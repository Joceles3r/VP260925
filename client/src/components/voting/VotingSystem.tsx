import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ThumbsUp, 
  ThumbsDown, 
  TrendingUp, 
  Users, 
  Star,
  Zap,
  Target,
  Award
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// ===== INTERFACES =====

interface VotingData {
  projectId: string;
  totalVotes: number;
  positiveVotes: number;
  negativeVotes: number;
  userVote: 'up' | 'down' | null;
  voteWeight: number;
  investmentInfluence: number;
  communityScore: number;
  trending: boolean;
}

interface VoteWeightInfo {
  baseWeight: number;
  investmentBonus: number;
  engagementBonus: number;
  totalWeight: number;
  maxPossibleWeight: number;
}

// ===== BARÈME DE VOTES SELON INVESTISSEMENT =====

const VOTE_WEIGHT_BARÈME = {
  // Investissement minimum = vote de base
  NO_INVESTMENT: { weight: 1, label: 'Spectateur', color: 'bg-gray-100 text-gray-800' },
  
  // Micro-investissements (1€-5€)
  MICRO_1_5: { weight: 2, label: 'Micro-investisseur', color: 'bg-blue-100 text-blue-800' },
  
  // Petits investissements (6€-10€)  
  SMALL_6_10: { weight: 3, label: 'Petit investisseur', color: 'bg-green-100 text-green-800' },
  
  // Investissements moyens (11€-15€)
  MEDIUM_11_15: { weight: 4, label: 'Investisseur', color: 'bg-yellow-100 text-yellow-800' },
  
  // Gros investissements (16€-20€)
  LARGE_16_20: { weight: 5, label: 'Gros investisseur', color: 'bg-purple-100 text-purple-800' },
  
  // Investisseurs récurrents (bonus engagement)
  RECURRING: { weight: 1.5, label: 'Bonus fidélité', color: 'bg-orange-100 text-orange-800' },
  
  // Créateurs de contenu (bonus créateur)
  CREATOR: { weight: 1.3, label: 'Bonus créateur', color: 'bg-pink-100 text-pink-800' }
};

// ===== HOOKS =====

