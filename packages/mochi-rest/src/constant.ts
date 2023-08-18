import { name, version } from "../package.json";

export const apiUrls = {
  prod: {
    API_SERVER_URL: `https://api.mochi.pod.town/api/v1` as const,
    API_PROFILE_SERVER_URL:
      `https://api.mochi-profile.console.so/api/v1` as const,
    API_PAY_SERVER_URL: `https://api.mochi-pay.console.so/api/v1` as const,
  } as const,
  preview: {
    API_SERVER_URL: `https://preview-api.mochi.pod.town/api/v1` as const,
    API_PROFILE_SERVER_URL:
      `https://preview-api.mochi-profile.console.so/api/v1` as const,
    API_PAY_SERVER_URL:
      `https://preview-api.mochi-pay.console.so/api/v1` as const,
  },
};

export const PACKAGE_ID = `${name}@${version}`;
