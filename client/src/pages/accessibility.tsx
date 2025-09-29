import { Accessibility, CheckCircle, Info, Users, Zap } from 'lucide-react';

/**
 * Page d'accessibilité VISUAL - Mise à niveau PRO
 * Conforme aux recommandations RGAA et WCAG 2.1 AA
 */
export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-background" data-testid="accessibility-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* En-tête */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Accessibility className="w-12 h-12 text-[#00D1FF] mr-4" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00D1FF] to-[#7B2CFF] bg-clip-text text-transparent">
              Accessibilité
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            VISUAL s'engage à offrir une expérience accessible à tous les utilisateurs, conformément aux standards internationaux d'accessibilité web.
          </p>
        </div>

        {/* Engagement d'accessibilité */}
        <div className="bg-gradient-to-r from-[#00D1FF]/10 to-[#7B2CFF]/10 p-6 rounded-lg border border-[#00D1FF]/20 mb-8" data-testid="accessibility-commitment">
          <div className="flex items-start">
            <CheckCircle className="w-6 h-6 text-[#00D1FF] mt-1 mr-4 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-semibold text-[#00D1FF] mb-3">Notre engagement</h2>
              <p className="text-muted-foreground leading-relaxed">
                VISUAL est conçu pour être utilisable par tous, y compris les personnes en situation de handicap. 
                Nous nous efforçons de respecter les directives WCAG 2.1 de niveau AA et le référentiel général 
                d'amélioration de l'accessibilité (RGAA) français.
              </p>
            </div>
          </div>
        </div>

        {/* Fonctionnalités d'accessibilité */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          
          <div className="bg-card p-6 rounded-lg border border-border" data-testid="accessibility-features">
            <div className="flex items-center mb-4">
              <Zap className="w-5 h-5 text-[#7B2CFF] mr-2" />
              <h3 className="text-lg font-semibold">Fonctionnalités intégrées</h3>
            </div>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start">
                <span className="text-[#00D1FF] mr-2">•</span>
                <span>Navigation au clavier complète sur toutes les fonctionnalités</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#00D1FF] mr-2">•</span>
                <span>Contrastes de couleur conformes (ratio 4.5:1 minimum)</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#00D1FF] mr-2">•</span>
                <span>Textes alternatifs sur toutes les images significatives</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#00D1FF] mr-2">•</span>
                <span>Étiquetage sémantique des formulaires et boutons</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#00D1FF] mr-2">•</span>
                <span>Structure de titres hiérarchisée (H1, H2, H3...)</span>
              </li>
            </ul>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border" data-testid="accessibility-tech">
            <div className="flex items-center mb-4">
              <Users className="w-5 h-5 text-[#FF3CAC] mr-2" />
              <h3 className="text-lg font-semibold">Technologies assistives</h3>
            </div>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start">
                <span className="text-[#FF3CAC] mr-2">•</span>
                <span>Compatible avec les lecteurs d'écran (NVDA, JAWS, VoiceOver)</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#FF3CAC] mr-2">•</span>
                <span>Support des loupes d'écran et zoom jusqu'à 200%</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#FF3CAC] mr-2">•</span>
                <span>Navigation vocale et commandes personnalisées</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#FF3CAC] mr-2">•</span>
                <span>Mode de contraste élevé disponible</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#FF3CAC] mr-2">•</span>
                <span>Réduction des animations pour le confort visuel</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Standards et conformité */}
        <div className="bg-card p-6 rounded-lg border border-border mb-8" data-testid="accessibility-standards">
          <div className="flex items-center mb-4">
            <Info className="w-5 h-5 text-[#00D1FF] mr-2" />
            <h3 className="text-lg font-semibold">Standards respectés</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-muted p-3 rounded">
              <div className="font-medium text-[#00D1FF] mb-1">WCAG 2.1 AA</div>
              <div className="text-muted-foreground">Web Content Accessibility Guidelines</div>
            </div>
            <div className="bg-muted p-3 rounded">
              <div className="font-medium text-[#7B2CFF] mb-1">RGAA v4.1</div>
              <div className="text-muted-foreground">Référentiel Général d'Amélioration de l'Accessibilité</div>
            </div>
            <div className="bg-muted p-3 rounded">
              <div className="font-medium text-[#FF3CAC] mb-1">EN 301 549</div>
              <div className="text-muted-foreground">Standard européen d'accessibilité numérique</div>
            </div>
          </div>
        </div>

        {/* Contact et feedback */}
        <div className="bg-card p-6 rounded-lg border border-border" data-testid="accessibility-contact">
          <h3 className="text-lg font-semibold mb-4">Nous signaler un problème d'accessibilité</h3>
          <p className="text-muted-foreground mb-4">
            Si vous rencontrez des difficultés d'accessibilité sur VISUAL, nous vous encourageons à nous le faire savoir. 
            Votre retour nous aide à améliorer l'expérience pour tous.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <span className="font-medium text-[#00D1FF] mr-2">Email :</span>
              <span className="text-muted-foreground">accessibilite@visual.fr</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium text-[#00D1FF] mr-2">Support :</span>
              <span className="text-muted-foreground">support@visual.fr</span>
            </div>
            <div className="flex items-start">
              <span className="font-medium text-[#00D1FF] mr-2">Délai de réponse :</span>
              <span className="text-muted-foreground">Nous nous engageons à répondre sous 48h ouvrables</span>
            </div>
          </div>
        </div>

        {/* Dernière mise à jour */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Dernière mise à jour de cette déclaration : 29 septembre 2025</p>
          <p className="mt-2">
            <button 
              onClick={() => window.history.back()} 
              className="text-[#00D1FF] hover:underline"
              data-testid="back-button"
            >
              ← Retour à la page précédente
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}