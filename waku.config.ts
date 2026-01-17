import { defineConfig } from "waku/config";

// Vercel uses web version
const libsqlClient = /sheldon/i.test(process.env["USER"] || "")
  ? "@libsql/client"
  : "@libsql/client/web";

export default defineConfig({
  unstable_honoEnhancer: "./src/hono-enhancer.ts",
  vite: {
    server: {
      host: true,
    },
    resolve: {
      alias: {
        "@libsql/client": libsqlClient,
      },
    },
    ssr: {
      // Externalize the main client and all native bindings for server functions
      external: [
        "@libsql/client",
        "@libsql/darwin-arm64",
        "@libsql/darwin-x64",
        "@libsql/linux-x64-gnu",
        "@libsql/linux-arm64-gnu",
        "@libsql/win32-x64-msvc",
      ],
    },
    // build: {
    //   rollupOptions: {
    //     external: ["@libsql/client"],
    //   },
    // },
  },
});
