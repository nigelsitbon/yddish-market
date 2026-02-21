import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { randomUUID } from "crypto";

const BUCKET = "products";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.sellerProfile) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "Aucun fichier" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Format non supporté. Utilisez JPG, PNG ou WebP." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Fichier trop volumineux (max 5 Mo)" },
        { status: 400 }
      );
    }

    // Generate unique path: sellers/{sellerId}/{uuid}.{ext}
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `sellers/${user.sellerProfile.id}/${randomUUID()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ensure bucket exists (create if not)
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === BUCKET);
    if (!bucketExists) {
      await supabaseAdmin.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: ALLOWED_TYPES,
      });
    }

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[UPLOAD_ERROR]", uploadError);
      return NextResponse.json(
        { success: false, error: "Erreur lors de l'upload" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      data: {
        url: urlData.publicUrl,
        path: filePath,
      },
    });
  } catch (error) {
    console.error("[UPLOAD_POST]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── DELETE /api/upload — Remove an image ── */
export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.sellerProfile) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 403 });
    }

    const { path } = await req.json();
    if (!path || typeof path !== "string") {
      return NextResponse.json({ success: false, error: "Chemin invalide" }, { status: 400 });
    }

    // Security: only allow deleting own files
    if (!path.startsWith(`sellers/${user.sellerProfile.id}/`)) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 403 });
    }

    const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path]);

    if (error) {
      console.error("[DELETE_UPLOAD_ERROR]", error);
      return NextResponse.json(
        { success: false, error: "Erreur lors de la suppression" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[UPLOAD_DELETE]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
