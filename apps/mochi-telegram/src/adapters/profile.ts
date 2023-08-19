import { API_PROFILE_SERVER_URL } from "env";
import base from "./base";

const api = base.url(API_PROFILE_SERVER_URL, true);

export default {
  getByTelegram: (telegramId: string, noFetchAmount = true) =>
    api
      .url(`/profiles/get-by-telegram/${telegramId}`)
      .query(noFetchAmount ? { noFetchAmount } : {})
      .get()
      .json<any>(),
  getById: (profileId: string) =>
    api.url(`/profiles/${profileId}`).get().json<any>(),
  getByDiscord: (discordId: string, noFetchAmount = true) =>
    api
      .url(`/profiles/get-by-discord/${discordId}`)
      .query(noFetchAmount ? { noFetchAmount } : {})
      .get()
      .json<any>(),
  getByEmail: (email: string) =>
    api.url(`/profiles/get-by-email/${email}`).get().json<any>(),
  getByTelegramUsername: (username: string) =>
    api.url(`/profiles/telegram/get-by-username/${username}`).get().json<any>(),
  getUserActivities: (
    profileId: string,
    {
      actions,
      status = "",
      page,
      size,
    }: {
      actions: (string | number)[];
      status?: "" | "new" | "read";
      page: number;
      size: number;
    }
  ) =>
    api
      .url(`/profiles/${profileId}/activities`)
      .query({ actions: actions.join("|"), page, size, status })
      .get()
      .json<any>((r) => ({
        ...r,
        pagination: {
          ...r.pagination,
          totalPage: Math.ceil(r.pagination.total / r.pagination.size),
        },
      })),
  requestProfileCode: (profileId: string) =>
    api
      .url(`/profiles/${profileId}/codes`)
      .post()
      .json<any>((r) => r.data.code),
  markReadActivities: (profileId: string, body: { ids: number[] }) =>
    api.url(`/profiles/${profileId}/activities`).put(body).json<any>(),
};
