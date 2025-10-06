import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy,
  Star,
  Zap,
  Target,
  Award,
  Gift,
  Crown,
  Medal,
  Flame,
  TrendingUp,
  Users,
  Calendar,
  Coins
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// ===== TYPES ET INTERFACES =====

interface UserStats {
  level: number;
  experience: number;
  nextLevelXP: number;
  totalInvestments: number;
  totalEarned: number;
  projectsSupported: number;
  badgesCount: number;
  streak: number;
  rank: number;
  visuPoints: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'investment' | 'social' | 'achievement' | 'special';
  requirement: string;
  reward: number; // VISUpoints
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  type: 'milestone' | 'streak' | 'special' | 'community';
  reward: {
    experience: number;
    visuPoints: number;
    badge?: string;
  };
  completed: boolean;
  completedAt?: string;
  progress: number;
  target: number;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number; // en VISUpoints
  type: 'boost' | 'cosmetic' | 'access' | 'discount';
  available: boolean;
  claimed: boolean;
  expiresAt?: string;
}

// ===== SYSTÈME DE BADGES =====

export const BADGES_SYSTEM: Badge[] = [
  // Badges d'investissement
  {
    id: 'first-investment',
    name: 'Premier Investissement',
    description: 'Votre premier pas dans l\'aventure VISUAL',
    icon: '🎯',
    rarity: 'common',
    category: 'investment',
    requirement: 'Effectuer votre premier investissement',
    reward: 50
  },
  {
    id: 'micro-investor',
    name: 'Micro-Investisseur',
    description: 'Investir avec des petits montants',
    icon: '💰',
    rarity: 'common',
    category: 'investment',
    requirement: 'Effectuer 5 investissements de 1-5€',
    reward: 100
  },
  {
    id: 'whale-investor',
    name: 'Gros Investisseur',
    description: 'Les gros moyens pour les gros projets',
    icon: '🐋',
    rarity: 'epic',
    category: 'investment',
    requirement: 'Investir 20€ dans un seul projet',
    reward: 500
  },
  {
    id: 'diversified',
    name: 'Portefeuille Diversifié',
    description: 'Investir dans toutes les catégories',
    icon: '📊',
    rarity: 'rare',
    category: 'investment',
    requirement: 'Investir dans 5 catégories différentes',
    reward: 300
  },

  // Badges sociaux
  {
    id: 'social-butterfly',
    name: 'Papillon Social',
    description: 'Très actif sur le réseau social',
    icon: '🦋',
    rarity: 'common',
    category: 'social',
    requirement: '50 interactions sociales (likes, commentaires)',
    reward: 150
  },
  {
    id: 'community-leader',
    name: 'Leader Communautaire',
    description: 'Influencer positif de la communauté',
    icon: '👑',
    rarity: 'legendary',
    category: 'social',
    requirement: 'Obtenir 1000 likes sur vos contenus',
    reward: 1000
  },
  {
    id: 'helpful-hand',
    name: 'Main Secourable',
    description: 'Aider les nouveaux utilisateurs',
    icon: '🤝',
    rarity: 'rare',
    category: 'social',
    requirement: 'Parrainer 10 nouveaux utilisateurs',
    reward: 400
  },

  // Badges d'accomplissement
  {
    id: 'early-bird',
    name: 'Lève-Tôt',
    description: 'Être parmi les premiers sur VISUAL',
    icon: '🌅',
    rarity: 'epic',
    category: 'special',
    requirement: 'S\'inscrire dans les 1000 premiers',
    reward: 750
  },
  {
    id: 'lucky-winner',
    name: 'Chanceux',
    description: 'Investir dans un projet qui explose',
    icon: '🍀',
    rarity: 'legendary',
    category: 'achievement',
    requirement: 'ROI de 500%+ sur un investissement',
    reward: 1500
  },
  {
    id: 'streak-master',
    name: 'Maître des Séries',
    description: 'Constance récompensée',
    icon: '🔥',
    rarity: 'epic',
    category: 'achievement',
    requirement: 'Connexion quotidienne pendant 30 jours',
    reward: 600
  }
];

// ===== SYSTÈME DE NIVEAUX =====

