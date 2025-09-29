/**
 * Système d'internationalisation trilingue pour VISUAL Platform
 * Support FR/EN/ES avec détection automatique et persistance
 */

import { useState, useEffect } from 'react';

export type SupportedLocale = 'fr' | 'en' | 'es';

export interface TranslationKeys {
  // Navigation
  'nav.home': string;
  'nav.visual': string;
  'nav.portfolio': string;
  'nav.profile': string;
  'nav.admin': string;
  'nav.login': string;
  'nav.logout': string;

  // Common
  'common.loading': string;
  'common.error': string;
  'common.success': string;
  'common.cancel': string;
  'common.confirm': string;
  'common.save': string;
  'common.delete': string;
  'common.edit': string;
  'common.view': string;
  'common.back': string;
  'common.next': string;
  'common.previous': string;
  'common.close': string;
  'common.search': string;
  'common.filter': string;
  'common.sort': string;
  'common.reset': string;

  // VISUAL Platform
  'visual.title': string;
  'visual.subtitle': string;
  'visual.description': string;
  'visual.categories.film': string;
  'visual.categories.music': string;
  'visual.categories.game': string;
  'visual.categories.art': string;
  'visual.categories.tech': string;
  'visual.categories.lifestyle': string;

  // Investments
  'investment.title': string;
  'investment.amount': string;
  'investment.currency': string;
  'investment.invest': string;
  'investment.invested': string;
  'investment.minimum': string;
  'investment.maximum': string;
  'investment.progress': string;
  'investment.target': string;
  'investment.backers': string;
  'investment.days_left': string;

  // Projects
  'project.title': string;
  'project.description': string;
  'project.creator': string;
  'project.category': string;
  'project.status': string;
  'project.created_at': string;
  'project.updated_at': string;
  'project.vote': string;
  'project.votes': string;
  'project.engagement': string;

  // Filters
  'filter.all': string;
  'filter.category': string;
  'filter.price_range': string;
  'filter.progress_range': string;
  'filter.trending': string;
  'filter.top10': string;
  'filter.new': string;
  'filter.sort_by': string;
  'filter.sort_title': string;
  'filter.sort_price': string;
  'filter.sort_progress': string;
  'filter.sort_engagement': string;
  'filter.sort_investors': string;
  'filter.sort_asc': string;
  'filter.sort_desc': string;

  // Authentication
  'auth.login': string;
  'auth.logout': string;
  'auth.register': string;
  'auth.email': string;
  'auth.password': string;
  'auth.confirm_password': string;
  'auth.forgot_password': string;
  'auth.reset_password': string;
  'auth.2fa_code': string;
  'auth.backup_code': string;
  'auth.enable_2fa': string;
  'auth.disable_2fa': string;

  // Notifications
  'notification.investment_success': string;
  'notification.investment_error': string;
  'notification.vote_success': string;
  'notification.vote_error': string;
  'notification.profile_updated': string;
  'notification.project_created': string;

  // Errors
  'error.network': string;
  'error.unauthorized': string;
  'error.forbidden': string;
  'error.not_found': string;
  'error.server': string;
  'error.validation': string;
  'error.form_invalid': string;

  // Time
  'time.seconds': string;
  'time.minutes': string;
  'time.hours': string;
  'time.days': string;
  'time.weeks': string;
  'time.months': string;
  'time.years': string;
  'time.ago': string;
  'time.remaining': string;

  // Numbers
  'number.currency_symbol': string;
  'number.decimal_separator': string;
  'number.thousands_separator': string;

  // Tour
  'tour.welcome_title': string;
  'tour.welcome_description': string;
  'tour.skip': string;
  'tour.next': string;
  'tour.previous': string;
  'tour.finish': string;
  'tour.step_of': string;
}

