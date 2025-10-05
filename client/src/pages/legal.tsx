import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, FileText, Cookie, TriangleAlert as AlertTriangle, Scale, BookOpen, FileCheck } from 'lucide-react';

interface LegalTerm {
  id: string;
  contentType: string;
  version: string;
  title: string;
  content: string;
  summary?: string;
  language: string;
  isCurrent: boolean;
  effectiveDate: string;
  metadata?: {
    compliance?: string[];
    regulations?: string[];
  };
}

const contentTypeConfig = {
  terms_of_service: {
    icon: FileText,
    label: 'Conditions Générales d\'Utilisation',
    color: 'text-blue-500',
    description: 'Règles d\'utilisation de la plateforme VISUAL'
  },
  privacy_policy: {
    icon: Shield,
    label: 'Politique de Confidentialité',
    color: 'text-green-500',
    description: 'Protection de vos données personnelles (RGPD)'
  },
  cookie_policy: {
    icon: Cookie,
    label: 'Politique des Cookies',
    color: 'text-orange-500',
    description: 'Utilisation des cookies sur la plateforme'
  },
  legal_notice: {
    icon: FileCheck,
    label: 'Mentions Légales',
    color: 'text-purple-500',
    description: 'Informations légales et éditeur'
  },
  investment_rules: {
    icon: Scale,
    label: 'Règlement des Investissements',
    color: 'text-red-500',
    description: 'Règles et avertissements AMF'
  },
  platform_rules: {
    icon: BookOpen,
    label: 'Règlement de la Plateforme',
    color: 'text-indigo-500',
    description: 'Règles de conduite et modération'
  }
};

export default function LegalPage() {
  const { data: termsData, isLoading } = useQuery({
    queryKey: ['legal-terms'],
    queryFn: async () => {
      const res = await fetch('/api/legal/terms');
      if (!res.ok) throw new Error('Failed to fetch legal terms');
      return res.json();
    }
  });

  const { data: riskWarningData } = useQuery({
    queryKey: ['risk-warning'],
    queryFn: async () => {
      const res = await fetch('/api/legal/risk-warning');
      if (!res.ok) throw new Error('Failed to fetch risk warning');
      return res.json();
    }
  });

  const terms: LegalTerm[] = termsData?.terms || [];
  const riskWarning = riskWarningData?.warning || '';

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const mainTerms = terms.filter(t =>
    ['terms_of_service', 'privacy_policy', 'cookie_policy'].includes(t.contentType)
  );

  const additionalTerms = terms.filter(t =>
    !['terms_of_service', 'privacy_policy', 'cookie_policy'].includes(t.contentType)
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Règlements et Conformité Légale</h1>
        <p className="text-muted-foreground text-lg">
          Tous les documents légaux de la plateforme VISUAL conformes aux lois européennes et françaises
        </p>
      </div>

      {riskWarning && (
        <Alert className="mb-6 border-red-500 bg-red-50">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-800 font-bold">Avertissement sur les Risques (Obligatoire AMF)</AlertTitle>
          <AlertDescription className="text-red-700 whitespace-pre-wrap text-sm mt-2">
            {riskWarning}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <Shield className="h-8 w-8 text-blue-600 mb-2" />
            <CardTitle className="text-lg">RGPD Compliant</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Conforme au Règlement Général sur la Protection des Données (UE 2016/679)
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <FileCheck className="h-8 w-8 text-green-600 mb-2" />
            <CardTitle className="text-lg">LCEN & MiFID II</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Conforme à la Loi pour la Confiance dans l'Économie Numérique et MiFID II
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <Scale className="h-8 w-8 text-purple-600 mb-2" />
            <CardTitle className="text-lg">AMF & LCB-FT</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Conforme aux règles AMF et à la Directive Anti-Blanchiment
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={mainTerms[0]?.contentType || 'terms_of_service'} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          {terms.map(term => {
            const config = contentTypeConfig[term.contentType as keyof typeof contentTypeConfig];
            const Icon = config?.icon || FileText;
            return (
              <TabsTrigger key={term.id} value={term.contentType} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{config?.label.split(' ')[0]}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {terms.map(term => {
          const config = contentTypeConfig[term.contentType as keyof typeof contentTypeConfig];
          const Icon = config?.icon || FileText;

          return (
            <TabsContent key={term.id} value={term.contentType} className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Icon className={`h-8 w-8 ${config?.color || 'text-gray-500'}`} />
                        <div>
                          <CardTitle className="text-2xl">{term.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {config?.description}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="secondary">Version {term.version}</Badge>
                      <Badge variant="outline">
                        En vigueur depuis {new Date(term.effectiveDate).toLocaleDateString('fr-FR')}
                      </Badge>
                    </div>
                  </div>

                  {term.summary && (
                    <Alert className="mt-4">
                      <AlertDescription>{term.summary}</AlertDescription>
                    </Alert>
                  )}

                  {term.metadata?.compliance && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="text-sm font-medium">Conformité:</span>
                      {term.metadata.compliance.map((comp: string) => (
                        <Badge key={comp} variant="outline" className="text-xs">
                          {comp}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardHeader>

                <Separator />

                <CardContent className="pt-6">
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                      {term.content}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg">Informations de Version</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Version actuelle:</span>
                    <span className="font-medium">{term.version}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date d'entrée en vigueur:</span>
                    <span className="font-medium">
                      {new Date(term.effectiveDate).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Dernière mise à jour:</span>
                    <span className="font-medium">
                      {new Date(term.updatedAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Langue:</span>
                    <span className="font-medium uppercase">{term.language}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      <div className="mt-8 p-6 border rounded-lg bg-muted/30">
        <h3 className="text-lg font-semibold mb-3">Vos Droits (RGPD)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium mb-1">Droit d'accès</p>
            <p className="text-muted-foreground">Obtenir une copie de vos données personnelles</p>
          </div>
          <div>
            <p className="font-medium mb-1">Droit de rectification</p>
            <p className="text-muted-foreground">Corriger vos données inexactes</p>
          </div>
          <div>
            <p className="font-medium mb-1">Droit à l'effacement</p>
            <p className="text-muted-foreground">Demander la suppression de vos données</p>
          </div>
          <div>
            <p className="font-medium mb-1">Droit à la portabilité</p>
            <p className="text-muted-foreground">Récupérer vos données dans un format structuré</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Pour exercer vos droits, contactez-nous à : <a href="mailto:privacy@visual.com" className="text-primary underline">privacy@visual.com</a>
        </p>
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          Dernière mise à jour de cette page : {new Date().toLocaleDateString('fr-FR')}
        </p>
        <p className="mt-2">
          En cas de question sur nos règlements, contactez-nous à <a href="mailto:contact@visual.com" className="text-primary underline">contact@visual.com</a>
        </p>
      </div>
    </div>
  );
}
