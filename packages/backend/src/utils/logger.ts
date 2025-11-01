type LogLevel = 'info' | 'warn' | 'error';

function log(level: LogLevel, event: string, metadata?: Record<string, unknown>): void {
  const payload = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...(metadata ?? {}),
  };

  // eslint-disable-next-line no-console
  console[level](JSON.stringify(payload));
}

export const logger = {
  info: (event: string, metadata?: Record<string, unknown>) => log('info', event, metadata),
  warn: (event: string, metadata?: Record<string, unknown>) => log('warn', event, metadata),
  error: (event: string, metadata?: Record<string, unknown>) => log('error', event, metadata),
};
