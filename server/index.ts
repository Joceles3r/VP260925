import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { validateSecrets } from "./config/secretsValidator";
import { setupCORS } from "./config/corsConfig";
import { setupSecurity } from "./config/security";
import { setupGDPRCompliance } from "./middleware/gdprCompliance";

// 🔒 SECURITY: Validate all critical secrets before starting server
// In production, this will block startup if default/insecure secrets are detected
validateSecrets(false); // Set to true to enforce strict validation in development too

const app = express();

// 🔒 SÉCURITÉ: Configuration complète de sécurité
setupSecurity(app);

// 🛡️ RGPD: Conformité et protection des données
setupGDPRCompliance(app);

// 🌍 CORS: Enable Cross-Origin Resource Sharing with environment-aware settings
app.use(setupCORS());

// Note: Do NOT add express.json() here - it must be added after Stripe webhook
// to ensure webhook receives raw body for signature verification

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, async () => {
    log(`serving on port ${port}`);
    
    // Initialiser les paramètres par défaut du mini réseau social
    try {
      const { miniSocialConfigService } = await import('./services/miniSocialConfigService');
      await miniSocialConfigService.initializeDefaultParams();
      log('[MiniSocial] Paramètres par défaut initialisés');
    } catch (error) {
      console.error('[MiniSocial] Erreur lors de l\'initialisation des paramètres:', error);
    }

    // Démarrer le service VisualAI pour la surveillance automatique des Live Shows
    try {
      const { visualAIService } = await import('./services/visualAIService');
      await visualAIService.startMonitoring();
      log('[VisualAI] Service de surveillance automatique démarré');
    } catch (error) {
      console.error('[VisualAI] Erreur lors du démarrage du service:', error);
    }

    // Démarrer le service de modération automatique avec cleanup périodique
    try {
      const { moderationService } = await import('./services/moderationService');
      
      // Configurer le cleanup périodique (toutes les heures)
      setInterval(() => {
        moderationService.cleanup();
      }, 60 * 60 * 1000);
      
      log('[Moderation] Service de modération automatique initialisé');
    } catch (error) {
      console.error('[Moderation] Erreur lors de l\'initialisation du service:', error);
    }

    // Initialiser les services de gestion du trafic et highlights
    try {
      const { highlightsService } = await import('./services/highlightsService');
      const { trafficModeService } = await import('./services/trafficModeService');
      
      // Les services sont maintenant disponibles pour utilisation
      log('[TrafficMode] Services de gestion du trafic et highlights initialisés');
    } catch (error) {
      console.error('[TrafficMode] Erreur lors de l\'initialisation des services:', error);
    }
  });
})();
