
import { NextResponse } from "next/server";
import { requireAdmin, requireContributor } from "@/lib/auth";
import { createUploadInstruction } from "@/lib/media/upload";

export async function POST(request: Request) {
  try {
    try {
      await requireAdmin();
    } catch {
      await requireContributor();
    }

    const body = (await request.json()) as {
      provider?: "cloudinary" | string;
      fileName?: string;
      contentType?: string;
      size?: number;
      resourceType?: "image" | "video";
    };

    // This endpoint now uses Cloudinary only.
    if (body.provider !== "cloudinary") {
      return NextResponse.json(
        { error: "Only Cloudinary uploads are enabled." },
        { status: 400 }
      );
    }

    if (
      typeof body.fileName !== "string" ||
      typeof body.contentType !== "string" ||
      typeof body.size !== "number"
    ) {
      return NextResponse.json(
        { error: "fileName, contentType and size are required." },
        { status: 400 }
      );
    }

    const isImage = body.contentType.startsWith("image/");
    const isVideo = body.contentType.startsWith("video/");

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "Only images and videos are supported." },
        { status: 400 }
      );
    }

    const resourceType = isImage ? "image" : "video";
    const maxSize = isImage
      ? 10 * 1024 * 1024
      : 100 * 1024 * 1024;

    if (
      body.size <= 0 ||
      body.size > maxSize ||
      (body.resourceType && body.resourceType !== resourceType)
    ) {
      return NextResponse.json(
        {
          error:
            body.size > maxSize
              ? isImage
                ? "Images must be 10 MB or smaller."
                : "Videos must be 100 MB or smaller."
              : "Invalid file size or resource type.",
        },
        { status: 400 }
      );
    }

    const instruction = await createUploadInstruction({
      provider: "cloudinary",
      fileName: body.fileName,
      contentType: body.contentType,
      size: body.size,
      resourceType,
    });

    return NextResponse.json(instruction);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Upload instruction failed.";

    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : 400 }
    );
  }
}
