# Finance_Pseudocode.md

> Pseudocode TypeScript — avec **extension_price_eur = 25** par défaut (modifiable).  
> Calculs en **centimes**, paiements utilisateurs **arrondis à l’euro inférieur**.

```ts
// ===== Runtime config (modifiable) =====
export const CONFIG = {
  payout_rule_version: "cat_close_40_30_7_23_v1",
  infoarticle_platform_fee_pct: 0.30,
  points_rate: 100,              // 100 pts = 1 €
  points_threshold: 2500,        // seuil de conversion
  extension_price_eur: 25,       // <-- confirmé
  pot24h_split_mode: "equipartition" as "equipartition"|"weighted"|"group_ratio",
};

// ===== Helpers =====
const toCents = (eur:number)=>Math.round(eur*100);
const euroFloor = (cents:number)=>Math.floor(cents/100)*100; // floor à l'euro
const nowIso = ()=>new Date().toISOString();

// ===== Coeff engagement & votes =====
export const votesByInvestment = (e:2|3|4|5|6|8|10|12|15|20)=>(
  {2:1,3:2,4:3,5:4,6:5,8:6,10:7,12:8,15:9,20:10}[e]
);

export const engagementCoeff = (amount:number, investors:number)=>{
  return +(amount / Math.max(1, investors)).toFixed(2);
};

// ===== Catégorie : clôture 40/30/7/23 =====
const INV_TOP10 = [0.1366,0.0683,0.0455,0.0341,0.0273,0.0228,0.0195,0.0171,0.0152,0.0137];
const PORT_TOP10= [0.1024,0.0512,0.0341,0.0256,0.0205,0.0171,0.0146,0.0128,0.0114,0.0102];

export function closeCategory(categoryId:string, S_eur:number, invTop10:string[], portTop10:string[], inv11to100:string[]){
  if(invTop10.length!==10 || portTop10.length!==10) throw new Error("Bad TOP10 inputs");

  const S_c = toCents(S_eur);
  const baseInv7_c = Math.floor(0.07 * S_c);
  const baseVisual23_c = Math.floor(0.23 * S_c);

  let usersPaid_c = 0;
  const payouts:any[] = [];

  // 40% investisseurs TOP10 (parts absolues de S)
  for(let i=0;i<10;i++){
    const c = Math.floor(INV_TOP10[i] * S_c);
    const e = euroFloor(c);
    payouts.push({type:"investor_top10", user:invTop10[i], cents:e, rank:i+1});
    usersPaid_c += e;
  }

  // 30% porteurs TOP10 (parts absolues de S)
  for(let i=0;i<10;i++){
    const c = Math.floor(PORT_TOP10[i] * S_c);
    const e = euroFloor(c);
    payouts.push({type:"creator_top10", user:portTop10[i], cents:e, rank:i+1});
    usersPaid_c += e;
  }

  // 7% investisseurs 11–100 (équipartition)
  if(inv11to100.length>0){
    const part_c = Math.floor(baseInv7_c / inv11to100.length);
    const e = euroFloor(part_c);
    for(const u of inv11to100){
      payouts.push({type:"investor_11_100", user:u, cents:e});
      usersPaid_c += e;
    }
  }

  // VISUAL = 23% + restes d'arrondis
  const allocated_c = usersPaid_c + baseVisual23_c;
  const residual_c = Math.max(0, S_c - allocated_c);
  payouts.push({type:"visual_platform", cents: baseVisual23_c + residual_c});

  return {categoryId, rule: CONFIG.payout_rule_version, payouts, ts: nowIso()};
}

// ===== Articles infoporteurs : 30/70 =====
export function onArticleSold(orderId:string, grossEUR:number, infoporterId:string){
  const gross_c = toCents(grossEUR);
  const fee_c   = Math.round(gross_c * CONFIG.infoarticle_platform_fee_pct);
  const net_c   = gross_c - fee_c;

  // Stripe transfers (idempotents) + ledger
  stripe.transfer("VISUAL", fee_c, {key:`fee:${orderId}`});
  stripe.transfer(infoporterId, net_c, {key:`net:${orderId}`});
  ledger.record({orderId, type:"infoarticle_sale", gross_c, fee_c, net_c, ts: nowIso()});
}

// ===== Pot 24h (articles) =====
// winners = union(TOP10 infoporteurs, investi-lecteurs ayant acheté ≥1 article de ce TOP10)
export function distributePot24h(windowId:string, winners:string[], potEUR:number){
  const pot_c = toCents(potEUR);
  if(winners.length===0) return {windowId, payouts:[], ts: nowIso()};

  // Mode par défaut : équipartition sur l'union des gagnants
  const share_c = Math.floor(pot_c / winners.length);
  const e = euroFloor(share_c);

  let totalUsers_c = 0;
  const payouts:any[] = [];
  for(const w of winners){
    payouts.push({type:"pot24h_winner", user:w, cents:e});
    totalUsers_c += e;
  }
  const residual_c = Math.max(0, pot_c - totalUsers_c);
  payouts.push({type:"pot24h_residual_visual", cents: residual_c}); // restes → VISUAL

  return {windowId, payouts, ts: nowIso()};
}

// ===== VISUpoints : conversion (100 pts = 1 €, seuil 2500, floor) =====
export function convertPoints(points:number){
  if(points < CONFIG.points_threshold) return {euros:0, pointsLeft:points};
  const euros = Math.floor(points / CONFIG.points_rate);
  return {euros, pointsLeft: points - euros*CONFIG.points_rate};
}

// ===== Extension 168h payante (25 € par défaut, modifiable) =====
export function requestExtension(projectId:string, userId:string){
  const price = CONFIG.extension_price_eur;
  stripe.charge(userId, price, {purpose:"category_extension", idempotencyKey:`ext:${projectId}:${nowIso()}`});
  scheduler.extendCategoryWindow(projectId, 168*60*60*1000);
  audit.log("extension_granted", {projectId,userId,price,ts:nowIso()});
}
```
