import React from 'react';
import { Play, TrendingUp, Shield, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background" data-testid="landing-page">
      {/* Navigation for logged out users */}
      <nav className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Play className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="ml-3 text-xl font-bold text-foreground">VISUAL</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild data-testid="login-button">
                <a href="/api/login">Se connecter</a>
              </Button>
              <Button asChild data-testid="signup-button">
                <a href="/api/login">S'inscrire</a>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground mb-6" data-testid="hero-title">
            Soutenez des projets visuels,<br />
            <span className="text-primary">votez avec vos euros</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8" data-testid="hero-subtitle">
            Investissez par tranches de 1 à 20 € et influencez le classement grâce aux VISUpoints. 
            Découvrez une nouvelle façon de soutenir la création audiovisuelle.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Button size="lg" className="text-lg px-8 py-4" asChild data-testid="cta-primary">
              <a href="/api/login">
                Commencer maintenant
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4" data-testid="cta-secondary">
              Découvrir les projets
            </Button>
          </div>

          <p className="text-sm text-muted-foreground" data-testid="hero-disclaimer">
            Aucun jeu de hasard : répartition selon performance, soumise à conditions.
          </p>
        </div>
      </section>

      {/* Key Numbers */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8" data-testid="key-numbers">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">1–20 €</div>
              <div className="text-muted-foreground">Tranches d'investissement</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-2">100 VP = 1 €</div>
              <div className="text-muted-foreground">Conversion VISUpoints</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-2">KYC & Cautions</div>
              <div className="text-muted-foreground">≥18 ans, caution 20 € investisseur</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12" data-testid="how-it-works-title">
            Comment ça marche ?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card rounded-lg p-6 border border-border text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">1. Choisissez un projet</h3>
              <p className="text-muted-foreground">
                Parcourez les catégories, consultez les extraits vidéo et l'historique des créateurs.
              </p>
            </div>

            <div className="bg-card rounded-lg p-6 border border-border text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">2. Investissez par tranches</h3>
              <p className="text-muted-foreground">
                1, 2, 5, 10, 11–15, 20 € → 1 à 10 votes VISUpoints. Plafonds : ≤ 100 €/projet/jour.
              </p>
            </div>

            <div className="bg-card rounded-lg p-6 border border-border text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">3. Suivez la performance</h3>
              <p className="text-muted-foreground">
                Vos votes influencent les classements. La répartition est basée sur la performance, pas le hasard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Pourquoi choisir VISUAL ?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Sécurisé & Régulé</h3>
              <p className="text-sm text-muted-foreground">
                Conformité AMF, KYC obligatoire, transactions sécurisées
              </p>
            </div>

            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Performance Transparente</h3>
              <p className="text-sm text-muted-foreground">
                ROI basé sur la performance réelle, pas le hasard
              </p>
            </div>

            <div className="text-center">
              <Play className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Live Shows</h3>
              <p className="text-sm text-muted-foreground">
                Battles en temps réel avec investissements instantanés
              </p>
            </div>

            <div className="text-center">
              <Users className="h-12 w-12 text-chart-4 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Communauté Active</h3>
              <p className="text-sm text-muted-foreground">
                Rejoignez des milliers d'investisseurs passionnés
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4" data-testid="final-cta-title">
            Prêt à vous lancer ?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Rejoignez la communauté VISUAL et commencez à soutenir la création audiovisuelle dès aujourd'hui.
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8 py-4" asChild data-testid="final-cta-button">
            <a href="/api/login">
              S'inscrire maintenant
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Play className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="ml-2 text-lg font-bold text-foreground">VISUAL</span>
              </div>
              <p className="text-sm text-muted-foreground">
                La première plateforme participative dédiée à l'investissement audiovisuel.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Plateforme</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Comment ça marche</a></li>
                <li><a href="#" className="hover:text-foreground">Découvrir les projets</a></li>
                <li><a href="#" className="hover:text-foreground">Live Shows</a></li>
                <li><a href="#" className="hover:text-foreground">Tarifs</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Centre d'aide</a></li>
                <li><a href="#" className="hover:text-foreground">Contact</a></li>
                <li><a href="#" className="hover:text-foreground">Statut</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Légal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Mentions légales</a></li>
                <li><a href="#" className="hover:text-foreground">Confidentialité</a></li>
                <li><a href="#" className="hover:text-foreground">CGU</a></li>
                <li><a href="#" className="hover:text-foreground">Compliance AMF</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} VISUAL — Tous droits réservés.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <button 
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => window.dispatchEvent(new CustomEvent('open-cmp'))}
              >
                Préférences cookies
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
