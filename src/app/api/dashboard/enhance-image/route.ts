import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { randomUUID } from "crypto";

/** Force Node.js runtime (Buffer, FormData, Blob all available) */
export const runtime = "nodejs";

/** Allow up to 60s for AI processing on Vercel */
export const maxDuration = 60;

const BUCKET = "products";

const ENHANCE_PROMPT = `Transform this product photo into a professional e-commerce packshot.
Place the product on a clean, pure white studio background.
Add soft, professional studio lighting with subtle natural shadows.
Keep the product exactly as it is — same angle, same details, same colors.
Only change the background to a premium white studio setting.
The result should look like a high-end luxury marketplace product photo.`;

export async function POST(req: Request) {
  const t0 = Date.now();
  const log = (step: string, ...args: unknown[]) =>
    console.log(`[ENHANCE][${Date.now() - t0}ms] ${step}`, ...args);
  const logErr = (step: string, ...args: unknown[]) =>
    console.error(`[ENHANCE][${Date.now() - t0}ms] ${step}`, ...args);

  try {
    // ── Step 1: Auth ──
    log("AUTH", "checking user...");
    const user = await getCurrentUser();
    if (!user?.sellerProfile) {
      log("AUTH", "no seller profile — 403");
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
        { status: 403 }
      );
    }
    log("AUTH", "OK — seller:", user.sellerProfile.id);

    // ── Step 2: API Key ──
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      logErr("CONFIG", "OPENAI_API_KEY is missing");
      return NextResponse.json(
        { success: false, error: "Clé API OpenAI non configurée" },
        { status: 500 }
      );
    }
    log("CONFIG", "API key present, length:", apiKey.length);

    // ── Step 3: Parse request ──
    const body = await req.json();
    const { imageUrl } = body;
    if (!imageUrl || typeof imageUrl !== "string") {
      logErr("INPUT", "missing imageUrl in body:", JSON.stringify(body).slice(0, 200));
      return NextResponse.json(
        { success: false, error: "URL d'image manquante" },
        { status: 400 }
      );
    }
    log("INPUT", "imageUrl:", imageUrl.slice(0, 120));

    // ── Step 4: Download original image ──
    log("DOWNLOAD", "fetching image...");
    let imageResponse: Response;
    try {
      imageResponse = await fetch(imageUrl, {
        redirect: "follow",
        headers: { Accept: "image/*" },
      });
    } catch (fetchErr) {
      logErr("DOWNLOAD", "fetch threw:", fetchErr);
      return NextResponse.json(
        { success: false, error: "Impossible de télécharger l'image" },
        { status: 400 }
      );
    }

    if (!imageResponse.ok) {
      logErr("DOWNLOAD", "HTTP", imageResponse.status, imageResponse.statusText);
      return NextResponse.json(
        {
          success: false,
          error: `Impossible de télécharger l'image (${imageResponse.status})`,
        },
        { status: 400 }
      );
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const contentType = imageResponse.headers.get("content-type") || "image/png";
    log("DOWNLOAD", "OK —", (imageBuffer.byteLength / 1024).toFixed(0), "KB, type:", contentType);

    // Validate it's actually an image
    if (!contentType.startsWith("image/")) {
      logErr("DOWNLOAD", "Not an image! Content-Type:", contentType);
      return NextResponse.json(
        { success: false, error: "Le fichier téléchargé n'est pas une image" },
        { status: 400 }
      );
    }

    // Determine extension
    let ext = "png";
    if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
    else if (contentType.includes("webp")) ext = "webp";

    // ── Step 5: Call gpt-image-1 ──
    log("OPENAI", "calling gpt-image-1 /images/edits...");
    let enhancedBuffer: Buffer | null = null;

    try {
      const formData = new FormData();
      const imageBlob = new Blob([imageBuffer], { type: contentType });
      formData.append("image", imageBlob, `product.${ext}`);
      formData.append("prompt", ENHANCE_PROMPT);
      formData.append("model", "gpt-image-1");
      formData.append("quality", "low");
      formData.append("size", "1024x1024");

      const aiRes = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
      });

      if (!aiRes.ok) {
        const errBody = await aiRes.text();
        logErr("OPENAI", "gpt-image-1 failed:", aiRes.status, errBody.slice(0, 500));
      } else {
        const aiData = await aiRes.json();

        // Handle b64_json response
        const b64 = aiData.data?.[0]?.b64_json;
        if (b64) {
          log("OPENAI", "gpt-image-1 returned b64_json, length:", b64.length);
          enhancedBuffer = Buffer.from(b64, "base64");
        }
        // Handle URL response
        else {
          const resultUrl = aiData.data?.[0]?.url;
          if (resultUrl) {
            log("OPENAI", "gpt-image-1 returned URL, downloading...");
            const imgRes = await fetch(resultUrl);
            if (imgRes.ok) {
              enhancedBuffer = Buffer.from(await imgRes.arrayBuffer());
            } else {
              logErr("OPENAI", "failed to download result URL:", imgRes.status);
            }
          } else {
            logErr("OPENAI", "unexpected response shape:", JSON.stringify(aiData).slice(0, 300));
          }
        }
      }
    } catch (err) {
      logErr("OPENAI", "gpt-image-1 exception:", err);
    }

    // ── Step 5b: Fallback — DALL-E 3 generation ──
    if (!enhancedBuffer) {
      log("FALLBACK", "trying DALL-E 3 generation via GPT-4o description...");
      try {
        enhancedBuffer = await fallbackDallE3(apiKey, imageUrl, log, logErr);
      } catch (err) {
        logErr("FALLBACK", "DALL-E 3 exception:", err);
      }
    }

    if (!enhancedBuffer) {
      logErr("RESULT", "All methods failed");
      return NextResponse.json(
        {
          success: false,
          error: "L'amélioration IA n'est pas disponible pour le moment. Réessayez.",
        },
        { status: 500 }
      );
    }

    log("RESULT", "enhanced image size:", (enhancedBuffer.byteLength / 1024).toFixed(0), "KB");

    // ── Step 6: Upload to Supabase ──
    const filePath = `sellers/${user.sellerProfile.id}/${randomUUID()}_enhanced.png`;
    log("UPLOAD", "uploading to:", filePath);

    const supabase = getSupabaseAdmin();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, enhancedBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      logErr("UPLOAD", "Supabase upload failed:", uploadError.message);
      return NextResponse.json(
        { success: false, error: "Erreur lors de la sauvegarde de l'image" },
        { status: 500 }
      );
    }

    // ── Step 7: Get public URL ──
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    log("DONE", "public URL:", urlData.publicUrl.slice(0, 100));

    return NextResponse.json({
      success: true,
      data: { url: urlData.publicUrl },
    });
  } catch (error) {
    logErr("FATAL", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur inattendue" },
      { status: 500 }
    );
  }
}

