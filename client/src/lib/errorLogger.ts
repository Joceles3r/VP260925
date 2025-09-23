/**
 * Service de logging d'erreurs côté client
 * Améliore le debugging et monitoring des erreurs pour les projets d'investissement
 */

interface ErrorLogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  details?: any;
  context?: {
    url: string;
    userAgent: string;
    userId?: string;
    component?: string;
    action?: string;
  };
  stack?: string;
  fingerprint?: string;
}

class ErrorLogger {
  private logs: ErrorLogEntry[] = [];
  private maxLogs = 100; // Limite pour éviter la surcharge mémoire
  private userId: string | null = null;

  constructor() {
    // Capturer les erreurs non gérées
    window.addEventListener('error', this.handleGlobalError.bind(this));
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
  }

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  private generateFingerprint(error: string, stack?: string): string {
    // Génère un hash simple pour grouper les erreurs similaires
    const content = `${error}${stack?.split('\n')[0] || ''}`;
    return btoa(content).substring(0, 12);
  }

  private createLogEntry(
    level: 'error' | 'warn' | 'info',
    message: string,
    details?: any,
    component?: string,
    action?: string,
    stack?: string
  ): ErrorLogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      details: details ? JSON.parse(JSON.stringify(details, null, 2)) : undefined,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId: this.userId || undefined,
        component,
        action
      },
      stack,
      fingerprint: this.generateFingerprint(message, stack)
    };
  }

  private addLog(entry: ErrorLogEntry) {
    this.logs.unshift(entry);
    
    // Limiter le nombre de logs en mémoire
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log dans la console en développement
    if (import.meta.env.DEV) {
      const consoleMethod = entry.level === 'error' ? 'error' : 
                           entry.level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](`[ErrorLogger] ${entry.message}`, entry);
    }
  }

  private handleGlobalError(event: ErrorEvent) {
    this.logError(
      event.message,
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        originalError: event.error
      },
      'Global',
      'unhandled_error',
      event.error?.stack
    );
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent) {
    const reason = event.reason;
    this.logError(
      `Unhandled Promise Rejection: ${reason?.message || reason}`,
      {
        reason,
        promise: event.promise
      },
      'Global',
      'unhandled_rejection',
      reason?.stack
    );
  }

  // API publique pour logger des erreurs
  logError(
    message: string,
    details?: any,
    component?: string,
    action?: string,
    stack?: string
  ) {
    const entry = this.createLogEntry('error', message, details, component, action, stack);
    this.addLog(entry);
    
    // En production, on pourrait envoyer les erreurs critiques à un service externe
    if (!import.meta.env.DEV && entry.level === 'error') {
      this.sendToRemoteService(entry).catch(() => {
        // Silently fail - ne pas perturber l'UX
      });
    }
  }

  logWarning(
    message: string,
    details?: any,
    component?: string,
    action?: string
  ) {
    const entry = this.createLogEntry('warn', message, details, component, action);
    this.addLog(entry);
  }

  logInfo(
    message: string,
    details?: any,
    component?: string,
    action?: string
  ) {
    const entry = this.createLogEntry('info', message, details, component, action);
    this.addLog(entry);
  }

  // Log spécialisé pour les erreurs d'API
  logApiError(
    method: string,
    url: string,
    status: number,
    statusText: string,
    responseData?: any,
    component?: string
  ) {
    this.logError(
      `API Error: ${method} ${url}`,
      {
        method,
        url,
        status,
        statusText,
        responseData,
        retryable: status >= 500 || status === 408 || status === 429
      },
      component,
      'api_request'
    );
  }

  // Log spécialisé pour les erreurs de récupération de projets
  logProjectsFetchError(
    error: any,
    filters?: {
      category?: string;
      search?: string;
      sort?: string;
    }
  ) {
    this.logError(
      'Failed to fetch projects',
      {
        error: error?.message,
        status: error?.status,
        details: error?.details,
        retryable: error?.retryable,
        filters,
        actionTaken: 'user_will_see_error_ui'
      },
      'ProjectsPage',
      'fetch_projects',
      error?.stack
    );
  }

  // Récupérer les logs récents pour le debugging
  getRecentLogs(limit: number = 20): ErrorLogEntry[] {
    return this.logs.slice(0, limit);
  }

  // Récupérer les erreurs par fingerprint pour grouper
  getErrorsByFingerprint(): Record<string, ErrorLogEntry[]> {
    const grouped: Record<string, ErrorLogEntry[]> = {};
    
    this.logs.forEach(log => {
      if (log.level === 'error' && log.fingerprint) {
        if (!grouped[log.fingerprint]) {
          grouped[log.fingerprint] = [];
        }
        grouped[log.fingerprint].push(log);
      }
    });

    return grouped;
  }

  // Envoyer les erreurs à un service externe (en production)
  private async sendToRemoteService(entry: ErrorLogEntry): Promise<void> {
    // En production, on pourrait envoyer à un service comme Sentry, LogRocket, etc.
    // Pour l'instant, on se contente d'un endpoint interne
    try {
      await fetch('/api/logs/client-errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry),
        credentials: 'include'
      });
    } catch (error) {
      // Ne pas logger cette erreur pour éviter les boucles infinies
    }
  }

  // Nettoyer les logs (utile pour les tests ou reset)
  clearLogs() {
    this.logs = [];
  }
}

// Instance singleton
export const errorLogger = new ErrorLogger();

// Hook React pour utiliser le logger avec le contexte du composant
export function useErrorLogger(componentName: string) {
  return {
    logError: (message: string, details?: any, action?: string, stack?: string) => 
      errorLogger.logError(message, details, componentName, action, stack),
    
    logWarning: (message: string, details?: any, action?: string) => 
      errorLogger.logWarning(message, details, componentName, action),
    
    logInfo: (message: string, details?: any, action?: string) => 
      errorLogger.logInfo(message, details, componentName, action),
    
    logApiError: (method: string, url: string, status: number, statusText: string, responseData?: any) => 
      errorLogger.logApiError(method, url, status, statusText, responseData, componentName),
      
    logProjectsFetchError: (error: any, filters?: any) => 
      errorLogger.logProjectsFetchError(error, filters)
  };
}