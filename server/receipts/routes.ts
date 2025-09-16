import { Router } from 'express';
import type { Request, Response } from 'express';
import { isAuthenticated } from '../replitAuth';
import { storage } from '../storage';
import { 
  receiptRequestSchema, 
  generateReceiptSchema, 
  bulkReceiptGenerationSchema,
  receiptDownloadSchema 
} from './schemas';
import { 
  generateReceiptPDF,
  generateReceiptTXT,
  bulkGenerateReceipts,
  getUserReceipts,
  generatePDFTemplate,
  generateTXTTemplate,
  getTransactionTypeLabel
} from './handlers';

const router = Router();

// ROUTE: /api/receipts
// Get current user's receipts (simplified endpoint for authenticated user)
router.get('/', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user.claims.sub;
    const { limit = 20, dateFrom, dateTo, format } = req.query;
    
    // Use existing getUserReceipts function
    const receipts = await getUserReceipts(userId, {
      dateFrom,
      dateTo,
      format: format === 'pdf' || format === 'txt' ? format : undefined
    });

    // Limit results for performance
    const limitedReceipts = receipts.slice(0, parseInt(limit));

    // Log audit
    await storage.createAuditLog({
      userId,
      action: 'receipts_viewed',
      resourceType: 'user_receipts',
      resourceId: userId,
      details: { 
        resultCount: limitedReceipts.length,
        filters: { dateFrom, dateTo, format, limit }
      }
    });

    res.json({
      success: true,
      receipts: limitedReceipts,
      count: limitedReceipts.length
    });
  } catch (error) {
    console.error("Error fetching current user receipts:", error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch receipts';
    res.status(500).json({ message: errorMessage });
  }
});

