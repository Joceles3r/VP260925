import React from 'react';
import { InternalMessageForm } from '@/components/InternalMessageForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle, Shield, Clock, AlertCircle } from 'lucide-react';
import { useLocation } from 'wouter';

const ContactSupportPage: React.FC = () => {
  const [, setLocation] = useLocation();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au tableau de bord
          </Button>
        </div>

        {/* Titre principal */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <MessageCircle className="h-6 w-6" />
              Centre de Support VISUAL
            </CardTitle>
            <CardDescription className="text-lg">
              Contactez notre équipe pour toute question ou problème
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Informations importantes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="font-semibold text-red-600">Urgences Financières</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Problèmes de paiement, fraudes, erreurs de prélèvement : 
                <strong className="text-red-600"> traités immédiatement</strong>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <h3 className="font-semibold text-orange-600">Bugs Techniques</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Dysfonctionnements de l'application : 
                <strong className="text-orange-600"> traités sous 24-48h</strong>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-green-600">Questions Générales</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Aide et questions diverses : 
                <strong className="text-green-600"> traités sous 2-5 jours</strong>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Règles d'utilisation */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-800 mb-2">Règles d'utilisation</h3>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Maximum <strong>3 messages par jour</strong> par utilisateur</li>
                  <li>• Les messages urgents (financiers) déclenchent une notification immédiate</li>
                  <li>• Soyez précis et détaillé dans votre description</li>
                  <li>• Respectez les autres utilisateurs et notre équipe</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulaire principal */}
        <InternalMessageForm
          onSuccess={() => {
            // Redirection vers le tableau de bord après envoi
            setTimeout(() => setLocation('/dashboard'), 2000);
          }}
          onCancel={() => setLocation('/dashboard')}
        />

        {/* FAQ rapide */}
        <Card>
          <CardHeader>
            <CardTitle>Questions fréquentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-1">💰 Problème de paiement non traité ?</h4>
              <p className="text-sm text-muted-foreground">
                Sélectionnez "Problème de paiement/virement" pour une prise en charge immédiate.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">🐛 Bug ou dysfonctionnement ?</h4>
              <p className="text-sm text-muted-foreground">
                Décrivez précisément les étapes qui causent le problème et votre navigateur.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">❓ Question sur un projet ?</h4>
              <p className="text-sm text-muted-foreground">
                Mentionnez l'ID du projet et votre question spécifique.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">⏰ Délai de réponse dépassé ?</h4>
              <p className="text-sm text-muted-foreground">
                Envoyez un nouveau message en mentionnant votre message précédent.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContactSupportPage;