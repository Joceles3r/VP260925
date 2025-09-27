import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { Globe, Check, ChevronDown } from 'lucide-react';

const LanguageSelector = ({ className = "" }) => {
  const { locale, changeLocale, supportedLocales } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const languages = {
    'fr-FR': { name: 'Français', flag: '🇫🇷', native: 'Français' },
    'en-US': { name: 'English', flag: '🇺🇸', native: 'English' },
    'es-ES': { name: 'Español', flag: '🇪🇸', native: 'Español' },
    'de-DE': { name: 'Deutsch', flag: '🇩🇪', native: 'Deutsch' },
    'it-IT': { name: 'Italiano', flag: '🇮🇹', native: 'Italiano' }
  };

  const currentLanguage = languages[locale];

  const handleLanguageChange = (newLocale) => {
    changeLocale(newLocale);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 min-w-0"
        size="sm"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{currentLanguage?.flag}</span>
        <span className="hidden md:inline">{currentLanguage?.native}</span>
        <ChevronDown className="h-3 w-3" />
      </Button>

      {isOpen && (
        <>
          {/* Overlay pour fermer le menu */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu déroulant */}
          <Card className="absolute top-full mt-2 right-0 z-50 min-w-48 shadow-lg">
            <CardContent className="p-2">
              <div className="space-y-1">
                {supportedLocales.map((localeCode) => {
                  const lang = languages[localeCode];
                  const isSelected = locale === localeCode;
                  
                  return (
                    <button
                      key={localeCode}
                      onClick={() => handleLanguageChange(localeCode)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                        isSelected 
                          ? 'bg-purple-50 text-purple-700' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{lang?.flag}</span>
                        <span className="font-medium">{lang?.native}</span>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-purple-600" />
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Informations sur la traduction */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500 text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <span>🤖</span>
                    <span>IA + Édition humaine</span>
                  </div>
                  <div className="mt-1">
                    Traductions professionnelles
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;