// ROUTE: /api/receipts/user/:userId
// Get user receipts
router.get('/user/:userId', isAuthenticated, async (req: any, res: Response) => {
  try {
    const requestUserId = req.user.claims.sub;
    const { userId } = req.params;
    
    // Verify access permissions
    if (requestUserId !== userId) {
      const user = await storage.getUser(requestUserId);
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
    }
    
    // Parse and validate query parameters
    const validatedQuery = receiptRequestSchema.parse({
      userId,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      transactionId: req.query.transactionId,
      format: req.query.format,
      includeMetadata: req.query.includeMetadata === 'true'
    });

    const receipts = await getUserReceipts(userId, {
      dateFrom: validatedQuery.dateFrom,
      dateTo: validatedQuery.dateTo,
      transactionId: validatedQuery.transactionId,
      format: validatedQuery.format === 'pdf' || validatedQuery.format === 'txt' ? validatedQuery.format : undefined
    });

    // Log audit
    await storage.createAuditLog({
      userId: requestUserId,
      action: 'receipts_viewed',
      resourceType: 'user_receipts',
      resourceId: userId,
      details: { 
        targetUserId: userId,
        filters: validatedQuery,
        resultCount: receipts.length
      }
    });

    res.json({
      success: true,
      receipts,
      count: receipts.length
    });
  } catch (error) {
    console.error("Error fetching user receipts:", error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch receipts';
    res.status(500).json({ message: errorMessage });
  }
});

// ROUTE: /api/receipts/generate
// Generate receipt for transaction
router.post('/generate', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user.claims.sub;
    const validatedRequest = generateReceiptSchema.parse(req.body);
    
    // Verify transaction access
    const transaction = await storage.getTransaction(validatedRequest.transactionId);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    
    // Check access permissions
    if (transaction.userId !== userId) {
      const user = await storage.getUser(userId);
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    // Check if receipt already exists
    const existingReceipts = await storage.getReceiptsByTransaction(validatedRequest.transactionId);
    const existingFormat = existingReceipts.find(r => r.format === validatedRequest.format);
    
    if (existingFormat) {
      return res.json({
        success: true,
        message: "Receipt already exists",
        receiptId: existingFormat.id,
        receiptNumber: (existingFormat.metadata as any)?.receiptNumber || 'N/A',
        format: existingFormat.format,
        existing: true
      });
    }

    // Generate new receipt
    let receipt;
    if (validatedRequest.format === 'pdf') {
      receipt = await generateReceiptPDF(
        validatedRequest.transactionId, 
        userId,
        {
          templateVersion: validatedRequest.templateVersion,
          includeDetails: validatedRequest.includeDetails
        }
      );
    } else {
      receipt = await generateReceiptTXT(
        validatedRequest.transactionId, 
        userId,
        {
          includeDetails: validatedRequest.includeDetails
        }
      );
    }

    // Log audit
    await storage.createAuditLog({
      userId,
      action: 'receipt_generated',
      resourceType: 'receipt',
      resourceId: receipt.receiptId,
      details: { 
        transactionId: validatedRequest.transactionId,
        format: validatedRequest.format,
        receiptNumber: receipt.receiptNumber
      }
    });

    res.json({
      success: true,
      message: "Receipt generated successfully",
      receiptId: receipt.receiptId,
      receiptNumber: receipt.receiptNumber,
      format: receipt.format,
      downloadUrl: `/api/receipts/${receipt.receiptId}/download`
    });
  } catch (error) {
    console.error("Error generating receipt:", error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate receipt';
    res.status(500).json({ message: errorMessage });
  }
});

// ROUTE: /api/receipts/:receiptId/download
// Download specific receipt
router.get('/:receiptId/download', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user.claims.sub;
    const { receiptId } = req.params;
    const { format } = req.query;
    
    // Validate receipt ID
    const validatedParams = receiptDownloadSchema.parse({
      receiptId,
      format
    });

    // Get receipt
    const receipt = await storage.getReceipt(receiptId);
    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    // Verify access permissions
    if (receipt.userId !== userId) {
      const user = await storage.getUser(userId);
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    // BUGFIX: Generate transient content without creating duplicate records
    const downloadFormat = validatedParams.format || receipt.format;
    if (downloadFormat !== receipt.format) {
      // Generate alternative format if requested - TRANSIENT ONLY
      if (!receipt.transactionId) {
        return res.status(400).json({ message: "Transaction ID not found for receipt" });
      }
      const transaction = await storage.getTransaction(receipt.transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      // Get user details for transient receipt generation
      const user = await storage.getUser(transaction.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate transient receipt data without saving to DB
      const receiptData = {
        receiptNumber: `TEMP-${Date.now()}-${transaction.id.slice(0, 8)}`,
        transactionId: transaction.id,
        date: transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'),
        time: transaction.createdAt ? new Date(transaction.createdAt).toLocaleTimeString('fr-FR') : new Date().toLocaleTimeString('fr-FR'),
        amount: `${transaction.amount}€`,
        type: getTransactionTypeLabel(transaction.type),
        userEmail: user.email,
        userName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        commission: transaction.commission || '0.00',
        metadata: null // No details for transient downloads
      };

      let transientContent: Buffer | string;
      let contentType: string;
      let fileName: string;

      if (downloadFormat === 'pdf') {
        const pdfResult = await generatePDFTemplate(receiptData, 'transient-v1');
        transientContent = pdfResult.content;
        contentType = 'application/pdf';
        fileName = `receipt-${receiptData.receiptNumber}.pdf`;
      } else {
        transientContent = generateTXTTemplate(receiptData);
        contentType = 'text/plain';
        fileName = `receipt-${receiptData.receiptNumber}.txt`;
      }
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.send(transientContent);
    }

    // Log audit
    await storage.createAuditLog({
      userId,
      action: 'receipt_downloaded',
      resourceType: 'receipt',
      resourceId: receiptId,
      details: { 
        receiptId,
        format: downloadFormat,
        receiptNumber: (receipt.metadata as any)?.receiptNumber || 'N/A'
      }
    });

    // Return receipt content
    const contentType = receipt.format === 'pdf' ? 'application/pdf' : 'text/plain';
    const fileName = `receipt-${(receipt.metadata as any)?.receiptNumber || receiptId}.${receipt.format}`;
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(receipt.content);
  } catch (error) {
    console.error("Error downloading receipt:", error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to download receipt';
    res.status(500).json({ message: errorMessage });
  }
});

// ROUTE: /api/receipts/bulk/generate  
// Bulk generate receipts (Admin only)
router.post('/bulk/generate', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    // SECURITY FIX: Verify admin access AND KYC verification
    if (!user || user.profileType !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    if (!user.kycVerified) {
      return res.status(403).json({ message: "KYC verification required for bulk operations" });
    }
    
    const validatedRequest = bulkReceiptGenerationSchema.parse(req.body);

    // Safety check: limit bulk operations
    if (validatedRequest.userIds.length > 100) {
      return res.status(400).json({ message: "Maximum 100 users per bulk operation" });
    }

    const results = await bulkGenerateReceipts(validatedRequest, userId);

    // Log audit
    await storage.createAuditLog({
      userId,
      action: 'bulk_receipts_generated',
      resourceType: 'bulk_receipts',
      resourceId: userId,
      details: { 
        userCount: validatedRequest.userIds.length,
        dateRange: { from: validatedRequest.dateFrom, to: validatedRequest.dateTo },
        dryRun: validatedRequest.dryRun,
        results: {
          processed: results.processed,
          generated: results.generated,
          errors: results.errors.length
        }
      }
    });

    res.json({
      success: true,
      message: `Bulk receipt generation ${validatedRequest.dryRun ? 'simulated' : 'completed'}`,
      results
    });
  } catch (error) {
    console.error("Error in bulk receipt generation:", error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate bulk receipts';
    res.status(500).json({ message: errorMessage });
  }
});

// ROUTE: /api/receipts/auto-generate
// Auto-generate receipt for new transaction (internal webhook)
router.post('/auto-generate', async (req: Request, res: Response) => {
  try {
    // Verify internal authentication
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.RECEIPTS_WEBHOOK_KEY || 'default-receipts-key'}`) {
      return res.status(401).json({ message: "Unauthorized receipt webhook access" });
    }

    const { transactionId, formats = ['pdf'] } = req.body;
    
    if (!transactionId) {
      return res.status(400).json({ message: "Transaction ID required" });
    }

    // Get transaction
    const transaction = await storage.getTransaction(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const receipts = [];
    
    // Generate receipts in requested formats
    for (const format of formats) {
      try {
        // Check if receipt already exists
        const existingReceipts = await storage.getReceiptsByTransaction(transactionId);
        const existingFormat = existingReceipts.find(r => r.format === format);
        
        if (!existingFormat) {
          let receipt;
          if (format === 'pdf') {
            receipt = await generateReceiptPDF(transactionId, transaction.userId);
          } else if (format === 'txt') {
            receipt = await generateReceiptTXT(transactionId, transaction.userId);
          }
          
          if (receipt) {
            receipts.push(receipt);
          }
        }
      } catch (error) {
        console.error(`Error generating ${format} receipt:`, error);
      }
    }

    // Log audit
    await storage.createAuditLog({
      userId: 'system',
      action: 'auto_receipt_generated',
      resourceType: 'transaction',
      resourceId: transactionId,
      details: { 
        transactionId,
        formats,
        generatedCount: receipts.length
      }
    });

    res.json({
      success: true,
      message: "Auto-receipt generation completed",
      receipts: receipts.map(r => ({
        receiptId: r.receiptId,
        format: r.format,
        receiptNumber: r.receiptNumber
      }))
    });
  } catch (error) {
    console.error("Error in auto receipt generation:", error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to auto-generate receipts';
    res.status(500).json({ message: errorMessage });
  }
});

export { router as receiptsRouter };