import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Calendar, 
  Shield, 
  Mail, 
  CheckCircle, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { useCreateMinorProfile } from '@/hooks/useMinorVisitor';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Schéma de validation
const minorProfileSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)"),
  parentEmail: z.string().email("Email invalide").optional(),
  parentalConsent: z.boolean().default(false),
}).refine(data => {
  // Vérifier que l'âge est entre 16 et 17 ans
  const birthDate = new Date(data.birthDate);
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age >= 16 && age <= 17;
}, {
  message: "Tu dois avoir entre 16 et 17 ans pour créer un profil visiteur mineur",
  path: ["birthDate"]
});

type MinorProfileForm = z.infer<typeof minorProfileSchema>;

interface MinorProfileSetupProps {
  onComplete?: () => void;
}

const MinorProfileSetup: React.FC<MinorProfileSetupProps> = ({ onComplete }) => {
  const createProfile = useCreateMinorProfile();
  const [showParentalConsent, setShowParentalConsent] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<MinorProfileForm>({
    resolver: zodResolver(minorProfileSchema)
  });

  const birthDate = watch('birthDate');
  const parentalConsent = watch('parentalConsent');
  
  // Calculer l'âge en temps réel
  const calculateAge = (birthDateStr: string) => {
    if (!birthDateStr) return null;
    try {
      const birth = new Date(birthDateStr);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const monthDiff = now.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      
      return age;
    } catch {
      return null;
    }
  };

  const age = calculateAge(birthDate);
  const isAgeValid = age !== null && age >= 16 && age <= 17;

  const onSubmit = async (data: MinorProfileForm) => {
    try {
      await createProfile.mutateAsync({
        birthDate: data.birthDate,
        parentEmail: data.parentEmail || undefined,
        parentalConsent: data.parentalConsent,
      });
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Erreur lors de la création du profil:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            <User className="h-6 w-6 text-blue-600" />
            Création de ton profil visiteur mineur
          </CardTitle>
          <CardDescription className="text-base">
            Espace sécurisé pour les utilisateurs de 16-17 ans sur VISUAL
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Date de naissance */}
            <div className="space-y-2">
              <Label htmlFor="birthDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date de naissance
              </Label>
              <Input
                id="birthDate"
                type="date"
                {...register('birthDate')}
                className={errors.birthDate ? 'border-red-500' : ''}
              />
              {errors.birthDate && (
                <p className="text-sm text-red-600">{errors.birthDate.message}</p>
              )}
              {age !== null && (
                <p className={`text-sm ${isAgeValid ? 'text-green-600' : 'text-red-600'}`}>
                  {isAgeValid ? '✅' : '❌'} Âge calculé : {age} ans
                </p>
              )}
            </div>

            {/* Validation de l'âge */}
            {isAgeValid && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-green-700">
                  <strong>Parfait !</strong> Tu es éligible pour le profil visiteur mineur. 
                  Tu pourras gagner jusqu'à 200€ en VISUpoints avant tes 18 ans.
                </AlertDescription>
              </Alert>
            )}

            {age !== null && !isAgeValid && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-700">
                  {age < 16 ? (
                    <>
                      <strong>Trop jeune :</strong> Tu dois avoir au moins 16 ans pour utiliser VISUAL.
                    </>
                  ) : (
                    <>
                      <strong>Majeur :</strong> À 18 ans et plus, tu peux créer directement un compte Investisseur ou Investi-lecteur.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Email parental (optionnel) */}
            <div className="space-y-2">
              <Label htmlFor="parentEmail" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email du parent/tuteur 
                <span className="text-xs text-muted-foreground">(optionnel)</span>
              </Label>
              <Input
                id="parentEmail"
                type="email"
                {...register('parentEmail')}
                placeholder="parent@exemple.com"
                className={errors.parentEmail ? 'border-red-500' : ''}
              />
              {errors.parentEmail && (
                <p className="text-sm text-red-600">{errors.parentEmail.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                L'email parental permettra de recevoir des informations importantes sur ton compte.
              </p>
            </div>

            {/* Consentement parental */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showParentalConsent"
                  checked={showParentalConsent}
                  onCheckedChange={setShowParentalConsent}
                />
                <Label htmlFor="showParentalConsent" className="text-sm">
                  J'ai l'autorisation de mon parent/tuteur (recommandé)
                </Label>
              </div>

              {showParentalConsent && (
                <div className="pl-6 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="parentalConsent"
                      checked={parentalConsent}
                      onCheckedChange={(checked) => setValue('parentalConsent', !!checked)}
                    />
                    <Label htmlFor="parentalConsent" className="text-sm">
                      Je confirme avoir l'autorisation de mon parent/tuteur pour utiliser VISUAL
                    </Label>
                  </div>
                  
                  <Alert className="border-blue-200 bg-blue-50">
                    <Shield className="h-4 w-4" />
                    <AlertDescription className="text-blue-700 text-sm">
                      Avec l'autorisation parentale, tu auras accès à toutes les fonctionnalités 
                      du profil visiteur mineur, y compris les activités éducatives récompensées.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>

            {/* Informations importantes */}
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  Ton profil visiteur mineur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>Gains VP jusqu'à 200€</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>Activités éducatives</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>Spectateur Live Shows</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>Consultation des contenus</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    <span>Pas d'investissements financiers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span>Transition automatique à 18 ans</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bouton de création */}
            <Button
              type="submit"
              className="w-full"
              disabled={!isAgeValid || isSubmitting || createProfile.isPending}
            >
              {isSubmitting || createProfile.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Création en cours...
                </>
              ) : (
                <>
                  <User className="h-4 w-4 mr-2" />
                  Créer mon profil visiteur mineur
                </>
              )}
            </Button>

            {/* Note légale */}
            <p className="text-xs text-muted-foreground text-center">
              En créant ton profil, tu acceptes les conditions d'utilisation de VISUAL 
              et confirmes avoir l'âge requis (16-17 ans).
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MinorProfileSetup;