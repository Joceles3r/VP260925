import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Send, Clock, Shield } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Schéma de validation
const messageSchema = z.object({
  subject: z.string().min(1, "Veuillez sélectionner un sujet"),
  subjectCustom: z.string().optional(),
  message: z.string()
    .min(10, "Le message doit contenir au moins 10 caractères")
    .max(2000, "Le message ne peut pas dépasser 2000 caractères"),
});

type MessageForm = z.infer<typeof messageSchema>;

// Sujets avec leurs priorités et descriptions
const MESSAGE_SUBJECTS = [
  {
    value: 'probleme_paiement',
    label: '🔴 Problème de paiement/virement',
    priority: 'urgent',
    description: 'Erreurs de paiement, virements non reçus, prélèvements incorrects'
  },
  {
    value: 'escroquerie_fraude', 
    label: '🔴 Signalement d\'escroquerie/fraude',
    priority: 'urgent',
    description: 'Tentatives de fraude, usurpation d\'identité, comptes compromis'
  },
  {
    value: 'erreur_prelevement',
    label: '🔴 Erreur de prélèvement/remboursement', 
    priority: 'urgent',
    description: 'Problèmes de remboursements, erreurs de facturation'
  },
  {
    value: 'probleme_compte',
    label: '🔴 Problème d\'accès compte',
    priority: 'urgent', 
    description: 'Impossible de se connecter, compte bloqué'
  },
  {
    value: 'signalement_bug',
    label: '🟡 Signalement de bug',
    priority: 'medium',
    description: 'Dysfonctionnements techniques, erreurs de l\'application'
  },
  {
    value: 'question_projet',
    label: '🟢 Question sur un projet',
    priority: 'low',
    description: 'Questions relatives aux projets d\'investissement'
  },
  {
    value: 'question_investissement',
    label: '🟢 Question sur un investissement',
    priority: 'low', 
    description: 'Questions sur vos investissements en cours'
  },
  {
    value: 'demande_aide',
    label: '🟢 Demande d\'aide générale',
    priority: 'low',
    description: 'Aide sur l\'utilisation de la plateforme'
  },
  {
    value: 'autre_demande',
    label: '🟢 Autre demande',
    priority: 'low',
    description: 'Toute autre demande non listée ci-dessus'
  }
];

interface InternalMessageFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const InternalMessageForm: React.FC<InternalMessageFormProps> = ({
  onSuccess,
  onCancel
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset
  } = useForm<MessageForm>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      subject: '',
      subjectCustom: '',
      message: ''
    }
  });

  const messageValue = watch('message');
  const subjectValue = watch('subject');

  // Récupérer la limite de messages
  const { data: rateLimit } = useQuery({
    queryKey: ['internal-messages', 'rate-limit'],
    queryFn: async () => {
      const response = await fetch('/api/internal-messages/rate-limit', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erreur lors de la vérification des limites');
      return response.json();
    }
  });

  // Mutation pour envoyer le message
  const sendMessage = useMutation({
    mutationFn: async (data: MessageForm) => {
      const response = await fetch('/api/internal-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'envoi du message');
      }

      return response.json();
    },
    onSuccess: (data) => {
      reset();
      setSelectedSubject('');
      queryClient.invalidateQueries({ queryKey: ['internal-messages', 'rate-limit'] });
      onSuccess?.();
    }
  });

  const onSubmit = (data: MessageForm) => {
    sendMessage.mutate(data);
  };

  const selectedSubjectInfo = MESSAGE_SUBJECTS.find(s => s.value === selectedSubject);

  // Vérifier si l'utilisateur a atteint sa limite
  if (rateLimit && !rateLimit.allowed) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <Clock className="h-5 w-5" />
            Limite de messages atteinte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Vous avez envoyé le maximum de 3 messages aujourd'hui. 
              La limite sera réinitialisée demain à 00h00.
            </AlertDescription>
          </Alert>
          {onCancel && (
            <Button onClick={onCancel} variant="outline" className="mt-4">
              Fermer
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Contacter le Responsable VISUAL
        </CardTitle>
        <CardDescription>
          Décrivez votre problème ou votre question. Nous vous répondrons dans les plus brefs délais.
        </CardDescription>
        
        {/* Indicateur de limites */}
        {rateLimit && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded">
            <Shield className="h-4 w-4" />
            <span>
              Messages restants aujourd'hui : {rateLimit.remainingToday}/3
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Sélection du sujet */}
          <div className="space-y-2">
            <Label htmlFor="subject">Sujet *</Label>
            <Select
              value={selectedSubject}
              onValueChange={(value) => {
                setSelectedSubject(value);
                setValue('subject', value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez le type de votre demande" />
              </SelectTrigger>
              <SelectContent>
                {MESSAGE_SUBJECTS.map((subject) => (
                  <SelectItem key={subject.value} value={subject.value}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{subject.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {subject.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.subject && (
              <p className="text-sm text-red-600">{errors.subject.message}</p>
            )}
          </div>

          {/* Sujet personnalisé pour "Autre demande" */}
          {selectedSubject === 'autre_demande' && (
            <div className="space-y-2">
              <Label htmlFor="subjectCustom">Précisez votre demande</Label>
              <Input
                {...register('subjectCustom')}
                placeholder="Décrivez brièvement votre demande"
                maxLength={100}
              />
            </div>
          )}

          {/* Indicateur de priorité */}
          {selectedSubjectInfo && (
            <Alert className={`
              ${selectedSubjectInfo.priority === 'urgent' ? 'border-red-200 bg-red-50' : ''}
              ${selectedSubjectInfo.priority === 'medium' ? 'border-orange-200 bg-orange-50' : ''}
              ${selectedSubjectInfo.priority === 'low' ? 'border-green-200 bg-green-50' : ''}
            `}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {selectedSubjectInfo.priority === 'urgent' && (
                  <span className="text-red-700 font-medium">
                    🔴 Priorité URGENTE - Notre équipe sera notifiée immédiatement
                  </span>
                )}
                {selectedSubjectInfo.priority === 'medium' && (
                  <span className="text-orange-700 font-medium">
                    🟡 Priorité MOYENNE - Traitement sous 24-48h
                  </span>
                )}
                {selectedSubjectInfo.priority === 'low' && (
                  <span className="text-green-700 font-medium">
                    🟢 Priorité NORMALE - Traitement sous 2-5 jours ouvrés
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Votre message *</Label>
            <Textarea
              {...register('message')}
              placeholder="Décrivez votre problème ou votre question en détail..."
              rows={6}
              maxLength={2000}
              className="resize-none"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              {errors.message && (
                <p className="text-red-600">{errors.message.message}</p>
              )}
              <div className="ml-auto">
                {messageValue?.length || 0}/2000 caractères
              </div>
            </div>
          </div>

          {/* Erreurs de soumission */}
          {sendMessage.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {sendMessage.error.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Message de succès */}
          {sendMessage.isSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                ✅ Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.
              </AlertDescription>
            </Alert>
          )}

          {/* Boutons d'action */}
          <div className="flex justify-end gap-3">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={isSubmitting || !subjectValue || !messageValue}
              className="min-w-32"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};