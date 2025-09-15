import { storage } from '../storage';
import type { ReceiptRequest, GenerateReceiptRequest, BulkReceiptGeneration } from './schemas';
import PDFDocument from 'pdfkit';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

// RECEIPT GENERATION HANDLERS

// HANDLER: generateReceiptPDF
export async function generateReceiptPDF(
  transactionId: string, 
  userId: string,
  options: { templateVersion?: string; includeDetails?: boolean } = {}
) {
  try {
    // Get transaction details
    const transaction = await storage.getTransaction(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Get transaction owner details for receipt content
    const transactionOwner = await storage.getUser(transaction.userId);
    if (!transactionOwner) {
      throw new Error('Transaction owner not found');
    }

    // Get requester details for authorization check
    const requesterUser = await storage.getUser(userId);
    if (!requesterUser) {
      throw new Error('Requester user not found');
    }

    // Verify ownership or admin access
    if (transaction.userId !== userId && requesterUser.profileType !== 'admin') {
      throw new Error('Access denied');
    }

    // Generate PDF content
    const receiptData = {
      receiptNumber: `VISUAL-${Date.now()}-${transaction.id.slice(0, 8)}`,
      transactionId: transaction.id,
      date: transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'),
      time: transaction.createdAt ? new Date(transaction.createdAt).toLocaleTimeString('fr-FR') : new Date().toLocaleTimeString('fr-FR'),
      amount: `${transaction.amount}€`,
      type: getTransactionTypeLabel(transaction.type),
      userEmail: transactionOwner.email,
      userName: `${transactionOwner.firstName || ''} ${transactionOwner.lastName || ''}`.trim(),
      commission: transaction.commission || '0.00',
      metadata: options.includeDetails ? transaction.metadata : null
    };

    const pdfResult = await generatePDFTemplate(receiptData, options.templateVersion || 'v1');
    
    // Create receipt record with file path instead of content blob
    const receipt = await storage.createReceipt({
      userId: transaction.userId,
      transactionId: transaction.id,
      type: 'investment',
      format: 'pdf',
      amount: transaction.amount,
      description: `Receipt for ${getTransactionTypeLabel(transaction.type)}`,
      receiptNumber: receiptData.receiptNumber,
      filePath: pdfResult.filePath,
      content: pdfResult.content.toString('base64'), // Store as base64 for compatibility
      metadata: {
        receiptNumber: receiptData.receiptNumber,
        templateVersion: options.templateVersion || 'v1',
        generatedAt: new Date().toISOString(),
        filePath: pdfResult.filePath
      }
    });

    return {
      receiptId: receipt.id,
      receiptNumber: receiptData.receiptNumber,
      content: pdfResult.content,
      filePath: pdfResult.filePath,
      format: 'pdf' as const
    };
  } catch (error) {
    console.error('Error generating PDF receipt:', error);
    throw error;
  }
}

// HANDLER: generateReceiptTXT
export async function generateReceiptTXT(
  transactionId: string, 
  userId: string,
  options: { includeDetails?: boolean } = {}
) {
  try {
    // Get transaction details
    const transaction = await storage.getTransaction(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Get transaction owner details for receipt content
    const transactionOwner = await storage.getUser(transaction.userId);
    if (!transactionOwner) {
      throw new Error('Transaction owner not found');
    }

    // Get requester details for authorization check
    const requesterUser = await storage.getUser(userId);
    if (!requesterUser) {
      throw new Error('Requester user not found');
    }

    // Verify ownership or admin access
    if (transaction.userId !== userId && requesterUser.profileType !== 'admin') {
      throw new Error('Access denied');
    }

    // Generate TXT content
    const receiptData = {
      receiptNumber: `VISUAL-${Date.now()}-${transaction.id.slice(0, 8)}`,
      transactionId: transaction.id,
      date: transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'),
      time: transaction.createdAt ? new Date(transaction.createdAt).toLocaleTimeString('fr-FR') : new Date().toLocaleTimeString('fr-FR'),
      amount: `${transaction.amount}€`,
      type: getTransactionTypeLabel(transaction.type),
      userEmail: transactionOwner.email,
      userName: `${transactionOwner.firstName || ''} ${transactionOwner.lastName || ''}`.trim(),
      commission: transaction.commission || '0.00',
      metadata: options.includeDetails ? transaction.metadata : null
    };

    const txtContent = generateTXTTemplate(receiptData);
    
    // Create receipt record
    const receipt = await storage.createReceipt({
      userId: transaction.userId,
      transactionId: transaction.id,
      type: 'investment',
      format: 'txt',
      amount: transaction.amount,
      description: `Receipt for ${getTransactionTypeLabel(transaction.type)}`,
      receiptNumber: receiptData.receiptNumber,
      content: txtContent,
      metadata: {
        receiptNumber: receiptData.receiptNumber,
        generatedAt: new Date().toISOString()
      }
    });

    return {
      receiptId: receipt.id,
      receiptNumber: receiptData.receiptNumber,
      content: txtContent,
      format: 'txt' as const
    };
  } catch (error) {
    console.error('Error generating TXT receipt:', error);
    throw error;
  }
}

// HANDLER: bulkGenerateReceipts
export async function bulkGenerateReceipts(
  request: BulkReceiptGeneration,
  adminUserId: string
) {
  const results = {
    processed: 0,
    generated: 0,
    errors: [] as string[],
    receipts: [] as { userId: string; receiptId: string; receiptNumber: string }[]
  };

  try {
    for (const userId of request.userIds) {
      results.processed++;
      
      try {
        // Get user transactions in date range
        const allTransactions = await storage.getUserTransactions(userId);
        const transactions = allTransactions.filter(t => {
          const transactionDate = t.createdAt ? new Date(t.createdAt) : new Date();
          const fromDate = new Date(request.dateFrom);
          const toDate = new Date(request.dateTo);
          return transactionDate >= fromDate && transactionDate <= toDate;
        });

        for (const transaction of transactions) {
          if (!request.dryRun) {
            // Check if receipt already exists
            const existingReceipts = await storage.getReceiptsByTransaction(transaction.id);
            if (existingReceipts.length === 0) {
              const receipt = await generateReceiptPDF(transaction.id, adminUserId, {
                templateVersion: 'bulk-v1',
                includeDetails: true
              });
              
              // Add audit log for bulk generation
              await storage.createAuditLog({
                userId: adminUserId,
                action: 'bulk_receipts_generated',
                resourceType: 'receipt',
                resourceId: receipt.receiptId,
                details: {
                  targetUserId: userId,
                  transactionId: transaction.id,
                  receiptNumber: receipt.receiptNumber,
                  batchOperation: true
                }
              });
              
              results.receipts.push({
                userId,
                receiptId: receipt.receiptId,
                receiptNumber: receipt.receiptNumber
              });
              results.generated++;
            }
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`User ${userId}: ${errorMsg}`);
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    results.errors.push(`Bulk generation error: ${errorMsg}`);
  }

  return results;
}

// HANDLER: getUserReceipts
export async function getUserReceipts(
  userId: string,
  options: { 
    dateFrom?: string; 
    dateTo?: string; 
    transactionId?: string;
    format?: 'pdf' | 'txt';
  } = {}
) {
  try {
    let receipts = await storage.getUserReceipts(userId);

    // Apply filters
    if (options.dateFrom || options.dateTo) {
      receipts = receipts.filter(receipt => {
        const receiptDate = receipt.createdAt ? new Date(receipt.createdAt) : new Date();
        if (options.dateFrom && receiptDate < new Date(options.dateFrom)) return false;
        if (options.dateTo && receiptDate > new Date(options.dateTo)) return false;
        return true;
      });
    }

    if (options.transactionId) {
      receipts = receipts.filter(receipt => receipt.transactionId === options.transactionId);
    }

    if (options.format) {
      receipts = receipts.filter(receipt => receipt.format === options.format);
    }

    // Format for API response
    return receipts.map(receipt => ({
      id: receipt.id,
      transactionId: receipt.transactionId,
      format: receipt.format,
      createdAt: receipt.createdAt,
      metadata: receipt.metadata,
      downloadUrl: `/api/receipts/${receipt.id}/download`
    }));
  } catch (error) {
    console.error('Error fetching user receipts:', error);
    throw error;
  }
}

// Helper: Get transaction type label
export function getTransactionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'investment': 'Investissement dans projet',
    'withdrawal': 'Retrait de fonds',
    'commission': 'Commission VISUAL',
    'redistribution': 'Redistribution gains',
    'deposit': 'Dépôt de fonds',
    'project_extension': 'Prolongation projet'
  };
  return labels[type] || type;
}

// Helper: Generate production-ready PDF using pdfkit
export async function generatePDFTemplate(data: any, version: string): Promise<{ filePath: string; content: Buffer }> {
  const doc = new PDFDocument();
  const chunks: Buffer[] = [];
  
  // Ensure receipts directory exists
  const receiptsDir = path.join(process.cwd(), 'receipts');
  if (!fs.existsSync(receiptsDir)) {
    fs.mkdirSync(receiptsDir, { recursive: true });
  }
  
  const fileName = `receipt-${data.receiptNumber.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`;
  const filePath = path.join(receiptsDir, fileName);
  
  return new Promise((resolve, reject) => {
    // Collect PDF chunks
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', async () => {
      try {
        const content = Buffer.concat(chunks);
        await fs.promises.writeFile(filePath, content);
        resolve({ filePath: `receipts/${fileName}`, content });
      } catch (error) {
        reject(error);
      }
    });
    
    // Generate PDF content
    doc.fontSize(20).text('VISUAL - Reçu de Paiement', 100, 100);
    doc.fontSize(12)
       .text(`Numéro de reçu: ${data.receiptNumber}`, 100, 150)
       .text(`Date: ${data.date} à ${data.time}`, 100, 170)
       .text(`Montant: ${data.amount}`, 100, 190)
       .text(`Type: ${data.type}`, 100, 210)
       .text(`Commission: ${data.commission}€`, 100, 230)
       .text(`Utilisateur: ${data.userName}`, 100, 260)
       .text(`Email: ${data.userEmail}`, 100, 280)
       .text(`Transaction ID: ${data.transactionId}`, 100, 300);
    
    if (data.metadata && version.includes('detail')) {
      doc.text('Détails:', 100, 330)
         .text(JSON.stringify(data.metadata, null, 2), 100, 350);
    }
    
    doc.text('Merci pour votre confiance en VISUAL !', 100, 500)
       .text('Ce reçu fait foi de votre paiement.', 100, 520)
       .text('Support: support@visual.fr | Site: https://visual.fr', 100, 550);
    
    doc.end();
  });
}

// Helper: Generate TXT template
export function generateTXTTemplate(data: any): string {
  // TXT_TEMPLATE_GENERATION
  return `═══════════════════════════════════════════
           VISUAL - REÇU DE PAIEMENT
═══════════════════════════════════════════

Numéro de reçu : ${data.receiptNumber}
Date/Heure     : ${data.date} à ${data.time}
Montant        : ${data.amount}
Type           : ${data.type}
Commission     : ${data.commission}€

Utilisateur    : ${data.userName}
Email          : ${data.userEmail}
Transaction ID : ${data.transactionId}

═══════════════════════════════════════════
  Merci pour votre confiance en VISUAL !
═══════════════════════════════════════════

Ce reçu fait foi de votre paiement.
Conservez-le pour vos dossiers comptables.

Support: support@visual.fr
Site: https://visual.fr

${data.metadata ? 'Détails: ' + JSON.stringify(data.metadata, null, 2) : ''}`;
}