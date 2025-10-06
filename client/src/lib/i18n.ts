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
  'visual.slogan': string;
  'visual.baseline': string;
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
  'auth.remember_me': string;
  'auth.remember_me_description': string;
  'auth.session_info': string;
  'auth.session_7days': string;
  'auth.session_short': string;
  'auth.secure_platform': string;
  'auth.security_details': string;
  'auth.terms_accept_prefix': string;
  'auth.terms_accept_connector': string;
  'auth.terms_link': string;
  'auth.privacy_link': string;
  'auth.back_home': string;

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

  // Settings
  'settings.title': string;
  'settings.subtitle': string;
  'settings.loginRequired': string;
  'settings.theme.title': string;
  'settings.theme.description': string;
  'settings.theme.label': string;
  'settings.profiles.title': string;
  'settings.profiles.description': string;
  'settings.profiles.available': string;
  'settings.profiles.restricted': string;
  'settings.profiles.restrictedNote': string;
  'settings.profiles.save': string;
  'settings.profiles.saving': string;
  'settings.profiles.cancel': string;
  'settings.profiles.success.title': string;
  'settings.profiles.success.description': string;
  'settings.profiles.error.title': string;
  'settings.profiles.error.description': string;
  'settings.profiles.minRequired.title': string;
  'settings.profiles.minRequired.description': string;
  'settings.profiles.investor.description': string;
  'settings.profiles.invested_reader.description': string;
  'settings.profiles.creator.description': string;
  'settings.profiles.creatorWarning.title': string;
  'settings.profiles.creatorWarning.description': string;

  // Profiles
  'profiles.investor': string;
  'profiles.invested_reader': string;
  'profiles.creator': string;
  'profiles.admin': string;
  'profiles.infoporteur': string;
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
  'visual.slogan': 'Regarde-Investis-Gagne',
  'visual.baseline': 'Investissez dans des projets visuels dès 2€ et participez aux gains',
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
  'auth.remember_me': 'Se souvenir de moi (7 jours)',
  'auth.remember_me_description': 'Cochez cette option sur un appareil de confiance. Décochez sur un ordinateur public.',
  'auth.session_info': 'Session sécurisée par Replit Auth',
  'auth.session_7days': 'Session de 7 jours (recommandé pour appareils personnels)',
  'auth.session_short': 'Session courte - Déconnexion à la fermeture du navigateur (recommandé pour ordinateurs publics)',
  'auth.secure_platform': 'Plateforme sécurisée',
  'auth.security_details': 'Connexion via Replit Auth avec chiffrement SSL/TLS. Vos données financières sont protégées selon les normes AMF/ACPR.',
  'auth.terms_accept_prefix': 'En vous connectant, vous acceptez nos',
  'auth.terms_accept_connector': 'et notre',
  'auth.terms_link': 'CGU',
  'auth.privacy_link': 'Politique de confidentialité',
  'auth.back_home': '← Retour à l\'accueil',

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

  // Settings
  'settings.title': 'Paramètres',
  'settings.subtitle': 'Gérez vos préférences et profils',
  'settings.loginRequired': 'Vous devez être connecté pour accéder aux paramètres',
  'settings.theme.title': 'Thème',
  'settings.theme.description': 'Choisissez votre thème préféré',
  'settings.theme.label': 'Mode sombre / clair',
  'settings.profiles.title': 'Gestion des profils',
  'settings.profiles.description': 'Sélectionnez les profils qui correspondent à vos activités sur la plateforme',
  'settings.profiles.available': 'Profils disponibles',
  'settings.profiles.restricted': 'Profils restreints',
  'settings.profiles.restrictedNote': 'Ces profils sont attribués par les administrateurs et ne peuvent pas être modifiés.',
  'settings.profiles.save': 'Enregistrer',
  'settings.profiles.saving': 'Enregistrement...',
  'settings.profiles.cancel': 'Annuler',
  'settings.profiles.success.title': 'Profils mis à jour',
  'settings.profiles.success.description': 'Vos profils ont été mis à jour avec succès',
  'settings.profiles.error.title': 'Erreur',
  'settings.profiles.error.description': 'Impossible de mettre à jour vos profils',
  'settings.profiles.minRequired.title': 'Profil requis',
  'settings.profiles.minRequired.description': 'Vous devez avoir au moins un profil actif',
  'settings.profiles.investor.description': 'Investissez dans des projets créatifs et suivez votre portefeuille',
  'settings.profiles.invested_reader.description': 'Accédez à du contenu exclusif grâce à vos investissements',
  'settings.profiles.creator.description': 'Créez et gérez vos propres projets',
  'settings.profiles.creatorWarning.title': 'Note pour les créateurs',
  'settings.profiles.creatorWarning.description': 'Vous ne pouvez pas investir dans vos propres projets ou contenus pour des raisons de sécurité.',

  // Profiles
  'profiles.investor': 'Investisseur',
  'profiles.invested_reader': 'Investi-lecteur',
  'profiles.creator': 'Créateur',
  'profiles.admin': 'Administrateur',
  'profiles.infoporteur': 'Infoporteur',
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
  'visual.slogan': 'Watch-Invest-Win',
  'visual.baseline': 'Invest in visual projects from €2 and share the profits',
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
  'auth.remember_me': 'Remember me (7 days)',
  'auth.remember_me_description': 'Check this on a trusted device. Uncheck on a public computer.',
  'auth.session_info': 'Session secured by Replit Auth',
  'auth.session_7days': '7-day session (recommended for personal devices)',
  'auth.session_short': 'Short session - Logout on browser close (recommended for public computers)',
  'auth.secure_platform': 'Secure Platform',
  'auth.security_details': 'Login via Replit Auth with SSL/TLS encryption. Your financial data is protected according to AMF/ACPR standards.',
  'auth.terms_accept_prefix': 'By logging in, you accept our',
  'auth.terms_accept_connector': 'and our',
  'auth.terms_link': 'Terms of Use',
  'auth.privacy_link': 'Privacy Policy',
  'auth.back_home': '← Back to home',

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

  // Settings
  'settings.title': 'Settings',
  'settings.subtitle': 'Manage your preferences and profiles',
  'settings.loginRequired': 'You must be logged in to access settings',
  'settings.theme.title': 'Theme',
  'settings.theme.description': 'Choose your preferred theme',
  'settings.theme.label': 'Dark / light mode',
  'settings.profiles.title': 'Profile Management',
  'settings.profiles.description': 'Select the profiles that match your activities on the platform',
  'settings.profiles.available': 'Available profiles',
  'settings.profiles.restricted': 'Restricted profiles',
  'settings.profiles.restrictedNote': 'These profiles are assigned by administrators and cannot be modified.',
  'settings.profiles.save': 'Save',
  'settings.profiles.saving': 'Saving...',
  'settings.profiles.cancel': 'Cancel',
  'settings.profiles.success.title': 'Profiles updated',
  'settings.profiles.success.description': 'Your profiles have been successfully updated',
  'settings.profiles.error.title': 'Error',
  'settings.profiles.error.description': 'Unable to update your profiles',
  'settings.profiles.minRequired.title': 'Profile required',
  'settings.profiles.minRequired.description': 'You must have at least one active profile',
  'settings.profiles.investor.description': 'Invest in creative projects and track your portfolio',
  'settings.profiles.invested_reader.description': 'Access exclusive content through your investments',
  'settings.profiles.creator.description': 'Create and manage your own projects',
  'settings.profiles.creatorWarning.title': 'Note for creators',
  'settings.profiles.creatorWarning.description': 'You cannot invest in your own projects or content for security reasons.',

  // Profiles
  'profiles.investor': 'Investor',
  'profiles.invested_reader': 'Invested Reader',
  'profiles.creator': 'Creator',
  'profiles.admin': 'Administrator',
  'profiles.infoporteur': 'Infoporteur',
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
  'visual.slogan': 'Mira-Invierte-Gana',
  'visual.baseline': 'Invierte en proyectos visuales desde 2€ y comparte las ganancias',
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
  'auth.remember_me': 'Recuérdame (7 días)',
  'auth.remember_me_description': 'Marque esta opción en un dispositivo de confianza. Desmarque en una computadora pública.',
  'auth.session_info': 'Sesión asegurada por Replit Auth',
  'auth.session_7days': 'Sesión de 7 días (recomendado para dispositivos personales)',
  'auth.session_short': 'Sesión corta - Cierre de sesión al cerrar el navegador (recomendado para computadoras públicas)',
  'auth.secure_platform': 'Plataforma segura',
  'auth.security_details': 'Inicio de sesión a través de Replit Auth con cifrado SSL/TLS. Sus datos financieros están protegidos según los estándares AMF/ACPR.',
  'auth.terms_accept_prefix': 'Al iniciar sesión, acepta nuestros',
  'auth.terms_accept_connector': 'y nuestra',
  'auth.terms_link': 'Términos de uso',
  'auth.privacy_link': 'Política de privacidad',
  'auth.back_home': '← Volver al inicio',

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

  // Settings
  'settings.title': 'Configuración',
  'settings.subtitle': 'Gestiona tus preferencias y perfiles',
  'settings.loginRequired': 'Debes iniciar sesión para acceder a la configuración',
  'settings.theme.title': 'Tema',
  'settings.theme.description': 'Elige tu tema preferido',
  'settings.theme.label': 'Modo oscuro / claro',
  'settings.profiles.title': 'Gestión de perfiles',
  'settings.profiles.description': 'Selecciona los perfiles que coincidan con tus actividades en la plataforma',
  'settings.profiles.available': 'Perfiles disponibles',
  'settings.profiles.restricted': 'Perfiles restringidos',
  'settings.profiles.restrictedNote': 'Estos perfiles son asignados por los administradores y no se pueden modificar.',
  'settings.profiles.save': 'Guardar',
  'settings.profiles.saving': 'Guardando...',
  'settings.profiles.cancel': 'Cancelar',
  'settings.profiles.success.title': 'Perfiles actualizados',
  'settings.profiles.success.description': 'Tus perfiles se han actualizado correctamente',
  'settings.profiles.error.title': 'Error',
  'settings.profiles.error.description': 'No se pudieron actualizar tus perfiles',
  'settings.profiles.minRequired.title': 'Perfil requerido',
  'settings.profiles.minRequired.description': 'Debes tener al menos un perfil activo',
  'settings.profiles.investor.description': 'Invierte en proyectos creativos y rastrea tu cartera',
  'settings.profiles.invested_reader.description': 'Accede a contenido exclusivo a través de tus inversiones',
  'settings.profiles.creator.description': 'Crea y gestiona tus propios proyectos',
  'settings.profiles.creatorWarning.title': 'Nota para creadores',
  'settings.profiles.creatorWarning.description': 'No puedes invertir en tus propios proyectos o contenidos por razones de seguridad.',

  // Profiles
  'profiles.investor': 'Inversor',
  'profiles.invested_reader': 'Lector invertido',
  'profiles.creator': 'Creador',
  'profiles.admin': 'Administrador',
  'profiles.infoporteur': 'Infoporteur',
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