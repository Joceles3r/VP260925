import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import SubtitlePlayer from '@/components/SubtitlePlayer';
import { useI18n } from '@/lib/i18n';
import { TrendingUp, Users, Eye, Heart, Share, DollarSign } from 'lucide-react';

const ProjectDemo = () => {
  const { t, formatCurrency, locale } = useI18n();

  // Données de projet avec sous-titres multilingues
  const project = {
    id: "proj-demo-1",
    title: locale === 'fr-FR' ? "Documentaire sur l'IA" : 
           locale === 'en-US' ? "AI Documentary" :
           locale === 'es-ES' ? "Documental sobre IA" : "AI Documentary",
    description: locale === 'fr-FR' ? 
      "Un documentaire innovant explorant l'impact de l'intelligence artificielle sur notre société moderne. Une plongée fascinante dans le monde de l'IA avec des experts reconnus." :
      locale === 'en-US' ?
      "An innovative documentary exploring the impact of artificial intelligence on our modern society. A fascinating dive into the world of AI with renowned experts." :
      "Un documental innovador que explora el impacto de la inteligencia artificial en nuestra sociedad moderna. Una inmersión fascinante en el mundo de la IA.",
    category: "documentaire",
    targetAmount: 50000,
    currentAmount: 12500,
    investorCount: 125,
    votesCount: 847,
    mlScore: 8.7,
    creator: {
      name: "Marie Dubois",
      bio: locale === 'fr-FR' ? "Réalisatrice spécialisée en documentaires scientifiques" :
           locale === 'en-US' ? "Director specialized in scientific documentaries" :
           "Directora especializada en documentales científicos"
    },
    videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
    subtitles: [
      {
        lang: "fr-FR",
        label: "Français",
        flag: "🇫🇷",
        url: "/subtitles/demo-fr.vtt"
      },
      {
        lang: "en-US", 
        label: "English",
        flag: "🇺🇸",
        url: "/subtitles/demo-en.vtt"
      },
      {
        lang: "es-ES",
        label: "Español",
        flag: "🇪🇸",
        url: "/subtitles/demo-es.vtt"
      },
      {
        lang: "de-DE",
        label: "Deutsch", 
        flag: "🇩🇪",
        url: "/subtitles/demo-de.vtt"
      }
    ]
  };

  const progressPercentage = (project.currentAmount / project.targetAmount) * 100;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {project.title}
        </h1>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <Badge variant="outline">{project.category}</Badge>
          <span>Par {project.creator.name}</span>
          <span>Score ML: {project.mlScore}/10</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lecteur vidéo principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-0">
              <SubtitlePlayer
                videoUrl={project.videoUrl}
                subtitles={project.subtitles}
                className="w-full aspect-video"
              />
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>
                {locale === 'fr-FR' ? 'À propos du projet' :
                 locale === 'en-US' ? 'About the project' :
                 locale === 'es-ES' ? 'Sobre el proyecto' : 'About the project'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                {project.description}
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Eye className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">
                      {locale === 'fr-FR' ? 'Sous-titres multilingues' :
                       locale === 'en-US' ? 'Multilingual subtitles' :
                       'Subtítulos multiidioma'}
                    </h4>
                    <p className="text-sm text-blue-700">
                      {locale === 'fr-FR' ? 
                        'Sous-titres générés par IA et révisés par des humains dans 5 langues. Changez la langue directement dans le lecteur vidéo.' :
                        locale === 'en-US' ?
                        'AI-generated subtitles reviewed by humans in 5 languages. Change the language directly in the video player.' :
                        'Subtítulos generados por IA y revisados por humanos en 5 idiomas. Cambia el idioma directamente en el reproductor.'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Créateur */}
          <Card>
            <CardHeader>
              <CardTitle>
                {locale === 'fr-FR' ? 'Le créateur' :
                 locale === 'en-US' ? 'The creator' :
                 'El creador'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-purple-600">MD</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{project.creator.name}</h3>
                  <p className="text-gray-600">{project.creator.bio}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar d'investissement */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                {locale === 'fr-FR' ? 'Investir' :
                 locale === 'en-US' ? 'Invest' :
                 'Invertir'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>{formatCurrency(project.currentAmount)}</span>
                  <span className="text-gray-500">{formatCurrency(project.targetAmount)}</span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
                <p className="text-sm text-gray-500 mt-2">
                  {progressPercentage.toFixed(1)}% {t('projects.funded')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{project.investorCount}</div>
                  <div className="text-xs text-gray-500">{t('projects.investors')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{project.votesCount}</div>
                  <div className="text-xs text-gray-500">{t('projects.votes')}</div>
                </div>
              </div>

              <Button className="w-full" size="lg">
                <TrendingUp className="w-4 h-4 mr-2" />
                {t('projects.invest')}
              </Button>

              <div className="flex space-x-2">
                <Button variant="outline" className="flex-1">
                  <Heart className="w-4 h-4 mr-2" />
                  Like
                </Button>
                <Button variant="outline" className="flex-1">
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques */}
          <Card>
            <CardHeader>
              <CardTitle>
                {locale === 'fr-FR' ? 'Statistiques' :
                 locale === 'en-US' ? 'Statistics' :
                 'Estadísticas'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">ROI projeté</span>
                <span className="text-sm font-medium text-green-600">+15%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Durée</span>
                <span className="text-sm font-medium">12 mois</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Risque</span>
                <span className="text-sm font-medium text-orange-600">Modéré</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Catégorie</span>
                <span className="text-sm font-medium capitalize">{project.category}</span>
              </div>
            </CardContent>
          </Card>

          {/* Feature i18n */}
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl mb-2">🌍</div>
                <h3 className="font-semibold mb-2">
                  {locale === 'fr-FR' ? 'Plateforme multilingue' :
                   locale === 'en-US' ? 'Multilingual platform' :
                   'Plataforma multiidioma'}
                </h3>
                <p className="text-sm text-gray-600">
                  {locale === 'fr-FR' ? 
                    'Interface traduite en 5 langues avec sous-titres automatiques' :
                    locale === 'en-US' ?
                    'Interface translated in 5 languages with automatic subtitles' :
                    'Interfaz traducida en 5 idiomas con subtítulos automáticos'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectDemo;