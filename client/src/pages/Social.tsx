import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Social() {
  return (
    <div className="container-xl py-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Réseau Social</h1>
        <p className="text-muted-foreground">
          Connectez-vous avec la communauté VISUAL
        </p>
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Page en développement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Le réseau social avec posts, likes et commentaires sera bientôt disponible.
            </p>
            <Badge>Bientôt disponible</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}