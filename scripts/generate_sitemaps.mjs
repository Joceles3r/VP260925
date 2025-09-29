/**
 * Generate localized sitemaps for VISUAL Platform
 * Path: scripts/generate_sitemaps.mjs
 * Usage: node scripts/generate_sitemaps.mjs
 */
import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.env.SITE_BASE_URL || "https://visual-platform.replit.app";
const LOCALES = ["fr", "en", "es"]; // Align with i18n strategy
const OUT_DIR = "client/public/sitemaps";

// VISUAL Platform routes - extend as needed
const ROUTES = [
  "/", 
  "/visual", 
  "/petites-annonces",
  "/plateforme", 
  "/comment-ca-marche", 
  "/projets", 
  "/live-shows",
  "/tarifs", 
  "/support", 
  "/aide", 
  "/contact", 
  "/statut",
  "/blog", 
  "/legal", 
  "/mentions-legales", 
  "/confidentialite", 
  "/cgu", 
  "/compliance-amf",
  "/accessibility"
];

// Dynamic content categories for VISUAL
const PROJECT_CATEGORIES = [
  "musique", 
  "video", 
  "art-visuel", 
  "theatre", 
  "danse", 
  "livres"
];

function ensureDir(p) {
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
}

function xmlEscape(s) {
  return s.replace(/&/g, "&amp;")
           .replace(/</g, "&lt;")
           .replace(/>/g, "&gt;")
           .replace(/"/g, "&quot;")
           .replace(/'/g, "&#39;");
}

function buildUrlset(urls) {
  const urlElements = urls.map(url => {
    const lastmod = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const priority = url.endsWith('/') && url.split('/').length === 4 ? '1.0' : '0.8'; // Homepage gets priority
    
    return `    <url>
      <loc>${xmlEscape(url)}</loc>
      <lastmod>${lastmod}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>${priority}</priority>
    </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`✅ Generated: ${filePath}`);
}

function generateProjectsSitemap() {
  console.log("🎯 Generating projects sitemap...");
  
  const projectUrls = [];
  
  // Add category pages
  PROJECT_CATEGORIES.forEach(category => {
    projectUrls.push(`${BASE_URL}/projets/category/${category}`);
  });
  
  // Add sample project URLs (in production, fetch from database)
  for (let i = 1; i <= 50; i++) {
    projectUrls.push(`${BASE_URL}/projets/project/${i}`);
  }
  
  const xml = buildUrlset(projectUrls);
  const filePath = path.join(OUT_DIR, "projects-sitemap.xml");
  writeFile(filePath, xml);
  
  return filePath;
}

function main() {
  console.log("🚀 Starting VISUAL Platform sitemap generation...");
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🌍 Locales: ${LOCALES.join(', ')}`);
  
  ensureDir(OUT_DIR);

  const indexEntries = [];
  
  // Generate locale-specific sitemaps
  for (const locale of LOCALES) {
    console.log(`🌐 Generating sitemap for locale: ${locale}`);
    
    const urls = ROUTES.map(route => {
      if (route === '/') {
        return locale === 'fr' ? BASE_URL : `${BASE_URL}/${locale}`;
      }
      return locale === 'fr' ? `${BASE_URL}${route}` : `${BASE_URL}/${locale}${route}`;
    });
    
    const xml = buildUrlset(urls);
    const fileName = `sitemap-${locale}.xml`;
    const filePath = path.join(OUT_DIR, fileName);
    writeFile(filePath, xml);
    
    indexEntries.push(`  <sitemap>
    <loc>${xmlEscape(`${BASE_URL}/sitemaps/${fileName}`)}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`);
  }

  // Generate projects sitemap
  const projectsSitemapPath = generateProjectsSitemap();
  const projectsFileName = path.basename(projectsSitemapPath);
  indexEntries.push(`  <sitemap>
    <loc>${xmlEscape(`${BASE_URL}/sitemaps/${projectsFileName}`)}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`);

  // Generate sitemap index
  console.log("📑 Generating sitemap index...");
  const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexEntries.join('\n')}
</sitemapindex>`;

  writeFile(path.join(OUT_DIR, "sitemap-index.xml"), indexXml);
  
  console.log("✨ Sitemap generation completed successfully!");
  console.log(`📊 Generated ${LOCALES.length + 1} sitemaps (${LOCALES.length} locales + 1 projects)`);
}

main();