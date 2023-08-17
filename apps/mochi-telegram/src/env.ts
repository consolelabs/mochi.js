import dotenv from "dotenv";

dotenv.config();

export const PROD = process.env.NODE_ENV === "production";
export const TEST = process.env.NODE_ENV === "test";
export const KAFKA_BROKERS = process.env.KAFKA_BROKERS || "";
export const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || "";
export const KAFKA_TOPIC = process.env.KAFKA_TOPIC || "";
export const KAFKA_ACTIVITY_PROFILE_TOPIC =
  process.env.KAFKA_ACTIVITY_PROFILE_TOPIC || "";
export const KAFKA_NOTIFICATION_TOPIC =
  process.env.KAFKA_NOTIFICATION_TOPIC || "";
export const KAFKA_ANALYTIC_TOPIC = process.env.KAFKA_ANALYTIC_TOPIC || "";
export const TELEGRAM_TOKEN =
  process.env.TELEGRAM_TOKEN || "invalid telegram token";
export const SENTRY_DSN = process.env.SENTRY_DSN || "invalid sentry dsn";

export const API_SERVER_URL = `${process.env.API_SERVER_HOST}/api/v1`;
export const API_PROFILE_SERVER_URL = `${process.env.MOCHI_PROFILE_API_SERVER_HOST}/api/v1`;
export const API_PAY_SERVER_URL = `${process.env.MOCHI_PAY_API_SERVER_HOST}/api/v1`;
export const API_PAY_SERVER_URL_V2 = `${process.env.MOCHI_PAY_API_SERVER_HOST}/api/v2`;

export const MOCHI_PROFILE_ACTIVITY_STATUS_NEW = "new";
export const MOCHI_APP_SERVICE = "Mochi App";
export const MOCHI_ACTION_PROFILE = "profile";
export const MOCHI_ACTION_WITHDRAW = "withdraw";

export const ECOCAL_API_KEY = `${process.env.ECOCAL_API_KEY}`;
export const ECOCAL_API_BASE_URL = `${process.env.ECOCAL_API_SERVER_HOST}/mochi`;

export const MTPROTO_API_ID = process.env.MTPROTO_API_ID || "";
export const MTPROTO_API_HASH = process.env.MTPROTO_API_HASH || "";

export const SHUTDOWN_CODE = process.env.SHUTDOWN_CODE || "";
export const API_CANVAS_PROCESS_URL = `${process.env.API_MOCHI_CANVAS_PROCESS_HOST}/api/v1`;