// Traductions françaises (langue par défaut)
const translations_fr: TranslationKeys = {
  // Navigation
  'nav.home': 'Accueil',
  'nav.visual': 'VISUAL',
  'nav.portfolio': 'Portfolio',
  'nav.profile': 'Profil',
  'nav.admin': 'Administration',
  'nav.login': 'Connexion',
  'nav.logout': 'Déconnexion',

  // Common
  'common.loading': 'Chargement...',
  'common.error': 'Erreur',
  'common.success': 'Succès',
  'common.cancel': 'Annuler',
  'common.confirm': 'Confirmer',
  'common.save': 'Sauvegarder',
  'common.delete': 'Supprimer',
  'common.edit': 'Modifier',
  'common.view': 'Voir',
  'common.back': 'Retour',
  'common.next': 'Suivant',
  'common.previous': 'Précédent',
  'common.close': 'Fermer',
  'common.search': 'Rechercher',
  'common.filter': 'Filtrer',
  'common.sort': 'Trier',
  'common.reset': 'Réinitialiser',

  // VISUAL Platform
  'visual.title': 'VISUAL Platform',
  'visual.subtitle': 'Investissement Créatif Hybride',
  'visual.description': 'Plateforme de financement participatif pour projets audiovisuels et créatifs',
  'visual.categories.film': 'Films & Vidéos',
  'visual.categories.music': 'Musique & Audio',
  'visual.categories.game': 'Jeux Vidéo',
  'visual.categories.art': 'Art & Design',
  'visual.categories.tech': 'Technologie',
  'visual.categories.lifestyle': 'Lifestyle',

  // Investments
  'investment.title': 'Investissement',
  'investment.amount': 'Montant',
  'investment.currency': '€',
  'investment.invest': 'Investir',
  'investment.invested': 'Investi',
  'investment.minimum': 'Minimum',
  'investment.maximum': 'Maximum',
  'investment.progress': 'Progression',
  'investment.target': 'Objectif',
  'investment.backers': 'Investisseurs',
  'investment.days_left': 'Jours restants',

  // Projects
  'project.title': 'Titre',
  'project.description': 'Description',
  'project.creator': 'Créateur',
  'project.category': 'Catégorie',
  'project.status': 'Statut',
  'project.created_at': 'Créé le',
  'project.updated_at': 'Mis à jour le',
  'project.vote': 'Voter',
  'project.votes': 'Votes',
  'project.engagement': 'Engagement',

  // Filters
  'filter.all': 'Tous',
  'filter.category': 'Catégorie',
  'filter.price_range': 'Fourchette de prix',
  'filter.progress_range': 'Progression',
  'filter.trending': 'Tendance',
  'filter.top10': 'TOP 10',
  'filter.new': 'Nouveau',
  'filter.sort_by': 'Trier par',
  'filter.sort_title': 'Titre',
  'filter.sort_price': 'Prix',
  'filter.sort_progress': 'Progression',
  'filter.sort_engagement': 'Engagement',
  'filter.sort_investors': 'Investisseurs',
  'filter.sort_asc': 'Croissant',
  'filter.sort_desc': 'Décroissant',

  // Authentication
  'auth.login': 'Se connecter',
  'auth.logout': 'Se déconnecter',
  'auth.register': 'S\'inscrire',
  'auth.email': 'Email',
  'auth.password': 'Mot de passe',
  'auth.confirm_password': 'Confirmer le mot de passe',
  'auth.forgot_password': 'Mot de passe oublié',
  'auth.reset_password': 'Réinitialiser le mot de passe',
  'auth.2fa_code': 'Code 2FA',
  'auth.backup_code': 'Code de secours',
  'auth.enable_2fa': 'Activer 2FA',
  'auth.disable_2fa': 'Désactiver 2FA',

  // Notifications
  'notification.investment_success': 'Investissement réalisé avec succès !',
  'notification.investment_error': 'Erreur lors de l\'investissement',
  'notification.vote_success': 'Vote enregistré !',
  'notification.vote_error': 'Erreur lors du vote',
  'notification.profile_updated': 'Profil mis à jour',
  'notification.project_created': 'Projet créé avec succès',

  // Errors
  'error.network': 'Erreur de connexion réseau',
  'error.unauthorized': 'Accès non autorisé',
  'error.forbidden': 'Accès interdit',
  'error.not_found': 'Ressource introuvable',
  'error.server': 'Erreur serveur interne',
  'error.validation': 'Erreur de validation',
  'error.form_invalid': 'Formulaire invalide',

  // Time
  'time.seconds': 'secondes',
  'time.minutes': 'minutes',
  'time.hours': 'heures',
  'time.days': 'jours',
  'time.weeks': 'semaines',
  'time.months': 'mois',
  'time.years': 'années',
  'time.ago': 'il y a',
  'time.remaining': 'restant',

  // Numbers
  'number.currency_symbol': '€',
  'number.decimal_separator': ',',
  'number.thousands_separator': ' ',

  // Tour
  'tour.welcome_title': 'Bienvenue sur VISUAL',
  'tour.welcome_description': 'Découvrez la plateforme d\'investissement créatif',
  'tour.skip': 'Ignorer',
  'tour.next': 'Suivant',
  'tour.previous': 'Précédent',
  'tour.finish': 'Terminer',
  'tour.step_of': 'de',
};

