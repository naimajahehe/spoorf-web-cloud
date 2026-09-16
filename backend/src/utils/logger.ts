type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'refreshtoken',
  'secret',
  'authorization',
  'cookie',
  'creditcard',
  'cardnumber',
  'cvv',
  'midtrans_server_key',
]);

function maskSensitiveData(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(maskSensitiveData);
  }

  const masked: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      masked[key] = '***MASKED***';
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

export class Logger {
  private context: string;

  constructor(context: string = 'App') {
    this.context = context;
  }

  private formatMessage(level: LogLevel, message: string, meta?: any, requestId?: string): void {
    const timestamp = new Date().toISOString();
    const maskedMeta = meta ? maskSensitiveData(meta) : undefined;

    if (process.env.NODE_ENV === 'production') {
      const logEntry: Record<string, any> = {
        timestamp,
        level,
        context: this.context,
        message,
        requestId,
        ...maskedMeta
      };
      console.log(JSON.stringify(logEntry));
    } else {
      const colors: Record<LogLevel, string> = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m',  // Green
        warn: '\x1b[33m',  // Yellow
        error: '\x1b[31m', // Red
      };
      const reset = '\x1b[0m';
      const color = colors[level] || '';
      const reqIdPrefix = requestId ? ` [Req: ${requestId.substring(0, 8)}]` : '';
      const metaStr = maskedMeta ? ` ${JSON.stringify(maskedMeta)}` : '';
      console.log(`${color}[${timestamp}] [${level.toUpperCase()}] [${this.context}]${reqIdPrefix}${reset} ${message}${metaStr}`);
    }
  }

  public debug(message: string, meta?: any, requestId?: string): void {
    if (process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug') {
      this.formatMessage('debug', message, meta, requestId);
    }
  }

  public info(message: string, meta?: any, requestId?: string): void {
    this.formatMessage('info', message, meta, requestId);
  }

  public warn(message: string, meta?: any, requestId?: string): void {
    this.formatMessage('warn', message, meta, requestId);
  }

  public error(message: string, meta?: any, requestId?: string): void {
    this.formatMessage('error', message, meta, requestId);
  }
}

export const logger = new Logger('Server');