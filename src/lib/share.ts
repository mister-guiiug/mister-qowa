/** Partage natif (Web Share API) avec repli copie presse-papier. */
export type ShareResult = "shared" | "copied" | "failed";

export async function shareOrCopy(data: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<ShareResult> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share(data);
      return "shared";
    } catch {
      return "failed"; // annulation ou erreur : on ne copie pas en douce
    }
  }
  const payload = data.url ?? data.text ?? "";
  try {
    await navigator.clipboard.writeText(payload);
    return "copied";
  } catch {
    return "failed";
  }
}
