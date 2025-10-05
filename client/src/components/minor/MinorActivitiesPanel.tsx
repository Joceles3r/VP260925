import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Gift, 
  Star, 
  Clock, 
  CheckCircle, 
  Book, 
  Eye, 
  Target, 
  Trophy,
  Play,
  Users,
  Brain,
  Heart
} from 'lucide-react';
import { useMinorStatus, useAwardMinorPoints, useMinorActivityEligibility } from '@/hooks/useMinorVisitor';

interface Activity {
  id: string;
  type: 'quiz' | 'viewing' | 'mission' | 'daily';
  title: string;
  description: string;
  reward: { min: number; max: number };
  icon: React.ReactNode;
  duration?: string;
  difficulty?: 'facile' | 'moyen' | 'difficile';
  category: string;
  available: boolean;
  completed?: boolean;
}

const MINOR_ACTIVITIES: Activity[] = [
  {
    id: 'daily-login',
    type: 'daily',
    title: 'Connexion quotidienne',
    description: 'Te connecter tous les jours sur VISUAL',
    reward: { min: 5, max: 5 },
    icon: <Star className="h-6 w-6 text-yellow-500" />,
    category: 'Quotidien',
    available: true,
    completed: true, // Exemple
  },
  {
    id: 'educational-quiz-cinema',
    type: 'quiz',
    title: 'Quiz Histoire du Cinéma',
    description: '10 questions sur les grands classiques du cinéma français',
    reward: { min: 30, max: 50 },
    icon: <Brain className="h-6 w-6 text-purple-500" />,
    duration: '5-8 min',
    difficulty: 'moyen',
    category: 'Éducatif',
    available: true,
  },
  {
    id: 'educational-quiz-technology',
    type: 'quiz',
    title: 'Quiz Technologie Audiovisuelle',
    description: 'Découvre les techniques de production vidéo',
    reward: { min: 20, max: 40 },
    icon: <Book className="h-6 w-6 text-blue-500" />,
    duration: '7-10 min',
    difficulty: 'difficile',
    category: 'Éducatif',
    available: true,
  },
  {
    id: 'live-viewing-session',
    type: 'viewing',
    title: 'Visionnage Live Show',
    description: 'Regarder un Live Show complet (spectateur)',
    reward: { min: 25, max: 35 },
    icon: <Eye className="h-6 w-6 text-red-500" />,
    duration: '30-45 min',
    category: 'Spectacle',
    available: false, // Pas de live en cours
  },
  {
    id: 'content-discovery',
    type: 'viewing',
    title: 'Découverte de contenu',
    description: 'Explorer et noter 5 projets de créateurs',
    reward: { min: 15, max: 25 },
    icon: <Target className="h-6 w-6 text-green-500" />,
    duration: '15-20 min',
    category: 'Découverte',
    available: true,
  },
  {
    id: 'community-mission-feedback',
    type: 'mission',
    title: 'Mission Amélioration',
    description: 'Donner ton avis sur 3 fonctionnalités de VISUAL',
    reward: { min: 40, max: 60 },
    icon: <Heart className="h-6 w-6 text-pink-500" />,
    duration: '10-15 min',
    category: 'Communauté',
    available: true,
  },
  {
    id: 'weekly-challenge',
    type: 'mission',
    title: 'Défi Hebdomadaire',
    description: 'Compléter 3 activités différentes cette semaine',
    reward: { min: 80, max: 120 },
    icon: <Trophy className="h-6 w-6 text-orange-500" />,
    duration: '1 semaine',
    difficulty: 'moyen',
    category: 'Défi',
    available: true,
  },
];

