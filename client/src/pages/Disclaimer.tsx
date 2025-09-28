import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, Info, DollarSign, FileText, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Disclaimer & Informations essentielles
            </h1>
            <p className="text-xl text-gray-300">
              Informations importantes sur les risques et règles de VISUAL
            </p>
          </div>

          {/* Warning Section */}
          <Card className="bg-red-900/20 border-red-500/30 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-red-300">
                <AlertTriangle className="h-6 w-6" />
                Avertissement général
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-4">
              <p>
                VISUAL est une plateforme qui combine <strong>streaming de contenus</strong> et{' '}
                <strong>micro-investissement</strong> dans des projets créatifs. Les montants engagés 
                comportent un <strong>risque de perte</strong>. VISUAL <strong>ne garantit aucun gain</strong>. 
                Les utilisateurs doivent n'investir que des sommes qu'ils peuvent se permettre de perdre.
              </p>
            </CardContent>
          </Card>

          {/* Financial Rules */}
          <Card className="bg-slate-800/50 border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <DollarSign className="h-6 w-6 text-green-400" />
                Règles financières (résumé)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-white mb-2">Ventes d'articles et de livres</h4>
                  <p className="text-sm">
                    Répartition <strong>70% créateur / 30% VISUAL</strong> (comptabilité au centime)
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Évènements de catégorie (vidéo)</h4>
                  <p className="text-sm">
                    <strong>40%</strong> investisseurs TOP 10, <strong>30%</strong> porteurs TOP 10,{' '}
                    <strong>7%</strong> investisseurs rangs 11–100, <strong>23%</strong> VISUAL
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Catégorie Livres (mensuelle)</h4>
                  <p className="text-sm">
                    Le pot agrège les montants des lecteurs rangs 11–100 ; partage{' '}
                    <strong>60%</strong> auteurs gagnants / <strong>40%</strong> lecteurs gagnants
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Arrondis</h4>
                  <p className="text-sm">
                    Tous les paiements utilisateurs sont <strong>arrondis à l'euro inférieur</strong> ; 
                    les écarts (centimes/restes) alimentent VISUAL
                  </p>
                </div>
              </div>
              
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-blue-300 mb-2">VISUpoints</h4>
                <p className="text-sm text-gray-300">
                  Jetons de fidélité internes (conversion indicative <strong>100 pts = 1€</strong>) 
                  échangeables à partir de <strong>2 500 pts</strong>, sous réserve KYC/Stripe et arrondi à l'euro.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payments & Compliance */}
          <Card className="bg-slate-800/50 border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <Shield className="h-6 w-6 text-blue-400" />
                Paiements & conformité
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-4">
              <ul className="space-y-2">
                <li>• Paiements opérés via <strong>Stripe</strong> (Connect, webhooks signés, idempotence)</li>
                <li>• KYC/2FA requis pour retraits et opérations sensibles</li>
                <li>• Les contenus et transactions doivent respecter la <strong>loi applicable</strong>, les <strong>CGU</strong> de VISUAL et les droits d'auteur</li>
              </ul>
            </CardContent>
          </Card>

          {/* No Advice */}
          <Card className="bg-slate-800/50 border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <Info className="h-6 w-6 text-yellow-400" />
                Absence de conseil
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p>
                Les informations présentées sur VISUAL <strong>ne constituent pas</strong> un conseil 
                financier, juridique ou fiscal. Chaque utilisateur reste <strong>seul responsable</strong> de ses décisions.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="bg-slate-800/50 border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <Phone className="h-6 w-6 text-green-400" />
                Contact & signalements
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p>
                Toute question ou réclamation : support VISUAL. Les abus/fraudes peuvent être{' '}
                <strong>signalés</strong> en un clic depuis l'interface.
              </p>
            </CardContent>
          </Card>

          {/* Back Button */}
          <div className="text-center">
            <Button 
              onClick={() => window.history.back()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Retour à VISUAL
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}