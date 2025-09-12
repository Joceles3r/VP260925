import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter for video uploads
const videoFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/ogg'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only video files are allowed.'), false);
  }
};

// File filter for images (thumbnails)
const imageFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only image files are allowed.'), false);
  }
};

// Configure multer for different file types
export const videoUpload = multer({
  storage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
  }
});

export const imageUpload = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for images
  }
});

export const documentUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and image files are allowed.'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for documents
  }
});

export interface FileUploadResult {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimetype: string;
}

export function processUploadedFile(file: Express.Multer.File): FileUploadResult {
  return {
    filename: file.filename,
    originalName: file.originalname,
    path: `/uploads/${file.filename}`,
    size: file.size,
    mimetype: file.mimetype,
  };
}

export function deleteFile(filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(process.cwd(), 'uploads', path.basename(filepath));
    
    fs.unlink(fullPath, (err) => {
      if (err) {
        console.error('Error deleting file:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function validateFileSize(size: number, maxSize: number): boolean {
  return size <= maxSize;
}

export function validateFileType(mimetype: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(mimetype);
}

// Helper function to generate thumbnail from video (would require ffmpeg in production)
export async function generateVideoThumbnail(videoPath: string): Promise<string> {
  // This is a placeholder - in production you would use ffmpeg
  // to generate actual thumbnails from video files
  
  // For now, return a placeholder path
  return '/uploads/placeholder-thumbnail.jpg';
}

// Helper function to validate video duration
export async function getVideoDuration(videoPath: string): Promise<number> {
  // This is a placeholder - in production you would use ffmpeg
  // to get actual video duration
  
  // Return a random duration between 30 seconds and 10 minutes for simulation
  return Math.floor(Math.random() * (600 - 30) + 30);
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  bitrate: number;
}

export async function getVideoMetadata(videoPath: string): Promise<VideoMetadata> {
  // This is a placeholder - in production you would use ffmpeg
  // to extract actual video metadata
  
  return {
    duration: await getVideoDuration(videoPath),
    width: 1920,
    height: 1080,
    fps: 30,
    bitrate: 5000000,
  };
}
