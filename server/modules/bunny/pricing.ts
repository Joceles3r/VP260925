import { CREATOR_DEPOSIT_PRICING, DepositType } from "../../../shared/constants/bunnyDeposit";

export function getUploadFeeEUR(type: DepositType, durationSec: number): number {
  const cfg = CREATOR_DEPOSIT_PRICING[type];
  if (!cfg) {
    throw new Error("Type de dépôt vidéo inconnu");
  }
  
  if (durationSec <= 0 || durationSec > cfg.maxSeconds) {
    throw new Error(
      `Durée non autorisée pour ${cfg.label}: max ${Math.floor(cfg.maxSeconds / 60)} minutes`
    );
  }
  
  return cfg.feeEur;
}

export function validateVideoType(type: string): type is DepositType {
  return type === 'clip' || type === 'doc' || type === 'film';
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min ${secs}s`;
}
