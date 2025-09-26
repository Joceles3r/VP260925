import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function KYCOnboarding() {
  return (
    <div className="container-xl py-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Vérification KYC</h1>
        <p className="text-muted-foreground">
          Vérifiez votre identité pour accéder à toutes les fonctionnalités
        </p>
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Page en développement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Le processus de vérification KYC sera bientôt disponible pour assurer la conformité AMF.
            </p>
            <Badge>Bientôt disponible</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}