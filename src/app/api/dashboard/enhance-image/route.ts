import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { randomUUID } from "crypto";

const BUCKET = "products";

const ENHANCE_PROMPT = `Transform this product photo into a professional e-commerce packshot.
Place the product on a clean, pure white studio background.
Add soft, professional studio lighting with subtle natural shadows.
Keep the product exactly as it is — same angle, same details, same colors.
Only change the background to a premium white studio setting.
The result should look like a high-end luxury marketplace product photo.`;

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.sellerProfile) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 403 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Clé API OpenAI non configurée" },
        { status: 500 }
      );
    }

    const { imageUrl } = await req.json();
    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ success: false, error: "URL d'image manquante" }, { status: 400 });
    }

    // 1. Download the original image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Impossible de télécharger l'image originale" },
        { status: 400 }
      );
    }

    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get("content-type") || "image/png";

    // Determine file extension for the upload
    let ext = "png";
    if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
    else if (contentType.includes("webp")) ext = "webp";

    // 2. Try gpt-image-1 (best quality, no mask needed)
    let result = await tryGptImage1(apiKey, imageArrayBuffer, contentType, ext);

    // 3. Fallback: try DALL-E 2 if gpt-image-1 fails
    if (!result) {
      result = await tryDallE2(apiKey, imageArrayBuffer, contentType, ext);
    }

    if (!result) {
      return NextResponse.json(
        { success: false, error: "L'amélioration n'a pas pu être effectuée. Réessayez." },
        { status: 500 }
      );
    }

    // 4. Upload enhanced image to Supabase
    const filePath = `sellers/${user.sellerProfile.id}/${randomUUID()}_enhanced.png`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath, result, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("[ENHANCE_UPLOAD_ERROR]", uploadError);
      return NextResponse.json(
        { success: false, error: "Erreur lors de la sauvegarde" },
        { status: 500 }
      );
    }

    // 5. Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      data: { url: urlData.publicUrl },
    });
  } catch (error) {
    console.error("[ENHANCE_IMAGE]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * Method 1: gpt-image-1 via /v1/images/edits (best — no mask required)
 */
async function tryGptImage1(
  apiKey: string,
  imageArrayBuffer: ArrayBuffer,
  contentType: string,
  ext: string
): Promise<Buffer | null> {
  try {
    const formData = new FormData();
    const imageBlob = new Blob([imageArrayBuffer], { type: contentType });
    formData.append("image", imageBlob, `product.${ext}`);
    formData.append("prompt", ENHANCE_PROMPT);
    formData.append("model", "gpt-image-1");
    formData.append("quality", "high");
    formData.append("size", "1024x1024");

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}` },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[ENHANCE_GPT_IMAGE_1]", response.status, errText);
      return null;
    }

    const data = await response.json();

    // gpt-image-1 returns b64_json by default
    const b64 = data.data?.[0]?.b64_json;
    if (b64) {
      return Buffer.from(b64, "base64");
    }

    // Or it might return a URL
    const url = data.data?.[0]?.url;
    if (url) {
      const imgRes = await fetch(url);
      if (imgRes.ok) {
        return Buffer.from(await imgRes.arrayBuffer());
      }
    }

    return null;
  } catch (error) {
    console.error("[ENHANCE_GPT_IMAGE_1_ERROR]", error);
    return null;
  }
}

/**
 * Method 2: DALL-E 2 via /v1/images/edits (fallback)
 * Note: DALL-E 2 works best with PNG images ≤4MB
 */
async function tryDallE2(
  apiKey: string,
  imageArrayBuffer: ArrayBuffer,
  contentType: string,
  ext: string
): Promise<Buffer | null> {
  try {
    const formData = new FormData();
    // DALL-E 2 prefers PNG
    const imageBlob = new Blob([imageArrayBuffer], { type: contentType });
    formData.append("image", imageBlob, `product.${ext}`);
    formData.append("prompt", ENHANCE_PROMPT);
    formData.append("model", "dall-e-2");
    formData.append("n", "1");
    formData.append("size", "1024x1024");
    formData.append("response_format", "b64_json");

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}` },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[ENHANCE_DALLE2]", response.status, errText);
      return null;
    }

    const data = await response.json();
    const b64 = data.data?.[0]?.b64_json;

    if (b64) {
      return Buffer.from(b64, "base64");
    }

    return null;
  } catch (error) {
    console.error("[ENHANCE_DALLE2_ERROR]", error);
    return null;
  }
}
