import { db } from "../db";
import { storage } from "../storage";
import {
  infoporteurProfiles,
  investiLecteurProfiles,
  voixInfoArticles,
  articlePurchases,
  dailyRankings,
  goldenTickets,
  visuPointsTransactions,
  dailyPotDistribution,
  users
} from "@shared/schema";
import { eq, and, desc, sum, count, sql, gte, lte } from "drizzle-orm";
import type {
  InfoporteurProfile,
  InsertInfoporteurProfile,
  InvestiLecteurProfile,
  InsertInvestiLecteurProfile,
  VoixInfoArticle,
  InsertVoixInfoArticle,
  UpdateVoixInfoArticle,
  ArticlePurchase,
  GoldenTicket,
  InsertGoldenTicket,
  VisuPointsTransaction,
  InsertVisuPointsTransaction,
  DailyRanking,
  DailyPotDistribution
} from "@shared/schema";

// ===== CONSTANTES DU SYSTÈME =====

export const VOIX_INFO_CONFIG = {
  // Cautions requises
  cautions: {
    infoporteur: 10.00,     // 10€
    investiLecteur: 20.00   // 20€
  },
  
  // Packs VISUpoints disponibles (anti-micro-frais)
  visuPointsPacks: [
    { euros: 5, points: 500 },
    { euros: 10, points: 1000 },
    { euros: 20, points: 2000 }
  ],
  
  // Prix d'articles autorisés (€)
  articlePricesAllowed: [0.2, 0.5, 1, 2, 3, 4, 5],
  
  // Tranches d'investissement autorisées (€)
  investmentTiersAllowed: [0.2, 0.5, 1, 2, 3, 4, 5, 10],
  
  // Conversion VISUpoints
  conversion: {
    pointsPerEuro: 100,           // 100 VP = 1€
    euroPerPoint: 0.01,           // 1 VP = 0.01€
    votesPerEuro: 10,             // 1€ = 10 votes
    euroPerVote: 0.10,            // 1 vote = 0.10€
    cashoutThreshold: 2500        // Seuil de conversion VP → € (25€)
  },
  
  // Golden Ticket tiers
  goldenTicketTiers: [
    { tier: 1, euros: 50, votes: 20, points: 5000 },
    { tier: 2, euros: 75, votes: 30, points: 7500 },
    { tier: 3, euros: 100, votes: 40, points: 10000 }
  ],
  
  // Remboursements Golden Ticket selon rang
  goldenTicketRefunds: {
    ranks1_10: 100,    // 100%
    rank11: 100,       // 100%
    ranks12_20: 50,    // 50%
    ranksAbove20: 0    // 0%
  },
  
  // Répartition des revenus
  revenueSharing: {
    // Ventes directes d'articles
    directSales: { infoporteur: 70, visual: 30 },
    // Pot commun (système TOP 10)
    potCommun: { infoporteurs: 50, investiLecteurs: 50, visual: 0 }
  }
};

// ===== INTERFACES =====

export interface CreateInfoporteurRequest {
  userId: string;
  displayName: string;
  bio?: string;
  specialties?: string[];
}

export interface CreateInvestiLecteurRequest {
  userId: string;
  displayName: string;
}

export interface CreateArticleRequest {
  infoporteurId: string;
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  priceEuros: number;
  tags?: string[];
  coverImage?: string;
}

export interface PurchaseArticleRequest {
  articleId: string;
  investiLecteurId: string;
  priceEuros: number;
  visuPointsSpent: number;
}

export interface PurchaseGoldenTicketRequest {
  investiLecteurId: string;
  tier: number;
  targetInfoporteurId?: string;
}

export interface BuyVisuPointsPackRequest {
  userId: string;
  packEuros: number;
  paymentIntentId: string;
}

// ===== SERVICES =====

export class VoixInfoService {

  // ===== PROFILS =====

  async createInfoporteurProfile(request: CreateInfoporteurRequest): Promise<InfoporteurProfile> {
    // Vérifier que l'utilisateur n'a pas déjà un profil
    const existing = await db
      .select()
      .from(infoporteurProfiles)
      .where(eq(infoporteurProfiles.userId, request.userId))
      .limit(1);

    if (existing.length > 0) {
      throw new Error("Profil infoporteur déjà existant");
    }

    const profileData: InsertInfoporteurProfile = {
      userId: request.userId,
      displayName: request.displayName,
      bio: request.bio,
      specialties: request.specialties ? JSON.stringify(request.specialties) : undefined
    };

    const [profile] = await db
      .insert(infoporteurProfiles)
      .values(profileData)
      .returning();

    return profile;
  }

