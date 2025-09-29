/**
 * Generate localized sitemaps for VISUAL
 * Path: scripts/generate_sitemaps.mjs
 * Usage: node scripts/generate_sitemaps.mjs
 */
import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.env.SITE_BASE_URL || "https://XXXXXXXX";
const LOCALES = ["fr","en","es"]; // align with i18n
const OUT_DIR = "public/sitemaps";

// Minimal set of routes; extend as needed
const ROUTES = [
  "/", "/plateforme", "/comment-ca-marche", "/projets", "/live-shows",
  "/tarifs", "/support", "/aide", "/contact", "/statut",
  "/blog", "/legal", "/mentions-legales", "/confidentialite", "/cgu", "/compliance-amf"
];

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function xmlEscape(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildUrlset(urls) {
  const body = urls.map(u => `<url><loc>${xmlEscape(u)}</loc></url>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>` +
         `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

function writeFile(p, content) {
  fs.writeFileSync(p, content, "utf8");
  console.log("Wrote", p);
}

function main() {
  ensureDir(OUT_DIR);

  const indexEntries = [];
  for (const loc of LOCALES) {
    const urls = ROUTES.map(r => `${BASE_URL}/${loc}${r}`);
    const xml = buildUrlset(urls);
    const file = path.join(OUT_DIR, `sitemap-${loc}.xml`);
    writeFile(file, xml);
    indexEntries.push(`<sitemap><loc>${xmlEscape(`${BASE_URL}/sitemaps/sitemap-${loc}.xml`)}</loc></sitemap>`);
  }

  const indexXml = `<?xml version="1.0" encoding="UTF-8"?>` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${indexEntries.join("")}</sitemapindex>`;

  writeFile(path.join(OUT_DIR, "sitemap-index.xml"), indexXml);
}

main();
