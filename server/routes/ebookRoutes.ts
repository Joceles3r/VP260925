import express, { Request, Response } from 'express';
import { storage } from '../storage';
import { isAuthenticated } from '../replitAuth';
import { ebookLicenseService } from '../services/ebookLicenseService';
import { z } from 'zod';

const router = express.Router();

const validateBody = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: any) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error: any) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
  };
};

const requestDownloadSchema = z.object({
  licenseId: z.string().uuid(),
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    
    const ebooks = await storage.getEbooks(status, limit);
    return res.json({ ebooks });
  } catch (error: any) {
    console.error('[Ebooks] Error fetching ebooks:', error);
    return res.status(500).json({ error: 'Failed to fetch ebooks' });
  }
});

router.get('/my-licenses', isAuthenticated, async (req: any, res: any) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const licenses = await storage.getUserEbookLicenses(userId);
    
    const enrichedLicenses = await Promise.all(
      licenses.map(async (license) => {
        const ebook = await storage.getEbook(license.ebookId);
        const canDL = ebookLicenseService.checkQuota(license);
        return {
          ...license,
          ebook,
          canDownload: canDL.allowed,
          quotaInfo: canDL,
        };
      })
    );

    return res.json({ licenses: enrichedLicenses });
  } catch (error: any) {
    console.error('[Ebooks] Error fetching user licenses:', error);
    return res.status(500).json({ error: 'Failed to fetch licenses' });
  }
});

router.post(
  '/request-download',
  isAuthenticated,
  validateBody(requestDownloadSchema),
  async (req: any, res: any) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { licenseId } = req.body;

      const license = await storage.getEbookLicense(licenseId);
      if (!license) {
        return res.status(404).json({ error: 'License not found' });
      }

      if (license.userId !== userId) {
        return res.status(403).json({ error: 'License does not belong to you' });
      }

      if (license.status === 'revoked') {
        return res.status(403).json({ error: 'License has been revoked', reason: license.revokedReason });
      }

      const quotaCheck = ebookLicenseService.checkQuota(license);
      if (!quotaCheck.allowed) {
        return res.status(429).json({
          error: 'Download quota exceeded',
          quota: quotaCheck,
        });
      }

      const ebook = await storage.getEbook(license.ebookId);
      if (!ebook) {
        return res.status(404).json({ error: 'Ebook not found' });
      }

      const result = await ebookLicenseService.requestDownload(license, ebook, userId);

      return res.json({
        downloadUrl: `/api/ebooks/download/${result.nonce}`,
        expiresAt: result.expiresAt,
        nonce: result.nonce,
      });
    } catch (error: any) {
      console.error('[Ebooks] Error issuing download token:', error);
      return res.status(500).json({ error: error.message || 'Failed to issue download token' });
    }
  }
);

router.get('/download/:nonce', async (req: any, res: any) => {
  try {
    const { nonce } = req.params;

    const attempt = await storage.getEbookDownloadAttemptByNonce(nonce);
    if (!attempt) {
      return res.status(404).json({ error: 'Download link not found or expired' });
    }

    if (attempt.status !== 'pending') {
      return res.status(400).json({ error: `Download already ${attempt.status}` });
    }

    if (new Date() > attempt.expiresAt) {
      await storage.updateEbookDownloadAttempt(attempt.id, { status: 'expired' });
      return res.status(410).json({ error: 'Download link has expired' });
    }

    const tokenData = ebookLicenseService.verifyJWT(attempt.jwtToken);
    if (!tokenData || !tokenData.valid) {
      await storage.updateEbookDownloadAttempt(attempt.id, { status: 'failed', errorMessage: 'JWT verification failed' });
      return res.status(403).json({ error: 'Invalid download token' });
    }

    if (tokenData.payload?.jti !== attempt.jwtJti) {
      await storage.updateEbookDownloadAttempt(attempt.id, { status: 'failed', errorMessage: 'JWT JTI mismatch' });
      return res.status(403).json({ error: 'Token tampering detected' });
    }

    const ebook = await storage.getEbook(attempt.ebookId);
    if (!ebook) {
      await storage.updateEbookDownloadAttempt(attempt.id, { status: 'failed', errorMessage: 'Ebook not found' });
      return res.status(404).json({ error: 'Ebook file not found' });
    }

    const signedUrl = ebookLicenseService.generateSignedURL(ebook.storageKey, attempt.nonce, 60);

    await storage.updateEbookDownloadAttempt(attempt.id, {
      status: 'success',
      completedAt: new Date(),
    });

    await storage.incrementEbookLicenseUsage(attempt.licenseId);

    return res.json({
      message: 'Download authorized',
      signedUrl,
      expiresIn: 60,
      ebook: {
        id: ebook.id,
        title: ebook.title,
        author: ebook.author,
        format: ebook.format,
        fileSize: ebook.fileSize,
      },
      watermark: tokenData.watermark || null,
    });
  } catch (error: any) {
    console.error('[Ebooks] Error processing download:', error);
    return res.status(500).json({ error: 'Failed to process download' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ebook = await storage.getEbook(id);
    
    if (!ebook) {
      return res.status(404).json({ error: 'Ebook not found' });
    }

    return res.json({ ebook });
  } catch (error: any) {
    console.error('[Ebooks] Error fetching ebook:', error);
    return res.status(500).json({ error: 'Failed to fetch ebook' });
  }
});

export default router;
