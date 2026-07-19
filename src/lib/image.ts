/**
 * Comprime imágenes en el navegador (canvas) antes de subirlas: reduce la
 * dimensión máxima y reencoda a JPEG, para no llenar el storage y que la
 * galería cargue rápido. HEIC u otros formatos no decodificables se suben tal
 * cual. Devuelve un File listo para FormData.
 */
export async function compressImage(
  file: File,
  maxDim = 1600,
  quality = 0.8,
): Promise<File> {
  if (typeof document === "undefined") return file;
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file; // HEIC, etc: tal cual
  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;
    const max = Math.max(width, height);
    if (max > maxDim) {
      const scale = maxDim / max;
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file; // no mejoró: original
    const nombre = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], nombre, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