  async createInvestiLecteurProfile(request: CreateInvestiLecteurRequest): Promise<InvestiLecteurProfile> {
    // Vérifier que l'utilisateur n'a pas déjà un profil
    const existing = await db
      .select()
      .from(investiLecteurProfiles)
      .where(eq(investiLecteurProfiles.userId, request.userId))
      .limit(1);

    if (existing.length > 0) {
      throw new Error("Profil investi-lecteur déjà existant");
    }

    const profileData: InsertInvestiLecteurProfile = {
      userId: request.userId,
      displayName: request.displayName
    };

    const [profile] = await db
      .insert(investiLecteurProfiles)
      .values(profileData)
      .returning();

    return profile;
  }

  async getInfoporteurProfile(userId: string): Promise<InfoporteurProfile | null> {
    const [profile] = await db
      .select()
      .from(infoporteurProfiles)
      .where(eq(infoporteurProfiles.userId, userId))
      .limit(1);

    return profile || null;
  }

  async getInvestiLecteurProfile(userId: string): Promise<InvestiLecteurProfile | null> {
    const [profile] = await db
      .select()
      .from(investiLecteurProfiles)
      .where(eq(investiLecteurProfiles.userId, userId))
      .limit(1);

    return profile || null;
  }

  // ===== ARTICLES =====

  async createArticle(request: CreateArticleRequest): Promise<VoixInfoArticle> {
    // Valider le prix
    if (!VOIX_INFO_CONFIG.articlePricesAllowed.includes(request.priceEuros)) {
      throw new Error(`Prix non autorisé. Prix autorisés : ${VOIX_INFO_CONFIG.articlePricesAllowed.join(', ')}€`);
    }

    // Générer le slug
    const slug = this.generateSlug(request.title);

    // Vérifier l'unicité du slug
    const existingSlug = await db
      .select()
      .from(voixInfoArticles)
      .where(eq(voixInfoArticles.slug, slug))
      .limit(1);

    if (existingSlug.length > 0) {
      throw new Error("Un article avec ce titre existe déjà");
    }

    const articleData: InsertVoixInfoArticle = {
      infoporteurId: request.infoporteurId,
      title: request.title,
      content: request.content,
      excerpt: request.excerpt,
      category: request.category as any,
      priceEuros: request.priceEuros.toString(),
      tags: request.tags ? JSON.stringify(request.tags) : undefined,
      coverImage: request.coverImage,
      readingTime: this.estimateReadingTime(request.content)
    };

    const [article] = await db
      .insert(voixInfoArticles)
      .values(articleData)
      .returning();

    return article;
  }

  async publishArticle(articleId: string, infoporteurId: string): Promise<VoixInfoArticle> {
    const [article] = await db
      .update(voixInfoArticles)
      .set({ 
        status: 'active',
        publishedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(voixInfoArticles.id, articleId),
        eq(voixInfoArticles.infoporteurId, infoporteurId)
      ))
      .returning();

    if (!article) {
      throw new Error("Article non trouvé ou non autorisé");
    }

    return article;
  }

  async getArticlesByInfoporteur(infoporteurId: string, status?: string): Promise<VoixInfoArticle[]> {
    let query = db
      .select()
      .from(voixInfoArticles)
      .where(eq(voixInfoArticles.infoporteurId, infoporteurId));

    if (status) {
      query = query.where(and(
        eq(voixInfoArticles.infoporteurId, infoporteurId),
        eq(voixInfoArticles.status, status as any)
      ));
    }

    return await query.orderBy(desc(voixInfoArticles.createdAt));
  }

  async getPublicArticles(limit = 20, offset = 0): Promise<VoixInfoArticle[]> {
    return await db
      .select()
      .from(voixInfoArticles)
      .where(eq(voixInfoArticles.status, 'active'))
      .orderBy(desc(voixInfoArticles.publishedAt))
      .limit(limit)
      .offset(offset);
  }

  // ===== VISUPOINTS =====

