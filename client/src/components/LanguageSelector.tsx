import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { useI18n, type Locale } from '@/hooks/useI18n';

const localeLabels: Record<Locale, string> = {
  'fr-FR': '🇫🇷 Français',
  'en-US': '🇺🇸 English',
  'es-ES': '🇪🇸 Español'
};

export default function LanguageSelector() {
  const { currentLocale, setLocale, supportedLocales } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
          <Globe className="h-4 w-4 mr-2" />
          {localeLabels[currentLocale].split(' ')[0]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
        {supportedLocales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => setLocale(locale)}
            className={`cursor-pointer hover:bg-slate-700 ${
              currentLocale === locale ? 'bg-slate-700 text-white' : 'text-gray-300'
            }`}
          >
            {localeLabels[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}