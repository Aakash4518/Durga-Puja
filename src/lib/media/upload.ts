import { getCloudinary } from "./providers";

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120) || "upload.bin";
}

export async function createUploadInstruction(input: {
  provider: "cloudinary";
  fileName: string;
  contentType: string;
  size: number;
  resourceType?: "image" | "video";
}) {
  const { fileName, contentType, size } = input;

  const isImage = contentType.startsWith("image/");
  const isVideo = contentType.startsWith("video/");
  if (!isImage && !isVideo) {
    throw new Error("Only image and video uploads are supported.");
  }

  const resourceType = isImage ? "image" : "video";
  if (input.resourceType && input.resourceType !== resourceType) {
    throw new Error("File type does not match the requested resource type.");
  }

  const maxSize = isImage ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
  if (size <= 0 || size > maxSize) {
    throw new Error(isImage
      ? "Photos must be 10 MB or smaller."
      : "Videos must be 100 MB or smaller.");
  }

  const c = getCloudinary();
  const key = `${new Date().getFullYear()}/${crypto.randomUUID()}-${safeFileName(fileName)}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "laxman-chhapra-mela";
  const params = { timestamp, folder };
  const signature = c.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    provider: "cloudinary" as const,
    key,
    method: "POST" as const,
    uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
    fields: {
      api_key: process.env.CLOUDINARY_API_KEY!,
      timestamp: String(timestamp),
      folder,
      signature,
    },
    note: "Signed Cloudinary upload. API secret remains server-side.",
  };
}
