import type { ReactNode } from "react";
import "../styles/global.css";
import "../styles/tailwind.css";

interface RootProps {
  children: ReactNode;
}

// crypto.randomUUID() is only defined in secure contexts (https or localhost).
// Waku's dev-mode RSC debug channel calls it unconditionally, which throws when
// the dev server is reached over plain HTTP via a LAN IP (waku.config.ts sets
// `server: { host: true }` for that). Polyfill it from crypto.getRandomValues,
// which browsers expose regardless of secure-context status.
const CRYPTO_RANDOM_UUID_POLYFILL = `
if (typeof crypto !== "undefined" && typeof crypto.randomUUID !== "function" && typeof crypto.getRandomValues === "function") {
  crypto.randomUUID = function () {
    var b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    var hex = Array.from(b, function (byte) { return byte.toString(16).padStart(2, "0"); });
    return hex.slice(0, 4).join("") + "-" + hex.slice(4, 6).join("") + "-" + hex.slice(6, 8).join("") + "-" + hex.slice(8, 10).join("") + "-" + hex.slice(10, 16).join("");
  };
}
`;

export default function Root({ children }: RootProps) {
  return (
    <html lang="en">
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static inline polyfill, not user input */}
        <script dangerouslySetInnerHTML={{ __html: CRYPTO_RANDOM_UUID_POLYFILL }} />
        <link rel="icon" type="image/png" href="/shui.png" />
        <title>Shui App</title>
      </head>
      <body>
        <div id="app">{children}</div>
      </body>
    </html>
  );
}
