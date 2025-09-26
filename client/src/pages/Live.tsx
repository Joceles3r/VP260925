import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Live() {
  return (
    <div className="container-xl py-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Shows Live</h1>
        <p className="text-muted-foreground">
          Participez aux battles d'artistes en temps réel
        </p>
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Page en développement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Les émissions live et battles d'artistes seront bientôt disponibles.
            </p>
            <Badge>Bientôt disponible</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}