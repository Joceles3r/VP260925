import { useEffect } from 'react';
import { useI18n } from '@/lib/i18n';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  schemaMarkup?: any;
}

export function SEOHead(props: SEOProps) {
  const { locale } = useI18n();

  useEffect(() => {
    if (props.title) {
      document.title = props.title;
    }

    updateMetaTag('description', props.description);
    updateMetaTag('keywords', props.keywords?.join(', '));
    
    if (props.canonicalUrl) {
      updateLinkTag('canonical', props.canonicalUrl);
    }

    updateMetaTag('og:title', props.ogTitle || props.title, 'property');
    updateMetaTag('og:description', props.ogDescription || props.description, 'property');
    updateMetaTag('og:image', props.ogImage, 'property');
    updateMetaTag('og:type', props.ogType || 'website', 'property');
    updateMetaTag('og:locale', locale, 'property');
    
    updateMetaTag('twitter:card', props.twitterCard || 'summary_large_image');
    updateMetaTag('twitter:title', props.twitterTitle || props.title);
    updateMetaTag('twitter:description', props.twitterDescription || props.description);
    updateMetaTag('twitter:image', props.twitterImage || props.ogImage);

    if (props.schemaMarkup) {
      updateJSONLD(props.schemaMarkup);
    }

    const alternateLangs = ['fr', 'en', 'es'];
    alternateLangs.forEach(lang => {
      const currentUrl = window.location.origin + window.location.pathname;
      updateLinkTag(`alternate-${lang}`, `${currentUrl}?lang=${lang}`, lang);
    });
  }, [props, locale]);

  return null;
}

function updateMetaTag(name: string, content: string | undefined, attributeName: string = 'name') {
  if (!content) return;

  let meta = document.querySelector(`meta[${attributeName}="${name}"]`);
  
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attributeName, name);
    document.head.appendChild(meta);
  }
  
  meta.setAttribute('content', content);
}

function updateLinkTag(rel: string, href: string, hreflang?: string) {
  if (!href) return;

  const selector = hreflang 
    ? `link[rel="alternate"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]`;
  
  let link = document.querySelector(selector) as HTMLLinkElement;
  
  if (!link) {
    link = document.createElement('link');
    link.rel = hreflang ? 'alternate' : rel;
    if (hreflang) {
      link.setAttribute('hreflang', hreflang);
    }
    document.head.appendChild(link);
  }
  
  link.href = href;
}

function updateJSONLD(schema: any) {
  let script = document.querySelector('script[type="application/ld+json"]');
  
  if (!script) {
    script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    document.head.appendChild(script);
  }
  
  script.textContent = JSON.stringify(schema);
}

export default SEOHead;
