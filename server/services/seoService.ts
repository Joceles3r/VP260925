import { db } from '../db';
import { sql, eq, and, desc } from 'drizzle-orm';
import {
  seoConfig,
  pageMetadata,
  seoGenerationLogs,
  projects,
  socialPosts,
  liveShowEditions,
  SeoConfig,
  PageMetadata,
  InsertPageMetadata,
  InsertSeoGenerationLog,
} from '@shared/schema';

export class SEOService {
  async getOrCreateConfig(): Promise<SeoConfig> {
    const configs = await db.select().from(seoConfig).limit(1);
    
    if (configs.length === 0) {
      const newConfig = await db.insert(seoConfig).values({
        siteName: 'VISUAL',
        siteUrl: process.env.REPLIT_DOMAINS?.split(',')[0] 
          ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
          : 'https://visual-platform.replit.app',
        defaultLocale: 'fr',
        supportedLocales: ['fr', 'en', 'es'],
        twitterHandle: '@VisualPlatform',
        enableSitemap: true,
        enableRobotsTxt: true,
        aiGenerationEnabled: true,
        visualAIOverride: false,
        adminOverrideAll: true,
        organizationSchema: {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'VISUAL',
          url: 'https://visual-platform.replit.app',
          logo: 'https://visual-platform.replit.app/logo.png',
          description: 'Platform for investing in visual content projects',
          foundingDate: '2025',
        },
      }).returning();
      
      return newConfig[0];
    }
    
    return configs[0];
  }

  async generateSitemap(locale: string = 'fr'): Promise<string> {
    const config = await this.getOrCreateConfig();
    const baseUrl = config.siteUrl;

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

    const staticPages = [
      { url: '/', priority: 1.0, changefreq: 'daily' },
      { url: '/projects', priority: 0.9, changefreq: 'daily' },
      { url: '/live-show', priority: 0.8, changefreq: 'weekly' },
      { url: '/about', priority: 0.5, changefreq: 'monthly' },
    ];

    for (const page of staticPages) {
      xml += this.createSitemapUrl(baseUrl, page.url, config.supportedLocales as string[], page.priority, page.changefreq);
    }

    const activeProjects = await db
      .select({ id: projects.id, updatedAt: projects.updatedAt })
      .from(projects)
      .where(eq(projects.status, 'active'))
      .limit(1000);

    for (const project of activeProjects) {
      xml += this.createSitemapUrl(
        baseUrl, 
        `/projects/${project.id}`, 
        config.supportedLocales as string[], 
        0.7, 
        'weekly',
        project.updatedAt
      );
    }

    const publishedPosts = await db
      .select({ id: socialPosts.id, updatedAt: socialPosts.createdAt })
      .from(socialPosts)
      .where(eq(socialPosts.status, 'published'))
      .orderBy(desc(socialPosts.createdAt))
      .limit(500);

    for (const post of publishedPosts) {
      xml += this.createSitemapUrl(
        baseUrl, 
        `/social/${post.id}`, 
        config.supportedLocales as string[], 
        0.6, 
        'monthly',
        post.updatedAt
      );
    }

    xml += '</urlset>';
    return xml;
  }

  private createSitemapUrl(
    baseUrl: string, 
    path: string, 
    locales: string[], 
    priority: number, 
    changefreq: string,
    lastmod?: Date | null
  ): string {
    let url = '  <url>\n';
    url += `    <loc>${baseUrl}${path}</loc>\n`;
    
    if (lastmod) {
      url += `    <lastmod>${lastmod.toISOString().split('T')[0]}</lastmod>\n`;
    }
    
    url += `    <changefreq>${changefreq}</changefreq>\n`;
    url += `    <priority>${priority.toFixed(1)}</priority>\n`;

    for (const locale of locales) {
      url += `    <xhtml:link rel="alternate" hreflang="${locale}" href="${baseUrl}${path}?lang=${locale}" />\n`;
    }

    url += '  </url>\n';
    return url;
  }

  async getPageMetadata(pageSlug: string, locale: string = 'fr'): Promise<PageMetadata | null> {
    const metadata = await db
      .select()
      .from(pageMetadata)
      .where(and(
        eq(pageMetadata.pageSlug, pageSlug),
        eq(pageMetadata.locale, locale)
      ))
      .limit(1);

    if (metadata.length > 0) {
      const meta = metadata[0];
      if (meta.status === 'active' || meta.status === 'ai_generated' || meta.status === 'admin_override') {
        return meta;
      }
    }

    return null;
  }

  async createOrUpdateMetadata(
    data: InsertPageMetadata,
    performedBy: 'admin' | 'visualscoutai' | 'visualai' = 'admin',
    aiReasoning?: string
  ): Promise<PageMetadata> {
    const existing = await db
      .select()
      .from(pageMetadata)
      .where(and(
        eq(pageMetadata.pageSlug, data.pageSlug),
        eq(pageMetadata.locale, data.locale || 'fr')
      ))
      .limit(1);

    let result: PageMetadata;

    if (existing.length > 0) {
      const updated = await db
        .update(pageMetadata)
        .set({
          ...data,
          generatedBy: performedBy,
          adminApproved: performedBy === 'admin',
          visualAIApproved: performedBy === 'visualai' || performedBy === 'admin',
          status: performedBy === 'admin' ? 'admin_override' : data.status || 'ai_generated',
          updatedAt: new Date(),
        })
        .where(eq(pageMetadata.id, existing[0].id))
        .returning();

      await db.insert(seoGenerationLogs).values({
        pageMetadataId: existing[0].id,
        action: 'updated',
        performedBy,
        previousData: existing[0],
        newData: data,
        aiReasoning,
        approvalStatus: performedBy === 'admin' ? 'approved' : 'pending',
      });

      result = updated[0];
    } else {
      const created = await db.insert(pageMetadata).values({
        ...data,
        generatedBy: performedBy,
        adminApproved: performedBy === 'admin',
        visualAIApproved: performedBy === 'visualai' || performedBy === 'admin',
        status: performedBy === 'admin' ? 'admin_override' : (data.status || 'ai_generated'),
      }).returning();

      await db.insert(seoGenerationLogs).values({
        pageMetadataId: created[0].id,
        action: 'generated',
        performedBy,
        newData: data,
        aiReasoning,
        approvalStatus: performedBy === 'admin' ? 'approved' : 'pending',
      });

      result = created[0];
    }

    return result;
  }

