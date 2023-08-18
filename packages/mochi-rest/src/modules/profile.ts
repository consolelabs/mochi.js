import { FullOptions } from "../mochi";
import {
  Activity,
  AnySchema,
  Code,
  CodeSchema,
  ListActivity,
  Profile,
  ProfileSchema,
  getParser,
} from "../schemas";
import type { Fetcher } from "../utils";
import base from "./base";

export class ProfileModule {
  mochi: {
    getById: Fetcher<string, Profile>;
  };

  telegram: {
    getById: Fetcher<{ telegramId: string; noFetchAmount?: boolean }, Profile>;
  };

  discord: {
    getById: Fetcher<{ discordId: string; noFetchAmount?: boolean }, Profile>;
  };

  email: {
    getByEmail: Fetcher<{ email: string; noFetchAmount?: boolean }, Profile>;
  };

  activities: {
    getByUser: Fetcher<
      {
        profileId: string;
        actions: (string | number)[];
        status?: "new" | "read";
        page?: number;
        size?: number;
      },
      Array<Activity>
    >;
    markRead: Fetcher<{ profileId: string; ids: (string | number)[] }>;
  };

  connect: {
    requestCode: Fetcher<string, Code>;
  };

  constructor({ profileUrl, apiKey, catcher }: FullOptions) {
    const parse = getParser(catcher);
    let api = base.url(profileUrl, true);

    if (catcher) {
      api = api.catcherFallback(catcher);
    }

    let profiles = api.url("/profiles");
    if (apiKey) {
      profiles = profiles.auth(`Bearer ${apiKey}`);
    }

    this.mochi = {
      getById: async function (profileId) {
        return await api
          .url(`/profiles/${profileId}`)
          .resolve(parse(ProfileSchema))
          .get();
      },
    };

    this.telegram = {
      getById: async function ({ telegramId, noFetchAmount }) {
        return api
          .url(`/profiles/get-by-telegram/${telegramId}`)
          .query(noFetchAmount ? { noFetchAmount } : {})
          .resolve(parse(ProfileSchema))
          .get();
      },
    };

    this.discord = {
      getById: async function ({ discordId, noFetchAmount }) {
        return api
          .url(`/profiles/get-by-discord/${discordId}`)
          .query(noFetchAmount ? { noFetchAmount } : {})
          .resolve(parse(ProfileSchema))
          .get();
      },
    };

    this.email = {
      getByEmail: async function ({ email, noFetchAmount }) {
        return api
          .url(`/profiles/get-by-email/${email}`)
          .query(noFetchAmount ? { noFetchAmount } : {})
          .resolve(parse(ProfileSchema))
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
          .resolve(parse(ListActivity))
          .get();
      },
      markRead: async function ({ profileId, ids }) {
        return api
          .url(`/profiles/${profileId}/activities`)
          .resolve(parse(AnySchema))
          .put({ ids });
      },
    };

    this.connect = {
      requestCode: async function (profileId) {
        return api
          .url(`/profiles/${profileId}/codes`)
          .resolve(parse(CodeSchema))
          .post();
      },
    };
  }
}
