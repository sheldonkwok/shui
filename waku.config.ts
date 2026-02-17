import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "waku/config";

export default defineConfig({
  unstable_adapter: "waku/adapters/vercel",
  vite: {
    plugins: [tailwindcss()],
    server: {
      host: true,
    },
  },
});
