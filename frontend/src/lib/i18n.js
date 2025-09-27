// Configuration i18n pour VISUAL Platform
import { useState, useEffect, createContext, useContext } from 'react';

// Configuration des locales supportées selon le document
const I18N_CONFIG = {
  default_locale: "fr-FR",
  supported_locales: ["fr-FR", "en-US", "es-ES", "de-DE", "it-IT"],
  url_strategy: "path-prefix",
  seo: { hreflang: true, localized_sitemaps: true },
  subtitle_formats: ["vtt", "srt"],
  mt_provider: "auto",
  tm_enabled: true,
  fallback_order: ["fr-FR", "en-US"],
  currency_format: { "EUR": "fr-FR" }
};

// Traductions pour VISUAL Platform
const translations = {
  "fr-FR": {
    // Navigation
    "nav.home": "Accueil",
    "nav.dashboard": "Dashboard",
    "nav.projects": "Projets",
    "nav.portfolio": "Portfolio",
    "nav.live": "Live",
    "nav.social": "Social",
    "nav.admin": "Admin",
    
    // Landing Page
    "landing.hero.title": "Investissez dans",
    "landing.hero.subtitle": "l'avenir créatif",
    "landing.hero.description": "VISUAL révolutionne l'investissement dans les contenus visuels. Soutenez des créateurs talentueux avec des micro-investissements et participez au succès des projets du futur.",
    "landing.cta.start": "Commencer maintenant",
    "landing.features.title": "Une plateforme révolutionnaire",
    "landing.features.micro_investment.title": "Micro-investissements",
    "landing.features.micro_investment.desc": "Investissez de 1€ à 20€ par projet avec des calculs de ROI automatiques et un suivi en temps réel de vos performances.",
    "landing.features.community.title": "Communauté active",
    "landing.features.community.desc": "Votez pour vos projets préférés, participez aux discussions et influencez les classements de la plateforme.",
    "landing.features.live_shows.title": "Shows en direct",
    "landing.features.live_shows.desc": "Assistez aux battles d'artistes en temps réel et investissez pendant les performances live.",
    "landing.features.compliance.title": "Conformité AMF",
    "landing.features.compliance.desc": "Plateforme sécurisée avec rapports automatiques et audit trail complet pour votre tranquillité d'esprit.",
    
    // Dashboard
    "dashboard.welcome": "Bonjour {name} ! 👋",
    "dashboard.subtitle": "Voici un aperçu de votre activité sur VISUAL Platform",
    "dashboard.stats.balance": "Balance totale",
    "dashboard.stats.invested": "Total investi",
    "dashboard.stats.gains": "Gains totaux",
    "dashboard.stats.projects": "Projets suivis",
    "dashboard.quick_actions": "Actions rapides",
    "dashboard.browse_projects": "Parcourir les projets",
    "dashboard.portfolio": "Mon portefeuille",
    "dashboard.live_shows": "Shows en direct",
    "dashboard.board": "Tableau de bord",
    
    // Projects
    "projects.title": "Projets d'investissement",
    "projects.subtitle": "Découvrez les projets créatifs et investissez dans ceux qui vous inspirent",
    "projects.categories.all": "Tous",
    "projects.categories.documentary": "Documentaires",
    "projects.categories.animation": "Animation",
    "projects.categories.fiction": "Fiction",
    "projects.categories.music": "Musique",
    "projects.invest": "Investir",
    "projects.funded": "financé",
    "projects.investors": "investisseurs",
    "projects.votes": "votes",
    "projects.load_more": "Charger plus de projets",
    
    // VISUAL Terms (Glossaire verrouillé)
    "terms.visupoints": "VISUpoints",
    "terms.investi_lecteur": "Investi-lecteur",
    "terms.infoporteur": "Infoporteur",
    "terms.visual_platform": "VISUAL Platform",
    
    // Live Shows
    "live.title": "Shows en direct",
    "live.subtitle": "Participez aux événements live et investissez en temps réel",
    "live.status.live": "🔴 En direct",
    "live.status.starting_soon": "🟡 Bientôt",
    "live.status.scheduled": "📅 Programmé",
    "live.viewers": "spectateurs",
    "live.prize": "de prix",
    "live.join": "Rejoindre",
    "live.details": "Détails",
    
    // Currency & Formats
    "currency.symbol": "€",
    "date.format": "DD/MM/YYYY",
    "number.decimal": ",",
    "number.thousand": " "
  },
  
  "en-US": {
    // Navigation
    "nav.home": "Home",
    "nav.dashboard": "Dashboard", 
    "nav.projects": "Projects",
    "nav.portfolio": "Portfolio",
    "nav.live": "Live",
    "nav.social": "Social",
    "nav.admin": "Admin",
    
    // Landing Page
    "landing.hero.title": "Invest in",
    "landing.hero.subtitle": "creative future",
    "landing.hero.description": "VISUAL revolutionizes investment in visual content. Support talented creators with micro-investments and participate in the success of future projects.",
    "landing.cta.start": "Get Started Now",
    "landing.features.title": "A revolutionary platform",
    "landing.features.micro_investment.title": "Micro-investments",
    "landing.features.micro_investment.desc": "Invest from €1 to €20 per project with automatic ROI calculations and real-time performance tracking.",
    "landing.features.community.title": "Active Community",
    "landing.features.community.desc": "Vote for your favorite projects, participate in discussions and influence platform rankings.",
    "landing.features.live_shows.title": "Live Shows",
    "landing.features.live_shows.desc": "Watch artist battles in real time and invest during live performances.",
    "landing.features.compliance.title": "AMF Compliance",
    "landing.features.compliance.desc": "Secure platform with automatic reports and complete audit trail for your peace of mind.",
    
    // Dashboard
    "dashboard.welcome": "Hello {name}! 👋",
    "dashboard.subtitle": "Here's an overview of your activity on VISUAL Platform",
    "dashboard.stats.balance": "Total Balance",
    "dashboard.stats.invested": "Total Invested",
    "dashboard.stats.gains": "Total Gains",
    "dashboard.stats.projects": "Followed Projects",
    "dashboard.quick_actions": "Quick Actions",
    "dashboard.browse_projects": "Browse Projects",
    "dashboard.portfolio": "My Portfolio",
    "dashboard.live_shows": "Live Shows",
    "dashboard.board": "Dashboard",
    
    // Projects
    "projects.title": "Investment Projects",
    "projects.subtitle": "Discover creative projects and invest in those that inspire you",
    "projects.categories.all": "All",
    "projects.categories.documentary": "Documentaries",
    "projects.categories.animation": "Animation", 
    "projects.categories.fiction": "Fiction",
    "projects.categories.music": "Music",
    "projects.invest": "Invest",
    "projects.funded": "funded",
    "projects.investors": "investors",
    "projects.votes": "votes",
    "projects.load_more": "Load More Projects",
    
    // VISUAL Terms
    "terms.visupoints": "VISUpoints",
    "terms.investi_lecteur": "Investor-Reader",
    "terms.infoporteur": "Info-carrier",
    "terms.visual_platform": "VISUAL Platform",
    
    // Live Shows
    "live.title": "Live Shows",
    "live.subtitle": "Participate in live events and invest in real time",
    "live.status.live": "🔴 Live",
    "live.status.starting_soon": "🟡 Starting Soon",
    "live.status.scheduled": "📅 Scheduled",
    "live.viewers": "viewers",
    "live.prize": "prize",
    "live.join": "Join",
    "live.details": "Details",
    
    // Currency & Formats
    "currency.symbol": "€",
    "date.format": "MM/DD/YYYY",
    "number.decimal": ".",
    "number.thousand": ","
  },
  
  "es-ES": {
    // Navigation
    "nav.home": "Inicio",
    "nav.dashboard": "Panel",
    "nav.projects": "Proyectos", 
    "nav.portfolio": "Cartera",
    "nav.live": "En Vivo",
    "nav.social": "Social",
    "nav.admin": "Admin",
    
    // Landing Page
    "landing.hero.title": "Invierte en",
    "landing.hero.subtitle": "el futuro creativo",
    "landing.hero.description": "VISUAL revoluciona la inversión en contenidos visuales. Apoya a creadores talentosos con micro-inversiones y participa en el éxito de los proyectos del futuro.",
    "landing.cta.start": "Comenzar Ahora",
    "landing.features.title": "Una plataforma revolucionaria",
    "landing.features.micro_investment.title": "Micro-inversiones",
    "landing.features.micro_investment.desc": "Invierte de 1€ a 20€ por proyecto con cálculos automáticos de ROI y seguimiento en tiempo real.",
    "landing.features.community.title": "Comunidad Activa",
    "landing.features.community.desc": "Vota por tus proyectos favoritos, participa en discusiones e influye en los rankings de la plataforma.",
    "landing.features.live_shows.title": "Shows en Vivo",
    "landing.features.live_shows.desc": "Asiste a batallas de artistas en tiempo real e invierte durante las actuaciones en vivo.",
    "landing.features.compliance.title": "Cumplimiento AMF",
    "landing.features.compliance.desc": "Plataforma segura con informes automáticos y trazabilidad completa para tu tranquilidad.",
    
    // Dashboard
    "dashboard.welcome": "¡Hola {name}! 👋",
    "dashboard.subtitle": "Aquí tienes una vista general de tu actividad en VISUAL Platform",
    "dashboard.stats.balance": "Saldo Total",
    "dashboard.stats.invested": "Total Invertido",
    "dashboard.stats.gains": "Ganancias Totales",
    "dashboard.stats.projects": "Proyectos Seguidos",
    "dashboard.quick_actions": "Acciones Rápidas",
    "dashboard.browse_projects": "Explorar Proyectos",
    "dashboard.portfolio": "Mi Cartera",
    "dashboard.live_shows": "Shows en Vivo",
    "dashboard.board": "Panel de Control",
    
    // VISUAL Terms
    "terms.visupoints": "VISUpoints",
    "terms.investi_lecteur": "Inversor-Lector",
    "terms.infoporteur": "Porta-info",
    "terms.visual_platform": "Plataforma VISUAL",
    
    // Currency & Formats
    "currency.symbol": "€",
    "date.format": "DD/MM/YYYY",
    "number.decimal": ",",
    "number.thousand": "."
  }
};

