import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface SplitItem {
  accountId: string;
  role: string;
  amountCents: number;
  note: string;
}

interface PreviewResult {
  plan: SplitItem[];
  totals: Record<string, number>;
}

export function FinancePreviewCard() {
  const [scenario, setScenario] = useState<"article" | "category">("article");
  const [priceEur, setPriceEur] = useState("9.99");
  const [potEur, setPotEur] = useState("10000");
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCalculate = async () => {
    setIsLoading(true);
    try {
      const payload: any = { scenario };

      if (scenario === "article") {
        payload.price_eur = parseFloat(priceEur);
        payload.porter_account_id = "acc_porter_1";
        payload.visual_account_id = "acc_visual";
      } else {
        payload.pot_eur = parseFloat(potEur);
        payload.visual_account_id = "acc_visual";
        payload.investor_top10_accounts = Array.from({ length: 10 }, (_, i) => `acc_inv${i + 1}`);
        payload.porter_top10_accounts = Array.from({ length: 10 }, (_, i) => `acc_port${i + 1}`);
        payload.investor_ranks_11_100_accounts = Array.from({ length: 90 }, (_, i) => `acc_inv_${i + 11}`);
      }

      const response = await apiRequest("POST", "/api/admin/finance/preview-split", payload);
      const data = await response.json();
      
      setResult(data);
      toast({
        title: "✅ Calcul réussi",
        description: `Split calculé pour ${scenario === "article" ? "vente d'article" : "clôture de catégorie"}`,
      });
    } catch (error: any) {
      toast({
        title: "❌ Erreur",
        description: error.message || "Erreur lors du calcul",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCents = (cents: number) => {
    return `${(cents / 100).toFixed(2)} €`;
  };

  const formatCentsOnly = (cents: number) => {
    return `${cents} cts`;
  };

  return (
    <Card className="border-[#7B2CFF]/30 bg-gradient-to-b from-[#00D1FF]/5 to-transparent backdrop-blur-sm" data-testid="card-finance-preview">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-[#00D1FF] to-[#7B2CFF]">
          💸 Revenue Engine - Prévisualisation des Splits
        </CardTitle>
        <CardDescription className="text-gray-400">
          Testez les formules mathématiques de répartition des revenus
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium text-gray-300">Scénario</Label>
            <Select value={scenario} onValueChange={(val) => setScenario(val as any)}>
              <SelectTrigger className="w-[250px] bg-black/40 border-[#7B2CFF]/30" data-testid="select-scenario">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="article" data-testid="option-article">Vente d'article (70/30)</SelectItem>
                <SelectItem value="category" data-testid="option-category">Clôture de catégorie (40/30/7/23)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {scenario === "article" ? (
            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm font-medium text-gray-300">
                Prix de l'article (€)
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={priceEur}
                onChange={(e) => setPriceEur(e.target.value)}
                className="bg-black/40 border-[#7B2CFF]/30 text-white"
                placeholder="9.99"
                data-testid="input-price"
              />
              <p className="text-xs text-gray-500">
                Formule: 70% porteur (arrondi euro inf.) / 30% VISUAL + restes
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="pot" className="text-sm font-medium text-gray-300">
                Pot total (€)
              </Label>
              <Input
                id="pot"
                type="number"
                step="1"
                value={potEur}
                onChange={(e) => setPotEur(e.target.value)}
                className="bg-black/40 border-[#7B2CFF]/30 text-white"
                placeholder="10000"
                data-testid="input-pot"
              />
              <p className="text-xs text-gray-500">
                Formule: 40% Inv TOP10 / 30% Port TOP10 / 7% Inv 11-100 / 23% VISUAL + restes
              </p>
            </div>
          )}

          <Button
            onClick={handleCalculate}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#7B2CFF] to-[#FF3CAC] hover:opacity-90"
            data-testid="button-calculate"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calcul en cours...
              </>
            ) : (
              "🧮 Calculer la répartition"
            )}
          </Button>
        </div>

        {result && (
          <div className="space-y-4 mt-6 p-4 rounded-lg border border-[#00D1FF]/30 bg-black/20" data-testid="results-container">
            <div>
              <h3 className="text-sm font-semibold text-[#00D1FF] mb-2">📊 Totaux par rôle</h3>
              <div className="space-y-1">
                {Object.entries(result.totals).map(([role, cents]) => (
                  <div key={role} className="flex justify-between text-sm" data-testid={`total-${role}`}>
                    <span className="text-gray-400">{role}:</span>
                    <span className="font-mono text-white">
                      {formatCents(cents)} <span className="text-gray-500">({formatCentsOnly(cents)})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#7B2CFF] mb-2">📋 Plan de répartition détaillé</h3>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {result.plan.map((item, index) => (
                  <div
                    key={index}
                    className="p-2 rounded bg-black/40 border border-[#7B2CFF]/20 text-xs"
                    data-testid={`plan-item-${index}`}
                  >
                    <div className="flex justify-between">
                      <span className="text-gray-400">{item.role}</span>
                      <span className="font-mono text-[#00D1FF]">{formatCents(item.amountCents)}</span>
                    </div>
                    <div className="text-gray-600 mt-1">
                      Account: {item.accountId} • {item.note}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
