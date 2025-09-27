import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Upload, User, FileText, Shield, AlertCircle } from 'lucide-react';

const KYCOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const kycSteps = [
    {
      id: 1,
      title: 'Informations personnelles',
      description: 'Vos données de base',
      icon: User,
      status: 'completed'
    },
    {
      id: 2,
      title: 'Pièces justificatives',
      description: 'Documents d\'identité',
      icon: FileText,
      status: 'current'
    },
    {
      id: 3,
      title: 'Vérification bancaire',
      description: 'Compte de paiement',
      icon: Shield,
      status: 'pending'
    },
    {
      id: 4,
      title: 'Validation finale',
      description: 'Révision des documents',
      icon: CheckCircle,
      status: 'pending'
    }
  ];

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Votre prénom"
                  defaultValue="Demo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Votre nom"
                  defaultValue="User"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de naissance *
                </label>
                <input
                  type="date"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nationalité *
                </label>
                <select className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500">
                  <option>Française</option>
                  <option>Autre</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse complète *
              </label>
              <textarea
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                rows="3"
                placeholder="Votre adresse complète"
              />
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-orange-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Documents requis</h3>
              <p className="text-gray-600 mb-6">
                Téléchargez les documents suivants pour valider votre identité
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors cursor-pointer">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="font-medium mb-2">Carte d'identité (recto)</p>
                <p className="text-sm text-gray-500 mb-4">
                  Format accepté: JPG, PNG (max 5MB)
                </p>
                <Button variant="outline" size="sm">
                  Choisir un fichier
                </Button>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors cursor-pointer">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="font-medium mb-2">Carte d'identité (verso)</p>
                <p className="text-sm text-gray-500 mb-4">
                  Format accepté: JPG, PNG (max 5MB)
                </p>
                <Button variant="outline" size="sm">
                  Choisir un fichier
                </Button>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors cursor-pointer">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="font-medium mb-2">Justificatif de domicile</p>
                <p className="text-sm text-gray-500 mb-4">
                  Moins de 3 mois (facture, quittance...)
                </p>
                <Button variant="outline" size="sm">
                  Choisir un fichier
                </Button>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors cursor-pointer">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="font-medium mb-2">Selfie avec pièce d'identité</p>
                <p className="text-sm text-gray-500 mb-4">
                  Vous tenant votre pièce d'identité
                </p>
                <Button variant="outline" size="sm">
                  Choisir un fichier
                </Button>
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Shield className="h-16 w-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Vérification bancaire</h3>
              <p className="text-gray-600">
                Ajoutez votre compte bancaire pour les transactions
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du titulaire du compte *
                </label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Nom sur le compte bancaire"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IBAN *
                </label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="FR76 1234 5678 9012 3456 7890 123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BIC/SWIFT *
                </label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="BNPAFRPP"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banque *
                </label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Nom de votre banque"
                />
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Shield className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Sécurité garantie</h4>
                  <p className="text-sm text-blue-700">
                    Vos informations bancaires sont chiffrées et sécurisées selon les normes PCI DSS.
                    Nous ne stockons jamais vos données de paiement complètes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6 text-center">
            <CheckCircle className="h-24 w-24 text-green-400 mx-auto" />
            <h3 className="text-2xl font-semibold">Validation en cours</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Vos documents ont été soumis avec succès. Notre équipe les examine 
              actuellement. Vous recevrez une notification sous 24-48h.
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
              <h4 className="font-medium text-green-900 mb-2">Prochaines étapes</h4>
              <ul className="text-sm text-green-700 space-y-1 text-left">
                <li>✓ Documents reçus et en cours de vérification</li>
                <li>• Validation par notre équipe (24-48h)</li>
                <li>• Notification par email du résultat</li>
                <li>• Activation complète de votre compte</li>
              </ul>
            </div>
            
            <div className="text-sm text-gray-500">
              <p>Numéro de dossier: KYC-2024-{Math.random().toString().slice(2, 8)}</p>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Vérification d'identité (KYC)
        </h1>
        <p className="text-gray-600">
          Conformément à la réglementation, nous devons vérifier votre identité
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium">Progression</span>
          <span className="text-sm text-gray-500">
            Étape {currentStep} sur {totalSteps}
          </span>
        </div>
        <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
      </div>

      {/* Steps Navigation */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-4">
          {kycSteps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index + 1 < currentStep;
            const isCurrent = index + 1 === currentStep;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isCompleted ? 'bg-green-500 border-green-500 text-white' :
                  isCurrent ? 'bg-purple-500 border-purple-500 text-white' :
                  'bg-white border-gray-300 text-gray-400'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                {index < kycSteps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            {React.createElement(kycSteps[currentStep - 1].icon, { className: "h-5 w-5 mr-2" })}
            {kycSteps[currentStep - 1].title}
          </CardTitle>
          <CardDescription>
            {kycSteps[currentStep - 1].description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePreviousStep}
          disabled={currentStep === 1}
        >
          Précédent
        </Button>
        
        {currentStep === totalSteps ? (
          <Button onClick={() => window.location.href = '/'}>
            Retour à l'accueil
          </Button>
        ) : (
          <Button onClick={handleNextStep}>
            Suivant
          </Button>
        )}
      </div>

      {/* Help Section */}
      <Card className="mt-8 bg-gray-50">
        <CardContent className="p-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
            <div>
              <h4 className="font-medium mb-2">Besoin d'aide ?</h4>
              <p className="text-sm text-gray-600 mb-2">
                Si vous rencontrez des difficultés, notre équipe support est là pour vous aider.
              </p>
              <Button variant="outline" size="sm">
                Contacter le support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KYCOnboarding;