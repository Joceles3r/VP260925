import { useI18n, SupportedLocale } from '@/lib/i18n';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface LanguageSelectorProps {
  showLabel?: boolean;
}

export function LanguageSelector({ showLabel = false }: LanguageSelectorProps) {
  const { locale, setLocale } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();

  const languages: { code: SupportedLocale; name: string; flag: string }[] = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
  ];

  const handleLanguageChange = async (newLocale: SupportedLocale) => {
    setLocale(newLocale);
    
    if (user) {
      try {
        await apiRequest('PATCH', '/api/users/preference', { preferredLanguage: newLocale });
      } catch (error) {
        console.error('Failed to save language preference:', error);
      }
    }
  };

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="glass-card smooth-transition hover:border-[#00D1FF]/50 hover:neon-glow-blue"
          data-testid="language-selector"
        >
          <span className="text-xl">{currentLanguage.flag}</span>
          {showLabel && <span className="ml-2 text-sm">{currentLanguage.name}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-card w-40">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`cursor-pointer smooth-transition ${
              locale === lang.code
                ? 'bg-gradient-to-r from-[#00D1FF]/20 to-[#7B2CFF]/20 text-[#00D1FF]'
                : 'hover:bg-muted/50'
            }`}
            data-testid={`language-option-${lang.code}`}
          >
            <span className="mr-2">{lang.flag}</span>
            <span>{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
