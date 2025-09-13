// VISUAL Video Deposit Modal - Frontend component for video uploads
// Integrates pricing (2€/5€/10€), quota checking, and Stripe payment

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Upload, Video, Clock, Euro, AlertTriangle, CheckCircle, Film, FileVideo } from 'lucide-react';
import type { Project, User } from '@shared/schema';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Video pricing from VISUAL constants
const VIDEO_PRICING = {
  clip: {
    price: 2,
    maxDuration: 600, // 10 minutes
    maxSizeGB: 1,
    label: 'Clips / Teasers',
    description: '≤ 10 min → 2 €',
    icon: Video,
    quota: { max: 2, period: 'mois' }
  },
  documentary: {
    price: 5,
    maxDuration: 1800, // 30 minutes  
    maxSizeGB: 2,
    label: 'Courts-métrages / Documentaires',
    description: '≤ 30 min → 5 €',
    icon: Film,
    quota: { max: 1, period: 'mois' }
  },
  film: {
    price: 10,
    maxDuration: 14400, // 4 hours
    maxSizeGB: 5,
    label: 'Films complets', 
    description: '≤ 4 h → 10 €',
    icon: FileVideo,
    quota: { max: 1, period: 'trimestre' }
  }
} as const;

interface VideoDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  user: User;
}

interface QuotaResponse {
  canDeposit: boolean;
  quotaExceeded?: boolean;
  remainingQuota: {
    clips: number;
    documentaries: number;
    films: number;
  };
  resetDate: string;
  errors: string[];
}

interface DepositResponse {
  depositId: string;
  paymentIntentId: string;
  clientSecret: string;
  depositFee: number;
  videoType: 'clip' | 'documentary' | 'film';
  bunnyUploadUrl?: string;
  quotaRemaining: {
    clips: number;
    documentaries: number;
    films: number;
  };
}

