import { createLogger, format, transports } from 'winston';

export function logToConsole(level: string, message: string, metadata?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  
  if (metadata) {
    console[level as 'log' | 'error' | 'warn'](
      logMessage, 
      JSON.stringify(metadata, null, 2)
    );
  } else {
    console[level as 'log' | 'error' | 'warn'](logMessage);
  }
}

export const dbLogger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.colorize(),
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.printf(({ timestamp, level, message, ...metadata }) => {
      let msg = `[${timestamp}] ${level}: ${message}`;
      const metaStr = Object.keys(metadata).length 
        ? ` | ${JSON.stringify(metadata)}` 
        : '';
      return msg + metaStr;
    })
  ),
  transports: [
    new transports.Console()
  ]
});