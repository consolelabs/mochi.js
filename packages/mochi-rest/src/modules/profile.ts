import endpoints from "../endpoints";
import { Options } from "../mochi";
import {
  Activity,
  Code,
  CodeSchema,
  ListActivity,
  Profile,
  ProfileSchema,
  Pagination,
  AuthRequest,
  AuthRequestSchema,
  ListProfileSchema,
} from "../schemas";
import { AnySchema, getParser } from "../schemas/utils";
import type { Fetcher } from "../utils";
import base from "./base";
import { Module } from "./module";

export class ProfileModule extends Module {
  mochi: {
    getById: Fetcher<string, Profile>;
  };

  telegram: {
    getById: Fetcher<{ telegramId: string; noFetchAmount?: boolean }, Profile>;
    getByUsernames: Fetcher<string[], Record<string, string | undefined>>;
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

  auth: {
    byDiscord: Fetcher<
      { platform: "web" | "telegram" | "discord"; urlLocation: string },
      AuthRequest
    >;
    byFacebook: Fetcher<
      { platform: "web" | "telegram" | "discord"; urlLocation: string },
      AuthRequest
    >;
    byTwitter: Fetcher<
      { platform: "web" | "telegram" | "discord"; urlLocation: string },
      AuthRequest
    >;
    byGmail: Fetcher<
      { platform: "web" | "telegram" | "discord"; urlLocation: string },
      AuthRequest
    >;
  };

  connect: {
    requestCode: Fetcher<string, Code>;
    byDiscord: Fetcher<
      { platform: "web" | "telegram" | "discord"; code: string },
      AuthRequest
    >;
  };

  users: {
    search: Fetcher<{ username: string; platform?: string }, Array<Profile>>;
  };

  constructor({ addons, profileUrl, catcher, log }: Options) {
    super(base.url(profileUrl, true).options({ log }));
    const parse = getParser(catcher);

    if (addons?.length) {
      for (const addon of addons) {
        this.api = this.api.addon(addon);
      }
    }

    if (catcher) {
      this.api = this.api.catcherFallback(catcher);
    }

    this.mochi = {
      getById: async (profileId) => {
        return await this.api
          .url(endpoints.MOCHI_PROFILE.GET_BY_ID(profileId))
          .resolve(parse(ProfileSchema))
          .get();
      },
    };

    this.telegram = {
      getById: async ({ telegramId, noFetchAmount }) => {
        return this.api
          .url(endpoints.MOCHI_PROFILE.GET_BY_TELEGRAM_ID(telegramId))
          .query(noFetchAmount ? { noFetchAmount } : {})
          .resolve(parse(ProfileSchema))
          .get();
      },
      getByUsernames: async (usernames) => {
        return this.api
          .url(endpoints.MOCHI_PROFILE.GET_BY_TELEGRAM_USERNAMES)
          .query({ usernames: usernames.join("|") })
          .resolve(parse(AnySchema))
          .get();
      },
    };

    this.discord = {
      getById: async ({ discordId, noFetchAmount }) => {
        return this.api
          .url(endpoints.MOCHI_PROFILE.GET_BY_DISCORD_ID(discordId))
          .query(noFetchAmount ? { noFetchAmount } : {})
          .resolve(parse(ProfileSchema))
          .get();
      },
    };

    this.email = {
      getByEmail: async ({ email, noFetchAmount }) => {
        return this.api
          .url(endpoints.MOCHI_PROFILE.GET_BY_EMAIL(email))
          .query(noFetchAmount ? { noFetchAmount } : {})
          .resolve(parse(ProfileSchema))
          .get();
      },
    };

    this.activities = {
      getByUser: async ({
        profileId,
        page = 0,
        size = 10,
        actions,
        status,
      }) => {
        return this.api
          .url(endpoints.MOCHI_PROFILE.USER_ACTIVITIES(profileId))
          .query({ actions: actions.join("|"), page, size, status })
          .resolve(parse(ListActivity)<Pagination>)
          .get();
      },
      markRead: async ({ profileId, ids }) => {
        return this.api
          .url(endpoints.MOCHI_PROFILE.USER_ACTIVITIES(profileId))
          .resolve(parse(AnySchema))
          .put({ ids });
      },
    };

    // this is used for login
    this.auth = {
      byDiscord: async ({ urlLocation, platform }) => {
        return await this.api
          .url(endpoints.MOCHI_PROFILE.AUTH_BY_DISCORD)
          .query({ urlLocation, platform })
          .resolve(parse(AuthRequestSchema))
          .get();
      },
      byFacebook: async ({ urlLocation, platform }) => {
        return await this.api
          .url(endpoints.MOCHI_PROFILE.AUTH_BY_FACEBOOK)
          .query({ urlLocation, platform })
          .resolve(parse(AuthRequestSchema))
          .get();
      },
      byTwitter: async ({ urlLocation, platform }) => {
        return await this.api
          .url(endpoints.MOCHI_PROFILE.AUTH_BY_TWITTER)
          .query({ urlLocation, platform })
          .resolve(parse(AuthRequestSchema))
          .get();
      },
      byGmail: async ({ urlLocation, platform }) => {
        return await this.api
          .url(endpoints.MOCHI_PROFILE.AUTH_BY_GMAIL)
          .query({ urlLocation, platform })
          .resolve(parse(AuthRequestSchema))
          .get();
      },
    };

    // this is used for connecting social accounts
    this.connect = {
      requestCode: async (profileId) => {
        return this.api
          .url(endpoints.MOCHI_PROFILE.REQUEST_CODE(profileId))
          .resolve(parse(CodeSchema))
          .post();
      },
      byDiscord: async ({ platform, code }) => {
        return await this.api
          .url(endpoints.MOCHI_PROFILE.CONNECT_DISCORD)
          .query({ code, platform })
          .resolve(parse(AuthRequestSchema))
          .post();
      },
    };

    this.users = {
      search: async ({ username, platform = "" }) => {
        return this.api
          .url(endpoints.MOCHI_PROFILE.PROFILE_SEARCH)
          .query({ username, platform })
          .resolve(parse(ListProfileSchema))
          .get();
      },
    };
  }
}