  async buyVisuPointsPack(request: BuyVisuPointsPackRequest): Promise<{ transaction: VisuPointsTransaction; newBalance: number }> {
    // Valider le pack
    const pack = VOIX_INFO_CONFIG.visuPointsPacks.find(p => p.euros === request.packEuros);
    if (!pack) {
      throw new Error(`Pack non autorisé. Packs disponibles : ${VOIX_INFO_CONFIG.visuPointsPacks.map(p => p.euros).join(', ')}€`);
    }

    // Récupérer le profil investi-lecteur
    const profile = await db
      .select()
      .from(investiLecteurProfiles)
      .where(eq(investiLecteurProfiles.userId, request.userId))
      .limit(1);

    if (!profile[0]) {
      throw new Error("Profil investi-lecteur requis");
    }

    const currentBalance = profile[0].visuPoints;
    const newBalance = currentBalance + pack.points;

    // Créer la transaction
    const transactionData: InsertVisuPointsTransaction = {
      userId: request.userId,
      type: 'purchase',
      amount: pack.points,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      euroAmount: pack.euros,
      description: `Achat pack ${pack.points} VISUpoints (${pack.euros}€)`,
      relatedType: 'pack_purchase',
      paymentIntentId: request.paymentIntentId
    };

    const [transaction] = await db
      .insert(visuPointsTransactions)
      .values(transactionData)
      .returning();

    // Mettre à jour le solde
    await db
      .update(investiLecteurProfiles)
      .set({ 
        visuPoints: newBalance,
        updatedAt: new Date()
      })
      .where(eq(investiLecteurProfiles.userId, request.userId));

    return { transaction, newBalance };
  }

  async spendVisuPoints(userId: string, amount: number, description: string, relatedId?: string, relatedType?: string): Promise<VisuPointsTransaction> {
    // Récupérer le profil
    const profile = await db
      .select()
      .from(investiLecteurProfiles)
      .where(eq(investiLecteurProfiles.userId, userId))
      .limit(1);

    if (!profile[0]) {
      throw new Error("Profil investi-lecteur requis");
    }

    const currentBalance = profile[0].visuPoints;
    
    if (currentBalance < amount) {
      throw new Error(`Solde insuffisant. Solde actuel : ${currentBalance} VP, requis : ${amount} VP`);
    }

    const newBalance = currentBalance - amount;

    // Créer la transaction de dépense
    const transactionData: InsertVisuPointsTransaction = {
      userId,
      type: 'spend',
      amount: -amount, // Négatif pour une dépense
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      euroAmount: amount * VOIX_INFO_CONFIG.conversion.euroPerPoint,
      description,
      relatedId,
      relatedType
    };

    const [transaction] = await db
      .insert(visuPointsTransactions)
      .values(transactionData)
      .returning();

    // Mettre à jour le solde
    await db
      .update(investiLecteurProfiles)
      .set({ 
        visuPoints: newBalance,
        updatedAt: new Date()
      })
      .where(eq(investiLecteurProfiles.userId, userId));

    return transaction;
  }

  async getVisuPointsBalance(userId: string): Promise<number> {
    const profile = await db
      .select({ visuPoints: investiLecteurProfiles.visuPoints })
      .from(investiLecteurProfiles)
      .where(eq(investiLecteurProfiles.userId, userId))
      .limit(1);

    return profile[0]?.visuPoints || 0;
  }

  // ===== ACHATS D'ARTICLES =====

  async purchaseArticle(request: PurchaseArticleRequest): Promise<ArticlePurchase> {
    // Vérifier que l'article existe et est actif
    const [article] = await db
      .select()
      .from(voixInfoArticles)
      .where(and(
        eq(voixInfoArticles.id, request.articleId),
        eq(voixInfoArticles.status, 'active')
      ))
      .limit(1);

    if (!article) {
      throw new Error("Article non trouvé ou non disponible");
    }

    // Vérifier que l'utilisateur n'a pas déjà acheté cet article
    const existingPurchase = await db
      .select()
      .from(articlePurchases)
      .where(and(
        eq(articlePurchases.articleId, request.articleId),
        eq(articlePurchases.investiLecteurId, request.investiLecteurId)
      ))
      .limit(1);

    if (existingPurchase.length > 0) {
      throw new Error("Article déjà acheté");
    }

    // Calculer les votes selon le barème
    const votes = Math.floor(request.priceEuros / VOIX_INFO_CONFIG.conversion.euroPerVote);

    // Dépenser les VISUpoints
    await this.spendVisuPoints(
      request.investiLecteurId, 
      request.visuPointsSpent,
      `Achat article: ${article.title}`,
      request.articleId,
      'article_purchase'
    );

    // Créer l'achat
    const purchaseData = {
      articleId: request.articleId,
      investiLecteurId: request.investiLecteurId,
      priceEuros: request.priceEuros.toString(),
      visuPointsSpent: request.visuPointsSpent,
      votes
    };

    const [purchase] = await db
      .insert(articlePurchases)
      .values(purchaseData)
      .returning();

    // Mettre à jour les statistiques de l'article
    await db
      .update(voixInfoArticles)
      .set({
        totalSales: sql`${voixInfoArticles.totalSales} + 1`,
        totalRevenue: sql`${voixInfoArticles.totalRevenue} + ${request.priceEuros}`,
        updatedAt: new Date()
      })
      .where(eq(voixInfoArticles.id, request.articleId));

    return purchase;
  }