// Traductions anglaises
const translations_en: TranslationKeys = {
  // Navigation
  'nav.home': 'Home',
  'nav.visual': 'VISUAL',
  'nav.portfolio': 'Portfolio',
  'nav.profile': 'Profile',
  'nav.admin': 'Admin',
  'nav.login': 'Login',
  'nav.logout': 'Logout',

  // Common
  'common.loading': 'Loading...',
  'common.error': 'Error',
  'common.success': 'Success',
  'common.cancel': 'Cancel',
  'common.confirm': 'Confirm',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.view': 'View',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.previous': 'Previous',
  'common.close': 'Close',
  'common.search': 'Search',
  'common.filter': 'Filter',
  'common.sort': 'Sort',
  'common.reset': 'Reset',

  // VISUAL Platform
  'visual.title': 'VISUAL Platform',
  'visual.subtitle': 'Hybrid Creative Investment',
  'visual.description': 'Crowdfunding platform for audiovisual and creative projects',
  'visual.categories.film': 'Films & Videos',
  'visual.categories.music': 'Music & Audio',
  'visual.categories.game': 'Video Games',
  'visual.categories.art': 'Art & Design',
  'visual.categories.tech': 'Technology',
  'visual.categories.lifestyle': 'Lifestyle',

  // Investments
  'investment.title': 'Investment',
  'investment.amount': 'Amount',
  'investment.currency': '€',
  'investment.invest': 'Invest',
  'investment.invested': 'Invested',
  'investment.minimum': 'Minimum',
  'investment.maximum': 'Maximum',
  'investment.progress': 'Progress',
  'investment.target': 'Target',
  'investment.backers': 'Backers',
  'investment.days_left': 'Days left',

  // Projects
  'project.title': 'Title',
  'project.description': 'Description',
  'project.creator': 'Creator',
  'project.category': 'Category',
  'project.status': 'Status',
  'project.created_at': 'Created',
  'project.updated_at': 'Updated',
  'project.vote': 'Vote',
  'project.votes': 'Votes',
  'project.engagement': 'Engagement',

  // Filters
  'filter.all': 'All',
  'filter.category': 'Category',
  'filter.price_range': 'Price range',
  'filter.progress_range': 'Progress',
  'filter.trending': 'Trending',
  'filter.top10': 'TOP 10',
  'filter.new': 'New',
  'filter.sort_by': 'Sort by',
  'filter.sort_title': 'Title',
  'filter.sort_price': 'Price',
  'filter.sort_progress': 'Progress',
  'filter.sort_engagement': 'Engagement',
  'filter.sort_investors': 'Investors',
  'filter.sort_asc': 'Ascending',
  'filter.sort_desc': 'Descending',

  // Authentication
  'auth.login': 'Login',
  'auth.logout': 'Logout',
  'auth.register': 'Register',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.confirm_password': 'Confirm password',
  'auth.forgot_password': 'Forgot password',
  'auth.reset_password': 'Reset password',
  'auth.2fa_code': '2FA Code',
  'auth.backup_code': 'Backup code',
  'auth.enable_2fa': 'Enable 2FA',
  'auth.disable_2fa': 'Disable 2FA',

  // Notifications
  'notification.investment_success': 'Investment successful!',
  'notification.investment_error': 'Investment error',
  'notification.vote_success': 'Vote recorded!',
  'notification.vote_error': 'Vote error',
  'notification.profile_updated': 'Profile updated',
  'notification.project_created': 'Project created successfully',

  // Errors
  'error.network': 'Network connection error',
  'error.unauthorized': 'Unauthorized access',
  'error.forbidden': 'Access forbidden',
  'error.not_found': 'Resource not found',
  'error.server': 'Internal server error',
  'error.validation': 'Validation error',
  'error.form_invalid': 'Invalid form',

  // Time
  'time.seconds': 'seconds',
  'time.minutes': 'minutes',
  'time.hours': 'hours',
  'time.days': 'days',
  'time.weeks': 'weeks',
  'time.months': 'months',
  'time.years': 'years',
  'time.ago': 'ago',
  'time.remaining': 'remaining',

  // Numbers
  'number.currency_symbol': '€',
  'number.decimal_separator': '.',
  'number.thousands_separator': ',',

  // Tour
  'tour.welcome_title': 'Welcome to VISUAL',
  'tour.welcome_description': 'Discover the creative investment platform',
  'tour.skip': 'Skip',
  'tour.next': 'Next',
  'tour.previous': 'Previous',
  'tour.finish': 'Finish',
  'tour.step_of': 'of',
};

