import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "waku/config";

const isE2E = process.env.WAKU_ADAPTER === "node";

export default defineConfig({
  unstable_adapter: isE2E ? "waku/adapters/node" : "waku/adapters/vercel",
  vite: {
    plugins: [tailwindcss()],
    server: {
      host: true,
    },
  },
});
