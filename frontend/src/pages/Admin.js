import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
export default function Admin() {
    return (<div className="container-xl py-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Administration</h1>
        <p className="text-muted-foreground">
          Panneau d'administration de la plateforme VISUAL
        </p>
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Page en développement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Le panneau d'administration complet avec gestion des utilisateurs, projets et modération sera bientôt disponible.
            </p>
            <Badge>Bientôt disponible</Badge>
          </CardContent>
        </Card>
      </div>
    </div>);
}
