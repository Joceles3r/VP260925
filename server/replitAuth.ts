import { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { users, type User } from '@shared/schema';
import type { AuthUser } from '@shared/types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export interface ReplitUserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string;
}

/**
 * Get authenticated user from Replit headers
 */
export async function getReplitUser(req: Request): Promise<ReplitUserInfo | null> {
  try {
    // In Replit environment, user info is available in headers
    const userInfo = req.headers['x-replit-user-info'];
    
    if (!userInfo || typeof userInfo !== 'string') {
      return null;
    }

    const parsedUser = JSON.parse(userInfo) as ReplitUserInfo;
    
    // Validate required fields
    if (!parsedUser.id || !parsedUser.email) {
      return null;
    }

    return parsedUser;
  } catch (error) {
    console.error('Error parsing Replit user info:', error);
    return null;
  }
}

/**
 * Ensure user exists in database and return full user data
 */
export async function ensureUser(replitUser: ReplitUserInfo): Promise<AuthUser> {
  try {
    // Check if user exists
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, replitUser.email))
      .limit(1);

    let user: User;

    if (existingUsers.length > 0) {
      // Update existing user with latest Replit info
      const [updatedUser] = await db
        .update(users)
        .set({
          firstName: replitUser.firstName,
          lastName: replitUser.lastName,
          profileImageUrl: replitUser.profileImageUrl,
          updatedAt: new Date()
        })
        .where(eq(users.id, existingUsers[0].id))
        .returning();
      
      user = updatedUser;
    } else {
      // Create new user
      const [newUser] = await db
        .insert(users)
        .values({
          email: replitUser.email,
          firstName: replitUser.firstName,
          lastName: replitUser.lastName,
          profileImageUrl: replitUser.profileImageUrl,
          profileType: 'investor', // Default profile type
          simulationMode: true, // Start in simulation mode
          balanceEUR: '10000.00' // Start with €10,000 simulation balance
        })
        .returning();
      
      user = newUser;
    }

    // Return AuthUser with additional computed fields
    return {
      ...user,
      isAdmin: user.profileType === 'admin',
      isCreator: user.profileType === 'creator' || user.profileType === 'admin'
    };
  } catch (error) {
    console.error('Error ensuring user:', error);
    throw new Error('Failed to authenticate user');
  }
}

/**
 * Authentication middleware
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const replitUser = await getReplitUser(req);
    
    if (!replitUser) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    // Ensure user exists in database and attach to request
    const user = await ensureUser(replitUser);
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Authentication failed' 
    });
  }
}

/**
 * Admin authentication middleware
 */
export async function requireAdminAccess(req: Request, res: Response, next: NextFunction) {
  try {
    // First ensure user is authenticated
    await requireAuth(req, res, () => {});
    
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    // Check if user has admin access
    if (!req.user.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        error: 'Admin access required' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Authorization failed' 
    });
  }
}

/**
 * Optional authentication middleware (doesn't fail if no auth)
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const replitUser = await getReplitUser(req);
    
    if (replitUser) {
      const user = await ensureUser(replitUser);
      req.user = user;
    }
    
    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    // Continue without auth if optional
    next();
  }
}

/**
 * Get current user info (for API endpoints)
 */
export function getCurrentUser(req: Request): AuthUser | null {
  return req.user || null;
}