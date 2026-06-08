/** Upload d'image de question vers Firebase Storage (import paresseux du SDK). */
import { getApp } from "firebase/app";
import { ensureAuth } from "../firebase/app";

const MAX_BYTES = 3 * 1024 * 1024;

export async function uploadQuestionImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Choisis une image.");
  if (file.size > MAX_BYTES) throw new Error("Image trop lourde (max 3 Mo).");
  const user = await ensureAuth();
  const { getStorage, ref, uploadBytes, getDownloadURL } =
    await import("firebase/storage");
  const storage = getStorage(getApp());
  const r = ref(storage, `quiz-media/${user.uid}/${crypto.randomUUID()}`);
  await uploadBytes(r, file, { contentType: file.type });
  return getDownloadURL(r);
}
