import pino, { LoggerOptions } from "pino";

const options: LoggerOptions =
  process.env.NODE_ENV === "production"
    ? {
        transport: {
          target: "pino/file",
          options: {
            destination: 1,
          },
        },
      }
    : process.env.NODE_ENV === "test"
    ? { enabled: false }
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            levelFirst: true,
          },
        },
      };
export const logger = pino(options, process.stdout);
