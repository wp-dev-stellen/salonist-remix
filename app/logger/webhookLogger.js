// utils/webhookLogger.js
import { createLogger, format, transports } from 'winston';

const webhookLogger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()} [WEBHOOK]: ${message}`;
    })
  ),
  transports: [
    new transports.File({ filename: 'logs/webhook-error.log', level: 'error' }),
    new transports.File({ filename: 'logs/webhook-combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  webhookLogger.add(new transports.Console({
    format: format.simple(),
  }));
}

export default webhookLogger;