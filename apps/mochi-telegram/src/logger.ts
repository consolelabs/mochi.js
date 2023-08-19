import pino from "pino";

import { PROD, TEST } from "env";

const options = PROD
  ? { transport: { target: "pino-pretty", levelFirst: true, colorize: false } }
  : TEST
  ? { enabled: false }
  : {
      transport: {
        target: "pino-pretty",
        colorize: true,
        levelFirst: true,
      },
    };
export const logger = pino(options, process.stdout);
