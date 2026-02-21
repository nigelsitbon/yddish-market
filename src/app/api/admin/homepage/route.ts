import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import sharp from "sharp";

/* ── Dimensions cibles par clé ── */
const DIMENSIONS: Record<string, { width: number; height: number; label: string }> = {
  hero_image:            { width: 1200, height: 1500, label: "Hero (portrait 4:5)" },
  bijoux_image:          { width: 800,  height: 600,  label: "Bijoux (paysage 4:3)" },
  art_accessoires_image: { width: 800,  height: 600,  label: "Art & Accessoires (paysage 4:3)" },
  fetes_image:           { width: 800,  height: 600,  label: "Fêtes (paysage 4:3)" },
  artisan_image:         { width: 1200, height: 800,  label: "Artisan (paysage 3:2)" },
  vetements_image:       { width: 600,  height: 600,  label: "Vêtements (carré 1:1)" },
  livres_image:          { width: 600,  height: 600,  label: "Livres (carré 1:1)" },
  epicerie_fine_image:   { width: 600,  height: 600,  label: "Épicerie Fine (carré 1:1)" },
};

const VALID_KEYS = Object.keys(DIMENSIONS);
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

/* ── GET: Récupérer toutes les images homepage ── */

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const settings = await prisma.siteSetting.findMany({
      where: { key: { in: VALID_KEYS } },
    });

    const images: Record<string, string | null> = {};
    for (const key of VALID_KEYS) {
      const setting = settings.find((s) => s.key === key);
      images[key] = setting?.value ?? null;
    }

    return NextResponse.json({
      success: true,
      data: { images, dimensions: DIMENSIONS },
    });
  } catch (error) {
    console.error("[ADMIN_HOMEPAGE_GET]", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

/* ── POST: Upload + resize + save ── */

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const key = formData.get("key") as string | null;

    if (!file || !key) {
      return NextResponse.json({ success: false, error: "file et key requis" }, { status: 400 });
    }

    if (!VALID_KEYS.includes(key)) {
      return NextResponse.json({ success: false, error: `Clé invalide: ${key}` }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: "Format accepté: JPEG, PNG, WebP, AVIF" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: "Fichier trop lourd (max 10 Mo)" }, { status: 400 });
    }

    // Lire le fichier
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Resize + crop centré + conversion WebP
    let processedBuffer: Buffer;
    try {
      const { width, height } = DIMENSIONS[key];
      processedBuffer = await sharp(inputBuffer)
        .resize(width, height, { fit: "cover", position: "centre" })
        .webp({ quality: 85 })
        .toBuffer();
    } catch (sharpError) {
      console.error("[ADMIN_HOMEPAGE_SHARP]", sharpError);
      return NextResponse.json({
        success: false,
        error: `Erreur traitement image: ${sharpError instanceof Error ? sharpError.message : "Unknown"}`,
      }, { status: 500 });
    }

    // Upload vers Supabase Storage
    const storagePath = `homepage/${key}.webp`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("products")
      .upload(storagePath, processedBuffer, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) {
      console.error("[ADMIN_HOMEPAGE_UPLOAD]", uploadError);
      return NextResponse.json({
        success: false,
        error: `Erreur upload: ${uploadError.message}`,
      }, { status: 500 });
    }

    // Récupérer l'URL publique
    const { data: publicUrlData } = supabaseAdmin.storage
      .from("products")
      .getPublicUrl(storagePath);

    const url = `${publicUrlData.publicUrl}?v=${Date.now()}`;

    // Sauvegarder en DB
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value: url },
      create: { key, value: url },
    });

    return NextResponse.json({ success: true, data: { url, key } });
  } catch (error) {
    console.error("[ADMIN_HOMEPAGE_POST]", error);
    return NextResponse.json({
      success: false,
      error: `Erreur serveur: ${error instanceof Error ? error.message : "Unknown"}`,
    }, { status: 500 });
  }
}
