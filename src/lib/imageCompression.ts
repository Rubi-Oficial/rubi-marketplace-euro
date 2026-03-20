const MAX_DIMENSION = 1920;
const QUALITY = 0.82;

/**
 * Compresses an image file client-side using Canvas.
 * - Resizes to max 1920px on the longest side
 * - Converts to JPEG at 82% quality
 * - Returns the original file if it's already smaller than the result
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  let newW = width;
  let newH = height;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    newW = Math.round(width * ratio);
    newH = Math.round(height * ratio);
  }

  const canvas = new OffscreenCanvas(newW, newH);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(bitmap, 0, 0, newW, newH);
  bitmap.close();

  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: QUALITY });

  // Keep original if compression didn't help
  if (blob.size >= file.size) return file;

  const name = file.name.replace(/\.[^.]+$/, ".jpg");
  return new File([blob], name, { type: "image/jpeg" });
}
