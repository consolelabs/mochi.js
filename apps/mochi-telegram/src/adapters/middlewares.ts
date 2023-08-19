import { logger } from "logger";
import { WretchOptions } from "wretch/types";
import { nanoid } from "nanoid";
import { snakeCase } from "change-case";
import { transform } from "lodash";

export const log = (next: any) => (url: string, opts: WretchOptions) => {
  logger.info(
    `[API going - ${opts.method}]: ${url}${
      opts.body ? ` with body ${opts.body}` : ""
    }`
  );
  return next(url, opts).then((r: any) => {
    if (r.ok) {
      logger.info(
        `[API ok - ${opts.method}/${r.status}]: ${url}${
          opts.body ? ` with body ${opts.body}` : ""
        }`
      );
    } else {
      logger.error(
        `[API failed - ${opts.method}/${r.status}]: ${url}${
          opts.body ? ` with body ${opts.body}` : ""
        }`
      );
    }
    return r;
  });
};

export const attachRequestId =
  (next: any) => (url: string, opts: WretchOptions) => {
    const id = nanoid(10);
    if (!opts.headers) {
      opts.headers = {
        "X-Request-ID": id,
      };
    } else {
      opts.headers["X-Request-ID"] = id;
    }
    return next(url, opts);
  };

export const convertQueryToSnakeCase =
  (next: any) => (url: string, opts: WretchOptions) => {
    const urlObj = new URL(url);
    const newSearchParams = new URLSearchParams();
    for (const [k, v] of urlObj.searchParams.entries()) {
      newSearchParams.set(snakeCase(k), v);
    }

    urlObj.search = newSearchParams.toString();

    return next(urlObj.toString(), opts);
  };

export const convertBodyToSnakeCase =
  (next: any) => (url: string, opts: WretchOptions) => {
    if (!opts.body) return next(url, opts);
    try {
      const body = JSON.parse(opts.body);
      const newBody = transform<any, any>(body, function (result, v, k) {
        result[snakeCase(k as string)] = v;
      });

      return next(url, { ...opts, body: JSON.stringify(newBody) });
    } catch (e: any) {
      return next(url, opts);
    }
  };