  async generateMetadataForProject(projectId: string, locale: string = 'fr'): Promise<PageMetadata> {
    const project = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    
    if (project.length === 0) {
      throw new Error('Project not found');
    }

    const p = project[0];
    const baseUrl = (await this.getOrCreateConfig()).siteUrl;
    const pageSlug = `/projects/${projectId}`;

    const metadata: InsertPageMetadata = {
      pageType: 'project',
      pageSlug,
      locale,
      title: `${p.title} | VISUAL`,
      description: p.description.substring(0, 160),
      keywords: [p.category, 'investment', 'visual content', 'creative project'],
      canonicalUrl: `${baseUrl}${pageSlug}`,
      ogTitle: p.title,
      ogDescription: p.description.substring(0, 200),
      ogImage: p.thumbnailUrl || `${baseUrl}/og-default.png`,
      ogType: 'article',
      twitterCard: 'summary_large_image',
      twitterTitle: p.title,
      twitterDescription: p.description.substring(0, 160),
      twitterImage: p.thumbnailUrl || `${baseUrl}/og-default.png`,
      schemaMarkup: {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: p.title,
        description: p.description,
        image: p.thumbnailUrl,
        url: `${baseUrl}${pageSlug}`,
        creator: {
          '@type': 'Person',
          name: 'Creator',
        },
      },
    };

    return await this.createOrUpdateMetadata(metadata, 'visualscoutai', 
      `Auto-generated metadata for project: ${p.title}. Category: ${p.category}.`
    );
  }

  async generateHomePageMetadata(locale: string = 'fr'): Promise<PageMetadata> {
    const config = await this.getOrCreateConfig();
    const baseUrl = config.siteUrl;

    const translations = {
      fr: {
        title: 'VISUAL - Investissez dans la créativité visuelle',
        description: 'Plateforme d\'investissement pour projets visuels créatifs. Investissez à partir de 2€ et soutenez les créateurs de demain.',
        keywords: ['investissement créatif', 'contenu visuel', 'projets créatifs', 'crowdfunding'],
      },
      en: {
        title: 'VISUAL - Invest in visual creativity',
        description: 'Investment platform for creative visual projects. Invest from €2 and support tomorrow\'s creators.',
        keywords: ['creative investment', 'visual content', 'creative projects', 'crowdfunding'],
      },
      es: {
        title: 'VISUAL - Invierte en creatividad visual',
        description: 'Plataforma de inversión para proyectos visuales creativos. Invierte desde 2€ y apoya a los creadores del mañana.',
        keywords: ['inversión creativa', 'contenido visual', 'proyectos creativos', 'crowdfunding'],
      },
    };

    const trans = translations[locale as keyof typeof translations] || translations.fr;

    const metadata: InsertPageMetadata = {
      pageType: 'home',
      pageSlug: '/',
      locale,
      title: trans.title,
      description: trans.description,
      keywords: trans.keywords,
      canonicalUrl: baseUrl,
      ogTitle: trans.title,
      ogDescription: trans.description,
      ogImage: `${baseUrl}/og-home.png`,
      ogType: 'website',
      twitterCard: 'summary_large_image',
      twitterTitle: trans.title,
      twitterDescription: trans.description,
      twitterImage: `${baseUrl}/og-home.png`,
      schemaMarkup: config.organizationSchema as any,
    };

    return await this.createOrUpdateMetadata(metadata, 'visualscoutai',
      `Auto-generated homepage metadata for locale: ${locale}`
    );
  }

  async getAllMetadata(locale?: string): Promise<PageMetadata[]> {
    const query = locale
      ? db.select().from(pageMetadata).where(eq(pageMetadata.locale, locale))
      : db.select().from(pageMetadata);

    return await query;
  }

  async approveMetadata(metadataId: string, performedBy: 'visualai' | 'admin'): Promise<void> {
    await db.update(pageMetadata)
      .set({
        visualAIApproved: true,
        adminApproved: performedBy === 'admin',
        status: performedBy === 'admin' ? 'admin_override' : 'active',
      })
      .where(eq(pageMetadata.id, metadataId));

    await db.insert(seoGenerationLogs).values({
      pageMetadataId: metadataId,
      action: 'approved',
      performedBy,
      approvalStatus: 'approved',
    });
  }

  async getGenerationLogs(metadataId?: string, limit: number = 50): Promise<any[]> {
    const query = metadataId
      ? db.select().from(seoGenerationLogs).where(eq(seoGenerationLogs.pageMetadataId, metadataId))
      : db.select().from(seoGenerationLogs);

    return await query.orderBy(desc(seoGenerationLogs.createdAt)).limit(limit);
  }
}

export const seoService = new SEOService();
