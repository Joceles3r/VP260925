import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { Play, Pause, Volume2, Settings, Subtitles } from 'lucide-react';

const SubtitlePlayer = ({ 
  videoUrl, 
  subtitles = [], // Format: [{lang: 'fr-FR', url: '...', label: 'Français'}, ...]
  className = "" 
}) => {
  const { locale, t } = useI18n();
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSubtitle, setSelectedSubtitle] = useState(null);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Auto-sélection des sous-titres basée sur la langue actuelle
  useEffect(() => {
    const matchingSubtitle = subtitles.find(sub => sub.lang === locale);
    if (matchingSubtitle) {
      setSelectedSubtitle(matchingSubtitle);
    } else if (subtitles.length > 0) {
      // Fallback vers les sous-titres français ou le premier disponible
      const fallback = subtitles.find(sub => sub.lang === 'fr-FR') || subtitles[0];
      setSelectedSubtitle(fallback);
    }
  }, [locale, subtitles]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSubtitleChange = (subtitle) => {
    setSelectedSubtitle(subtitle);
    setShowSubtitleMenu(false);
    
    // Mise à jour du track de sous-titres
    if (videoRef.current) {
      const tracks = videoRef.current.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = tracks[i].language === subtitle?.lang ? 'showing' : 'hidden';
      }
    }
  };

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Lecteur vidéo */}
      <video
        ref={videoRef}
        className="w-full h-auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        crossOrigin="anonymous"
      >
        <source src={videoUrl} type="video/mp4" />
        
        {/* Ajout des pistes de sous-titres */}
        {subtitles.map((subtitle, index) => (
          <track
            key={index}
            kind="subtitles"
            src={subtitle.url}
            srcLang={subtitle.lang}
            label={subtitle.label}
            default={subtitle.lang === locale}
          />
        ))}
        
        Votre navigateur ne supporte pas la lecture vidéo.
      </video>

      {/* Contrôles vidéo personnalisés */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          {/* Contrôles de lecture */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlay}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Contrôles de sous-titres et paramètres */}
          <div className="flex items-center space-x-2">
            {/* Sélecteur de sous-titres */}
            {subtitles.length > 0 && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSubtitleMenu(!showSubtitleMenu)}
                  className="text-white hover:bg-white/20"
                >
                  <Subtitles className="h-4 w-4" />
                  {selectedSubtitle && (
                    <span className="ml-1 text-xs">
                      {selectedSubtitle.lang.split('-')[0].toUpperCase()}
                    </span>
                  )}
                </Button>

                {showSubtitleMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setShowSubtitleMenu(false)}
                    />
                    <Card className="absolute bottom-full mb-2 right-0 z-50 min-w-48">
                      <CardContent className="p-2">
                        <div className="space-y-1">
                          <button
                            onClick={() => handleSubtitleChange(null)}
                            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                              !selectedSubtitle ? 'bg-purple-50 text-purple-700' : 'hover:bg-gray-50'
                            }`}
                          >
                            {t('player.subtitles.off', 'Désactivé')}
                          </button>
                          
                          {subtitles.map((subtitle) => (
                            <button
                              key={subtitle.lang}
                              onClick={() => handleSubtitleChange(subtitle)}
                              className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                                selectedSubtitle?.lang === subtitle.lang 
                                  ? 'bg-purple-50 text-purple-700' 
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <span>{subtitle.flag || '🎬'}</span>
                                <span>{subtitle.label}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-xs text-gray-500 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <span>🤖</span>
                              <span>Générés par IA</span>
                            </div>
                            <div className="mt-1">+ Édition humaine</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            )}

            {/* Paramètres */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="text-white hover:bg-white/20"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Menu paramètres */}
      {showSettings && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowSettings(false)}
          />
          <Card className="absolute top-4 right-4 z-50 min-w-64">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">{t('player.settings', 'Paramètres')}</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {t('player.quality', 'Qualité')}
                  </label>
                  <select className="w-full p-2 border rounded-md text-sm">
                    <option value="auto">Auto</option>
                    <option value="1080p">1080p</option>
                    <option value="720p">720p</option>
                    <option value="480p">480p</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {t('player.playback_speed', 'Vitesse de lecture')}
                  </label>
                  <select className="w-full p-2 border rounded-md text-sm">
                    <option value="0.5">0.5x</option>
                    <option value="0.75">0.75x</option>
                    <option value="1" selected>Normal</option>
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2">2x</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default SubtitlePlayer;