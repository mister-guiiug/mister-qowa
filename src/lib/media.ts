/**
 * Upload d'image de question vers Firebase Storage (import paresseux du SDK),
 * avec compression côté client : redimensionnement ≤ 1280 px + ré-encodage
 * WebP (fallback JPEG pour Safari/iOS), orientation EXIF corrigée.
 */
import { getApp } from "firebase/app";
import { ensureAuth } from "../firebase/app";
import { AppError } from "./appError";

const MAX_BYTES = 3 * 1024 * 1024;
const MAX_DIMENSION = 1280;
const QUALITY = 0.82;

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Compresse une image (resize + WebP/JPEG). Renvoie le fichier d'origine si la
 * compression échoue (GIF animé, navigateur exotique…) ou n'apporte rien.
 */
export async function compressImage(
  file: File,
): Promise<{ blob: Blob; contentType: string }> {
  try {
    // `imageOrientation: from-image` applique la rotation EXIF des photos mobiles.
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    const scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2d indisponible");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const webp = await canvasToBlob(canvas, "image/webp", QUALITY);
    const blob =
      webp && webp.type === "image/webp"
        ? webp
        : await canvasToBlob(canvas, "image/jpeg", QUALITY);
    if (blob && blob.size < file.size) {
      return { blob, contentType: blob.type };
    }
  } catch {
    /* compression impossible : on retombe sur le fichier brut */
  }
  return { blob: file, contentType: file.type };
}

export async function uploadQuestionImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new AppError("err.pickImage");
  const user = await ensureAuth();
  const { blob, contentType } = await compressImage(file);
  if (blob.size > MAX_BYTES) {
    throw new AppError("err.imageTooHeavy");
  }
  const { getStorage, ref, uploadBytes, getDownloadURL } =
    await import("firebase/storage");
  const storage = getStorage(getApp());
  const r = ref(storage, `quiz-media/${user.uid}/${crypto.randomUUID()}`);
  await uploadBytes(r, blob, { contentType });
  return getDownloadURL(r);
}