function useProjectVoting(projectId: string) {
  return useQuery({
    queryKey: ['project-voting', projectId],
    queryFn: async (): Promise<VotingData> => {
      const response = await fetch(`/api/projects/${projectId}/voting`, { 
        credentials: 'include' 
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des votes');
      const data = await response.json();
      return data.voting;
    },
  });
}

function useVoteWeight(projectId: string) {
  return useQuery({
    queryKey: ['vote-weight', projectId],
    queryFn: async (): Promise<VoteWeightInfo> => {
      const response = await fetch(`/api/projects/${projectId}/vote-weight`, { 
        credentials: 'include' 
      });
      if (!response.ok) throw new Error('Erreur lors du calcul du poids de vote');
      const data = await response.json();
      return data.voteWeight;
    },
  });
}

function useSubmitVote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ projectId, voteType }: { projectId: string; voteType: 'up' | 'down' }) => {
      const response = await fetch(`/api/projects/${projectId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ voteType }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors du vote');
      }

      return response.json();
    },
    onSuccess: (data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-voting', projectId] });
      toast({
        title: "✅ Vote enregistré",
        description: `Votre vote a été pris en compte avec un poids de ${data.voteWeight}`,
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

interface VotingSystemProps {
  projectId: string;
  compact?: boolean;
}

const VotingSystem: React.FC<VotingSystemProps> = ({ projectId, compact = false }) => {
  const { data: votingData, isLoading } = useProjectVoting(projectId);
  const { data: voteWeight } = useVoteWeight(projectId);
  const submitVote = useSubmitVote();

  const handleVote = (voteType: 'up' | 'down') => {
    submitVote.mutate({ projectId, voteType });
  };

  if (isLoading) {
    return (
      <Card className={compact ? "bg-muted/30" : ""}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            <span className="text-sm">Chargement des votes...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!votingData) return null;

  const positivePercentage = votingData.totalVotes > 0 
    ? (votingData.positiveVotes / votingData.totalVotes) * 100 
    : 0;

  const getVoteWeightBadge = (weight: number) => {
    if (weight >= 5) return VOTE_WEIGHT_BARÈME.LARGE_16_20;
    if (weight >= 4) return VOTE_WEIGHT_BARÈME.MEDIUM_11_15;
    if (weight >= 3) return VOTE_WEIGHT_BARÈME.SMALL_6_10;
    if (weight >= 2) return VOTE_WEIGHT_BARÈME.MICRO_1_5;
    return VOTE_WEIGHT_BARÈME.NO_INVESTMENT;
  };

  const weightBadge = getVoteWeightBadge(voteWeight?.totalWeight || 1);

  if (compact) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">{votingData.positiveVotes}</span>
              </div>
              <div className="flex items-center gap-1">
                <ThumbsDown className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">{votingData.negativeVotes}</span>
              </div>
              {votingData.trending && (
                <Badge className="bg-orange-100 text-orange-800 text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Tendance
                </Badge>
              )}
            </div>
            
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={votingData.userVote === 'up' ? 'default' : 'outline'}
                onClick={() => handleVote('up')}
                disabled={submitVote.isPending}
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={votingData.userVote === 'down' ? 'default' : 'outline'}
                onClick={() => handleVote('down')}
                disabled={submitVote.isPending}
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Progress value={positivePercentage} className="h-2 mt-2" />
          
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{positivePercentage.toFixed(1)}% positif</span>
            <span>{votingData.totalVotes} vote{votingData.totalVotes !== 1 ? 's' : ''}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-500" />
          Votes Communautaires
          {votingData.trending && (
            <Badge className="bg-orange-100 text-orange-800">
              <TrendingUp className="h-4 w-4 mr-1" />
              En tendance
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Système de vote pondéré selon votre investissement
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Statistiques des votes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <ThumbsUp className="h-5 w-5 text-green-500" />
              <span className="font-bold text-green-600">{votingData.positiveVotes}</span>
            </div>
            <div className="text-sm text-muted-foreground">Pour</div>
          </div>
          
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <ThumbsDown className="h-5 w-5 text-red-500" />
              <span className="font-bold text-red-600">{votingData.negativeVotes}</span>
            </div>
            <div className="text-sm text-muted-foreground">Contre</div>
          </div>
          
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="font-bold text-blue-600">{votingData.totalVotes}</span>
            </div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Star className="h-5 w-5 text-purple-500" />
              <span className="font-bold text-purple-600">{votingData.communityScore.toFixed(1)}</span>
            </div>
            <div className="text-sm text-muted-foreground">Score</div>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Opinion communautaire</span>
            <span className="font-medium">{positivePercentage.toFixed(1)}% positif</span>
          </div>
          <Progress 
            value={positivePercentage} 
            className="h-3"
            indicatorClassName={positivePercentage >= 70 ? 'bg-green-500' : positivePercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}
          />
        </div>

        {/* Poids de vote de l'utilisateur */}
        {voteWeight && (
          <Card className="bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Votre poids de vote</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Badge className={weightBadge.color}>
                    {weightBadge.label}
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">
                    Poids total : {voteWeight.totalWeight}x
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">
                    {voteWeight.totalWeight}x
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Max: {voteWeight.maxPossibleWeight}x
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Vote de base :</span>
                  <span>{voteWeight.baseWeight}x</span>
                </div>
                {voteWeight.investmentBonus > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Bonus investissement :</span>
                    <span className="text-green-600">+{voteWeight.investmentBonus}x</span>
                  </div>
                )}
                {voteWeight.engagementBonus > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Bonus engagement :</span>
                    <span className="text-blue-600">+{voteWeight.engagementBonus}x</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Boutons de vote */}
        <div className="flex gap-4 justify-center">
          <Button
            size="lg"
            variant={votingData.userVote === 'up' ? 'default' : 'outline'}
            onClick={() => handleVote('up')}
            disabled={submitVote.isPending}
            className="flex-1 max-w-32"
          >
            <ThumbsUp className="h-5 w-5 mr-2" />
            {votingData.userVote === 'up' ? 'Voté Pour' : 'Voter Pour'}
          </Button>
          
          <Button
            size="lg"
            variant={votingData.userVote === 'down' ? 'default' : 'outline'}
            onClick={() => handleVote('down')}
            disabled={submitVote.isPending}
            className="flex-1 max-w-32"
          >
            <ThumbsDown className="h-5 w-5 mr-2" />
            {votingData.userVote === 'down' ? 'Voté Contre' : 'Voter Contre'}
          </Button>
        </div>

        {/* Information sur le barème */}
        <Alert>
          <Award className="h-4 w-4" />
          <AlertDescription>
            <strong>Barème de votes :</strong> Plus vous investissez, plus votre vote compte ! 
            Investissements 1€-5€ = 2x, 6€-10€ = 3x, 11€-15€ = 4x, 16€-20€ = 5x.
            Bonus fidélité et créateur disponibles.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default VotingSystem;