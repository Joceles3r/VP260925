/**
 * Service de Conformité Légale VISUAL
 * Gestion des règlements et conformité aux lois européennes et françaises
 *
 * Conformité:
 * - RGPD (Règlement Général sur la Protection des Données)
 * - LCEN (Loi pour la Confiance dans l'Économie Numérique)
 * - Code Monétaire et Financier
 * - AMF (Autorité des Marchés Financiers)
 * - Directive MiFID II
 * - Directive anti-blanchiment (LCB-FT)
 */

import { storage } from '../storage';

export type LegalContentType =
  | 'terms_of_service'
  | 'privacy_policy'
  | 'cookie_policy'
  | 'legal_notice'
  | 'investment_rules'
  | 'platform_rules'
  | 'kyc_aml_policy'
  | 'risk_warning'
  | 'fee_schedule';

export type ConsentStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface LegalTerm {
  id: string;
  contentType: LegalContentType;
  version: string;
  title: string;
  content: string;
  summary?: string;
  language: string;
  isCurrent: boolean;
  effectiveDate: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  metadata?: Record<string, any>;
}

export interface UserConsent {
  id: string;
  userId: string;
  legalTermId: string;
  contentType: LegalContentType;
  version: string;
  status: ConsentStatus;
  consentedAt?: Date;
  withdrawnAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceLog {
  id: string;
  eventType: string;
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  action: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  complianceStatus?: string;
  createdAt: Date;
}

export class LegalComplianceService {
  /**
   * Récupère les termes légaux actuels par type
   */
  async getCurrentLegalTerms(
    contentType: LegalContentType,
    language: string = 'fr'
  ): Promise<LegalTerm | null> {
    try {
      const terms = await storage.query(
        `SELECT * FROM legal_terms
         WHERE content_type = $1
         AND language = $2
         AND is_current = true
         LIMIT 1`,
        [contentType, language]
      );

      if (terms.rows.length === 0) return null;

      return this.mapLegalTerm(terms.rows[0]);
    } catch (error) {
      console.error('[LegalCompliance] Error fetching legal terms:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les règlements actuels
   */
  async getAllCurrentTerms(language: string = 'fr'): Promise<LegalTerm[]> {
    try {
      const terms = await storage.query(
        `SELECT * FROM legal_terms
         WHERE language = $1
         AND is_current = true
         ORDER BY content_type`,
        [language]
      );

      return terms.rows.map(row => this.mapLegalTerm(row));
    } catch (error) {
      console.error('[LegalCompliance] Error fetching all terms:', error);
      throw error;
    }
  }

  /**
   * Récupère l'historique des versions d'un type de document
   */
  async getTermsHistory(
    contentType: LegalContentType,
    language: string = 'fr'
  ): Promise<LegalTerm[]> {
    try {
      const terms = await storage.query(
        `SELECT * FROM legal_terms
         WHERE content_type = $1
         AND language = $2
         ORDER BY effective_date DESC`,
        [contentType, language]
      );

      return terms.rows.map(row => this.mapLegalTerm(row));
    } catch (error) {
      console.error('[LegalCompliance] Error fetching terms history:', error);
      throw error;
    }
  }

  /**
   * Enregistre le consentement d'un utilisateur
   */
  async recordUserConsent(
    userId: string,
    contentType: LegalContentType,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserConsent> {
    try {
      const currentTerms = await this.getCurrentLegalTerms(contentType);

      if (!currentTerms) {
        throw new Error(`No current legal terms found for ${contentType}`);
      }

      const consent = await storage.query(
        `INSERT INTO user_consents (
          id, user_id, legal_term_id, content_type, version, status,
          consented_at, ip_address, user_agent, metadata
        ) VALUES (
          gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW(), $6, $7, $8
        ) RETURNING *`,
        [
          userId,
          currentTerms.id,
          contentType,
          currentTerms.version,
          'accepted',
          ipAddress,
          userAgent,
          JSON.stringify({ consentDate: new Date().toISOString() })
        ]
      );

      await this.logComplianceEvent({
        eventType: 'consent_recorded',
        userId,
        action: 'consent_accepted',
        details: {
          contentType,
          version: currentTerms.version,
          termsId: currentTerms.id
        },
        ipAddress,
        userAgent,
        complianceStatus: 'compliant'
      });

      return this.mapUserConsent(consent.rows[0]);
    } catch (error) {
      console.error('[LegalCompliance] Error recording consent:', error);
      throw error;
    }
  }

  /**
   * Vérifie si un utilisateur a consenti aux termes actuels
   */
  async hasUserConsented(
    userId: string,
    contentType: LegalContentType
  ): Promise<boolean> {
    try {
      const currentTerms = await this.getCurrentLegalTerms(contentType);

      if (!currentTerms) return false;

      const consent = await storage.query(
        `SELECT id FROM user_consents
         WHERE user_id = $1
         AND content_type = $2
         AND version = $3
         AND status = 'accepted'
         LIMIT 1`,
        [userId, contentType, currentTerms.version]
      );

      return consent.rows.length > 0;
    } catch (error) {
      console.error('[LegalCompliance] Error checking consent:', error);
      return false;
    }
  }

  /**
   * Récupère tous les consentements d'un utilisateur
   */
  async getUserConsents(userId: string): Promise<UserConsent[]> {
    try {
      const consents = await storage.query(
        `SELECT * FROM user_consents
         WHERE user_id = $1
         ORDER BY consented_at DESC`,
        [userId]
      );

      return consents.rows.map(row => this.mapUserConsent(row));
    } catch (error) {
      console.error('[LegalCompliance] Error fetching user consents:', error);
      throw error;
    }
  }

  /**
   * Retire le consentement d'un utilisateur (droit de retrait RGPD)
   */
  async withdrawConsent(
    userId: string,
    contentType: LegalContentType
  ): Promise<void> {
    try {
      await storage.query(
        `UPDATE user_consents
         SET status = 'withdrawn',
             withdrawn_at = NOW(),
             updated_at = NOW()
         WHERE user_id = $1
         AND content_type = $2
         AND status = 'accepted'`,
        [userId, contentType]
      );

      await this.logComplianceEvent({
        eventType: 'consent_withdrawn',
        userId,
        action: 'consent_withdrawn',
        details: { contentType },
        complianceStatus: 'withdrawal_processed'
      });
    } catch (error) {
      console.error('[LegalCompliance] Error withdrawing consent:', error);
      throw error;
    }
  }

  /**
   * Vérifie la conformité globale d'un utilisateur
   */
  async checkUserCompliance(userId: string): Promise<{
    compliant: boolean;
    missingConsents: LegalContentType[];
    details: Record<string, boolean>;
  }> {
    try {
      const requiredConsents: LegalContentType[] = [
        'terms_of_service',
        'privacy_policy',
        'cookie_policy'
      ];

      const details: Record<string, boolean> = {};
      const missingConsents: LegalContentType[] = [];

      for (const contentType of requiredConsents) {
        const hasConsent = await this.hasUserConsented(userId, contentType);
        details[contentType] = hasConsent;

        if (!hasConsent) {
          missingConsents.push(contentType);
        }
      }

      return {
        compliant: missingConsents.length === 0,
        missingConsents,
        details
      };
    } catch (error) {
      console.error('[LegalCompliance] Error checking compliance:', error);
      throw error;
    }
  }

  /**
   * Génère un avertissement sur les risques (obligatoire AMF)
   */
  getRiskWarning(language: string = 'fr'): string {
    const warnings: Record<string, string> = {
      fr: `⚠️ AVERTISSEMENT OBLIGATOIRE (Article L. 511-6 du Code Monétaire et Financier)

Investir dans des projets comporte des risques de perte totale ou partielle du capital investi.
Les performances passées ne préjugent pas des performances futures.
Tout investissement doit être effectué en connaissance de cause.

VISUAL n'est pas un établissement de crédit et ne fournit pas de conseil en investissement.

Conformément aux directives européennes (MiFID II), nous vous recommandons de :
- Ne pas investir plus que ce que vous pouvez vous permettre de perdre
- Diversifier vos investissements
- Évaluer votre tolérance au risque avant d'investir

Pour plus d'informations sur les risques, consultez notre règlement des investissements.`,
      en: `⚠️ MANDATORY WARNING (Article L. 511-6 of the French Monetary and Financial Code)

Investing in projects carries risks of total or partial loss of invested capital.
Past performance does not predict future performance.
Any investment must be made with full knowledge of the facts.

VISUAL is not a credit institution and does not provide investment advice.

In accordance with European directives (MiFID II), we recommend that you:
- Do not invest more than you can afford to lose
- Diversify your investments
- Assess your risk tolerance before investing

For more information on risks, consult our investment rules.`
    };

    return warnings[language] || warnings.fr;
  }

  /**
   * Enregistre un événement de conformité dans les logs
   */
  async logComplianceEvent(event: {
    eventType: string;
    userId?: string;
    resourceType?: string;
    resourceId?: string;
    action: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    complianceStatus?: string;
  }): Promise<void> {
    try {
      await storage.query(
        `INSERT INTO legal_compliance_logs (
          id, event_type, user_id, resource_type, resource_id,
          action, details, ip_address, user_agent, compliance_status
        ) VALUES (
          gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9
        )`,
        [
          event.eventType,
          event.userId,
          event.resourceType,
          event.resourceId,
          event.action,
          JSON.stringify(event.details || {}),
          event.ipAddress,
          event.userAgent,
          event.complianceStatus
        ]
      );
    } catch (error) {
      console.error('[LegalCompliance] Error logging compliance event:', error);
    }
  }

  /**
   * Génère un rapport de conformité (pour audits)
   */
  async generateComplianceReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    period: { start: Date; end: Date };
    totalConsents: number;
    consentsByType: Record<string, number>;
    withdrawals: number;
    complianceEvents: number;
    userComplianceRate: number;
  }> {
    try {
      const [consents, withdrawals, events, totalUsers] = await Promise.all([
        storage.query(
          `SELECT content_type, COUNT(*) as count
           FROM user_consents
           WHERE consented_at BETWEEN $1 AND $2
           AND status = 'accepted'
           GROUP BY content_type`,
          [startDate, endDate]
        ),
        storage.query(
          `SELECT COUNT(*) as count
           FROM user_consents
           WHERE withdrawn_at BETWEEN $1 AND $2
           AND status = 'withdrawn'`,
          [startDate, endDate]
        ),
        storage.query(
          `SELECT COUNT(*) as count
           FROM legal_compliance_logs
           WHERE created_at BETWEEN $1 AND $2`,
          [startDate, endDate]
        ),
        storage.query(`SELECT COUNT(*) as count FROM users`)
      ]);

      const consentsByType: Record<string, number> = {};
      let totalConsents = 0;

      consents.rows.forEach(row => {
        consentsByType[row.content_type] = parseInt(row.count);
        totalConsents += parseInt(row.count);
      });

      const userComplianceRate =
        totalUsers.rows[0]?.count > 0
          ? (totalConsents / (parseInt(totalUsers.rows[0].count) * 3)) * 100
          : 0;

      return {
        period: { start: startDate, end: endDate },
        totalConsents,
        consentsByType,
        withdrawals: parseInt(withdrawals.rows[0]?.count || '0'),
        complianceEvents: parseInt(events.rows[0]?.count || '0'),
        userComplianceRate: Math.round(userComplianceRate * 100) / 100
      };
    } catch (error) {
      console.error('[LegalCompliance] Error generating report:', error);
      throw error;
    }
  }

  private mapLegalTerm(row: any): LegalTerm {
    return {
      id: row.id,
      contentType: row.content_type,
      version: row.version,
      title: row.title,
      content: row.content,
      summary: row.summary,
      language: row.language,
      isCurrent: row.is_current,
      effectiveDate: new Date(row.effective_date),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
      metadata: row.metadata
    };
  }

  private mapUserConsent(row: any): UserConsent {
    return {
      id: row.id,
      userId: row.user_id,
      legalTermId: row.legal_term_id,
      contentType: row.content_type,
      version: row.version,
      status: row.status,
      consentedAt: row.consented_at ? new Date(row.consented_at) : undefined,
      withdrawnAt: row.withdrawn_at ? new Date(row.withdrawn_at) : undefined,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}

export const legalComplianceService = new LegalComplianceService();