/**
 * Fallback: GPT-4o describes the product, then DALL-E 3 generates a packshot.
 */
async function fallbackDallE3(
  apiKey: string,
  imageUrl: string,
  log: (step: string, ...args: unknown[]) => void,
  logErr: (step: string, ...args: unknown[]) => void
): Promise<Buffer | null> {
  // Step A: GPT-4o vision to describe the product
  log("DALLE3", "getting product description via GPT-4o...");
  const descRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
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
              image_url: { url: imageUrl, detail: "low" },
            },
          ],
        },
      ],
      max_tokens: 200,
    }),
  });

  if (!descRes.ok) {
    const err = await descRes.text();
    logErr("DALLE3", "GPT-4o-mini failed:", descRes.status, err.slice(0, 300));
    return null;
  }

  const descData = await descRes.json();
  const description = descData.choices?.[0]?.message?.content;
  if (!description) {
    logErr("DALLE3", "no description returned");
    return null;
  }
  log("DALLE3", "description:", description.slice(0, 100));

  // Step B: DALL-E 3 generation
  const genPrompt = `Professional e-commerce packshot photo of: ${description}\n\nStyle: Clean white studio background, soft diffused lighting, subtle natural shadow. Product centered, high resolution, luxury marketplace quality. Photorealistic product photography.`;

  log("DALLE3", "generating packshot...");
  const genRes = await fetch("https://api.openai.com/v1/images/generations", {
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
      quality: "standard",
      response_format: "b64_json",
    }),
  });

  if (!genRes.ok) {
    const err = await genRes.text();
    logErr("DALLE3", "generation failed:", genRes.status, err.slice(0, 500));
    return null;
  }

  const genData = await genRes.json();
  const b64 = genData.data?.[0]?.b64_json;
  if (b64) {
    log("DALLE3", "generation success, b64 length:", b64.length);
    return Buffer.from(b64, "base64");
  }

  logErr("DALLE3", "no b64 in response");
  return null;
}
