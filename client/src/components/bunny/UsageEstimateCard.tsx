import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { BarChart3, HardDrive, Upload, Clock } from "lucide-react";

type UsageResponse = {
  month: string;
  usage: {
    storage_gb: number;
    egress_gb: number;
    encode_min: number;
  };
  tariffs: {
    storage_eur_per_gb: number;
    egress_eur_per_gb: number;
    encode_eur_per_min: number;
  };
  estimated_cost_eur: number;
  cap_eur: number;
  min_activation_eur: number;
};

export function UsageEstimateCard() {
  const { data, isLoading } = useQuery<UsageResponse>({
    queryKey: ["/api/bunny/usage/estimate"],
  });

  if (isLoading) {
    return (
      <Card className="p-6 border-neon-cyan/30 bg-gradient-to-b from-neon-cyan/5 to-transparent">
        <div className="animate-pulse">
          <div className="h-6 bg-neon-cyan/20 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-neon-cyan/10 rounded"></div>
            <div className="h-4 bg-neon-cyan/10 rounded w-5/6"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="p-6 border-neon-cyan/30 bg-gradient-to-b from-neon-cyan/5 to-transparent">
        <p className="text-muted-foreground">Aucune donnée disponible</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-neon-cyan/30 bg-gradient-to-b from-neon-cyan/5 to-transparent">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-neon-cyan" />
          <h3 className="text-lg font-semibold">Diffusion — Consommation & Estimation</h3>
        </div>
        <div className="text-sm text-muted-foreground">{data.month}</div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
          <div className="flex items-center gap-3">
            <HardDrive className="w-4 h-4 text-neon-purple" />
            <span className="text-sm">Stockage</span>
          </div>
          <div className="text-right">
            <div className="font-semibold">{data.usage.storage_gb.toFixed(2)} GB</div>
            <div className="text-xs text-muted-foreground">
              {data.tariffs.storage_eur_per_gb}€/GB
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
          <div className="flex items-center gap-3">
            <Upload className="w-4 h-4 text-neon-pink" />
            <span className="text-sm">Bande passante (egress)</span>
          </div>
          <div className="text-right">
            <div className="font-semibold">{data.usage.egress_gb.toFixed(2)} GB</div>
            <div className="text-xs text-muted-foreground">
              {data.tariffs.egress_eur_per_gb}€/GB
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-neon-cyan" />
            <span className="text-sm">Encodage</span>
          </div>
          <div className="text-right">
            <div className="font-semibold">{data.usage.encode_min.toFixed(2)} min</div>
            <div className="text-xs text-muted-foreground">
              {data.tariffs.encode_eur_per_min}€/min
            </div>
          </div>
        </div>

        <div className="border-t border-neon-cyan/20 pt-4 mt-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Estimation mensuelle</span>
            <span className="text-2xl font-bold text-neon-cyan">
              {data.estimated_cost_eur.toFixed(2)}€
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Plafonné à {data.cap_eur}€ • Minimum {data.min_activation_eur}€
          </div>
        </div>
      </div>
    </Card>
  );
}
