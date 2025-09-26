import type { Express } from "express";
import { createServer as createViteServer } from "vite";
import type { ViteDevServer } from "vite";
import express from "express";
import path from "path";

export function log(message: string) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [express] ${message}`);
}

export async function setupVite(app: Express, server: any): Promise<ViteDevServer> {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
    base: process.env.BASE_URL || "/",
  });

  app.use(vite.ssrFixStacktrace);
  app.use(vite.middlewares);

  return vite;
}

export function serveStatic(app: Express) {
  const distPath = path.resolve("dist/public");
  const staticHandler = express.static(distPath, {
    maxAge: "1y",
    etag: true,
  });

  app.use(staticHandler);

  // Serve index.html for all non-API routes (SPA fallback)
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }

    res.sendFile(path.join(distPath, "index.html"));
  });
}