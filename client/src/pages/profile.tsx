import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Mail, Briefcase, Wallet, TrendingUp, Award, Calendar, Check, X } from "lucide-react";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-8 animate-pulse">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-full bg-muted"></div>
              <div className="flex-1 space-y-4">
                <div className="h-8 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass-card rounded-2xl p-8 border border-[#FF3CAC]/30 text-center">
          <p className="text-muted-foreground">Vous devez être connecté pour voir votre profil</p>
        </div>
      </div>
    );
  }

  const profileTypeLabels: Record<string, string> = {
    investor: "Investisseur",
    invested_reader: "Investi-lecteur",
    creator: "Créateur",
    admin: "Administrateur",
    infoporteur: "Infoporteur"
  };

  const profileTypeColors: Record<string, string> = {
    investor: "from-[#00D1FF] to-[#7B2CFF]",
    invested_reader: "from-[#7B2CFF] to-[#FF3CAC]",
    creator: "from-[#FF3CAC] to-[#00D1FF]",
    admin: "from-[#00D1FF] to-[#FF3CAC]",
    infoporteur: "from-[#7B2CFF] to-[#00D1FF]"
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative" data-testid="profile-page">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00D1FF]/5 via-transparent to-[#7B2CFF]/5 pointer-events-none"></div>

      <div className="relative z-10 space-y-6">
        {/* Header with profile info */}
        <div className="glass-card rounded-2xl p-8 border border-[#00D1FF]/30 neon-border visual-fade-in" data-testid="profile-header">
          <div className="flex items-start gap-6 flex-col sm:flex-row">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#00D1FF] to-[#7B2CFF] flex items-center justify-center neon-glow-blue floating-animation" data-testid="profile-avatar">
                {user.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
              {user.kycVerified && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 neon-glow-green" data-testid="kyc-badge">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            {/* User info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold visual-text-gradient mb-2" data-testid="profile-name">
                {user.firstName} {user.lastName}
              </h1>
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-4 h-4 text-[#00D1FF]" />
                <span className="text-muted-foreground" data-testid="profile-email">{user.email}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge 
                  className={`bg-gradient-to-r ${profileTypeColors[user.profileType || 'investor']} text-white px-3 py-1`}
                  data-testid="profile-type"
                >
                  <Briefcase className="w-3 h-3 mr-1" />
                  {profileTypeLabels[user.profileType || 'investor']}
                </Badge>
                {user.simulationMode && (
                  <Badge variant="outline" className="border-yellow-500/50 text-yellow-400" data-testid="simulation-badge">
                    Mode Simulation
                  </Badge>
                )}
                {user.kycVerified ? (
                  <Badge variant="outline" className="border-green-500/50 text-green-400" data-testid="kyc-status">
                    <Check className="w-3 h-3 mr-1" />
                    KYC Vérifié
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-orange-500/50 text-orange-400" data-testid="kyc-status">
                    <X className="w-3 h-3 mr-1" />
                    KYC Non vérifié
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 visual-fade-in visual-delay-100">
          {/* Balance */}
          <Card className="glass-card border-[#00D1FF]/30 smooth-transition hover:border-[#00D1FF] hover:neon-glow-blue" data-testid="balance-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#00D1FF]" />
                Solde disponible
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold visual-text-gradient" data-testid="balance-amount">
                {parseFloat(user.balanceEUR || '0').toLocaleString('fr-FR', { 
                  style: 'currency', 
                  currency: 'EUR' 
                })}
              </div>
            </CardContent>
          </Card>

          {/* Total invested */}
          <Card className="glass-card border-[#7B2CFF]/30 smooth-transition hover:border-[#7B2CFF] hover:neon-glow-violet" data-testid="invested-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#7B2CFF]" />
                Total investi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold visual-text-gradient" data-testid="invested-amount">
                {parseFloat(user.totalInvested || '0').toLocaleString('fr-FR', { 
                  style: 'currency', 
                  currency: 'EUR' 
                })}
              </div>
            </CardContent>
          </Card>

          {/* Total gains */}
          <Card className="glass-card border-[#FF3CAC]/30 smooth-transition hover:border-[#FF3CAC] hover:neon-glow-pink" data-testid="gains-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Award className="w-4 h-4 text-[#FF3CAC]" />
                Gains totaux
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold visual-text-gradient" data-testid="gains-amount">
                {parseFloat(user.totalGains || '0').toLocaleString('fr-FR', { 
                  style: 'currency', 
                  currency: 'EUR' 
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional info */}
        <div className="glass-card rounded-2xl p-6 border border-[#7B2CFF]/30 visual-fade-in visual-delay-200" data-testid="additional-info">
          <h2 className="text-xl font-bold mb-4 visual-text-gradient">Informations complémentaires</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user.rankGlobal && (
              <div className="flex items-center gap-3" data-testid="rank-info">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00D1FF] to-[#7B2CFF] flex items-center justify-center neon-glow-blue">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rang global</p>
                  <p className="font-semibold" data-testid="rank-value">#{user.rankGlobal}</p>
                </div>
              </div>
            )}
            
            {user.cautionEUR && parseFloat(user.cautionEUR) > 0 && (
              <div className="flex items-center gap-3" data-testid="caution-info">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#7B2CFF] to-[#FF3CAC] flex items-center justify-center neon-glow-violet">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Caution</p>
                  <p className="font-semibold" data-testid="caution-value">
                    {parseFloat(user.cautionEUR).toLocaleString('fr-FR', { 
                      style: 'currency', 
                      currency: 'EUR' 
                    })}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3" data-testid="member-since">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF3CAC] to-[#00D1FF] flex items-center justify-center neon-glow-pink">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Membre depuis</p>
                <p className="font-semibold" data-testid="created-at">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'Non disponible'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 visual-fade-in visual-delay-300">
          <Button variant="neon" className="flex-1" data-testid="edit-profile-button">
            Modifier le profil
          </Button>
          <Button variant="glass" className="flex-1" data-testid="settings-button">
            Paramètres
          </Button>
        </div>
      </div>
    </main>
  );
}
