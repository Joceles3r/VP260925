import { useState } from 'react';
import { Play, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/lib/i18n';

export default function LoginPage() {
  const { t } = useI18n();
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = () => {
    const loginUrl = `/api/login?rememberMe=${rememberMe ? '1' : '0'}`;
    window.location.href = loginUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4" data-testid="login-page">
      {/* Logo fixe en haut */}
      <div className="absolute top-8 left-8 flex items-center">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
          <Play className="h-6 w-6 text-primary-foreground" />
        </div>
        <span className="ml-3 text-xl font-bold text-foreground">VISUAL</span>
      </div>

      {/* Carte de connexion */}
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-2xl border border-border p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="login-title">
              {t('auth.login')}
            </h1>
            <p className="text-sm text-muted-foreground" data-testid="session-info">
              {t('auth.session_info')}
            </p>
          </div>

          {/* Information sécurité */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">{t('auth.secure_platform')}</p>
                <p className="text-xs">
                  {t('auth.security_details')}
                </p>
              </div>
            </div>
          </div>

          {/* Option "Se souvenir de moi" */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-4 bg-muted/30 rounded-lg border border-border">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                data-testid="checkbox-remember-me"
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label
                  htmlFor="remember-me"
                  className="text-sm font-medium cursor-pointer text-foreground"
                  data-testid="label-remember-me"
                >
                  {t('auth.remember_me')}
                </Label>
                <p className="text-xs text-muted-foreground mt-1" data-testid="description-remember-me">
                  {t('auth.remember_me_description')}
                </p>
              </div>
            </div>

            {/* Info contextuelle */}
            <div className="text-xs text-muted-foreground space-y-1 px-1">
              <p className="flex items-center" data-testid="session-duration-info">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                {rememberMe 
                  ? t('auth.session_7days')
                  : t('auth.session_short')
                }
              </p>
            </div>
          </div>

          {/* Bouton de connexion */}
          <Button
            size="lg"
            className="w-full text-lg"
            onClick={handleLogin}
            data-testid="button-login"
          >
            {t('auth.login')}
          </Button>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
            <p>
              {t('auth.terms_accept_prefix')}{' '}
              <a href="/info" className="text-primary hover:underline">{t('auth.terms_link')}</a>
              {' '}{t('auth.terms_accept_connector')}{' '}
              <a href="/info" className="text-primary hover:underline">{t('auth.privacy_link')}</a>
            </p>
          </div>
        </div>

        {/* Lien retour */}
        <div className="text-center mt-6">
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {t('auth.back_home')}
          </a>
        </div>
      </div>
    </div>
  );
}