const MinorActivitiesPanel: React.FC = () => {
  const { data: status } = useMinorStatus();
  const awardPoints = useAwardMinorPoints();
  const eligibility = useMinorActivityEligibility(status);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const handleStartActivity = async (activity: Activity) => {
    if (!eligibility.canParticipate) return;

    // Simulation de participation à l'activité
    const rewardAmount = Math.floor(
      Math.random() * (activity.reward.max - activity.reward.min + 1) + activity.reward.min
    );

    await awardPoints.mutateAsync({
      amount: rewardAmount,
      source: `${activity.type}_completion`,
      sourceId: activity.id,
      description: `Participation à: ${activity.title}`,
    });

    setSelectedActivity(null);
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'facile': return 'bg-green-100 text-green-800';
      case 'moyen': return 'bg-yellow-100 text-yellow-800';
      case 'difficile': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Quotidien': return 'bg-blue-100 text-blue-800';
      case 'Éducatif': return 'bg-purple-100 text-purple-800';
      case 'Spectacle': return 'bg-red-100 text-red-800';
      case 'Découverte': return 'bg-green-100 text-green-800';
      case 'Communauté': return 'bg-pink-100 text-pink-800';
      case 'Défi': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!eligibility.canParticipate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-muted-foreground" />
            Activités VISUpoints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              {eligibility.message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const availableActivities = MINOR_ACTIVITIES.filter(a => a.available);
  const completedActivities = MINOR_ACTIVITIES.filter(a => a.completed);

  return (
    <div className="space-y-6">
      {/* En-tête des activités */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-green-600" />
            Activités pour gagner des VISUpoints
          </CardTitle>
          <CardDescription>
            Activités éducatives et ludiques spécialement conçues pour les 16-17 ans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-green-600">{availableActivities.length}</div>
              <div className="text-sm text-muted-foreground">Disponibles</div>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{completedActivities.length}</div>
              <div className="text-sm text-muted-foreground">Terminées</div>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{status?.visuPoints || 0}</div>
              <div className="text-sm text-muted-foreground">VP actuels</div>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{Math.max(20000 - (status?.visuPoints || 0), 0)}</div>
              <div className="text-sm text-muted-foreground">VP restants</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des activités disponibles */}
      <div className="grid gap-4">
        {MINOR_ACTIVITIES.map((activity) => (
          <Card 
            key={activity.id} 
            className={`transition-all ${activity.available ? 'hover:shadow-md cursor-pointer' : 'opacity-60'} ${
              activity.completed ? 'bg-green-50 border-green-200' : ''
            }`}
            onClick={() => activity.available && !activity.completed && setSelectedActivity(activity)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {activity.completed ? (
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    ) : (
                      activity.icon
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{activity.title}</h3>
                      <Badge className={getCategoryColor(activity.category)}>
                        {activity.category}
                      </Badge>
                      {activity.difficulty && (
                        <Badge variant="outline" className={getDifficultyColor(activity.difficulty)}>
                          {activity.difficulty}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {activity.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {activity.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {activity.duration}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {activity.reward.min === activity.reward.max ? 
                          `${activity.reward.min} VP` : 
                          `${activity.reward.min}-${activity.reward.max} VP`
                        }
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  {activity.completed ? (
                    <Badge className="bg-green-100 text-green-800">
                      ✅ Terminée
                    </Badge>
                  ) : activity.available ? (
                    <Button size="sm" variant="outline">
                      <Play className="h-4 w-4 mr-1" />
                      Commencer
                    </Button>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Non disponible
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de confirmation d'activité */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedActivity.icon}
                {selectedActivity.title}
              </CardTitle>
              <CardDescription>
                {selectedActivity.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Récompense</div>
                <div className="font-medium text-green-600">
                  {selectedActivity.reward.min === selectedActivity.reward.max ? 
                    `${selectedActivity.reward.min} VISUpoints` : 
                    `${selectedActivity.reward.min} à ${selectedActivity.reward.max} VISUpoints`
                  }
                </div>
                <div className="text-xs text-muted-foreground">
                  ≈ {(selectedActivity.reward.min / 100).toFixed(2)}€ - {(selectedActivity.reward.max / 100).toFixed(2)}€
                </div>
              </div>
              
              {selectedActivity.duration && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Durée estimée : {selectedActivity.duration}</span>
                </div>
              )}
              
              <Alert>
                <AlertDescription className="text-sm">
                  Cette activité t'aidera à découvrir VISUAL tout en gagnant des VISUpoints. 
                  Assure-toi d'avoir le temps nécessaire avant de commencer !
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedActivity(null)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button 
                  onClick={() => handleStartActivity(selectedActivity)}
                  disabled={awardPoints.isPending}
                  className="flex-1"
                >
                  {awardPoints.isPending ? 'En cours...' : 'Commencer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MinorActivitiesPanel;