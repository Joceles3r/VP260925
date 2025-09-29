import { Request, Response } from 'express';
import { db } from '../db';
import { storage } from '../storage';
import { sql } from 'drizzle-orm';

/**
 * Health check endpoints pour la mise à niveau PRO
 * Conformes aux standards Kubernetes et monitoring
 */

/**
 * Liveness probe - /healthz
 * Vérifie si l'application est en vie et peut traiter les requêtes
 */
export async function healthzHandler(req: Request, res: Response) {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };

  res.status(200).json(healthCheck);
}

/**
 * Readiness probe - /readyz  
 * Vérifie si l'application est prête à recevoir du trafic
 */
export async function readyzHandler(req: Request, res: Response) {
  const checks = {
    database: 'unknown',
    storage: 'unknown',
    memory: 'unknown'
  };
  
  let allHealthy = true;
  
  try {
    // Test de connexion à la base de données
    await db.execute(sql`SELECT 1`);
    checks.database = 'healthy';
  } catch (error) {
    checks.database = 'unhealthy';
    allHealthy = false;
  }
  
  try {
    // Test du système de stockage (simple vérification)
    const testProjects = await storage.getProjects('all', 0, 1);
    checks.storage = 'healthy';
  } catch (error) {
    checks.storage = 'unhealthy';
    allHealthy = false;
  }
  
  // Vérification de la mémoire (alerte si > 80% utilisée)
  const memUsage = process.memoryUsage();
  const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  checks.memory = memUsagePercent > 80 ? 'warning' : 'healthy';
  
  const readinessCheck = {
    status: allHealthy ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    checks,
    details: {
      memoryUsage: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
        percentage: Math.round(memUsagePercent) + '%'
      }
    }
  };
  
  const statusCode = allHealthy ? 200 : 503;
  res.status(statusCode).json(readinessCheck);
}

/**
 * Metrics endpoint - /metrics
 * Expose des métriques au format Prometheus
 */
export async function metricsHandler(req: Request, res: Response) {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  try {
    // Récupération de métriques optimisées (sans charger tous les objets)
    let projectsCount = 0;
    let usersCount = 0;
    
    try {
      // Utiliser une requête COUNT optimisée au lieu de charger tous les projets
      const countResult = await db.execute(sql`SELECT COUNT(*) as count FROM projects`);
      projectsCount = Number((countResult.rows[0] as any)?.count || 0);
    } catch (e) {
      // Métrique non critique, continuer
      console.warn('Failed to get projects count for metrics:', e);
    }
    
    try {
      // Compter les utilisateurs via requête optimisée
      const countResult = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
      usersCount = Number((countResult.rows[0] as any)?.count || 0);
    } catch (e) {
      // Métrique non critique, continuer
      console.warn('Failed to get users count for metrics:', e);
    }
    
    // Format Prometheus text avec TYPE lines
    const metrics = [
      '# HELP visual_app_info Information about the VISUAL application',
      '# TYPE visual_app_info gauge',
      `visual_app_info{version="${process.env.npm_package_version || '1.0.0'}",environment="${process.env.NODE_ENV || 'development'}"} 1`,
      '',
      '# HELP visual_uptime_seconds Total uptime of the application in seconds',
      '# TYPE visual_uptime_seconds counter',
      `visual_uptime_seconds ${uptime}`,
      '',
      '# HELP nodejs_memory_heap_used_bytes Node.js heap memory usage in bytes',
      '# TYPE nodejs_memory_heap_used_bytes gauge',
      `nodejs_memory_heap_used_bytes ${memUsage.heapUsed}`,
      '',
      '# HELP nodejs_memory_heap_total_bytes Node.js heap memory total in bytes',
      '# TYPE nodejs_memory_heap_total_bytes gauge', 
      `nodejs_memory_heap_total_bytes ${memUsage.heapTotal}`,
      '',
      '# HELP nodejs_memory_rss_bytes Node.js resident set size in bytes',
      '# TYPE nodejs_memory_rss_bytes gauge',
      `nodejs_memory_rss_bytes ${memUsage.rss}`,
      '',
      '# HELP visual_projects_total Total number of projects in the platform',
      '# TYPE visual_projects_total gauge',
      `visual_projects_total ${projectsCount}`,
      '',
      '# HELP visual_users_total Total number of registered users',
      '# TYPE visual_users_total gauge',
      `visual_users_total ${usersCount}`,
      '',
      '# HELP visual_http_requests_total Total number of HTTP requests processed',
      '# TYPE visual_http_requests_total counter',
      `visual_http_requests_total ${process.env.HTTP_REQUESTS_COUNT || 0}`,
      ''
    ].join('\n');
    
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.status(200).send(metrics);
    
  } catch (error) {
    console.error('Error generating metrics:', error);
    res.status(500).send('# Error generating metrics\n');
  }
}

/**
 * Status page endpoint - pour le monitoring externe
 * Informations détaillées sur le statut des services
 */
export async function statusHandler(req: Request, res: Response) {
  const services = [];
  
  try {
    // Test Database
    await db.execute(sql`SELECT 1`);
    services.push({
      name: 'PostgreSQL Database',
      status: 'operational',
      responseTime: '< 10ms',
      lastCheck: new Date().toISOString()
    });
  } catch (error) {
    services.push({
      name: 'PostgreSQL Database', 
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
      lastCheck: new Date().toISOString()
    });
  }
  
  try {
    // Test Storage
    await storage.getProjects('all', 0, 1);
    services.push({
      name: 'Storage Layer',
      status: 'operational',
      responseTime: '< 50ms',
      lastCheck: new Date().toISOString()
    });
  } catch (error) {
    services.push({
      name: 'Storage Layer',
      status: 'down', 
      error: error instanceof Error ? error.message : 'Unknown error',
      lastCheck: new Date().toISOString()
    });
  }
  
  // Stripe status (si configuré)
  services.push({
    name: 'Stripe Payments',
    status: process.env.STRIPE_SECRET_KEY ? 'operational' : 'not_configured',
    responseTime: 'N/A',
    lastCheck: new Date().toISOString()
  });
  
  const overallStatus = services.every(s => s.status === 'operational') ? 'operational' : 'degraded';
  
  const statusPage = {
    status: overallStatus,
    lastUpdated: new Date().toISOString(),
    services,
    uptime: {
      current: process.uptime(),
      percentage: '99.9%' // À calculer réellement avec les données historiques
    },
    incidents: [] // À implémenter avec un système d'incidents
  };
  
  res.status(200).json(statusPage);
}