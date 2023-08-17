import MochiAPI from "@consolelabs/mochi-rest";
import { commandStore } from "async-storage";
import kafka from "services/kafka";
import { WretchError } from "wretch/resolver";

const api = new MochiAPI({
  catcher: (err) => {
    console.log(err);
    if (err instanceof WretchError && err.status === 500) {
      const store = commandStore.getStore();
      kafka.queue?.produceAnalyticMsg([
        {
          ...(store ? { data: store.data } : {}),
          url: err.url,
          status: err.status,
          error: err.json || err.text || err.message,
        },
      ]);
    }
  },
});

api.init();

export default api;
