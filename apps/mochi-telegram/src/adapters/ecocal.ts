import { ECOCAL_API_BASE_URL } from "env";
import base from "./base";

const api = base.url(ECOCAL_API_BASE_URL, true);

export default {
  ecocal: {
    get: (
      impact: string,
      start_time: string,
      end_time: string,
      api_key: string
    ) =>
      api
        .url("/economic-calendars")
        .query({ impact, start_time, end_time, api_key })
        .get()
        .json<any>((r) => r.data),
  },
};
