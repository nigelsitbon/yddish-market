import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { randomUUID } from "crypto";
import sharp from "sharp";

/** Force Node.js runtime (Buffer, Sharp, FormData all available) */
export const runtime = "nodejs";

/** Allow up to 60s for processing on Vercel */
export const maxDuration = 60;

const BUCKET = "products";

/** Minimum canvas size (for very small images) */
const MIN_CANVAS = 1024;

/** Padding around the product (% of largest dimension) */
const PADDING_RATIO = 0.06;

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

    // ── Step 2: Config ──
    const removeBgKey = process.env.REMOVEBG_API_KEY;
    if (!removeBgKey) {
      logErr("CONFIG", "REMOVEBG_API_KEY is missing");
      return NextResponse.json(
        { success: false, error: "Clé API remove.bg non configurée. Ajoutez REMOVEBG_API_KEY." },
        { status: 500 }
      );
    }
    log("CONFIG", "remove.bg key present");

    // ── Step 3: Parse request ──
    const body = await req.json();
    const { imageUrl } = body;
    if (!imageUrl || typeof imageUrl !== "string") {
      logErr("INPUT", "missing imageUrl");
      return NextResponse.json(
        { success: false, error: "URL d'image manquante" },
        { status: 400 }
      );
    }
    log("INPUT", "imageUrl:", imageUrl.slice(0, 120));

    // ── Step 4: Remove background via remove.bg ──
    log("REMBG", "sending to remove.bg...");
    let transparentBuffer: Buffer;

    try {
      const rbFormData = new FormData();
      rbFormData.append("image_url", imageUrl);
      rbFormData.append("size", "auto");
      rbFormData.append("format", "png");
      rbFormData.append("type", "product");

      const rbRes = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: { "X-Api-Key": removeBgKey },
        body: rbFormData,
      });

      if (!rbRes.ok) {
        const errBody = await rbRes.text();
        logErr("REMBG", "remove.bg failed:", rbRes.status, errBody.slice(0, 500));

        // Specific error handling
        if (rbRes.status === 402) {
          return NextResponse.json(
            { success: false, error: "Quota remove.bg épuisé ce mois-ci (50 images/mois gratuit)." },
            { status: 429 }
          );
        }
        if (rbRes.status === 403) {
          return NextResponse.json(
            { success: false, error: "Clé API remove.bg invalide." },
            { status: 500 }
          );
        }

        return NextResponse.json(
          { success: false, error: "Erreur lors de la suppression du fond." },
          { status: 500 }
        );
      }

      transparentBuffer = Buffer.from(await rbRes.arrayBuffer());
      log("REMBG", "OK — transparent PNG:", (transparentBuffer.byteLength / 1024).toFixed(0), "KB");
    } catch (err) {
      logErr("REMBG", "exception:", err);
      return NextResponse.json(
        { success: false, error: "Erreur réseau avec remove.bg." },
        { status: 500 }
      );
    }

    // ── Step 5: Composite onto white studio background with Sharp ──
    log("COMPOSITE", "building studio packshot...");

    try {
      const metadata = await sharp(transparentBuffer).metadata();
      const origW = metadata.width || MIN_CANVAS;
      const origH = metadata.height || MIN_CANVAS;
      log("COMPOSITE", "product dimensions:", origW, "x", origH);

      // Canvas adapts to product size — square, based on largest dimension + padding
      const maxDim = Math.max(origW, origH);
      const padding = Math.round(maxDim * PADDING_RATIO);
      const canvasSize = Math.max(maxDim + padding * 2, MIN_CANVAS);
      log("COMPOSITE", "canvas:", canvasSize, "x", canvasSize, "padding:", padding);

      // Product keeps its original size — only scale UP if smaller than MIN_CANVAS
      const productW = origW;
      const productH = origH;

      // Center the product on canvas
      const left = Math.round((canvasSize - productW) / 2);
      const top = Math.round((canvasSize - productH) / 2);

      // Ensure product has clean alpha channel
      const cleanProduct = await sharp(transparentBuffer)
        .ensureAlpha()
        .png()
        .toBuffer();

      // Create a subtle shadow: blurred, darkened silhouette offset down
      const shadowOffset = Math.round(productH * 0.015);
      const shadowBlur = Math.max(10, Math.round(maxDim * 0.02));

      const shadowLayer = await sharp(cleanProduct)
        .ensureAlpha()
        .modulate({ brightness: 0 })
        .blur(shadowBlur)
        .composite([
          {
            input: Buffer.from(
              `<svg width="${productW}" height="${productH}">
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.10)"/>
              </svg>`
            ),
            blend: "dest-in",
          },
        ])
        .png()
        .toBuffer();

      // Build the final studio image — product at full resolution
      const studioImage = await sharp({
        create: {
          width: canvasSize,
          height: canvasSize,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      })
        .png()
        .composite([
          { input: shadowLayer, left, top: top + shadowOffset },
          { input: cleanProduct, left, top },
        ])
        .png({ compressionLevel: 6 })
        .toBuffer();

      log("COMPOSITE", "studio image:", (studioImage.byteLength / 1024).toFixed(0), "KB");

      // ── Step 6: Upload to Supabase ──
      const filePath = `sellers/${user.sellerProfile.id}/${randomUUID()}_studio.png`;
      log("UPLOAD", "uploading:", filePath);

      const supabase = getSupabaseAdmin();
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, studioImage, {
          contentType: "image/png",
          upsert: false,
        });

      if (uploadError) {
        logErr("UPLOAD", "Supabase upload failed:", uploadError.message);
        return NextResponse.json(
          { success: false, error: "Erreur lors de la sauvegarde de l'image." },
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
    } catch (err) {
      logErr("COMPOSITE", "Sharp exception:", err);
      return NextResponse.json(
        { success: false, error: "Erreur lors de la création de l'image studio." },
        { status: 500 }
      );
    }
  } catch (error) {
    logErr("FATAL", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur inattendue" },
      { status: 500 }
    );
  }
}
