import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useI18n } from '@/lib/i18n';

export interface PageMetadata {
  id: string;
  pageType: string;
  pageSlug: string;
  locale: string;
  title: string;
  description: string;
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
  status: string;
  generatedBy?: string;
  adminApproved?: boolean;
  visualAIApproved?: boolean;
  viewCount?: number;
  clickRate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function useSEO(pageSlug: string) {
  const { locale } = useI18n();

  const { data: metadata, isLoading } = useQuery<PageMetadata | null>({
    queryKey: ['/api/seo/metadata', pageSlug, locale],
    queryFn: async () => {
      const res = await fetch(`/api/seo/metadata?pageSlug=${encodeURIComponent(pageSlug)}&locale=${locale}`);
      if (!res.ok) {
        console.error('SEO metadata fetch failed:', res.statusText);
        return null;
      }
      const data = await res.json();
      return data;
    },
  });

  return {
    metadata,
    isLoading,
  };
}

export function useSEOConfig() {
  const { data: config, isLoading } = useQuery({
    queryKey: ['/api/seo/config'],
    queryFn: async () => {
      const res = await fetch('/api/seo/config');
      if (!res.ok) throw new Error('Failed to fetch SEO config');
      return res.json();
    },
  });

  return {
    config,
    isLoading,
  };
}
