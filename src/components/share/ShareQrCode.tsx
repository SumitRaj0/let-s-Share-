"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type ShareQrCodeProps = {
  /** Absolute share URL to encode */
  url: string;
  size?: number;
  className?: string;
  alt?: string;
};

/**
 * Client-generated QR (canvas → data URL). Fixed box so layout never collapses.
 */
export function ShareQrCode({
  url,
  size = 180,
  className = "",
  alt = "QR code for share link",
}: ShareQrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    setDataUrl(null);

    // Wait until we have a real absolute URL (skip bare paths like `/abc`).
    if (!url.trim() || url.startsWith("/") || !/^https?:\/\//i.test(url)) {
      return;
    }

    QRCode.toDataURL(url, {
      width: size * 2,
      margin: 2,
      color: { dark: "#111111", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then((next) => {
        if (!cancelled) setDataUrl(next);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [url, size]);

  const boxStyle = {
    width: size,
    height: size,
  } as const;

  if (failed) {
    return (
      <div
        role="alert"
        className={`flex shrink-0 items-center justify-center rounded-lg bg-white p-3 text-center text-[12px] text-[#666] ${className}`.trim()}
        style={boxStyle}
      >
        Couldn’t generate QR
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div
        className={`flex shrink-0 animate-pulse items-center justify-center rounded-lg bg-white ${className}`.trim()}
        style={boxStyle}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg bg-white p-2 ${className}`.trim()}
      style={boxStyle}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- data URL from local QR encode */}
      <img
        src={dataUrl}
        alt={alt}
        width={size - 16}
        height={size - 16}
        className="block h-auto w-full max-w-full"
        decoding="async"
      />
    </div>
  );
}

/** True when a phone scanning the QR likely cannot reach this origin. */
export function isLocalOnlyOrigin(origin: string): boolean {
  try {
    const host = new URL(origin).hostname;
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "[::1]" ||
      host.endsWith(".local")
    );
  } catch {
    return false;
  }
}
