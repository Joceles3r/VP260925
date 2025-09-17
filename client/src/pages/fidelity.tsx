import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import { Progress } from '@/components/ui/progress'; // Component not available
import { Separator } from '@/components/ui/separator';
import { 
  Flame, 
  Calendar, 
  Star, 
  Gift, 
  TrendingUp,
  Clock,
  Target,
  Award
} from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';

interface FidelityStats {
  stats: {
    dailyStreak: {
      current: number;
      longest: number;
      totalLogins: number;
      pointsEarned: number;
      nextReward: {
        day: number;
        visuPoints: number;
        description: string;
      } | null;
    };
    weeklyStreak: {
      current: number;
      longest: number;
      totalWeeks: number;
      pointsEarned: number;
      nextReward: {
        week: number;
        visuPoints: number;
        description: string;
      } | null;
    };
  };
}

interface RewardScales {
  scales: {
    daily: Array<{
      day: number;
      visuPoints: number;
      description: string;
    }>;
    weekly: Array<{
      week: number;
      visuPoints: number;
      description: string;
    }>;
  };
}

interface LoginResult {
  message: string;
  rewards: {
    daily: { points: number; day: number; description: string } | null;
    weekly: { points: number; week: number; description: string } | null;
    totalPoints: number;
  };
}

export default function Fidelity() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [hasProcessedLogin, setHasProcessedLogin] = useState(false);

  // Fetch user fidelity stats
  const { data: fidelityStats, isLoading: isLoadingStats, refetch } = useQuery<FidelityStats>({
    queryKey: ['/api/fidelity/stats'],
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });

  // Fetch reward scales
  const { data: rewardScales } = useQuery<RewardScales>({
    queryKey: ['/api/fidelity/rewards'],
    refetchOnWindowFocus: false,
  });

  // Login processing mutation
  const loginMutation = useMutation({
    mutationFn: async (): Promise<LoginResult> => {
      const response = await fetch('/api/fidelity/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to process login');
      }
      return response.json();
    },
    onSuccess: (data: LoginResult) => {
      const { rewards } = data;
      if (rewards.totalPoints > 0) {
        toast({
          title: "Récompenses de fidélité !",
          description: `+${rewards.totalPoints} VISUpoints gagnés pour votre connexion`,
          variant: "default",
        });
      }
      refetch(); // Refresh stats after login processing
      setHasProcessedLogin(true);
    },
    onError: (error) => {
      console.error('Error processing login:', error);
    },
  });

  // Process login on page load (once per session)
  useEffect(() => {
    if (isAuthenticated && !hasProcessedLogin && !loginMutation.isPending) {
      loginMutation.mutate();
    }
  }, [isAuthenticated, hasProcessedLogin]);

  // Helper functions
  const getDailyProgressPercentage = () => {
    if (!fidelityStats?.stats.dailyStreak.current) return 0;
    return Math.min((fidelityStats.stats.dailyStreak.current / 7) * 100, 100);
  };

  const getWeeklyProgressPercentage = () => {
    if (!fidelityStats?.stats.weeklyStreak.current) return 0;
    return Math.min((fidelityStats.stats.weeklyStreak.current / 4) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Connexion Requise</h2>
              <p className="text-muted-foreground mb-4">
                Connectez-vous pour accéder à votre programme de fidélité
              </p>
              <Button onClick={() => window.location.href = "/api/login"}>
                Se connecter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-2">
          <Star className="h-8 w-8 text-yellow-500" />
          <h1 className="text-4xl font-bold text-foreground">Programme Fidélité</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Gagnez des VISUpoints en vous connectant quotidiennement et hebdomadairement
        </p>
      </div>

      {isLoadingStats ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid gap-8">
          {/* Current Streaks Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Streak Quotidien</CardTitle>
                <Flame className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary" data-testid="daily-streak-current">
                  {fidelityStats?.stats.dailyStreak.current || 0} jours
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${getDailyProgressPercentage()}%` }}
                    data-testid="daily-streak-progress"
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Cycle de 7 jours • Record: {fidelityStats?.stats.dailyStreak.longest || 0} jours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Streak Hebdomadaire</CardTitle>
                <Calendar className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-secondary" data-testid="weekly-streak-current">
                  {fidelityStats?.stats.weeklyStreak.current || 0} semaines
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${getWeeklyProgressPercentage()}%` }}
                    data-testid="weekly-streak-progress"
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Cycle de 4 semaines • Record: {fidelityStats?.stats.weeklyStreak.longest || 0} semaines
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Daily Streak Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span>Streak Quotidien</span>
                </CardTitle>
                <CardDescription>
                  Connectez-vous chaque jour pour gagner des VISUpoints
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Status */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium">Connexions consécutives</p>
                    <p className="text-sm text-muted-foreground">
                      Total: {fidelityStats?.stats.dailyStreak.totalLogins || 0} connexions
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-lg">
                    {fidelityStats?.stats.dailyStreak.current || 0} jours
                  </Badge>
                </div>

                {/* Points Earned */}
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">VISUpoints gagnés</p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Récompenses quotidiennes
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {fidelityStats?.stats.dailyStreak.pointsEarned || 0} VP
                    </p>
                  </div>
                </div>

                {/* Next Reward */}
                {fidelityStats?.stats.dailyStreak.nextReward && (
                  <div className="flex items-center justify-between p-4 border-2 border-dashed border-primary/30 rounded-lg">
                    <div>
                      <p className="font-medium">Prochaine récompense</p>
                      <p className="text-sm text-muted-foreground">
                        Jour {fidelityStats.stats.dailyStreak.nextReward.day}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        +{fidelityStats.stats.dailyStreak.nextReward.visuPoints} VP
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fidelityStats.stats.dailyStreak.nextReward.description}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weekly Streak Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <span>Streak Hebdomadaire</span>
                </CardTitle>
                <CardDescription>
                  Maintenez vos connexions pendant des semaines entières
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Status */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium">Semaines consécutives</p>
                    <p className="text-sm text-muted-foreground">
                      Total: {fidelityStats?.stats.weeklyStreak.totalWeeks || 0} semaines
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-lg">
                    {fidelityStats?.stats.weeklyStreak.current || 0} semaines
                  </Badge>
                </div>

                {/* Points Earned */}
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div>
                    <p className="font-medium text-blue-800 dark:text-blue-200">VISUpoints gagnés</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      Récompenses hebdomadaires
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">
                      {fidelityStats?.stats.weeklyStreak.pointsEarned || 0} VP
                    </p>
                  </div>
                </div>

                {/* Next Reward */}
                {fidelityStats?.stats.weeklyStreak.nextReward && (
                  <div className="flex items-center justify-between p-4 border-2 border-dashed border-secondary/30 rounded-lg">
                    <div>
                      <p className="font-medium">Prochaine récompense</p>
                      <p className="text-sm text-muted-foreground">
                        Semaine {fidelityStats.stats.weeklyStreak.nextReward.week}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-secondary">
                        +{fidelityStats.stats.weeklyStreak.nextReward.visuPoints} VP
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fidelityStats.stats.weeklyStreak.nextReward.description}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Reward Scales */}
          {rewardScales && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-purple-500" />
                  <span>Barèmes de Récompenses</span>
                </CardTitle>
                <CardDescription>
                  Découvrez tous les paliers de récompenses disponibles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Daily Rewards Scale */}
                  <div>
                    <h3 className="font-semibold mb-4 flex items-center space-x-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span>Récompenses Quotidiennes</span>
                    </h3>
                    <div className="space-y-2">
                      {rewardScales.scales.daily.map((reward) => (
                        <div 
                          key={reward.day}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            fidelityStats?.stats.dailyStreak.current === reward.day
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                              : 'border-border'
                          }`}
                          data-testid={`daily-reward-${reward.day}`}
                        >
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold">
                              {reward.day}
                            </div>
                            <span className="text-sm">{reward.description}</span>
                          </div>
                          <Badge variant="outline" className="text-orange-600">
                            +{reward.visuPoints} VP
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weekly Rewards Scale */}
                  <div>
                    <h3 className="font-semibold mb-4 flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span>Récompenses Hebdomadaires</span>
                    </h3>
                    <div className="space-y-2">
                      {rewardScales.scales.weekly.map((reward) => (
                        <div 
                          key={reward.week}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            fidelityStats?.stats.weeklyStreak.current === reward.week
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                              : 'border-border'
                          }`}
                          data-testid={`weekly-reward-${reward.week}`}
                        >
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">
                              {reward.week}
                            </div>
                            <span className="text-sm">{reward.description}</span>
                          </div>
                          <Badge variant="outline" className="text-blue-600">
                            +{reward.visuPoints} VP
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips Card */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-purple-700 dark:text-purple-300">
                <Gift className="h-5 w-5" />
                <span>Conseils pour Maximiser vos Gains</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-purple-600 dark:text-purple-400">
                <li className="flex items-start space-x-2">
                  <Target className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Connectez-vous chaque jour pour maintenir votre streak quotidien</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Les récompenses augmentent progressivement jusqu'au 7ème jour consécutif</span>
                </li>
                <li className="flex items-start space-x-2">
                  <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Les streaks hebdomadaires offrent des bonus substantiels sur 4 semaines</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Award className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Les deux systèmes sont cumulables pour maximiser vos gains</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}