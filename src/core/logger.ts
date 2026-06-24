import { createLogger, format, transports } from 'winston';

const isProduction = process.env.NODE_ENV === "production";
const logger = createLogger({
  level: isProduction ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    isProduction ? format.json() : format.simple()
  ),
  defaultMeta: { application: process.env.npm_package_name },
  transports: [
    new transports.Console({
      format: isProduction
        ? format.json()
        : format.combine(format.colorize(), format.simple()),
    }),
  ]
});

export default logger;