// Traductions espagnoles
const translations_es: TranslationKeys = {
  // Navigation
  'nav.home': 'Inicio',
  'nav.visual': 'VISUAL',
  'nav.portfolio': 'Portafolio',
  'nav.profile': 'Perfil',
  'nav.admin': 'Administración',
  'nav.login': 'Iniciar sesión',
  'nav.logout': 'Cerrar sesión',

  // Common
  'common.loading': 'Cargando...',
  'common.error': 'Error',
  'common.success': 'Éxito',
  'common.cancel': 'Cancelar',
  'common.confirm': 'Confirmar',
  'common.save': 'Guardar',
  'common.delete': 'Eliminar',
  'common.edit': 'Editar',
  'common.view': 'Ver',
  'common.back': 'Atrás',
  'common.next': 'Siguiente',
  'common.previous': 'Anterior',
  'common.close': 'Cerrar',
  'common.search': 'Buscar',
  'common.filter': 'Filtrar',
  'common.sort': 'Ordenar',
  'common.reset': 'Restablecer',

  // VISUAL Platform
  'visual.title': 'Plataforma VISUAL',
  'visual.subtitle': 'Inversión Creativa Híbrida',
  'visual.description': 'Plataforma de financiación colectiva para proyectos audiovisuales y creativos',
  'visual.categories.film': 'Películas y Videos',
  'visual.categories.music': 'Música y Audio',
  'visual.categories.game': 'Videojuegos',
  'visual.categories.art': 'Arte y Diseño',
  'visual.categories.tech': 'Tecnología',
  'visual.categories.lifestyle': 'Estilo de vida',

  // Investments
  'investment.title': 'Inversión',
  'investment.amount': 'Cantidad',
  'investment.currency': '€',
  'investment.invest': 'Invertir',
  'investment.invested': 'Invertido',
  'investment.minimum': 'Mínimo',
  'investment.maximum': 'Máximo',
  'investment.progress': 'Progreso',
  'investment.target': 'Objetivo',
  'investment.backers': 'Inversores',
  'investment.days_left': 'Días restantes',

  // Projects
  'project.title': 'Título',
  'project.description': 'Descripción',
  'project.creator': 'Creador',
  'project.category': 'Categoría',
  'project.status': 'Estado',
  'project.created_at': 'Creado',
  'project.updated_at': 'Actualizado',
  'project.vote': 'Votar',
  'project.votes': 'Votos',
  'project.engagement': 'Compromiso',

  // Filters
  'filter.all': 'Todos',
  'filter.category': 'Categoría',
  'filter.price_range': 'Rango de precio',
  'filter.progress_range': 'Progreso',
  'filter.trending': 'Tendencia',
  'filter.top10': 'TOP 10',
  'filter.new': 'Nuevo',
  'filter.sort_by': 'Ordenar por',
  'filter.sort_title': 'Título',
  'filter.sort_price': 'Precio',
  'filter.sort_progress': 'Progreso',
  'filter.sort_engagement': 'Compromiso',
  'filter.sort_investors': 'Inversores',
  'filter.sort_asc': 'Ascendente',
  'filter.sort_desc': 'Descendente',

  // Authentication
  'auth.login': 'Iniciar sesión',
  'auth.logout': 'Cerrar sesión',
  'auth.register': 'Registrarse',
  'auth.email': 'Correo electrónico',
  'auth.password': 'Contraseña',
  'auth.confirm_password': 'Confirmar contraseña',
  'auth.forgot_password': 'Contraseña olvidada',
  'auth.reset_password': 'Restablecer contraseña',
  'auth.2fa_code': 'Código 2FA',
  'auth.backup_code': 'Código de respaldo',
  'auth.enable_2fa': 'Activar 2FA',
  'auth.disable_2fa': 'Desactivar 2FA',

  // Notifications
  'notification.investment_success': '¡Inversión realizada con éxito!',
  'notification.investment_error': 'Error en la inversión',
  'notification.vote_success': '¡Voto registrado!',
  'notification.vote_error': 'Error en el voto',
  'notification.profile_updated': 'Perfil actualizado',
  'notification.project_created': 'Proyecto creado con éxito',

  // Errors
  'error.network': 'Error de conexión de red',
  'error.unauthorized': 'Acceso no autorizado',
  'error.forbidden': 'Acceso prohibido',
  'error.not_found': 'Recurso no encontrado',
  'error.server': 'Error interno del servidor',
  'error.validation': 'Error de validación',
  'error.form_invalid': 'Formulario inválido',

  // Time
  'time.seconds': 'segundos',
  'time.minutes': 'minutos',
  'time.hours': 'horas',
  'time.days': 'días',
  'time.weeks': 'semanas',
  'time.months': 'meses',
  'time.years': 'años',
  'time.ago': 'hace',
  'time.remaining': 'restante',

  // Numbers
  'number.currency_symbol': '€',
  'number.decimal_separator': ',',
  'number.thousands_separator': '.',

  // Tour
  'tour.welcome_title': 'Bienvenido a VISUAL',
  'tour.welcome_description': 'Descubre la plataforma de inversión creativa',
  'tour.skip': 'Omitir',
  'tour.next': 'Siguiente',
  'tour.previous': 'Anterior',
  'tour.finish': 'Finalizar',
  'tour.step_of': 'de',
};

