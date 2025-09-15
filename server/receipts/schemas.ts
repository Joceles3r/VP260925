import { z } from 'zod';

// RECEIPT VALIDATION SCHEMAS

export const receiptRequestSchema = z.object({
  transactionId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  format: z.enum(['pdf', 'txt']).default('pdf'),
  includeMetadata: z.boolean().default(false)
});

export const generateReceiptSchema = z.object({
  transactionId: z.string().uuid(),
  format: z.enum(['pdf', 'txt']).default('pdf'),
  templateVersion: z.string().default('v1'),
  includeDetails: z.boolean().default(true)
});

export const bulkReceiptGenerationSchema = z.object({
  userIds: z.array(z.string().uuid()).max(100),
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
  format: z.enum(['pdf', 'txt']).default('pdf'),
  dryRun: z.boolean().default(true)
});

export const receiptDownloadSchema = z.object({
  receiptId: z.string().uuid(),
  format: z.enum(['pdf', 'txt']).optional()
});

export type ReceiptRequest = z.infer<typeof receiptRequestSchema>;
export type GenerateReceiptRequest = z.infer<typeof generateReceiptSchema>;
export type BulkReceiptGeneration = z.infer<typeof bulkReceiptGenerationSchema>;
export type ReceiptDownload = z.infer<typeof receiptDownloadSchema>;