export const LEVEL_SYSTEM = {
  maxLevel: 100,
  
  getXPForLevel: (level: number): number => {
    // Progression exponentielle douce
    return Math.floor(100 * Math.pow(1.15, level - 1));
  },
  
  getTotalXPForLevel: (level: number): number => {
    let total = 0;
    for (let i = 1; i < level; i++) {
      total += LEVEL_SYSTEM.getXPForLevel(i);
    }
    return total;
  },
  
  getLevelFromXP: (xp: number): number => {
    let level = 1;
    let totalXP = 0;
    
    while (level <= LEVEL_SYSTEM.maxLevel) {
      const xpNeeded = LEVEL_SYSTEM.getXPForLevel(level);
      if (totalXP + xpNeeded > xp) break;
      totalXP += xpNeeded;
      level++;
    }
    
    return level;
  },
  
  getLevelRewards: (level: number) => {
    const rewards = [];
    
    // Récompenses tous les 5 niveaux
    if (level % 5 === 0) {
      rewards.push({ type: 'visupoints', amount: level * 10 });
    }
    
    // Récompenses spéciales
    if (level === 10) rewards.push({ type: 'badge', id: 'dedicated-user' });
    if (level === 25) rewards.push({ type: 'boost', name: 'Double XP 24h' });
    if (level === 50) rewards.push({ type: 'badge', id: 'veteran-investor' });
    if (level === 100) rewards.push({ type: 'badge', id: 'grandmaster' });
    
    return rewards;
  }
};

// ===== HOOKS =====

