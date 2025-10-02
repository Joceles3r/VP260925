import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Calendar, Share2, Download, BarChart3, History, Medal, Crown } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useI18n } from '@/hooks/useI18n';

export default function LeaderboardPage() {
  const { t } = useI18n();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [viewMode, setViewMode] = useState<'monthly' | 'all-time' | 'replay'>('monthly');
  const [selectedProjectForReplay, setSelectedProjectForReplay] = useState<string | null>(null);

  // Fetch available months
  const { data: monthsData } = useQuery({
    queryKey: ['/api/leaderboard/months'],
  });

  // Fetch monthly rankings
  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['/api/leaderboard/monthly', selectedMonth],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard/monthly/${selectedMonth}`);
      if (!res.ok) throw new Error('Failed to fetch monthly rankings');
      return res.json();
    },
    enabled: viewMode === 'monthly',
  });

  // Fetch all-time top performers
  const { data: allTimeData, isLoading: allTimeLoading } = useQuery({
    queryKey: ['/api/leaderboard/all-time'],
    queryFn: async () => {
      const res = await fetch('/api/leaderboard/all-time');
      if (!res.ok) throw new Error('Failed to fetch all-time performers');
      return res.json();
    },
    enabled: viewMode === 'all-time',
  });

  // Fetch replay data for selected project
  const { data: replayData } = useQuery({
    queryKey: ['/api/leaderboard/history', selectedProjectForReplay],
    queryFn: async () => {
      if (!selectedProjectForReplay) return null;
      const res = await fetch(`/api/leaderboard/history/${selectedProjectForReplay}`);
      if (!res.ok) throw new Error('Failed to fetch project history');
      return res.json();
    },
    enabled: !!selectedProjectForReplay,
  });

  const getBadgeIcon = (badge: string | null) => {
    if (!badge) return null;
    
    switch (badge) {
      case 'gold':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'silver':
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 'bronze':
        return <Medal className="h-4 w-4 text-amber-600" />;
      case 'rising_star':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getBadgeColor = (badge: string | null) => {
    switch (badge) {
      case 'gold':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      case 'silver':
        return 'bg-gray-400/20 text-gray-400 border-gray-400/50';
      case 'bronze':
        return 'bg-amber-600/20 text-amber-600 border-amber-600/50';
      case 'rising_star':
        return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/leaderboard?month=${selectedMonth}`;
    const text = `🏆 Classement VISUAL ${selectedMonth} - Top des meilleurs projets créatifs !`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: 'VISUAL Leaderboard', text, url });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      alert('Lien copié dans le presse-papiers !');
    }
  };

  const handleExport = () => {
    const data = viewMode === 'monthly' ? monthlyData?.rankings : allTimeData?.topPerformers;
    if (!data) return;

    const csv = [
      ['Rang', 'Projet', 'Créateur', 'Investissement Total', 'ROI Moyen', 'Score'],
      ...data.map((item: any) => [
        item.rank || item.bestRank,
        item.project?.title || '',
        `${item.creator?.firstName} ${item.creator?.lastName}` || '',
        item.totalInvestedEUR || '',
        item.avgRoi || item.avgRank || '',
        item.successScore || item.topRankCount || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visual-leaderboard-${selectedMonth}.csv`;
    a.click();
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold visual-text-gradient mb-2 flex items-center gap-3">
            <Trophy className="h-10 w-10 text-[#00D1FF]" />
            {t('Classement & Hall of Fame')}
          </h1>
          <p className="text-muted-foreground">
            {t('Les meilleurs projets et porteurs de projet - Historique et mode replay')}
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleShare} variant="outline" size="sm" data-testid="button-share">
            <Share2 className="h-4 w-4 mr-2" />
            Partager
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* View Mode Selector */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="mb-6">
        <TabsList className="grid w-full max-w-xl grid-cols-3">
          <TabsTrigger value="monthly" data-testid="tab-monthly">
            <Calendar className="h-4 w-4 mr-2" />
            Mensuel
          </TabsTrigger>
          <TabsTrigger value="all-time" data-testid="tab-alltime">
            <Crown className="h-4 w-4 mr-2" />
            All-Time
          </TabsTrigger>
          <TabsTrigger value="replay" data-testid="tab-replay">
            <History className="h-4 w-4 mr-2" />
            Mode Replay
          </TabsTrigger>
        </TabsList>

        {/* Monthly View */}
        <TabsContent value="monthly" className="space-y-6">
          {/* Month Selector */}
          <Card className="p-4 glass-card border-[#00D1FF]/20">
            <div className="flex items-center gap-4">
              <Calendar className="h-5 w-5 text-[#00D1FF]" />
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-48" data-testid="select-month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthsData?.months?.map((month: string) => (
                    <SelectItem key={month} value={month}>
                      {new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant="outline" className="text-[#00D1FF]">
                {monthlyData?.totalCount || 0} projets classés
              </Badge>
            </div>
          </Card>

          {/* Rankings Table */}
          <Card className="p-6 glass-card border-[#7B2CFF]/20">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[#FFD700]" />
              Top 10 - {new Date(selectedMonth + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </h3>

            {monthlyLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-3">
                {monthlyData?.rankings?.map((ranking: any) => (
                  <div
                    key={ranking.id}
                    className={`p-4 rounded-lg border ${
                      ranking.rank <= 3 ? 'bg-gradient-to-r from-[#FFD700]/10 to-transparent border-[#FFD700]/30' : 'bg-muted/50 border-muted'
                    }`}
                    data-testid={`ranking-${ranking.rank}`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold ${
                        ranking.rank === 1 ? 'bg-[#FFD700]/20 text-[#FFD700]' :
                        ranking.rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                        ranking.rank === 3 ? 'bg-amber-600/20 text-amber-600' :
                        'bg-muted'
                      }`}>
                        {ranking.rank <= 3 ? <Trophy className="h-6 w-6" /> : `#${ranking.rank}`}
                      </div>

                      {/* Project Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-lg">{ranking.project?.title}</h4>
                          {ranking.badge && (
                            <Badge className={getBadgeColor(ranking.badge)}>
                              {getBadgeIcon(ranking.badge)}
                              <span className="ml-1 capitalize">{ranking.badge.replace('_', ' ')}</span>
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Par {ranking.creator?.firstName} {ranking.creator?.lastName}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-[#00D1FF]">
                            €{parseFloat(ranking.totalInvestedEUR || '0').toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">Investi</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-[#7B2CFF]">
                            {ranking.investorCount}
                          </div>
                          <div className="text-xs text-muted-foreground">Investisseurs</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-[#FF3CAC]">
                            {parseFloat(ranking.avgRoi || '0').toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">ROI Moyen</div>
                        </div>
                      </div>

                      {/* Replay Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProjectForReplay(ranking.projectId);
                          setViewMode('replay');
                        }}
                        data-testid={`button-replay-${ranking.projectId}`}
                      >
                        <History className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Score de succès</span>
                        <span>{ranking.successScore}/100</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#00D1FF] to-[#7B2CFF] rounded-full"
                          style={{ width: `${ranking.successScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* All-Time View */}
        <TabsContent value="all-time" className="space-y-6">
          <Card className="p-6 glass-card border-[#FFD700]/20">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Crown className="h-5 w-5 text-[#FFD700]" />
              Hall of Fame - Top Performers de tous les temps
            </h3>

            {allTimeLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-4">
                {allTimeData?.topPerformers?.map((perf: any, index: number) => (
                  <div
                    key={perf.projectId}
                    className="p-6 rounded-lg bg-gradient-to-r from-[#FFD700]/10 via-transparent to-[#7B2CFF]/10 border border-[#FFD700]/30"
                    data-testid={`alltime-${index}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl font-bold text-[#FFD700]">#{index + 1}</div>
                        <div>
                          <h4 className="text-xl font-bold">{perf.project?.title}</h4>
                          <p className="text-muted-foreground">
                            {perf.creator?.firstName} {perf.creator?.lastName}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-6 text-center">
                        <div>
                          <div className="text-3xl font-bold text-[#FFD700]">{perf.goldCount}</div>
                          <div className="text-xs text-muted-foreground">🥇 Or</div>
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-gray-400">{perf.silverCount}</div>
                          <div className="text-xs text-muted-foreground">🥈 Argent</div>
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-amber-600">{perf.bronzeCount}</div>
                          <div className="text-xs text-muted-foreground">🥉 Bronze</div>
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-[#00D1FF]">{perf.totalMonths}</div>
                          <div className="text-xs text-muted-foreground">Mois classé</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Replay Mode */}
        <TabsContent value="replay" className="space-y-6">
          <Card className="p-4 glass-card border-[#7B2CFF]/20">
            <div className="flex items-center gap-4">
              <History className="h-5 w-5 text-[#7B2CFF]" />
              <div className="flex-1">
                <Select value={selectedProjectForReplay || ''} onValueChange={setSelectedProjectForReplay}>
                  <SelectTrigger className="w-64" data-testid="select-project-replay">
                    <SelectValue placeholder="Sélectionner un projet..." />
                  </SelectTrigger>
                  <SelectContent>
                    {monthlyData?.rankings?.map((ranking: any) => (
                      <SelectItem key={ranking.projectId} value={ranking.projectId}>
                        {ranking.project?.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Badge variant="outline" className="text-[#7B2CFF]">
                {replayData?.totalMonths || 0} mois d'historique
              </Badge>
            </div>
          </Card>

          {replayData && (() => {
            // Create a properly ordered copy for charts (oldest to newest)
            const orderedHistory = [...(replayData.history || [])].reverse();
            
            return (
              <>
                {/* Evolution Chart */}
                <Card className="p-6 glass-card border-[#00D1FF]/20">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-[#00D1FF]" />
                    Évolution du classement - {replayData.project?.title}
                  </h3>

                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={orderedHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="monthYear" 
                        stroke="#9CA3AF"
                        tickFormatter={(value) => new Date(value + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}
                      />
                      <YAxis stroke="#9CA3AF" reversed />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                        labelFormatter={(value) => new Date(value + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="rank" 
                        stroke="#00D1FF" 
                        fill="#00D1FF20" 
                        name="Position"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>

                {/* Performance Metrics Chart */}
                <Card className="p-6 glass-card border-[#7B2CFF]/20">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#7B2CFF]" />
                    Métriques de performance
                  </h3>

                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={orderedHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="monthYear" 
                        stroke="#9CA3AF"
                        tickFormatter={(value) => new Date(value + '-01').toLocaleDateString('fr-FR', { month: 'short' })}
                      />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                      />
                      <Legend />
                      <Bar dataKey="totalInvestedEUR" fill="#00D1FF" name="Investi (€)" />
                      <Bar dataKey="investorCount" fill="#7B2CFF" name="Investisseurs" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </>
            );
          })()}
        </TabsContent>
      </Tabs>
    </main>
  );
}
