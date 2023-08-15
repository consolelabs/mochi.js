import pino, { LoggerOptions } from "pino";
import { PACKAGE_ID } from "./constant";

const options: LoggerOptions =
  process.env.NODE_ENV === "production"
    ? {
        mixin() {
          return { package: PACKAGE_ID };
        },
        transport: {
          target: "pino/file",
          options: {
            destination: 1,
          },
        },
      }
    : process.env.NODE_ENV === "test"
    ? {
        mixin() {
          return { package: PACKAGE_ID };
        },
        enabled: false,
      }
    : {
        mixin() {
          return { package: PACKAGE_ID };
        },
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            levelFirst: true,
          },
        },
      };
export const logger = pino(options, process.stdout);
