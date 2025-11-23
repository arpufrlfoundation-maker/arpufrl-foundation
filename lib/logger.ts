/**
 * Production-Ready Logger
 * Replaces console.log/error in production with proper logging
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  data?: any
  stack?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private formatLog(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(data && { data }),
    }
  }

  info(message: string, data?: any) {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, data || '')
    } else {
      // In production, send to logging service (e.g., Sentry, CloudWatch)
      this.sendToLoggingService(this.formatLog('info', message, data))
    }
  }

  warn(message: string, data?: any) {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, data || '')
    } else {
      this.sendToLoggingService(this.formatLog('warn', message, data))
    }
  }

  error(message: string, error?: Error | any, data?: any) {
    const logEntry = this.formatLog('error', message, data)
    
    if (error instanceof Error) {
      logEntry.stack = error.stack
    }

    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, error, data || '')
    } else {
      // In production, send to error tracking service
      this.sendToLoggingService(logEntry)
      // Optionally send to Sentry or similar
      // Sentry.captureException(error)
    }
  }

  debug(message: string, data?: any) {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data || '')
    }
    // Don't log debug in production unless explicitly enabled
  }

  private sendToLoggingService(logEntry: LogEntry) {
    // TODO: Implement actual logging service integration
    // Examples:
    // - Sentry.captureMessage(logEntry)
    // - Winston logger
    // - CloudWatch Logs
    // - Datadog
    
    // For now, just use console in production (better than nothing)
    const logMethod = logEntry.level === 'error' ? console.error : console.log
    logMethod(JSON.stringify(logEntry))
  }
}

export const logger = new Logger()
