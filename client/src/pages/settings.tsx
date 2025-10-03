import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Settings as SettingsIcon, User, Shield, CheckCircle2, Info, UserCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useI18n } from "@/lib/i18n";

type ProfileType = 'investor' | 'invested_reader' | 'creator' | 'admin' | 'infoporteur';

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [selectedProfiles, setSelectedProfiles] = useState<ProfileType[]>([]);
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Sync state with user data when it loads
  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  // Fetch current profiles
  const { data: currentProfiles, isLoading: profilesLoading } = useQuery<ProfileType[]>({
    queryKey: ['/api/user/profiles'],
    queryFn: async () => {
      const response = await fetch('/api/user/profiles', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch profiles');
      const data = await response.json();
      setSelectedProfiles(data.profileTypes);
      return data.profileTypes;
    },
    enabled: !!user
  });

  // Update profiles mutation
  const updateProfilesMutation = useMutation({
    mutationFn: async (profileTypes: ProfileType[]) => {
      return await apiRequest('PATCH', '/api/user/profiles', { profileTypes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/profiles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: t('settings.profiles.success.title'),
        description: t('settings.profiles.success.description'),
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: t('settings.profiles.error.title'),
        description: error.message || t('settings.profiles.error.description'),
        variant: "destructive"
      });
    }
  });

  // Update display (nickname/avatar) mutation
  const updateDisplayMutation = useMutation({
    mutationFn: async (display: { nickname?: string; avatarUrl?: string | null }) => {
      return await apiRequest('PATCH', '/api/user/display', display);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Profil mis à jour",
        description: "Votre pseudo et avatar ont été mis à jour avec succès",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour votre profil",
        variant: "destructive"
      });
    }
  });

  const handleProfileToggle = (profile: ProfileType) => {
    setSelectedProfiles(prev => {
      if (prev.includes(profile)) {
        // Prevent removing the last profile
        if (prev.length === 1) {
          toast({
            title: t('settings.profiles.minRequired.title'),
            description: t('settings.profiles.minRequired.description'),
            variant: "destructive"
          });
          return prev;
        }
        return prev.filter(p => p !== profile);
      } else {
        return [...prev, profile];
      }
    });
  };

  const handleSave = () => {
    if (selectedProfiles.length === 0) {
      toast({
        title: t('settings.profiles.minRequired.title'),
        description: t('settings.profiles.minRequired.description'),
        variant: "destructive"
      });
      return;
    }
    updateProfilesMutation.mutate(selectedProfiles);
  };

  const handleDisplaySave = () => {
    const trimmedNickname = nickname.trim();
    
    if (trimmedNickname.length > 50) {
      toast({
        title: "Erreur",
        description: "Le pseudo ne peut pas dépasser 50 caractères",
        variant: "destructive"
      });
      return;
    }
    
    updateDisplayMutation.mutate({
      nickname: trimmedNickname || undefined,
      avatarUrl: avatarUrl.trim() || null
    });
  };

  const profileOptions: { value: ProfileType; label: string; description: string; restricted: boolean }[] = [
    {
      value: 'investor',
      label: t('profiles.investor'),
      description: t('settings.profiles.investor.description'),
      restricted: false
    },
    {
      value: 'invested_reader',
      label: t('profiles.invested_reader'),
      description: t('settings.profiles.invested_reader.description'),
      restricted: false
    },
    {
      value: 'creator',
      label: t('profiles.creator'),
      description: t('settings.profiles.creator.description'),
      restricted: false
    }
  ];

  const restrictedProfiles = currentProfiles?.filter(p => p === 'admin' || p === 'infoporteur') || [];

  if (authLoading || profilesLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="glass-card rounded-2xl p-8">
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
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
          <p className="text-muted-foreground">{t('settings.loginRequired')}</p>
        </div>
      </div>
    );
  }

  const hasChanges = JSON.stringify([...selectedProfiles].sort()) !== JSON.stringify([...(currentProfiles || [])].sort());

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative" data-testid="settings-page">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00D1FF]/5 via-transparent to-[#7B2CFF]/5 pointer-events-none"></div>

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 visual-fade-in">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00D1FF] to-[#7B2CFF] flex items-center justify-center">
            <SettingsIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text" data-testid="settings-title">
              {t('settings.title')}
            </h1>
            <p className="text-muted-foreground" data-testid="settings-subtitle">
              {t('settings.subtitle')}
            </p>
          </div>
        </div>

        {/* Theme Settings */}
        <Card className="glass-card border-[#00D1FF]/30 neon-border visual-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {t('settings.theme.title')}
            </CardTitle>
            <CardDescription>{t('settings.theme.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="theme-toggle">{t('settings.theme.label')}</Label>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        {/* Nickname and Avatar */}
        <Card className="glass-card border-[#7B2CFF]/30 neon-border visual-fade-in" data-testid="display-settings-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="w-5 h-5" />
              Pseudo et Avatar
            </CardTitle>
            <CardDescription>
              Personnalisez votre affichage dans l'application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">Pseudo (optionnel)</Label>
              <Input
                id="nickname"
                type="text"
                placeholder="Votre pseudo"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={50}
                data-testid="input-nickname"
              />
              <p className="text-xs text-muted-foreground">
                {nickname.length}/50 caractères
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="avatar">URL de l'avatar (optionnel)</Label>
              <Input
                id="avatar"
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                data-testid="input-avatar"
              />
              <p className="text-xs text-muted-foreground">
                Utilisez une URL d'image pour votre avatar personnalisé
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handleDisplaySave}
                disabled={updateDisplayMutation.isPending}
                className="bg-gradient-to-r from-[#7B2CFF] to-[#FF3CAC] hover:from-[#7B2CFF]/90 hover:to-[#FF3CAC]/90"
                data-testid="button-save-display"
              >
                {updateDisplayMutation.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
              {(user?.nickname || user?.avatarUrl) && (
                <p className="text-sm text-muted-foreground">
                  Pseudo actuel: {user?.nickname || 'Non défini'} | Avatar: {user?.avatarUrl ? '✓' : '✗'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Management */}
        <Card className="glass-card border-[#7B2CFF]/30 neon-border visual-fade-in" data-testid="profile-settings-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {t('settings.profiles.title')}
            </CardTitle>
            <CardDescription>{t('settings.profiles.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Regular Profiles */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {t('settings.profiles.available')}
              </h3>
              {profileOptions.map((option) => (
                <div
                  key={option.value}
                  className="flex items-start gap-3 p-4 rounded-lg border border-border/50 hover:border-[#00D1FF]/30 transition-colors"
                  data-testid={`profile-option-${option.value}`}
                >
                  <Checkbox
                    id={option.value}
                    checked={selectedProfiles.includes(option.value)}
                    onCheckedChange={() => handleProfileToggle(option.value)}
                    className="mt-1"
                    data-testid={`checkbox-${option.value}`}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={option.value}
                      className="text-base font-medium cursor-pointer flex items-center gap-2"
                    >
                      {option.label}
                      {selectedProfiles.includes(option.value) && (
                        <CheckCircle2 className="w-4 h-4 text-[#00D1FF]" />
                      )}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Restricted Profiles */}
            {restrictedProfiles.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#FF3CAC]" />
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('settings.profiles.restricted')}
                  </h3>
                </div>
                <div className="flex gap-2">
                  {restrictedProfiles.map((profile) => (
                    <Badge
                      key={profile}
                      variant="outline"
                      className="bg-gradient-to-r from-[#FF3CAC]/10 to-[#7B2CFF]/10 border-[#FF3CAC]/30"
                      data-testid={`badge-${profile}`}
                    >
                      {profile === 'admin' ? t('profiles.admin') : t('profiles.infoporteur')}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                  <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    {t('settings.profiles.restrictedNote')}
                  </p>
                </div>
              </div>
            )}

            {/* Self-Investment Warning */}
            {selectedProfiles.includes('creator') && (
              <div className="flex items-start gap-2 p-4 rounded-lg bg-[#FF3CAC]/10 border border-[#FF3CAC]/30">
                <Info className="w-5 h-5 text-[#FF3CAC] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t('settings.profiles.creatorWarning.title')}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('settings.profiles.creatorWarning.description')}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="neon"
                onClick={handleSave}
                disabled={!hasChanges || updateProfilesMutation.isPending}
                className="flex-1"
                data-testid="button-save-profiles"
              >
                {updateProfilesMutation.isPending ? t('settings.profiles.saving') : t('settings.profiles.save')}
              </Button>
              <Button
                variant="glass"
                onClick={() => setSelectedProfiles(currentProfiles || [])}
                disabled={!hasChanges || updateProfilesMutation.isPending}
                data-testid="button-cancel"
              >
                {t('settings.profiles.cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
