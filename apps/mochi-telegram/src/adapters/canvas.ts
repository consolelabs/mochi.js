import { API_CANVAS_PROCESS_URL } from "env";
import wretch from "wretch";

const api = wretch().url(API_CANVAS_PROCESS_URL, true);
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
