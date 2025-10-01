/**
 * Structured Logger for VISUAL Platform
 * 
 * Environment-aware logging with levels, contexts, and structured output.
 * Automatically masks sensitive data in production.
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  ip?: string;
  [key: string]: any;
}

interface LogOptions {
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  data?: any;
}

class Logger {
  private minLevel: LogLevel;
  private isProduction: boolean;
  private sensitiveKeys = [
    'password',
    'secret',
    'token',
    'apiKey',
    'api_key',
    'authorization',
    'stripe_key',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'access_token',
    'refresh_token',
  ];

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    // In production: only log INFO and above
    // In development: log everything (DEBUG and above)
    this.minLevel = this.isProduction ? LogLevel.INFO : LogLevel.DEBUG;
  }

  /**
   * Mask sensitive data in objects
   */
  private maskSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.maskSensitiveData(item));
    }

    const masked = { ...data };
    for (const key in masked) {
      const lowerKey = key.toLowerCase();
      const isSensitive = this.sensitiveKeys.some((sensitiveKey) =>
        lowerKey.includes(sensitiveKey.toLowerCase())
      );

      if (isSensitive) {
        const value = String(masked[key]);
        // Show first 4 and last 4 characters for debugging
        if (value.length > 8) {
          masked[key] = `${value.substring(0, 4)}****${value.substring(value.length - 4)}`;
        } else {
          masked[key] = '****';
        }
      } else if (typeof masked[key] === 'object') {
        masked[key] = this.maskSensitiveData(masked[key]);
      }
    }

    return masked;
  }

  /**
   * Format log message with timestamp and level
   */
  private format(options: LogOptions): string {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[options.level];
    const prefix = `[${timestamp}] [${levelName}]`;

    let message = `${prefix} ${options.message}`;

    if (options.context && Object.keys(options.context).length > 0) {
      const maskedContext = this.maskSensitiveData(options.context);
      message += ` | Context: ${JSON.stringify(maskedContext)}`;
    }

    if (options.data) {
      const maskedData = this.maskSensitiveData(options.data);
      message += ` | Data: ${JSON.stringify(maskedData)}`;
    }

    if (options.error) {
      message += ` | Error: ${options.error.message}`;
      if (!this.isProduction && options.error.stack) {
        message += `\n${options.error.stack}`;
      }
    }

    return message;
  }

  /**
   * Internal log method
   */
  private log(options: LogOptions): void {
    if (options.level < this.minLevel) {
      return; // Skip logs below minimum level
    }

    const formattedMessage = this.format(options);

    switch (options.level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        console.log(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(formattedMessage);
        break;
    }
  }

  /**
   * Log debug message (development only)
   */
  debug(message: string, context?: LogContext, data?: any): void {
    this.log({ level: LogLevel.DEBUG, message, context, data });
  }

  /**
   * Log informational message
   */
  info(message: string, context?: LogContext, data?: any): void {
    this.log({ level: LogLevel.INFO, message, context, data });
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext, data?: any): void {
    this.log({ level: LogLevel.WARN, message, context, data });
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: LogContext, data?: any): void {
    this.log({ level: LogLevel.ERROR, message, error, context, data });
  }

  /**
   * Log critical error (always logged, even in production)
   */
  critical(message: string, error?: Error, context?: LogContext, data?: any): void {
    this.log({ level: LogLevel.CRITICAL, message, error, context, data });
  }

  /**
   * Create a child logger with preset context
   */
  child(context: LogContext): ChildLogger {
    return new ChildLogger(this, context);
  }
}

/**
 * Child logger with preset context
 */
class ChildLogger {
  constructor(
    private parent: Logger,
    private baseContext: LogContext
  ) {}

  private mergeContext(additionalContext?: LogContext): LogContext {
    return { ...this.baseContext, ...additionalContext };
  }

  debug(message: string, context?: LogContext, data?: any): void {
    this.parent.debug(message, this.mergeContext(context), data);
  }

  info(message: string, context?: LogContext, data?: any): void {
    this.parent.info(message, this.mergeContext(context), data);
  }

  warn(message: string, context?: LogContext, data?: any): void {
    this.parent.warn(message, this.mergeContext(context), data);
  }

  error(message: string, error?: Error, context?: LogContext, data?: any): void {
    this.parent.error(message, error, this.mergeContext(context), data);
  }

  critical(message: string, error?: Error, context?: LogContext, data?: any): void {
    this.parent.critical(message, error, this.mergeContext(context), data);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for Express middleware
export function createRequestLogger(req: any): ChildLogger {
  return logger.child({
    requestId: req.id,
    method: req.method,
    path: req.path,
    ip: req.ip || req.connection?.remoteAddress,
    userId: req.user?.claims?.sub,
    sessionId: req.sessionID,
  });
}
