import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import { UPLOAD_LIMITS } from '@shared/constants';
import { sanitizeFilename, getFileExtension } from '@shared/utils';

// Ensure upload directories exist
const UPLOAD_DIRS = {
  videos: path.join(process.cwd(), 'uploads', 'videos'),
  images: path.join(process.cwd(), 'uploads', 'images'),
  documents: path.join(process.cwd(), 'uploads', 'documents'),
  thumbnails: path.join(process.cwd(), 'uploads', 'thumbnails')
};

// Create upload directories if they don't exist
async function ensureDirectories() {
  for (const dir of Object.values(UPLOAD_DIRS)) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      console.error(`Failed to create directory ${dir}:`, error);
    }
  }
}

// Initialize directories
ensureDirectories();

/**
 * Configure multer storage
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir = UPLOAD_DIRS.documents; // default
    
    // Determine upload directory based on file type
    if (file.mimetype.startsWith('video/')) {
      uploadDir = UPLOAD_DIRS.videos;
    } else if (file.mimetype.startsWith('image/')) {
      uploadDir = UPLOAD_DIRS.images;
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = getFileExtension(file.originalname);
    const sanitizedName = sanitizeFilename(file.originalname.replace(/\.[^/.]+$/, ''));
    
    const filename = `${sanitizedName}_${timestamp}_${randomString}.${extension}`;
    cb(null, filename);
  }
});

/**
 * File filter for uploads
 */
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const extension = getFileExtension(file.originalname);
  
  // Check file type
  if (file.mimetype.startsWith('video/')) {
    if (UPLOAD_LIMITS.ALLOWED_VIDEO_TYPES.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error(`Video type ${extension} not allowed. Allowed types: ${UPLOAD_LIMITS.ALLOWED_VIDEO_TYPES.join(', ')}`));
    }
  } else if (file.mimetype.startsWith('image/')) {
    if (UPLOAD_LIMITS.ALLOWED_IMAGE_TYPES.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error(`Image type ${extension} not allowed. Allowed types: ${UPLOAD_LIMITS.ALLOWED_IMAGE_TYPES.join(', ')}`));
    }
  } else {
    cb(new Error('Only video and image files are allowed'));
  }
};

/**
 * Configure multer with limits and validation
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Math.max(
      UPLOAD_LIMITS.MAX_VIDEO_SIZE_MB * 1024 * 1024,
      UPLOAD_LIMITS.MAX_IMAGE_SIZE_MB * 1024 * 1024
    )
  }
});

/**
 * Get file URL for serving
 */
export function getFileUrl(filename: string, type: 'video' | 'image' | 'thumbnail' = 'image'): string {
  return `/uploads/${type}/${filename}`;
}

/**
 * Delete file from storage
 */
export async function deleteFile(filepath: string): Promise<void> {
  try {
    await fs.unlink(filepath);
  } catch (error) {
    console.error('Failed to delete file:', filepath, error);
    // Don't throw error if file doesn't exist
  }
}

/**
 * Get file stats
 */
export async function getFileStats(filepath: string) {
  try {
    const stats = await fs.stat(filepath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory()
    };
  } catch (error) {
    return null;
  }
}

/**
 * Generate thumbnail for video (placeholder implementation)
 */
export async function generateThumbnail(videoPath: string): Promise<string | null> {
  try {
    // TODO: Implement actual thumbnail generation using ffmpeg or similar
    // For now, return a placeholder or default thumbnail
    console.log('Thumbnail generation not yet implemented for:', videoPath);
    return null;
  } catch (error) {
    console.error('Thumbnail generation failed:', error);
    return null;
  }
}

/**
 * Validate uploaded file
 */
export function validateUploadedFile(file: Express.Multer.File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }
  
  const extension = getFileExtension(file.originalname);
  const isVideo = file.mimetype.startsWith('video/');
  const isImage = file.mimetype.startsWith('image/');
  
  if (!isVideo && !isImage) {
    return { valid: false, error: 'Only video and image files are allowed' };
  }
  
  if (isVideo) {
    if (!UPLOAD_LIMITS.ALLOWED_VIDEO_TYPES.includes(extension)) {
      return { 
        valid: false, 
        error: `Video format ${extension} not supported. Allowed: ${UPLOAD_LIMITS.ALLOWED_VIDEO_TYPES.join(', ')}` 
      };
    }
    
    if (file.size > UPLOAD_LIMITS.MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      return { 
        valid: false, 
        error: `Video file too large. Maximum size: ${UPLOAD_LIMITS.MAX_VIDEO_SIZE_MB}MB` 
      };
    }
  }
  
  if (isImage) {
    if (!UPLOAD_LIMITS.ALLOWED_IMAGE_TYPES.includes(extension)) {
      return { 
        valid: false, 
        error: `Image format ${extension} not supported. Allowed: ${UPLOAD_LIMITS.ALLOWED_IMAGE_TYPES.join(', ')}` 
      };
    }
    
    if (file.size > UPLOAD_LIMITS.MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      return { 
        valid: false, 
        error: `Image file too large. Maximum size: ${UPLOAD_LIMITS.MAX_IMAGE_SIZE_MB}MB` 
      };
    }
  }
  
  return { valid: true };
}

export { UPLOAD_DIRS };