// Context pour l'i18n
const I18nContext = createContext();

// Hook personnalisé pour l'i18n
export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    // Fallback si pas dans le provider
    return useI18nFallback();
  }
  return context;
};

// Fallback hook
const useI18nFallback = () => {
  const [locale, setLocale] = useState(() => {
    // Détection langue navigateur
    const savedLocale = localStorage.getItem('visual_locale');
    if (savedLocale && I18N_CONFIG.supported_locales.includes(savedLocale)) {
      return savedLocale;
    }
    
    const browserLocale = navigator.language || navigator.languages[0];
    const matchedLocale = I18N_CONFIG.supported_locales.find(
      loc => loc.startsWith(browserLocale.split('-')[0])
    );
    return matchedLocale || I18N_CONFIG.default_locale;
  });

  const changeLocale = (newLocale) => {
    if (I18N_CONFIG.supported_locales.includes(newLocale)) {
      setLocale(newLocale);
      localStorage.setItem('visual_locale', newLocale);
    }
  };

  const t = (key, params = {}) => {
    const keys = key.split('.');
    let value = translations[locale];
    
    // Navigation dans l'objet de traduction
    for (const k of keys) {
      value = value?.[k];
    }
    
    // Fallback vers langue par défaut si traduction manquante
    if (!value && locale !== I18N_CONFIG.default_locale) {
      let fallbackValue = translations[I18N_CONFIG.default_locale];
      for (const k of keys) {
        fallbackValue = fallbackValue?.[k];
      }
      value = fallbackValue;
    }
    
    // Si toujours pas de valeur, retourner la clé
    if (!value) {
      return key;
    }
    
    // Remplacement des paramètres {name}, {count}, etc.
    return value.replace(/\{(\w+)\}/g, (match, param) => {
      return params[param] || match;
    });
  };

  const formatCurrency = (amount, locale_override) => {
    const targetLocale = locale_override || locale;
    return new Intl.NumberFormat(targetLocale, {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (date, locale_override) => {
    const targetLocale = locale_override || locale;
    return new Intl.DateTimeFormat(targetLocale).format(date);
  };

  const formatNumber = (number, locale_override) => {
    const targetLocale = locale_override || locale;
    return new Intl.NumberFormat(targetLocale).format(number);
  };

  return {
    locale,
    changeLocale,
    t,
    formatCurrency,
    formatDate,
    formatNumber,
    supportedLocales: I18N_CONFIG.supported_locales,
    config: I18N_CONFIG
  };
};

// Provider pour l'i18n
export const I18nProvider = ({ children }) => {
  const i18nValue = useI18nFallback();
  
  return (
    <I18nContext.Provider value={i18nValue}>
      {children}
    </I18nContext.Provider>
  );
};

export default I18N_CONFIG;