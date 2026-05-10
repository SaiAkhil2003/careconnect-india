import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const LOGO_BUCKET = "provider-logos";
const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const STORAGE_NOT_CONFIGURED_ERROR =
  "Provider logo storage is not configured yet.";

function jsonResponse<T>(
  body: { success: true; data: T } | { success: false; error: string },
  status = 200,
) {
  return NextResponse.json(body, { status });
}

function sanitizeFilename(filename: string) {
  const sanitized = filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return sanitized || "provider-logo";
}

function isStorageBucketMissing(error: { message?: string; statusCode?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.statusCode === "404" ||
    message.includes("bucket not found") ||
    message.includes("not found")
  );
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return jsonResponse({ success: false, error: "Unauthenticated." }, 401);
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonResponse(
        { success: false, error: "Select a logo image to upload." },
        400,
      );
    }

    if (!ALLOWED_LOGO_TYPES.has(file.type)) {
      return jsonResponse(
        {
          success: false,
          error: "Logo must be a PNG, JPEG, or WebP image.",
        },
        400,
      );
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      return jsonResponse(
        { success: false, error: "Logo image must be 2 MB or smaller." },
        400,
      );
    }

    const supabase = createSupabaseServerClient();
    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select("id")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (providerError) {
      return jsonResponse(
        { success: false, error: "Unable to fetch provider profile." },
        500,
      );
    }

    if (!provider) {
      return jsonResponse(
        {
          success: false,
          error: "Please register your provider profile first.",
        },
        404,
      );
    }

    const filename = sanitizeFilename(file.name);
    const logoPath = `${provider.id}/${Date.now()}-${filename}`;
    const { error: uploadError } = await supabase.storage
      .from(LOGO_BUCKET)
      .upload(logoPath, Buffer.from(await file.arrayBuffer()), {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      if (isStorageBucketMissing(uploadError)) {
        return jsonResponse(
          { success: false, error: STORAGE_NOT_CONFIGURED_ERROR },
          503,
        );
      }

      console.error("Provider logo upload failed", uploadError.message);
      return jsonResponse(
        { success: false, error: "Unable to upload provider logo." },
        500,
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from(LOGO_BUCKET)
      .getPublicUrl(logoPath);
    const logoUrl = publicUrlData.publicUrl;

    const { error: updateError } = await supabase
      .from("providers")
      .update({ logo_url: logoUrl })
      .eq("id", provider.id);

    if (updateError) {
      console.error("Provider logo URL update failed", updateError.message);
      return jsonResponse(
        { success: false, error: "Unable to save provider logo." },
        500,
      );
    }

    return jsonResponse<{ logo_url: string }>({
      success: true,
      data: { logo_url: logoUrl },
    });
  } catch (error) {
    console.error(
      "POST /api/provider/logo failed",
      error instanceof Error ? error.message : "Unknown error",
    );

    return jsonResponse(
      { success: false, error: "Unexpected server error." },
      500,
    );
  }
}