  // ===== GOLDEN TICKETS =====

  async purchaseGoldenTicket(request: PurchaseGoldenTicketRequest): Promise<GoldenTicket> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Vérifier qu'il n'y a pas déjà un ticket pour ce mois
    const existingTicket = await db
      .select()
      .from(goldenTickets)
      .where(and(
        eq(goldenTickets.investiLecteurId, request.investiLecteurId),
        eq(goldenTickets.monthYear, currentMonth)
      ))
      .limit(1);

    if (existingTicket.length > 0) {
      throw new Error("Vous avez déjà un Golden Ticket pour ce mois");
    }

    // Valider le tier
    const tier = VOIX_INFO_CONFIG.goldenTicketTiers.find(t => t.tier === request.tier);
    if (!tier) {
      throw new Error(`Tier invalide. Tiers disponibles : 1 (50€), 2 (75€), 3 (100€)`);
    }

    // Dépenser les VISUpoints
    await this.spendVisuPoints(
      request.investiLecteurId,
      tier.points,
      `Golden Ticket Tier ${request.tier} (${tier.euros}€)`,
      undefined,
      'golden_ticket'
    );

    // Créer le ticket
    const ticketData: InsertGoldenTicket = {
      investiLecteurId: request.investiLecteurId,
      monthYear: currentMonth,
      tier: request.tier,
      amountEuros: tier.euros,
      visuPointsSpent: tier.points,
      targetInfoporteurId: request.targetInfoporteurId
    };

    const [ticket] = await db
      .insert(goldenTickets)
      .values(ticketData)
      .returning();

    return ticket;
  }

  // ===== CLASSEMENTS =====

  async calculateDailyRankings(date: string): Promise<DailyRanking[]> {
    // Calculer les ventes par infoporteur pour la date donnée
    const salesStats = await db
      .select({
        infoporteurId: voixInfoArticles.infoporteurId,
        totalSales: count(articlePurchases.id).as('totalSales'),
        totalRevenue: sum(articlePurchases.priceEuros).as('totalRevenue')
      })
      .from(articlePurchases)
      .innerJoin(voixInfoArticles, eq(articlePurchases.articleId, voixInfoArticles.id))
      .where(sql`DATE(${articlePurchases.createdAt}) = ${date}`)
      .groupBy(voixInfoArticles.infoporteurId)
      .orderBy(desc(count(articlePurchases.id)), desc(sum(articlePurchases.priceEuros)));

    // Créer les classements
    const rankings: DailyRanking[] = [];
    
    for (let i = 0; i < salesStats.length; i++) {
      const stat = salesStats[i];
      const rank = i + 1;
      const isTop10 = rank <= 10;

      const rankingData = {
        rankingDate: date,
        infoporteurId: stat.infoporteurId,
        rank,
        totalSales: Number(stat.totalSales),
        totalRevenue: stat.totalRevenue?.toString() || '0.00',
        isTop10,
        status: 'completed' as any
      };

      const [ranking] = await db
        .insert(dailyRankings)
        .values(rankingData)
        .returning();

      rankings.push(ranking);
    }

    return rankings;
  }

  async getDailyRankings(date: string): Promise<DailyRanking[]> {
    return await db
      .select()
      .from(dailyRankings)
      .where(eq(dailyRankings.rankingDate, date))
      .orderBy(dailyRankings.rank);
  }

  // ===== UTILITAIRES =====

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Supprimer les accents
      .replace(/[^a-z0-9\s]/g, '') // Garder seulement lettres, chiffres et espaces
      .trim()
      .replace(/\s+/g, '-') // Remplacer espaces par tirets
      .slice(0, 200); // Limiter la longueur
  }

  private estimateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }
}

// Export instance unique
export const voixInfoService = new VoixInfoService();