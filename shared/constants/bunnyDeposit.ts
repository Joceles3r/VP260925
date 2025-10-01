export const CREATOR_DEPOSIT_PRICING = {
  clip: { maxSeconds: 10 * 60, feeEur: 2, label: "Clip (≤10min)" },
  doc: { maxSeconds: 30 * 60, feeEur: 5, label: "Documentaire (≤30min)" },
  film: { maxSeconds: 4 * 60 * 60, feeEur: 10, label: "Film (≤4h)" }
} as const;

export type DepositType = keyof typeof CREATOR_DEPOSIT_PRICING;

export const BUNNY_TARIFFS = {
  storage_eur_per_gb: 0.01,
  egress_eur_per_gb: 0.005,
  encode_eur_per_min: 0.005
};

export const CREATOR_CAP_EUR = 20;
export const MIN_ACTIVATION_EUR = 1;

export type DepositStatus = "PENDING" | "PAID" | "READY" | "CANCELLED" | "EXPIRED";
