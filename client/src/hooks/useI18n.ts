import { useState, useEffect } from 'react';

export type Locale = 'fr-FR' | 'en-US' | 'es-ES';

interface I18nConfig {
  defaultLocale: Locale;
  supportedLocales: Locale[];
  fallbackOrder: Locale[];
}

const config: I18nConfig = {
  defaultLocale: 'fr-FR',
  supportedLocales: ['fr-FR', 'en-US', 'es-ES'],
  fallbackOrder: ['fr-FR', 'en-US']
};

// Translation keys and values
const translations = {
  'fr-FR': {
    // Navigation
    'nav.home': 'Accueil',
    'nav.projects': 'Projets',
    'nav.portfolio': 'Portfolio',
    'nav.live': 'Live',
    'nav.social': 'Social',
    'nav.books': 'Livres',
    'nav.ads': 'Annonces',
    
    // Landing page
    'landing.title': 'VISUAL',
    'landing.subtitle': 'Streaming + Investissement créatif',
    'landing.tagline': 'Regarde. Soutiens. Partage la réussite.',
    'landing.discover': 'Découvrir les projets',
    'landing.howItWorks': 'Comment ça marche ?',
    
    // Categories
    'category.films': 'Films / Vidéos / Documentaires',
    'category.voixInfo': 'Les Voix de l\'Info',
    'category.liveShow': 'Visual Studio Live Show',
    'category.books': 'Livres',
    'category.ads': 'Petites Annonces',
    
    // Status messages
    'status.categoryOff': 'Catégorie en travaux',
    'status.sectionOff': 'Rubrique en travaux',
    'status.maintenance': 'Maintenance en cours',
    
    // Common actions
    'action.discover': 'Découvrir',
    'action.watch': 'Regarder',
    'action.invest': 'Investir',
    'action.buy': 'Acheter',
    'action.share': 'Partager',
    
    // Financial
    'finance.price': 'Prix',
    'finance.investment': 'Investissement',
    'finance.votes': 'votes',
    'finance.investors': 'investisseurs',
    'finance.raised': 'collecté',
    'finance.target': 'objectif',
  },
  'en-US': {
    // Navigation
    'nav.home': 'Home',
    'nav.projects': 'Projects',
    'nav.portfolio': 'Portfolio',
    'nav.live': 'Live',
    'nav.social': 'Social',
    'nav.books': 'Books',
    'nav.ads': 'Classifieds',
    
    // Landing page
    'landing.title': 'VISUAL',
    'landing.subtitle': 'Streaming + Creative Investment',
    'landing.tagline': 'Watch. Support. Share success.',
    'landing.discover': 'Discover projects',
    'landing.howItWorks': 'How it works?',
    
    // Categories
    'category.films': 'Films / Videos / Documentaries',
    'category.voixInfo': 'News Voices',
    'category.liveShow': 'Visual Studio Live Show',
    'category.books': 'Books',
    'category.ads': 'Classifieds',
    
    // Status messages
    'status.categoryOff': 'Category under construction',
    'status.sectionOff': 'Section under construction',
    'status.maintenance': 'Under maintenance',
    
    // Common actions
    'action.discover': 'Discover',
    'action.watch': 'Watch',
    'action.invest': 'Invest',
    'action.buy': 'Buy',
    'action.share': 'Share',
    
    // Financial
    'finance.price': 'Price',
    'finance.investment': 'Investment',
    'finance.votes': 'votes',
    'finance.investors': 'investors',
    'finance.raised': 'raised',
    'finance.target': 'target',
  },
  'es-ES': {
    // Navigation
    'nav.home': 'Inicio',
    'nav.projects': 'Proyectos',
    'nav.portfolio': 'Cartera',
    'nav.live': 'En vivo',
    'nav.social': 'Social',
    'nav.books': 'Libros',
    'nav.ads': 'Anuncios',
    
    // Landing page
    'landing.title': 'VISUAL',
    'landing.subtitle': 'Streaming + Inversión creativa',
    'landing.tagline': 'Mira. Apoya. Comparte el éxito.',
    'landing.discover': 'Descubrir proyectos',
    'landing.howItWorks': '¿Cómo funciona?',
    
    // Categories
    'category.films': 'Películas / Videos / Documentales',
    'category.voixInfo': 'Voces de la Info',
    'category.liveShow': 'Visual Studio Live Show',
    'category.books': 'Libros',
    'category.ads': 'Anuncios clasificados',
    
    // Status messages
    'status.categoryOff': 'Categoría en construcción',
    'status.sectionOff': 'Sección en construcción',
    'status.maintenance': 'En mantenimiento',
    
    // Common actions
    'action.discover': 'Descubrir',
    'action.watch': 'Ver',
    'action.invest': 'Invertir',
    'action.buy': 'Comprar',
    'action.share': 'Compartir',
    
    // Financial
    'finance.price': 'Precio',
    'finance.investment': 'Inversión',
    'finance.votes': 'votos',
    'finance.investors': 'inversores',
    'finance.raised': 'recaudado',
    'finance.target': 'objetivo',
  }
};

export function useI18n() {
  const [currentLocale, setCurrentLocale] = useState<Locale>(() => {
    // Try to get locale from URL path
    const path = window.location.pathname;
    const pathLocale = path.split('/')[1];
    
    if (config.supportedLocales.includes(pathLocale as Locale)) {
      return pathLocale as Locale;
    }
    
    // Try to get from browser language
    const browserLang = navigator.language as Locale;
    if (config.supportedLocales.includes(browserLang)) {
      return browserLang;
    }
    
    return config.defaultLocale;
  });

  const t = (key: string): string => {
    const localeTranslations = translations[currentLocale];
    if (localeTranslations && localeTranslations[key as keyof typeof localeTranslations]) {
      return localeTranslations[key as keyof typeof localeTranslations];
    }
    
    // Fallback to default locale
    for (const fallbackLocale of config.fallbackOrder) {
      const fallbackTranslations = translations[fallbackLocale];
      if (fallbackTranslations && fallbackTranslations[key as keyof typeof fallbackTranslations]) {
        return fallbackTranslations[key as keyof typeof fallbackTranslations];
      }
    }
    
    // Return key if no translation found
    return key;
  };

  const setLocale = (locale: Locale) => {
    if (config.supportedLocales.includes(locale)) {
      setCurrentLocale(locale);
      
      // Update URL path
      const currentPath = window.location.pathname;
      const pathParts = currentPath.split('/');
      
      // Remove existing locale if present
      if (config.supportedLocales.includes(pathParts[1] as Locale)) {
        pathParts.splice(1, 1);
      }
      
      // Add new locale
      const newPath = `/${locale}${pathParts.join('/')}`;
      window.history.pushState({}, '', newPath);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(currentLocale, {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat(currentLocale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return {
    currentLocale,
    setLocale,
    t,
    formatCurrency,
    formatDate,
    supportedLocales: config.supportedLocales
  };
}