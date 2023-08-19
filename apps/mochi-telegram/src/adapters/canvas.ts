import { API_CANVAS_PROCESS_URL } from "env";

import base from "./base";

const api = base.url(API_CANVAS_PROCESS_URL, true);
const defi = api.url("/defi");

export default {
  defi: {
    getHeatmap: () =>
      defi
        .url(`/heatmap`)
        .get()
        .json((r) => r.data),
  },
};
