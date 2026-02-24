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

export const maxDuration = 60; // Allow up to 60s for AI processing

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
    console.log("[ENHANCE] Downloading image:", imageUrl.slice(0, 100));
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error("[ENHANCE] Download failed:", imageResponse.status);
      return NextResponse.json(
        { success: false, error: "Impossible de télécharger l'image originale" },
        { status: 400 }
      );
    }

    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get("content-type") || "image/png";
    const imageSizeKB = Math.round(imageArrayBuffer.byteLength / 1024);
    console.log("[ENHANCE] Image downloaded:", imageSizeKB, "KB, type:", contentType);

    // Determine file extension
    let ext = "png";
    if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
    else if (contentType.includes("webp")) ext = "webp";

    // 2. Try gpt-image-1 (best quality)
    let result = await tryGptImage1(apiKey, imageArrayBuffer, contentType, ext);

    // 3. Fallback: DALL-E 2
    if (!result) {
      console.log("[ENHANCE] gpt-image-1 failed, trying DALL-E 2...");
      result = await tryDallE2(apiKey, imageArrayBuffer, contentType, ext);
    }

    // 4. Fallback: Generate a new image using DALL-E 3 with a description
    if (!result) {
      console.log("[ENHANCE] DALL-E 2 failed, trying DALL-E 3 generation...");
      result = await tryDallE3Generation(apiKey, imageUrl);
    }

    if (!result) {
      return NextResponse.json(
        { success: false, error: "L'amélioration IA n'est pas disponible pour le moment. Vérifiez votre clé API OpenAI." },
        { status: 500 }
      );
    }

    // 5. Upload enhanced image to Supabase
    const filePath = `sellers/${user.sellerProfile.id}/${randomUUID()}_enhanced.png`;
    console.log("[ENHANCE] Uploading to:", filePath, "size:", result.byteLength);

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

    // 6. Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    console.log("[ENHANCE] Success! URL:", urlData.publicUrl.slice(0, 80));

    return NextResponse.json({
      success: true,
      data: { url: urlData.publicUrl },
    });
  } catch (error) {
    console.error("[ENHANCE_IMAGE_FATAL]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur inattendue" }, { status: 500 });
  }
}

/**
 * Method 1: gpt-image-1 via /v1/images/edits
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

    console.log("[ENHANCE] Calling gpt-image-1 edits...");
    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[ENHANCE_GPT_IMAGE_1]", response.status, errText.slice(0, 500));
      return null;
    }

    const data = await response.json();

    // b64_json response
    const b64 = data.data?.[0]?.b64_json;
    if (b64) {
      console.log("[ENHANCE] gpt-image-1 returned b64_json");
      return Buffer.from(b64, "base64");
    }

    // URL response
    const url = data.data?.[0]?.url;
    if (url) {
      console.log("[ENHANCE] gpt-image-1 returned URL");
      const imgRes = await fetch(url);
      if (imgRes.ok) {
        return Buffer.from(await imgRes.arrayBuffer());
      }
    }

    console.error("[ENHANCE_GPT_IMAGE_1] Unexpected response:", JSON.stringify(data).slice(0, 300));
    return null;
  } catch (error) {
    console.error("[ENHANCE_GPT_IMAGE_1_ERROR]", error);
    return null;
  }
}

/**
 * Method 2: DALL-E 2 via /v1/images/edits
 */
async function tryDallE2(
  apiKey: string,
  imageArrayBuffer: ArrayBuffer,
  contentType: string,
  ext: string
): Promise<Buffer | null> {
  try {
    // DALL-E 2 requires max 4MB
    if (imageArrayBuffer.byteLength > 4 * 1024 * 1024) {
      console.log("[ENHANCE_DALLE2] Image too large, skipping");
      return null;
    }

    const formData = new FormData();
    const imageBlob = new Blob([imageArrayBuffer], { type: contentType });
    formData.append("image", imageBlob, `product.${ext}`);
    formData.append("prompt", ENHANCE_PROMPT);
    formData.append("model", "dall-e-2");
    formData.append("n", "1");
    formData.append("size", "1024x1024");
    formData.append("response_format", "b64_json");

    console.log("[ENHANCE] Calling DALL-E 2 edits...");
    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[ENHANCE_DALLE2]", response.status, errText.slice(0, 500));
      return null;
    }

    const data = await response.json();
    const b64 = data.data?.[0]?.b64_json;

    if (b64) {
      console.log("[ENHANCE] DALL-E 2 returned b64_json");
      return Buffer.from(b64, "base64");
    }

    return null;
  } catch (error) {
    console.error("[ENHANCE_DALLE2_ERROR]", error);
    return null;
  }
}

/**
 * Method 3: DALL-E 3 generation (last resort)
 * Uses GPT-4o to describe the product, then DALL-E 3 to generate a packshot
 */
async function tryDallE3Generation(
  apiKey: string,
  imageUrl: string
): Promise<Buffer | null> {
  try {
    // Step 1: Use GPT-4o to describe the product
    console.log("[ENHANCE] Calling GPT-4o for image description...");
    const descResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Describe this product in detail for a photographer: what it is, its colors, materials, shape, and any text/patterns visible. Be precise and factual in 2-3 sentences. Do NOT mention the background or lighting — only describe the product itself.",
              },
              {
                type: "image_url",
                image_url: { url: imageUrl, detail: "high" },
              },
            ],
          },
        ],
        max_tokens: 300,
      }),
    });

    if (!descResponse.ok) {
      const err = await descResponse.text();
      console.error("[ENHANCE_GPT4O_DESC]", descResponse.status, err.slice(0, 300));
      return null;
    }

    const descData = await descResponse.json();
    const description = descData.choices?.[0]?.message?.content;

    if (!description) {
      console.error("[ENHANCE_GPT4O_DESC] No description returned");
      return null;
    }

    console.log("[ENHANCE] Product description:", description.slice(0, 100));

    // Step 2: Generate packshot with DALL-E 3
    const genPrompt = `Professional e-commerce packshot photo of: ${description}

Style: Clean white studio background, soft diffused lighting, subtle natural shadow. Product centered, high resolution, luxury marketplace quality. Photorealistic product photography.`;

    console.log("[ENHANCE] Calling DALL-E 3 generation...");
    const genResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: genPrompt,
        n: 1,
        size: "1024x1024",
        quality: "hd",
        response_format: "b64_json",
      }),
    });

    if (!genResponse.ok) {
      const err = await genResponse.text();
      console.error("[ENHANCE_DALLE3_GEN]", genResponse.status, err.slice(0, 500));
      return null;
    }

    const genData = await genResponse.json();
    const b64 = genData.data?.[0]?.b64_json;

    if (b64) {
      console.log("[ENHANCE] DALL-E 3 generation success");
      return Buffer.from(b64, "base64");
    }

    return null;
  } catch (error) {
    console.error("[ENHANCE_DALLE3_GEN_ERROR]", error);
    return null;
  }
}
