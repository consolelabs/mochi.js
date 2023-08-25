import endpoints from "../endpoints";
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
  Pagination,
  AuthRequest,
  AuthRequestSchema,
} from "../schemas";
import type { Fetcher } from "../utils";
import base from "./base";

export class ProfileModule {
  auth: {
    byDiscord: Fetcher<string, AuthRequest>;
  };

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
      Array<Activity>,
      Pagination
    >;
    markRead: Fetcher<{ profileId: string; ids: (string | number)[] }>;
  };

  connect: {
    requestCode: Fetcher<string, Code>;
  };

  constructor({ profileUrl, apiKey, catcher, log }: FullOptions) {
    const parse = getParser(catcher);
    let api = base.url(profileUrl, true);
    api = api.options({ log });

    if (catcher) {
      api = api.catcherFallback(catcher);
    }

    if (apiKey) {
      api = api.auth(`Bearer ${apiKey}`);
    }

    this.auth = {
      byDiscord: async function (code: string) {
        return await api
          .url(endpoints.MOCHI_PROFILE.AUTH_BY_DISCORD)
          .query({ code })
          .resolve(parse(AuthRequestSchema))
          .get();
      },
    };

    this.mochi = {
      getById: async function (profileId) {
        return await api
          .url(endpoints.MOCHI_PROFILE.GET_BY_ID(profileId))
          .resolve(parse(ProfileSchema))
          .get();
      },
    };

    this.telegram = {
      getById: async function ({ telegramId, noFetchAmount }) {
        return api
          .url(endpoints.MOCHI_PROFILE.GET_BY_TELEGRAM_ID(telegramId))
          .query(noFetchAmount ? { noFetchAmount } : {})
          .resolve(parse(ProfileSchema))
          .get();
      },
    };

    this.discord = {
      getById: async function ({ discordId, noFetchAmount }) {
        return api
          .url(endpoints.MOCHI_PROFILE.GET_BY_DISCORD_ID(discordId))
          .query(noFetchAmount ? { noFetchAmount } : {})
          .resolve(parse(ProfileSchema))
          .get();
      },
    };

    this.email = {
      getByEmail: async function ({ email, noFetchAmount }) {
        return api
          .url(endpoints.MOCHI_PROFILE.GET_BY_EMAIL(email))
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
          .url(endpoints.MOCHI_PROFILE.USER_ACTIVITIES(profileId))
          .query({ actions: actions.join("|"), page, size, status })
          .resolve(parse(ListActivity)<Pagination>)
          .get();
      },
      markRead: async function ({ profileId, ids }) {
        return api
          .url(endpoints.MOCHI_PROFILE.USER_ACTIVITIES(profileId))
          .resolve(parse(AnySchema))
          .put({ ids });
      },
    };

    this.connect = {
      requestCode: async function (profileId) {
        return api
          .url(endpoints.MOCHI_PROFILE.REQUEST_CODE(profileId))
          .resolve(parse(CodeSchema))
          .post();
      },
    };
  }
}
