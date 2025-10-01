# Bunny.net Video Upload Module - Setup Guide

## Overview
The Bunny.net video upload module provides secure video hosting with anti-piracy protection for the VISUAL platform. It supports clips, documentaries, and films with automated pricing based on duration and type.

## Features
- **Stripe Payment Integration**: Pay-per-upload with dynamic pricing
- **Anti-Piracy Protection**: Two-tier security system
- **Usage Tracking**: Monthly consumption estimates (storage, bandwidth, encoding)
- **Automated Workflow**: Upload → Payment → Hosting → Secure Playback

## Security Architecture

### Tier 1: Bunny.net CDN Token Authentication (Recommended)
**Full Protection** - All HLS segments (.m3u8, .ts, .m4s) are secured

#### Setup Required:
1. Go to Bunny.net Dashboard → Stream → Your Library → Security
2. Enable "Token Authentication"
3. Set a security key (min 32 characters, cryptographically random)
4. Choose "Path-Based Tokens" (required for HLS)
5. Add the security key to your environment:
   ```bash
   BUNNY_CDN_TOKEN_KEY=your-security-key-here
   BUNNY_PULL_ZONE=vz-xxxxx.b-cdn.net  # Your pull zone hostname
   ```

#### How It Works:
- Server generates signed URLs with embedded tokens
- Tokens automatically propagate to all HLS segments
- Bunny.net validates tokens at CDN edge
- Prevents direct segment access and URL sharing

### Tier 2: Legacy Token System (Fallback)
**Partial Protection** - Only manifest.m3u8 is protected

⚠️ **WARNING**: This mode leaves segments unprotected. Users can extract and share segment URLs.

#### Automatically Used When:
- `BUNNY_CDN_TOKEN_KEY` is not configured
- Bunny.net CDN Token Authentication is disabled

## Environment Variables

### Required for Basic Functionality:
```bash
# Bunny.net Stream API
BUNNY_LIBRARY_ID=your-library-id
BUNNY_STREAM_API_KEY=your-api-key

# Stripe Payment
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Replit Environment
REPLIT_DEV_DOMAIN=your-repl-name.repl.co
```

### Required for Full Security:
```bash
# Bunny.net CDN Token Authentication (TIER 1)
BUNNY_CDN_TOKEN_KEY=your-32-char-minimum-secret
BUNNY_PULL_ZONE=vz-xxxxx.b-cdn.net

# Legacy Token System (TIER 2 - used as fallback)
VISUAL_PLAY_TOKEN_SECRET=your-hmac-secret-key
```

## Pricing Structure

### Creator Upload Fees (VISUAL Platform):
- **Clips** (≤5 min): 2€
- **Documentaries** (5-30 min): 5€  
- **Films** (>30 min): 10€

### Bunny.net Real Costs (2025 Rates):
- **Storage**: €0.01/GB/month (2 regions)
- **Bandwidth**: €0.005/GB
- **Encoding**: €0.005/minute (included free)

### Monthly Caps:
- Minimum activation: €5/month
- Maximum cap: €50/month per creator

## API Endpoints

### Video Upload Flow:
1. `POST /api/bunny/videos/init-checkout` - Initialize Stripe payment
2. Stripe redirects to success/cancel URL
3. Webhook creates video object in Bunny.net
4. Frontend uploads binary video file
5. `GET /api/bunny/videos/session/:sessionId` - Check upload status

### Playback Flow:
1. `POST /api/bunny/videos/:guid/play-token` - Get playback token/URL
2. If TIER 1: Returns signed CDN URL (all segments protected)
3. If TIER 2: Returns legacy token (manifest-only protection)
4. `GET /api/bunny/videos/:guid/manifest.m3u8?token=xxx` - Stream manifest (TIER 2 only)

### Usage Analytics:
- `GET /api/bunny/usage/estimate` - Monthly consumption and cost estimate

## Frontend Integration

### Page: `/creator/videos`
- Video upload form with type and duration selection
- Real-time pricing calculation
- Stripe checkout integration
- Monthly usage dashboard

### Components:
- `VideoUploadForm`: Handles upload workflow
- `UsageEstimateCard`: Displays monthly costs

## Database Schema

The module uses the existing `videoDeposits` table:
```typescript
{
  id: string (UUID)
  userId: string
  projectId: string
  videoGuid: string (Bunny.net GUID)
  type: 'clip' | 'documentary' | 'film'
  title: string
  duration: number (seconds)
  fileSize: number (bytes)
  uploadFeeEUR: number
  paymentIntentId: string (Stripe)
  status: 'pending' | 'uploaded' | 'processing' | 'ready' | 'failed'
  bunnyStatus: object (Bunny.net video metadata)
  createdAt: timestamp
  uploadedAt: timestamp
}
```

## Testing Checklist

- [ ] Upload small clip (≤5 min) → Verify 2€ charge
- [ ] Upload documentary (5-30 min) → Verify 5€ charge
- [ ] Upload film (>30 min) → Verify 10€ charge
- [ ] Verify Stripe webhook creates video deposit
- [ ] Test video playback with token
- [ ] Verify usage estimate calculation
- [ ] Test CDN Token Authentication (if configured)
- [ ] Verify segment protection (try accessing .ts directly)

## Security Best Practices

1. **Never commit secrets** to repository
2. **Use strong random values** for all token keys (min 32 chars)
3. **Enable TIER 1** (CDN Token Auth) for production
4. **Monitor usage** to detect abuse
5. **Rotate keys** periodically (every 90 days)
6. **Log all playback** requests for auditing

## Troubleshooting

### Issue: Segments not protected
- **Cause**: CDN Token Authentication not enabled in Bunny.net
- **Fix**: Follow TIER 1 setup instructions above

### Issue: "Token invalid" errors
- **Cause**: VISUAL_PLAY_TOKEN_SECRET mismatch or using default value
- **Fix**: Set strong random secret and restart server

### Issue: Upload fails after payment
- **Cause**: Stripe webhook not configured or failing
- **Fix**: Check webhook secret and logs

### Issue: Usage estimate shows 0€
- **Cause**: No video deposits found for user
- **Fix**: Verify videoDeposits are being created

## Support Resources

- [Bunny.net CDN Token Authentication Docs](https://docs.bunny.net/docs/cdn-token-authentication)
- [Bunny.net Stream API Reference](https://docs.bunny.net/reference/stream-api-overview)
- [Stripe Checkout Session Docs](https://stripe.com/docs/api/checkout/sessions)

---

**Last Updated**: October 2025  
**Module Version**: 1.0.0
