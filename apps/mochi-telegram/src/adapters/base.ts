import { commandStore } from "async-storage";
import kafka from "services/kafka";
import wretch from "wretch";
import QueryStringAddon from "wretch/addons/queryString";
import { throttlingCache } from "wretch/middlewares";

import {
  attachRequestId,
  convertBodyToSnakeCase,
  convertQueryToSnakeCase,
  log,
} from "./middlewares";

const api = wretch()
  .content("application/json")
  .middlewares([
    attachRequestId,
    convertQueryToSnakeCase,
    convertBodyToSnakeCase,
    log,
    throttlingCache(),
  ])
  .addon(QueryStringAddon)
  .catcher(500, (err) => {
    const store = commandStore.getStore();
    kafka.queue?.produceAnalyticMsg([
      {
        ...(store ? { data: store.data } : {}),
        url: err.url,
        status: err.status,
        error: err.json || err.text || err.message,
      },
    ]);
    return {
      ok: false,
      error: {
        status: err.status,
        message: err.json || err.text || err.message,
      },
    };
  })
  .catcherFallback((err) => {
    return {
      ok: false,
      error: {
        status: err.status,
        message: err.json || err.text || err.message,
      },
    };
  });

export default api;