// Map des traductions
const translations: Record<SupportedLocale, TranslationKeys> = {
  fr: translations_fr,
  en: translations_en,
  es: translations_es,
};

// État global de l'i18n
class I18nService {
  private currentLocale: SupportedLocale = 'fr';
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Détecter la langue depuis localStorage ou navigateur
    this.currentLocale = this.detectLocale();
  }

  private detectLocale(): SupportedLocale {
    // 1. localStorage
    const stored = localStorage.getItem('visual-locale') as SupportedLocale;
    if (stored && this.isValidLocale(stored)) {
      return stored;
    }

    // 2. Navigateur
    const browserLang = navigator.language.split('-')[0] as SupportedLocale;
    if (this.isValidLocale(browserLang)) {
      return browserLang;
    }

    // 3. Défaut français
    return 'fr';
  }

  private isValidLocale(locale: string): locale is SupportedLocale {
    return ['fr', 'en', 'es'].includes(locale);
  }

  setLocale(locale: SupportedLocale) {
    if (locale !== this.currentLocale) {
      this.currentLocale = locale;
      localStorage.setItem('visual-locale', locale);
      this.notifyListeners();
    }
  }

  getLocale(): SupportedLocale {
    return this.currentLocale;
  }

  translate(key: keyof TranslationKeys, params?: Record<string, string | number>): string {
    let translation = translations[this.currentLocale][key] || translations.fr[key] || key;
    
    // Interpolation des paramètres
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{{${param}}}`, String(value));
      });
    }

    return translation;
  }

  // Alias court
  t = this.translate.bind(this);

  // Formatage de nombres selon la locale
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    const localeMap: Record<SupportedLocale, string> = {
      fr: 'fr-FR',
      en: 'en-US',
      es: 'es-ES',
    };

    return new Intl.NumberFormat(localeMap[this.currentLocale], options).format(value);
  }

  // Formatage de currency
  formatCurrency(value: number): string {
    return this.formatNumber(value, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  // Formatage de dates
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    const localeMap: Record<SupportedLocale, string> = {
      fr: 'fr-FR',
      en: 'en-US',
      es: 'es-ES',
    };

    return new Intl.DateTimeFormat(localeMap[this.currentLocale], options).format(date);
  }

  // Formatage de dates relatives
  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return this.t('time.seconds') + ' ' + this.t('time.ago');
    if (diffMinutes < 60) return `${diffMinutes} ${this.t('time.minutes')} ${this.t('time.ago')}`;
    if (diffHours < 24) return `${diffHours} ${this.t('time.hours')} ${this.t('time.ago')}`;
    if (diffDays < 30) return `${diffDays} ${this.t('time.days')} ${this.t('time.ago')}`;
    
    return this.formatDate(date, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // Écouter les changements de locale
  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback());
  }

  // Obtenir les locales supportées
  getSupportedLocales(): SupportedLocale[] {
    return ['fr', 'en', 'es'];
  }

  // Obtenir les infos de locale
  getLocaleInfo(locale: SupportedLocale) {
    const info = {
      fr: { name: 'Français', flag: '🇫🇷', rtl: false },
      en: { name: 'English', flag: '🇺🇸', rtl: false },
      es: { name: 'Español', flag: '🇪🇸', rtl: false },
    };
    return info[locale];
  }
}

// Instance singleton
export const i18n = new I18nService();

// Hook React pour l'i18n
export function useI18n() {
  const [locale, setLocaleState] = useState(i18n.getLocale());

  useEffect(() => {
    const unsubscribe = i18n.subscribe(() => {
      setLocaleState(i18n.getLocale());
    });
    return unsubscribe;
  }, []);

  const setLocale = (newLocale: SupportedLocale) => {
    i18n.setLocale(newLocale);
  };

  return {
    locale,
    setLocale,
    t: i18n.t,
    formatNumber: i18n.formatNumber.bind(i18n),
    formatCurrency: i18n.formatCurrency.bind(i18n),
    formatDate: i18n.formatDate.bind(i18n),
    formatRelativeTime: i18n.formatRelativeTime.bind(i18n),
    getSupportedLocales: i18n.getSupportedLocales.bind(i18n),
    getLocaleInfo: i18n.getLocaleInfo.bind(i18n),
  };
}

// Utilitaires pour les composants
export function useTranslation() {
  return useI18n();
}

// Export par défaut
export { i18n as default };