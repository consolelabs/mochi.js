import { API_PROFILE_SERVER_URL } from "../constant";
import type { Fetcher } from "../utils";
import base from "./base";

const api = base.url(API_PROFILE_SERVER_URL, true);
let profiles = api.url("/profiles");

export class ProfileModule {
  mochi: {
    getById: Fetcher<string>;
  };

  telegram: {
    getById: Fetcher<{ telegramId: string; noFetchAmount?: boolean }>;
  };

  activities: {
    getByUser: Fetcher<{
      profileId: string;
      actions: (string | number)[];
      status?: "new" | "read";
      page?: number;
      size?: number;
    }>;
    markRead: Fetcher<{ profileId: string; ids: (string | number)[] }>;
  };

  connect: {
    requestCode: Fetcher<string>;
  };

  constructor(apiKey?: string) {
    profiles = profiles.auth(`Bearer ${apiKey}`);

    this.mochi = {
      getById: async function (profileId) {
        return api.url(`/profiles/${profileId}`).get();
      },
    };

    this.telegram = {
      getById: async function ({ telegramId, noFetchAmount }) {
        return api
          .url(`/profiles/get-by-telegram/${telegramId}`)
          .query(noFetchAmount ? { noFetchAmount } : {})
          .get();
      },
    };

    this.activities = {
      getByUser: async function ({
        profileId,
        page = 0,
        size = 10,
        actions,
        status,
      }) {
        return api
          .url(`/profiles/${profileId}/activities`)
          .query({ actions: actions.join("|"), page, size, status })
          .get();
      },
      markRead: async function ({ profileId, ids }) {
        return api.url(`/profiles/${profileId}/activities`).put({ ids });
      },
    };

    this.connect = {
      requestCode: async function (profileId) {
        return api.url(`/profiles/${profileId}/codes`).post();
      },
    };
  }
}
