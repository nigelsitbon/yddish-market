import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import sharp from "sharp";

/* ── Dimensions cibles par clé image ── */
const DIMENSIONS: Record<string, { width: number; height: number; label: string }> = {
  hero_image:       { width: 1200, height: 1500, label: "Hero (portrait 4:5)" },
  heritage_image_1: { width: 600,  height: 750,  label: "Héritage 1 (portrait 4:5)" },
  heritage_image_2: { width: 600,  height: 750,  label: "Héritage 2 (portrait 4:5)" },
  heritage_image_3: { width: 600,  height: 750,  label: "Héritage 3 (portrait 4:5)" },
  heritage_image_4: { width: 600,  height: 750,  label: "Héritage 4 (portrait 4:5)" },
  heritage_image_5: { width: 600,  height: 750,  label: "Héritage 5 (portrait 4:5)" },
  heritage_image_6: { width: 600,  height: 750,  label: "Héritage 6 (portrait 4:5)" },
};

const VALID_IMAGE_KEYS = Object.keys(DIMENSIONS);
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

/* ── GET: Récupérer images + textes homepage ── */

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const settings = await prisma.siteSetting.findMany({
      where: {
        OR: [
          { key: { in: VALID_IMAGE_KEYS } },
          { key: { startsWith: "homepage_text_" } },
        ],
      },
    });

    const images: Record<string, string | null> = {};
    for (const key of VALID_IMAGE_KEYS) {
      const setting = settings.find((s) => s.key === key);
      images[key] = setting?.value ?? null;
    }

    const texts: Record<string, string> = {};
    for (const s of settings) {
      if (s.key.startsWith("homepage_text_")) {
        texts[s.key] = s.value;
      }
    }

    return NextResponse.json({
      success: true,
      data: { images, texts, dimensions: DIMENSIONS },
    });
  } catch (error) {
    console.error("[ADMIN_HOMEPAGE_GET]", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

/* ── POST: Upload + resize + save image ── */

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

    if (!VALID_IMAGE_KEYS.includes(key)) {
      return NextResponse.json({ success: false, error: `Clé invalide: ${key}` }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: "Format accepté: JPEG, PNG, WebP, AVIF" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: "Fichier trop lourd (max 10 Mo)" }, { status: 400 });
    }

    // Read file
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Resize + crop + WebP
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

    // Upload to Supabase
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

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from("products")
      .getPublicUrl(storagePath);

    const url = `${publicUrlData.publicUrl}?v=${Date.now()}`;

    // Save to DB
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value: url },
      create: { key, value: url },
    });

    // Bust cache
    revalidateTag("homepage", { expire: 0 });

    return NextResponse.json({ success: true, data: { url, key } });
  } catch (error) {
    console.error("[ADMIN_HOMEPAGE_POST]", error);
    return NextResponse.json({
      success: false,
      error: `Erreur serveur: ${error instanceof Error ? error.message : "Unknown"}`,
    }, { status: 500 });
  }
}

/* ── PUT: Save text content ── */

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { texts } = body as { texts?: Record<string, string> };

    if (!texts || typeof texts !== "object") {
      return NextResponse.json({ success: false, error: "texts requis" }, { status: 400 });
    }

    // Validate all keys start with homepage_text_
    const entries = Object.entries(texts);
    for (const [key] of entries) {
      if (!key.startsWith("homepage_text_")) {
        return NextResponse.json({
          success: false,
          error: `Clé invalide: ${key}. Seules les clés homepage_text_* sont autorisées.`,
        }, { status: 400 });
      }
    }

    // Upsert all values in transaction
    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.siteSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      )
    );

    // Bust cache
    revalidateTag("homepage", { expire: 0 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_HOMEPAGE_PUT]", error);
    return NextResponse.json({
      success: false,
      error: `Erreur serveur: ${error instanceof Error ? error.message : "Unknown"}`,
    }, { status: 500 });
  }
}