function useUserStats() {
  return useQuery({
    queryKey: ['user-stats', 'gamification'],
    queryFn: async (): Promise<UserStats> => {
      const response = await fetch('/api/gamification/stats', { 
        credentials: 'include' 
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des statistiques');
      const data = await response.json();
      return data.stats;
    },
  });
}

function useUserBadges() {
  return useQuery({
    queryKey: ['user-badges'],
    queryFn: async (): Promise<Badge[]> => {
      const response = await fetch('/api/gamification/badges', { 
        credentials: 'include' 
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des badges');
      const data = await response.json();
      return data.badges;
    },
  });
}

function useUserAchievements() {
  return useQuery({
    queryKey: ['user-achievements'],
    queryFn: async (): Promise<Achievement[]> => {
      const response = await fetch('/api/gamification/achievements', { 
        credentials: 'include' 
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des succès');
      const data = await response.json();
      return data.achievements;
    },
  });
}

function useAvailableRewards() {
  return useQuery({
    queryKey: ['available-rewards'],
    queryFn: async (): Promise<Reward[]> => {
      const response = await fetch('/api/gamification/rewards', { 
        credentials: 'include' 
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des récompenses');
      const data = await response.json();
      return data.rewards;
    },
  });
}

function useClaimReward() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (rewardId: string) => {
      const response = await fetch(`/api/gamification/rewards/${rewardId}/claim`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors de la récupération de la récompense');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      queryClient.invalidateQueries({ queryKey: ['available-rewards'] });
      toast({
        title: "🎁 Récompense récupérée !",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ===== COMPOSANT PRINCIPAL =====

const GamificationSystem: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const { data: badges = [] } = useUserBadges();
  const { data: achievements = [] } = useUserAchievements();
  const { data: rewards = [] } = useAvailableRewards();
  const claimReward = useClaimReward();

  const [selectedTab, setSelectedTab] = useState('overview');

  if (statsLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mx-auto mb-4" />
        <p className="text-muted-foreground">Chargement de vos statistiques...</p>
      </div>
    );
  }

  const getBadgeColor = (rarity: Badge['rarity']) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'legendary': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  const unlockedBadges = badges.filter(b => b.unlockedAt);
  const availableBadges = badges.filter(b => !b.unlockedAt);
  const completedAchievements = achievements.filter(a => a.completed);
  const pendingAchievements = achievements.filter(a => !a.completed);

  return (
    <div className="space-y-6">
      {/* En-tête avec niveau et XP */}
      {stats && (
        <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-full">
                  <Crown className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Niveau {stats.level}</h2>
                  <p className="opacity-90">Rang #{stats.rank} • {stats.visuPoints.toLocaleString()} VISUpoints</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-semibold">{stats.experience.toLocaleString()} XP</div>
                <div className="text-sm opacity-75">
                  {(stats.nextLevelXP - stats.experience).toLocaleString()} XP pour niveau suivant
                </div>
              </div>
            </div>
            
            <Progress 
              value={(stats.experience / stats.nextLevelXP) * 100} 
              className="mt-4 h-3 bg-white/20" 
              indicatorClassName="bg-white"
            />
          </CardContent>
        </Card>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="badges">
            Badges ({unlockedBadges.length})
          </TabsTrigger>
          <TabsTrigger value="achievements">
            Succès ({completedAchievements.length})
          </TabsTrigger>
          <TabsTrigger value="rewards">
            Récompenses ({rewards.length})
          </TabsTrigger>
          <TabsTrigger value="leaderboard">Classement</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Coins className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.totalInvestments}</div>
                  <div className="text-sm text-muted-foreground">Investissements</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.totalEarned.toFixed(2)}€</div>
                  <div className="text-sm text-muted-foreground">Gains totaux</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.projectsSupported}</div>
                  <div className="text-sm text-muted-foreground">Projets soutenus</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <Flame className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.streak}</div>
                  <div className="text-sm text-muted-foreground">Jours consécutifs</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Badges récents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Badges récents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {unlockedBadges.slice(0, 4).map((badge) => (
                  <div key={badge.id} className={`p-3 rounded-lg border ${getBadgeColor(badge.rarity)}`}>
                    <div className="text-center">
                      <div className="text-2xl mb-1">{badge.icon}</div>
                      <div className="font-medium text-sm">{badge.name}</div>
                      <div className="text-xs opacity-75">+{badge.reward} VP</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Prochains objectifs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Prochains objectifs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingAchievements.slice(0, 3).map((achievement) => (
                <div key={achievement.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{achievement.title}</div>
                    <div className="text-sm text-muted-foreground">{achievement.description}</div>
                  </div>
                  <div className="text-right">
                    <Progress value={(achievement.progress / achievement.target) * 100} className="w-24 h-2" />
                    <div className="text-xs text-muted-foreground mt-1">
                      {achievement.progress}/{achievement.target}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Badges */}
        <TabsContent value="badges" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Badges débloqués */}
            <Card>
              <CardHeader>
                <CardTitle>Badges débloqués ({unlockedBadges.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {unlockedBadges.map((badge) => (
                    <div key={badge.id} className={`p-3 rounded-lg border ${getBadgeColor(badge.rarity)}`}>
                      <div className="text-center">
                        <div className="text-3xl mb-2">{badge.icon}</div>
                        <div className="font-medium">{badge.name}</div>
                        <div className="text-sm opacity-75 mt-1">{badge.description}</div>
                        <Badge className="mt-2">{badge.rarity}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Badges à débloquer */}
            <Card>
              <CardHeader>
                <CardTitle>À débloquer ({availableBadges.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {availableBadges.map((badge) => (
                    <div key={badge.id} className="p-3 border rounded-lg opacity-60">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl filter grayscale">{badge.icon}</div>
                        <div className="flex-1">
                          <div className="font-medium">{badge.name}</div>
                          <div className="text-sm text-muted-foreground">{badge.requirement}</div>
                          {badge.progress !== undefined && badge.maxProgress && (
                            <div className="mt-2">
                              <Progress value={(badge.progress / badge.maxProgress) * 100} className="h-2" />
                              <div className="text-xs text-muted-foreground mt-1">
                                {badge.progress}/{badge.maxProgress}
                              </div>
                            </div>
                          )}
                        </div>
                        <Badge variant="outline">+{badge.reward} VP</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Succès */}
        <TabsContent value="achievements" className="space-y-6">
          <div className="space-y-4">
            {achievements.map((achievement) => (
              <Card key={achievement.id} className={achievement.completed ? 'border-green-200 bg-green-50' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={achievement.completed ? 'text-green-500' : 'text-muted-foreground'}>
                        {achievement.completed ? <Medal className="h-6 w-6" /> : <Target className="h-6 w-6" />}
                      </div>
                      <div>
                        <div className="font-medium">{achievement.title}</div>
                        <div className="text-sm text-muted-foreground">{achievement.description}</div>
                        {achievement.completedAt && (
                          <div className="text-xs text-green-600">
                            Complété le {new Date(achievement.completedAt).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {!achievement.completed && (
                        <div className="mb-2">
                          <Progress value={(achievement.progress / achievement.target) * 100} className="w-24 h-2" />
                          <div className="text-xs text-muted-foreground mt-1">
                            {achievement.progress}/{achievement.target}
                          </div>
                        </div>
                      )}
                      
                      <div className="text-sm">
                        <div>+{achievement.reward.experience} XP</div>
                        <div>+{achievement.reward.visuPoints} VP</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Récompenses */}
        <TabsContent value="rewards" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((reward) => (
              <Card key={reward.id} className={reward.claimed ? 'opacity-50' : ''}>
                <CardContent className="p-4">
                  <div className="text-center">
                    <Gift className="h-12 w-12 mx-auto mb-3 text-purple-500" />
                    <h3 className="font-medium mb-2">{reward.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{reward.description}</p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="outline">{reward.type}</Badge>
                      <div className="font-bold text-purple-600">{reward.cost} VP</div>
                    </div>
                    
                    <Button 
                      className="w-full"
                      disabled={reward.claimed || !reward.available || claimReward.isPending}
                      onClick={() => claimReward.mutate(reward.id)}
                    >
                      {reward.claimed ? 'Récupéré' : reward.available ? 'Récupérer' : 'Indisponible'}
                    </Button>
                    
                    {reward.expiresAt && (
                      <div className="text-xs text-orange-600 mt-2">
                        Expire le {new Date(reward.expiresAt).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Classement */}
        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Classement communautaire
              </CardTitle>
              <CardDescription>
                Les investisseurs les plus actifs de VISUAL
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Classement en cours de développement</p>
                <p className="text-sm">Bientôt disponible pour comparer vos performances !</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GamificationSystem;