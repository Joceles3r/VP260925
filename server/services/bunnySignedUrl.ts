import crypto from "crypto";

/**
 * Bunny.net CDN Token Authentication
 * 
 * This service generates signed URLs for Bunny.net CDN Token Authentication.
 * This provides COMPLETE anti-piracy protection for HLS streams by securing
 * ALL segments (.m3u8, .ts, .m4s) automatically.
 * 
 * IMPORTANT: CDN Token Authentication MUST be enabled in your Bunny.net
 * dashboard for this to work:
 * 
 * 1. Go to: Dashboard > Stream > Your Library > Security
 * 2. Enable "Token Authentication"
 * 3. Set a security key (this should match BUNNY_CDN_TOKEN_KEY env var)
 * 4. Choose "Path-Based Tokens" for HLS compatibility
 * 
 * @see https://docs.bunny.net/docs/cdn-token-authentication
 */

const BUNNY_CDN_TOKEN_KEY = process.env.BUNNY_CDN_TOKEN_KEY;
const BUNNY_PULL_ZONE = process.env.BUNNY_PULL_ZONE || "vz-xxxxx.b-cdn.net";

/**
 * Generates a Bunny.net CDN signed URL with token authentication
 * 
 * @param path - The video path (e.g., "/guid/playlist.m3u8")
 * @param expiresInSeconds - Token expiration time (default: 30 minutes)
 * @param userIp - Optional IP restriction for additional security
 * @returns Signed URL with embedded token
 */
export function generateBunnySignedUrl(
  path: string,
  expiresInSeconds = 30 * 60,
  userIp?: string
): string {
  if (!BUNNY_CDN_TOKEN_KEY) {
    throw new Error("BUNNY_CDN_TOKEN_KEY not configured - CDN token authentication disabled");
  }

  const expireTimestamp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const baseUrl = `https://${BUNNY_PULL_ZONE}`;
  
  // Token content: security_key + path + expiration + (optional)ip
  let tokenContent = `${BUNNY_CDN_TOKEN_KEY}${path}${expireTimestamp}`;
  if (userIp) {
    tokenContent += userIp;
  }

  // Generate SHA256 hash
  const hash = crypto.createHash('sha256').update(tokenContent).digest();
  
  // Base64 encode and format for Bunny.net
  let token = Buffer.from(hash).toString('base64');
  token = token
    .replace(/\n/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  // Use path-based token for HLS compatibility (auto-propagates to segments)
  const signedUrl = `${baseUrl}/bcdn_token=${token}&expires=${expireTimestamp}&token_path=${path}${path}`;
  
  return signedUrl;
}

/**
 * Generates a signed URL specifically for HLS streaming
 * Uses path-based tokens which automatically apply to all segments
 * 
 * @param videoGuid - Bunny.net video GUID
 * @param expiresInSeconds - Token expiration (default: 30 min)
 * @param userIp - Optional IP restriction
 * @returns Signed HLS manifest URL
 */
export function generateSignedHlsUrl(
  videoGuid: string,
  expiresInSeconds = 30 * 60,
  userIp?: string
): string {
  const manifestPath = `/${videoGuid}/playlist.m3u8`;
  return generateBunnySignedUrl(manifestPath, expiresInSeconds, userIp);
}

/**
 * Validates that Bunny.net CDN token authentication is properly configured
 * Should be called at server startup
 */
export function validateBunnyTokenConfig(): { 
  configured: boolean; 
  message: string;
  fallbackMode: boolean;
} {
  if (!BUNNY_CDN_TOKEN_KEY || !process.env.BUNNY_STREAM_API_KEY) {
    return {
      configured: false,
      message: "⚠️  BUNNY_CDN_TOKEN_KEY not set - Using fallback authentication (segments NOT protected)",
      fallbackMode: true
    };
  }

  if (process.env.VISUAL_PLAY_TOKEN_SECRET === "dev-secret-change-me") {
    return {
      configured: false,
      message: "⚠️  VISUAL_PLAY_TOKEN_SECRET using default value - INSECURE in production!",
      fallbackMode: true
    };
  }

  return {
    configured: true,
    message: "✅ Bunny.net CDN Token Authentication configured - Full HLS protection enabled",
    fallbackMode: false
  };
}
