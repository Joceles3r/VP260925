import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CreditCard, Shield } from "lucide-react";
import { Link } from "wouter";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface CheckoutFormProps {
  amount: number;
  onSuccess: () => void;
}

const CheckoutForm = ({ amount, onSuccess }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/kyc?payment=success',
      },
    });

    if (error) {
      toast({
        title: "Échec du paiement",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    } else {
      toast({
        title: "Paiement réussi",
        description: "Votre caution a été déposée avec succès !",
      });
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
        data-testid="confirm-payment-button"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            Traitement en cours...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Payer €{amount}
          </>
        )}
      </Button>
    </form>
  );
};

interface CheckoutProps {
  amount: number;
  type?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function Checkout({ amount, type = 'caution', onSuccess, onCancel }: CheckoutProps) {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, type })
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to create payment intent');
        }
        return res.json();
      })
      .then((data) => {
        setClientSecret(data.clientSecret);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error creating payment intent:', error);
        toast({
          title: "Erreur",
          description: "Impossible de créer l'intention de paiement",
          variant: "destructive",
        });
        setLoading(false);
      });
  }, [amount, type]);

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p>Initialisation du paiement...</p>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-red-500 text-4xl">⚠️</div>
              <h3 className="text-lg font-semibold">Erreur de paiement</h3>
              <p className="text-sm text-muted-foreground">
                Impossible d'initialiser le processus de paiement
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onCancel} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
                <Button onClick={() => window.location.reload()} className="flex-1">
                  Réessayer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mx-auto">
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold">Paiement sécurisé</h1>
          <p className="text-sm text-muted-foreground">
            Dépôt de caution de €{amount} pour commencer à investir
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Détails du paiement</CardTitle>
            <CardDescription>
              Votre paiement est sécurisé par Stripe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Elements 
              stripe={stripePromise} 
              options={{ 
                clientSecret,
                appearance: {
                  theme: 'stripe'
                }
              }}
            >
              <CheckoutForm amount={amount} onSuccess={handleSuccess} />
            </Elements>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={onCancel}
            data-testid="cancel-payment-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Annuler et retourner
          </Button>
        </div>

        <div className="text-xs text-center text-muted-foreground space-y-1">
          <p>🔒 Paiement sécurisé SSL</p>
          <p>Vos données bancaires ne sont pas stockées sur nos serveurs</p>
        </div>
      </div>
    </div>
  );
}