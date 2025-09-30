import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getJSON, patchJSON } from "../utils/api";
import { Settings, Save, RefreshCw } from "lucide-react";

type PlatformConfig = {
  platformCommission: number;
  minInvestment: number;
  maxInvestment: number;
  maxProjectsPerCreator: number;
  kycRequired: boolean;
  maintenanceMode: boolean;
  registrationOpen: boolean;
  withdrawalFee: number;
  referralBonus: number;
};

export function PlatformConfigCard() {
  const { toast } = useToast();
  const [config, setConfig] = useState<PlatformConfig>({
    platformCommission: 5,
    minInvestment: 2,
    maxInvestment: 20,
    maxProjectsPerCreator: 5,
    kycRequired: true,
    maintenanceMode: false,
    registrationOpen: true,
    withdrawalFee: 1,
    referralBonus: 10,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await getJSON("/api/admin/config");
      setConfig(data);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger la configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await patchJSON("/api/admin/config", config);
      toast({
        title: "Configuration sauvegardée",
        description: "Les paramètres de la plateforme ont été mis à jour",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key: keyof PlatformConfig, value: any) => {
    setConfig({ ...config, [key]: value });
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 p-5 bg-gradient-to-b from-emerald-500/5 to-transparent">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin opacity-50" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-500/30 p-5 bg-gradient-to-b from-emerald-500/5 to-transparent">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Settings className="w-5 h-5" />
        Configuration plateforme
      </h2>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="platform-commission">Commission plateforme (%)</Label>
          <Input
            id="platform-commission"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={config.platformCommission}
            onChange={(e) => updateConfig('platformCommission', parseFloat(e.target.value))}
            className="bg-black/40 border-emerald-500/30"
            data-testid="input-platform-commission"
          />
          <p className="text-xs opacity-70">Commission prélevée sur chaque transaction</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="withdrawal-fee">Frais de retrait (%)</Label>
          <Input
            id="withdrawal-fee"
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={config.withdrawalFee}
            onChange={(e) => updateConfig('withdrawalFee', parseFloat(e.target.value))}
            className="bg-black/40 border-emerald-500/30"
            data-testid="input-withdrawal-fee"
          />
          <p className="text-xs opacity-70">Frais appliqués lors des retraits</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="min-investment">Investissement minimum (€)</Label>
          <Input
            id="min-investment"
            type="number"
            min="1"
            value={config.minInvestment}
            onChange={(e) => updateConfig('minInvestment', parseInt(e.target.value))}
            className="bg-black/40 border-emerald-500/30"
            data-testid="input-min-investment"
          />
          <p className="text-xs opacity-70">Montant minimum par investissement</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="max-investment">Investissement maximum (€)</Label>
          <Input
            id="max-investment"
            type="number"
            min="1"
            value={config.maxInvestment}
            onChange={(e) => updateConfig('maxInvestment', parseInt(e.target.value))}
            className="bg-black/40 border-emerald-500/30"
            data-testid="input-max-investment"
          />
          <p className="text-xs opacity-70">Montant maximum par investissement</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="max-projects">Projets max par créateur</Label>
          <Input
            id="max-projects"
            type="number"
            min="1"
            value={config.maxProjectsPerCreator}
            onChange={(e) => updateConfig('maxProjectsPerCreator', parseInt(e.target.value))}
            className="bg-black/40 border-emerald-500/30"
            data-testid="input-max-projects"
          />
          <p className="text-xs opacity-70">Nombre maximum de projets simultanés</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="referral-bonus">Bonus de parrainage (VISUpoints)</Label>
          <Input
            id="referral-bonus"
            type="number"
            min="0"
            value={config.referralBonus}
            onChange={(e) => updateConfig('referralBonus', parseInt(e.target.value))}
            className="bg-black/40 border-emerald-500/30"
            data-testid="input-referral-bonus"
          />
          <p className="text-xs opacity-70">Points attribués au parrain</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 p-4 bg-black/40">
          <div>
            <Label htmlFor="kyc-required" className="font-medium">KYC obligatoire</Label>
            <p className="text-xs opacity-70 mt-1">Forcer la vérification KYC pour investir</p>
          </div>
          <Switch
            id="kyc-required"
            checked={config.kycRequired}
            onCheckedChange={(checked) => updateConfig('kycRequired', checked)}
            data-testid="switch-kyc-required"
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 p-4 bg-black/40">
          <div>
            <Label htmlFor="registration-open" className="font-medium">Inscriptions ouvertes</Label>
            <p className="text-xs opacity-70 mt-1">Permettre les nouvelles inscriptions</p>
          </div>
          <Switch
            id="registration-open"
            checked={config.registrationOpen}
            onCheckedChange={(checked) => updateConfig('registrationOpen', checked)}
            data-testid="switch-registration-open"
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-orange-500/20 p-4 bg-black/40">
          <div>
            <Label htmlFor="maintenance-mode" className="font-medium text-orange-400">Mode maintenance</Label>
            <p className="text-xs opacity-70 mt-1">Activer pour bloquer l'accès à la plateforme</p>
          </div>
          <Switch
            id="maintenance-mode"
            checked={config.maintenanceMode}
            onCheckedChange={(checked) => updateConfig('maintenanceMode', checked)}
            data-testid="switch-maintenance-mode"
          />
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full mt-6 bg-emerald-500 hover:bg-emerald-600"
        data-testid="button-save-config"
      >
        {saving ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Sauvegarde...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder la configuration
          </>
        )}
      </Button>
    </div>
  );
}
