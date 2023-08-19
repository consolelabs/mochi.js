import { API_PROFILE_SERVER_URL, API_SERVER_URL } from "env";
import Formatter from "@consolelabs/mochi-formatter";
import Redis from "ioredis";
import { HOMEPAGE_URL, REDIS_DB, REDIS_HOST } from "constant";

Formatter.profileApi = API_PROFILE_SERVER_URL;
Formatter.baseApi = API_SERVER_URL;

const redis = new Redis(`redis://${REDIS_HOST}/${REDIS_DB}`);
Formatter.redis = redis;
Formatter.homepageUrl = HOMEPAGE_URL;
export const fmt = Formatter;