const VideoDepositForm = ({ project, user, onSuccess }: { 
  project: Project; 
  user: User; 
  onSuccess: () => void; 
}) => {
  const [selectedType, setSelectedType] = useState<'clip' | 'documentary' | 'film' | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'select' | 'upload' | 'payment' | 'processing'>('select');
  
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  // Get creator quotas
  const { data: quotaData, isLoading: isLoadingQuota } = useQuery({
    queryKey: ['/api/video/quota', user.id],
    enabled: !!user.id
  });

  const quota = quotaData as QuotaResponse | undefined;

  // Create video deposit mutation
  const createDepositMutation = useMutation({
    mutationFn: async (data: { videoType: string; file: File }) => {
      const formData = new FormData();
      formData.append('projectId', project.id);
      formData.append('videoType', data.videoType);
      formData.append('video', data.file);
      
      // Use fetch directly for FormData upload since apiRequest doesn't handle FormData
      const res = await fetch('/api/video/deposit', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Erreur lors du dépôt vidéo');
      }
      
      return await res.json();
    }
  });

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async (data: { clientSecret: string; paymentMethodId: string }) => {
      if (!stripe) throw new Error('Stripe not loaded');
      
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: data.paymentMethodId
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      return result.paymentIntent;
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedType) return;

    const specs = VIDEO_PRICING[selectedType];
    const fileSizeGB = file.size / (1024 * 1024 * 1024);

    // Validate file specs
    if (fileSizeGB > specs.maxSizeGB) {
      toast({
        title: 'Fichier trop volumineux',
        description: `Taille max: ${specs.maxSizeGB} GB pour ${specs.label}`,
        variant: 'destructive'
      });
      return;
    }

    if (!file.type.startsWith('video/')) {
      toast({
        title: 'Format non supporté',
        description: 'Veuillez sélectionner un fichier vidéo valide',
        variant: 'destructive'
      });
      return;
    }

    setUploadFile(file);
    setPaymentStep('upload');
  };

  const handleProceedToPayment = async () => {
    if (!uploadFile || !selectedType) return;

    setIsProcessing(true);
    try {
      const depositData = await createDepositMutation.mutateAsync({
        videoType: selectedType,
        file: uploadFile
      }) as DepositResponse;
      setPaymentStep('payment');
      
      // Store deposit data for payment confirmation
      localStorage.setItem('videoDeposit', JSON.stringify(depositData));
      
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors du dépôt',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    const depositData = JSON.parse(localStorage.getItem('videoDeposit') || '{}') as DepositResponse;
    if (!depositData.clientSecret) return;

    setIsProcessing(true);
    setPaymentStep('processing');

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email || undefined
        }
      });

      if (error) throw new Error(error.message);

      await processPaymentMutation.mutateAsync({
        clientSecret: depositData.clientSecret,
        paymentMethodId: paymentMethod.id
      });

      // Clear stored data
      localStorage.removeItem('videoDeposit');
      
      // Refresh quota data
      queryClient.invalidateQueries({ queryKey: ['/api/video/quota', user.id] });
      
      toast({
        title: 'Dépôt vidéo réussi !',
        description: `Votre ${VIDEO_PRICING[selectedType!].label.toLowerCase()} a été déposée avec succès`,
      });

      onSuccess();

    } catch (error) {
      toast({
        title: 'Erreur de paiement',
        description: error instanceof Error ? error.message : 'Erreur lors du paiement',
        variant: 'destructive'
      });
      setPaymentStep('payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const getQuotaStatus = (type: 'clip' | 'documentary' | 'film') => {
    if (!quota) return { available: 0, canDeposit: false };
    
    const remaining = quota.remainingQuota[type + 's' as keyof typeof quota.remainingQuota];
    return {
      available: remaining,
      canDeposit: remaining > 0 && quota.canDeposit
    };
  };

  if (isLoadingQuota) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-muted-foreground">Vérification des quotas...</p>
        </div>
      </div>
    );
  }

  // Step 1: Video type selection
  if (paymentStep === 'select') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Choisissez le type de vidéo</h3>
          <p className="text-sm text-muted-foreground">
            Sélectionnez le format correspondant à votre contenu
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(VIDEO_PRICING).map(([type, specs]) => {
            const quotaStatus = getQuotaStatus(type as any);
            const Icon = specs.icon;
            
            return (
              <Card 
                key={type}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedType === type ? 'ring-2 ring-primary' : ''
                } ${!quotaStatus.canDeposit ? 'opacity-50' : ''}`}
                onClick={() => quotaStatus.canDeposit && setSelectedType(type as any)}
                data-testid={`video-type-${type}`}
              >
                <CardHeader className="text-center pb-2">
                  <Icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <CardTitle className="text-sm">{specs.label}</CardTitle>
                  <CardDescription className="text-xs">{specs.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 text-center">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center space-x-1">
                      <Euro className="w-4 h-4" />
                      <span className="text-lg font-bold">{specs.price}</span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Max: {specs.maxSizeGB} GB</p>
                      <p>Quota: {quotaStatus.available}/{specs.quota.max} par {specs.quota.period}</p>
                    </div>
                    {!quotaStatus.canDeposit && (
                      <Badge variant="destructive" className="text-xs">
                        Quota dépassé
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {selectedType && (
          <div className="text-center">
            <Button 
              onClick={() => setPaymentStep('upload')}
              className="w-full md:w-auto"
              data-testid="button-next-upload"
            >
              <Upload className="w-4 h-4 mr-2" />
              Continuer vers l'upload
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Step 2: File upload
  if (paymentStep === 'upload') {
    const specs = selectedType ? VIDEO_PRICING[selectedType] : null;
    if (!specs) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Upload de votre {specs.label.toLowerCase()}</h3>
          <p className="text-sm text-muted-foreground">
            Sélectionnez votre fichier vidéo
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Glissez votre vidéo ici ou cliquez pour parcourir</p>
                  <p className="text-xs text-muted-foreground">
                    Formats supportés: MP4, MOV, WebM, AVI
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Taille max: {specs.maxSizeGB} GB • Durée max: {Math.floor(specs.maxDuration / 60)} min
                  </p>
                </div>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  data-testid="input-video-file"
                />
              </div>

              {uploadFile && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{uploadFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(uploadFile.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                      <Badge variant="secondary">{specs.label}</Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setPaymentStep('select')}
            data-testid="button-back-select"
          >
            Retour
          </Button>
          {uploadFile && (
            <Button 
              onClick={handleProceedToPayment}
              disabled={isProcessing}
              data-testid="button-proceed-payment"
            >
              <Euro className="w-4 h-4 mr-2" />
              Procéder au paiement ({specs.price} €)
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Step 3: Payment
  if (paymentStep === 'payment') {
    const depositData = JSON.parse(localStorage.getItem('videoDeposit') || '{}') as DepositResponse;
    const specs = selectedType ? VIDEO_PRICING[selectedType] : null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Finaliser le paiement</h3>
          <p className="text-sm text-muted-foreground">
            Sécurisez votre dépôt vidéo avec Stripe
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Type de vidéo :</span>
                <Badge variant="secondary">{specs?.label}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Fichier :</span>
                <span className="text-sm">{uploadFile?.name}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total :</span>
                <span>{depositData.depositFee} €</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: 'hsl(var(--foreground))',
                      '::placeholder': {
                        color: 'hsl(var(--muted-foreground))',
                      },
                    },
                  },
                }}
              />
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => setPaymentStep('upload')}
              disabled={isProcessing}
              data-testid="button-back-upload"
            >
              Retour
            </Button>
            <Button 
              type="submit"
              disabled={!stripe || isProcessing}
              data-testid="button-confirm-payment"
            >
              <Euro className="w-4 h-4 mr-2" />
              Confirmer le paiement
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // Step 4: Processing
  if (paymentStep === 'processing') {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="animate-spin w-12 h-12 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Traitement en cours...</h3>
          <p className="text-sm text-muted-foreground">
            Votre paiement est en cours de traitement
          </p>
        </div>
        <Progress value={75} className="w-full max-w-md mx-auto" />
      </div>
    );
  }

  return null;
};

export default function VideoDepositModal({ isOpen, onClose, project, user }: VideoDepositModalProps) {
  const handleSuccess = () => {
    onClose();
    // Optionally refresh project data or show success message
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Video className="w-5 h-5" />
            <span>Dépôt vidéo pour "{project.title}"</span>
          </DialogTitle>
        </DialogHeader>
        
        <Elements stripe={stripePromise}>
          <VideoDepositForm 
            project={project}
            user={user}
            onSuccess={handleSuccess}
          />
        </Elements>
      </DialogContent>
    </Dialog>
  );
}