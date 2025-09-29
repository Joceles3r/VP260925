import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function KYCOnboarding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">Vérification d'identité</CardTitle>
              <p className="text-gray-400">
                Pour votre sécurité et la conformité réglementaire, nous devons vérifier votre identité
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-900/20 border border-blue-500/30">
                  <CheckCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-300">Informations personnelles</p>
                    <p className="text-sm text-gray-400">Nom, prénom, date de naissance</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-900/20 border border-yellow-500/30">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-300">Document d'identité</p>
                    <p className="text-sm text-gray-400">Carte d'identité ou passeport valide</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 rounded-lg bg-purple-900/20 border border-purple-500/30">
                  <CheckCircle className="h-5 w-5 text-purple-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-purple-300">Justificatif de domicile</p>
                    <p className="text-sm text-gray-400">Facture récente (moins de 3 mois)</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Button 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 w-full"
                  onClick={() => window.location.href = '/'}
                >
                  Commencer la vérification
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Processus sécurisé • Données chiffrées • Conforme RGPD
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}