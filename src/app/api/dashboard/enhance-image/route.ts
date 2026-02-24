import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { randomUUID } from "crypto";

const BUCKET = "products";

const ENHANCE_PROMPT = `Transform this product photo into a professional e-commerce packshot.
Place the product on a clean, pure white studio background.
Add soft, professional studio lighting with subtle natural shadows.
Keep the product exactly as it is — same angle, same details, same colors.
Only change the background to a premium white/light gray gradient studio setting.
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

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const contentType = imageResponse.headers.get("content-type") || "image/png";

    // Determine file extension
    let ext = "png";
    if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
    else if (contentType.includes("webp")) ext = "webp";

    // 2. Convert to base64 for the API
    const base64Image = imageBuffer.toString("base64");

    // 3. Call OpenAI Images Edit API (gpt-image-1)
    // Using the chat completions approach with image input for better results
    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_image",
                image_url: `data:${contentType};base64,${base64Image}`,
              },
              {
                type: "input_text",
                text: ENHANCE_PROMPT,
              },
            ],
          },
        ],
        tools: [
          {
            type: "image_generation",
            quality: "high",
            size: "1024x1024",
          },
        ],
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("[ENHANCE_OPENAI_ERROR]", openaiResponse.status, errorText);

      // Fallback: try the simpler images/edits endpoint
      return await fallbackEnhance(apiKey, imageBuffer, ext, user.sellerProfile.id, contentType);
    }

    const openaiData = await openaiResponse.json();

    // Extract the generated image from the response
    let enhancedBase64: string | null = null;

    // Navigate the response structure to find the generated image
    if (openaiData.output) {
      for (const item of openaiData.output) {
        if (item.type === "image_generation_call" && item.result) {
          enhancedBase64 = item.result;
          break;
        }
        // Also check content array items
        if (item.content) {
          for (const content of item.content) {
            if (content.type === "image" && content.image_url) {
              // It's a data URL or base64
              const match = content.image_url.match(/base64,(.+)/);
              if (match) enhancedBase64 = match[1];
            }
          }
        }
      }
    }

    if (!enhancedBase64) {
      // Fallback if response format didn't match
      return await fallbackEnhance(apiKey, imageBuffer, ext, user.sellerProfile.id, contentType);
    }

    // 4. Upload enhanced image to Supabase
    const enhancedBuffer = Buffer.from(enhancedBase64, "base64");
    const filePath = `sellers/${user.sellerProfile.id}/${randomUUID()}_enhanced.png`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath, enhancedBuffer, {
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
 * Fallback: use the simpler images/edits endpoint (DALL-E)
 */
async function fallbackEnhance(
  apiKey: string,
  imageBuffer: Buffer,
  ext: string,
  sellerId: string,
  contentType: string
) {
  try {
    const formData = new FormData();
    const blob = new Blob([imageBuffer as unknown as BlobPart], { type: contentType });
    formData.append("image", blob, `product.${ext}`);
    formData.append("prompt", ENHANCE_PROMPT);
    formData.append("model", "dall-e-2");
    formData.append("n", "1");
    formData.append("size", "1024x1024");
    formData.append("response_format", "b64_json");

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[ENHANCE_FALLBACK_ERROR]", response.status, errText);
      return NextResponse.json(
        { success: false, error: "L'amélioration IA n'a pas pu être effectuée. Réessayez." },
        { status: 500 }
      );
    }

    const data = await response.json();
    const b64 = data.data?.[0]?.b64_json;

    if (!b64) {
      return NextResponse.json(
        { success: false, error: "Aucune image générée" },
        { status: 500 }
      );
    }

    const enhancedBuffer = Buffer.from(b64, "base64");
    const filePath = `sellers/${sellerId}/${randomUUID()}_enhanced.png`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath, enhancedBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("[ENHANCE_FALLBACK_UPLOAD]", uploadError);
      return NextResponse.json(
        { success: false, error: "Erreur lors de la sauvegarde" },
        { status: 500 }
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      data: { url: urlData.publicUrl },
    });
  } catch (error) {
    console.error("[ENHANCE_FALLBACK]", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'amélioration" },
      { status: 500 }
    );
  }
}
