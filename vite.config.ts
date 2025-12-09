import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Connect, PluginOption } from "vite";
import { defineConfig } from "vite";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

/**
 * For DEV environment
 * @returns
 */
const proofPathPlugin = (): PluginOption => {
  const handler: Connect.NextHandleFunction = (req, _res, next) => {
    if (!req.url) {
      next();
      return;
    }

    const [path, search] = req.url.split("?");
    if (path === "/proof" || path === "/proof/") {
      req.url = `/shareable/proof${search ? `?${search}` : ""}`;
    }

    next();
  };

  return {
    name: "proof-path-rewrite",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/hello-world/" : "/",
  plugins: [proofPathPlugin(), react()],
  appType: "mpa",
  build: {
    rollupOptions: {
      input: {
        main: resolve(rootDir, "index.html"),
        proof: resolve(rootDir, "shareable/proof.html"),
      },
    },
  },
  server: {
    allowedHosts: true,
  },
}));
