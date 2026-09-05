import { useEffect, useState } from "react";
import { qrToSvg } from "@mister-guiiug/dev-pwa-config/qr";

/**
 * QR du lien d'invitation (lobby host) — `qrToSvg` du socle : la peer `qrcode`
 * n'est téléchargée que lorsqu'un QR est réellement affiché, au lieu de peser
 * dans le chunk Host via le composant `qrcode.react`. Rendu équivalent : même
 * URL encodée, 148 px, encre #0f0a1e sur blanc, SVG net à toute échelle — la
 * zone calme est fournie par le cadre blanc `p-3` du parent.
 */
export function JoinQr({ url }: { url: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    qrToSvg(url, {
      width: 148,
      margin: 0,
      errorCorrectionLevel: "L", // le défaut de qrcode.react — même densité de motif
      color: { dark: "#0f0a1e", light: "#ffffff" },
      loader: () => import("qrcode"), // import statiquement analysable par Vite (dev + build)
    })
      .then((s) => {
        if (!cancelled) setSvg(s);
      })
      // Best-effort : sans QR, le PIN et le bouton d'invitation restent là.
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [url]);
  // Réserve l'emplacement pendant le chargement — pas de saut de mise en page.
  if (!svg) return <div aria-hidden className="size-[148px]" />;
  return (
    <img
      src={`data:image/svg+xml,${encodeURIComponent(svg)}`}
      width={148}
      height={148}
      alt=""
    />
  );
}
