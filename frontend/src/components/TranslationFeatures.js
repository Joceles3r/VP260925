import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { 
  Globe, 
  Subtitles, 
  Users, 
  Brain, 
  CheckCircle, 
  Zap,
  MessageSquare,
  TrendingUp 
} from 'lucide-react';

const TranslationFeatures = () => {
  const { t, locale, supportedLocales } = useI18n();
  const [activeDemo, setActiveDemo] = useState('subtitles');

  const features = [
    {
      id: 'subtitles',
      icon: Subtitles,
      title: locale === 'fr-FR' ? 'Sous-titres IA' : 'AI Subtitles',
      description: locale === 'fr-FR' ? 
        'Génération automatique de sous-titres VTT/SRT avec révision humaine' :
        'Automatic VTT/SRT subtitle generation with human review',
      stats: {
        languages: supportedLocales.length,
        accuracy: '95%',
        processing: '< 5min'
      }
    },
    {
      id: 'interface',
      icon: Globe,
      title: locale === 'fr-FR' ? 'Interface multilingue' : 'Multilingual Interface', 
      description: locale === 'fr-FR' ?
        'Traduction complète de l\'interface utilisateur avec détection automatique' :
        'Complete user interface translation with automatic detection',
      stats: {
        languages: supportedLocales.length,
        coverage: '100%',
        fallback: 'Smart'
      }
    },
    {
      id: 'notifications',
      icon: MessageSquare,
      title: locale === 'fr-FR' ? 'Notifications localisées' : 'Localized Notifications',
      description: locale === 'fr-FR' ?
        'Messages et alertes adaptés à la langue et culture de l\'utilisateur' :
        'Messages and alerts adapted to user language and culture',
      stats: {
        formats: 'Local',
        timing: 'Timezone aware',
        delivery: 'Real-time'
      }
    }
  ];

  const technicalSpecs = {
    'subtitles': {
      title: locale === 'fr-FR' ? 'Génération de sous-titres' : 'Subtitle Generation',
      details: [
        {
          label: locale === 'fr-FR' ? 'Formats supportés' : 'Supported formats',
          value: 'VTT, SRT, WebVTT'
        },
        {
          label: locale === 'fr-FR' ? 'Langues' : 'Languages', 
          value: 'FR, EN, ES, DE, IT'
        },
        {
          label: locale === 'fr-FR' ? 'Précision IA' : 'AI Accuracy',
          value: '87-95%'
        },
        {
          label: locale === 'fr-FR' ? 'Post-édition humaine' : 'Human post-editing',
          value: locale === 'fr-FR' ? 'Disponible' : 'Available'
        },
        {
          label: locale === 'fr-FR' ? 'Temps de traitement' : 'Processing time',
          value: locale === 'fr-FR' ? '< 5 minutes' : '< 5 minutes'
        }
      ]
    },
    'interface': {
      title: locale === 'fr-FR' ? 'Système i18n' : 'i18n System',
      details: [
        {
          label: locale === 'fr-FR' ? 'Détection automatique' : 'Auto detection',
          value: locale === 'fr-FR' ? 'Langue navigateur' : 'Browser language'
        },
        {
          label: 'Fallback',
          value: 'FR → EN → Default'
        },
        {
          label: locale === 'fr-FR' ? 'Persistance' : 'Persistence',
          value: 'localStorage + Profile'
        },
        {
          label: 'SEO',
          value: 'hreflang, sitemaps'
        },
        {
          label: locale === 'fr-FR' ? 'Formats locaux' : 'Local formats',
          value: locale === 'fr-FR' ? 'Monnaie, dates, nombres' : 'Currency, dates, numbers'
        }
      ]
    },
    'notifications': {
      title: locale === 'fr-FR' ? 'Système de notifications' : 'Notification System',
      details: [
        {
          label: locale === 'fr-FR' ? 'Traduction dynamique' : 'Dynamic translation',
          value: locale === 'fr-FR' ? 'Temps réel' : 'Real-time'
        },
        {
          label: locale === 'fr-FR' ? 'Formatage local' : 'Local formatting',
          value: locale === 'fr-FR' ? 'Dates, heures, monnaie' : 'Dates, times, currency'
        },
        {
          label: locale === 'fr-FR' ? 'Fuseau horaire' : 'Timezone',
          value: 'Europe/Paris + Auto'
        },
        {
          label: locale === 'fr-FR' ? 'Templates' : 'Templates',
          value: locale === 'fr-FR' ? 'Multilingues' : 'Multilingual'
        },
        {
          label: locale === 'fr-FR' ? 'Modération' : 'Moderation',
          value: locale === 'fr-FR' ? 'Par langue' : 'Per language'
        }
      ]
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {locale === 'fr-FR' ? 
            '🌍 Module de Traduction VISUAL' :
            '🌍 VISUAL Translation Module'}
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          {locale === 'fr-FR' ?
            'Système i18n complet avec traduction IA, sous-titres automatiques et interface multilingue pour une expérience utilisateur globale.' :
            'Complete i18n system with AI translation, automatic subtitles and multilingual interface for a global user experience.'}
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {features.map((feature) => {
          const Icon = feature.icon;
          const isActive = activeDemo === feature.id;
          
          return (
            <Card 
              key={feature.id}
              className={`cursor-pointer transition-all ${
                isActive ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:shadow-lg'
              }`}
              onClick={() => setActiveDemo(feature.id)}
            >
              <CardHeader className="text-center">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  isActive ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Icon className="h-8 w-8" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {Object.entries(feature.stats).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-500 capitalize">{key}:</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Technical Details */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            {technicalSpecs[activeDemo]?.title}
          </CardTitle>
          <CardDescription>
            {locale === 'fr-FR' ? 
              'Spécifications techniques et implémentation détaillée' :
              'Technical specifications and detailed implementation'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {technicalSpecs[activeDemo]?.details.map((detail, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {detail.label}
                </div>
                <div className="text-lg font-semibold text-purple-600">
                  {detail.value}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Runtime */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            {locale === 'fr-FR' ? 'Configuration Runtime' : 'Runtime Configuration'}
          </CardTitle>
          <CardDescription>
            {locale === 'fr-FR' ? 
              'Configuration JSON utilisée par le système de traduction VISUAL' :
              'JSON configuration used by VISUAL translation system'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 rounded-lg p-4 text-sm font-mono text-gray-100 overflow-x-auto">
            <pre>{`{
  "i18n": {
    "default_locale": "fr-FR",
    "supported_locales": ["fr-FR","en-US","es-ES","de-DE","it-IT"],
    "url_strategy": "path-prefix",
    "seo": {
      "hreflang": true, 
      "localized_sitemaps": true
    },
    "subtitle_formats": ["vtt","srt"],
    "mt_provider": "auto",
    "tm_enabled": true,
    "fallback_order": ["fr-FR","en-US"],
    "currency_format": {"EUR":"fr-FR"}
  }
}`}</pre>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="font-medium text-green-900">
                  {locale === 'fr-FR' ? 'Fonctionnalités actives' : 'Active Features'}
                </span>
              </div>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• {locale === 'fr-FR' ? 'Détection automatique de langue' : 'Automatic language detection'}</li>
                <li>• {locale === 'fr-FR' ? 'Sous-titres générés par IA' : 'AI-generated subtitles'}</li>
                <li>• {locale === 'fr-FR' ? 'Mémoire de traduction' : 'Translation memory'}</li>
                <li>• {locale === 'fr-FR' ? 'SEO multilingue' : 'Multilingual SEO'}</li>
                <li>• {locale === 'fr-FR' ? 'Formats localisés' : 'Localized formats'}</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <TrendingUp className="h-4 w-4 text-blue-500 mr-2" />
                <span className="font-medium text-blue-900">
                  {locale === 'fr-FR' ? 'Métriques de qualité' : 'Quality Metrics'}
                </span>
              </div>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• {locale === 'fr-FR' ? 'Précision IA: 87-95%' : 'AI Accuracy: 87-95%'}</li>
                <li>• {locale === 'fr-FR' ? 'Temps traitement: <5min' : 'Processing time: <5min'}</li>
                <li>• {locale === 'fr-FR' ? 'Couverture: 100%' : 'Coverage: 100%'}</li>
                <li>• {locale === 'fr-FR' ? 'Révision humaine disponible' : 'Human review available'}</li>
                <li>• {locale === 'fr-FR' ? 'Fallback automatique' : 'Automatic fallback'}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TranslationFeatures;