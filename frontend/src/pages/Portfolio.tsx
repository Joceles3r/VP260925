import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Portfolio() {
  return (
    <div className="container-xl py-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <p className="text-muted-foreground">
          Suivez la performance de vos investissements
        </p>
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Page en développement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Votre portfolio d'investissements sera affiché ici avec toutes les métriques détaillées.
            </p>
            <Badge>Bientôt disponible</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}