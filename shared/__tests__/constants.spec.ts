import { VISUAL_CONSTANTS } from "../shared_visual_constants";

// @ts-ignore
declare global {
  function describe(description: string, fn: () => void): void;
  function test(name: string, fn: () => void): void;
  namespace jest {
    interface Expect {
      toBe(value: any): void;
      toEqual(value: any): void;
      toContain(value: any): void;
      toBeDefined(): void;
      toBeCloseTo(value: number): void;
    }
    let expect: (value: any) => Expect;
  }
}

describe("VISUAL Constants", () => {
  test("investment tiers = 2–20", () => {
    expect(VISUAL_CONSTANTS.investmentTiers.standard).toEqual([2,3,4,5,6,8,10,12,15,20]);
  });

  test("extension price = 25", () => {
    expect(VISUAL_CONSTANTS.extension_price_eur).toBe(25);
  });

  test("voix info investment tiers include micro amounts", () => {
    expect(VISUAL_CONSTANTS.investmentTiers.voixInfo).toContain(0.2);
    expect(VISUAL_CONSTANTS.investmentTiers.voixInfo).toContain(0.5);
    expect(VISUAL_CONSTANTS.investmentTiers.voixInfo).toContain(10);
  });

  test("votes mapping includes all standard investment amounts", () => {
    const standardAmounts = VISUAL_CONSTANTS.investmentTiers.standard;
    standardAmounts.forEach(amount => {
      expect(VISUAL_CONSTANTS.votesMapping[amount.toString()]).toBeDefined();
    });
  });

  test("splits configuration is correct", () => {
    const { videoEvent } = VISUAL_CONSTANTS.splits;
    expect(videoEvent.investorsTop10).toBe(0.40);
    expect(videoEvent.portersTop10).toBe(0.30);
    expect(videoEvent.investors11_100).toBe(0.07);
    expect(videoEvent.visual).toBe(0.23);
    
    // Vérifier que la somme fait 100%
    const total = videoEvent.investorsTop10 + videoEvent.portersTop10 + 
                 videoEvent.investors11_100 + videoEvent.visual;
    expect(total).toBeCloseTo(1.0);
  });

  test("currency is EUR", () => {
    expect(VISUAL_CONSTANTS.currency).toBe("EUR");
  });

  test("feature keys include all categories", () => {
    const expectedFeatures = ["films","videos","documentaires","voix_info","live_show","livres","petites_annonces"];
    expect(VISUAL_CONSTANTS.featureKeys).toEqual(expectedFeatures);
  });
});