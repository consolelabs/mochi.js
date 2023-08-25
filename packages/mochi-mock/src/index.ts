import { readFile } from "fs/promises";
import path from "path";
import recursiveRead from "recursive-readdir";
import { logger } from "./logger";
import qs from "querystring";
import type { WretchAddon } from "wretch";

const mockDirRoot = path.resolve(process.cwd(), "mochi-mocks", "mocks");

// interceptor
const monkeyPatchFunc = function (func: any) {
  return async function (url: RequestInfo | URL, opts?: RequestInit) {
    const [urlString, queryString] = url.toString().split("?");
    let mockHeaderValue = "";
    if (typeof opts?.headers?.forEach !== "string") {
      for (const [k, v] of Object.entries(opts?.headers ?? {})) {
        if (k.toLowerCase() === "x-mochi-mock") {
          mockHeaderValue = v;
        }
      }
    }

    // no mock header found, call api as usual
    if (!mockHeaderValue) {
      return await func.apply(
        typeof window === "undefined" ? globalThis : window,
        urlString,
        opts
      );
    }

    let files = await recursiveRead(
      path.resolve(process.cwd(), "mochi-mocks", "mocks")
    );

    files = files.map((f) => f.replace(mockDirRoot, ""));

    let file: string | null = null;
    for (let f of files.values()) {
      if (path.normalize(`/${mockHeaderValue}`) === path.normalize(f)) {
        // mock found
        file = f;
        break;
      }
    }

    // mock not found, call real api
    if (!file) {
      return await func.apply(
        typeof window === "undefined" ? globalThis : window,
        urlString,
        opts
      );
    }

    // mock found, read content from mock then return response
    const headers = new Headers();
    headers.set("Content-Type", "application/json");

    const query = qs.parse(queryString);
    const { page: _page, size: _size, ...rest } = query;

    let content = JSON.parse(
      await readFile(path.join(mockDirRoot, file), { encoding: "utf8" })
    );

    // if not list then return as it
    if (!Array.isArray(content)) {
      logger.info(`[Mock ok - ${opts?.method || ""}]: returning ${file}`);
      return new Response(JSON.stringify({ data: content }), {
        status: 200,
        headers,
      });
    }

    const total = Array.isArray(content) ? content.length : 0;

    for (const [k, v] of Object.entries(rest)) {
      if (!v || Array.isArray(v)) continue;
      content = content.filter((c: any) => c[k].includes(v));
    }

    let page = 0,
      size = 10;
    if (_page !== undefined && !Number.isNaN(Number(_page))) {
      page = Number(_page);
      if (_size !== undefined && !Number.isNaN(Number(_size))) {
        size = Number(_size);
      }

      content = content.slice(page * size, page * size + size);
    }

    logger.info(`[Mock ok - ${opts?.method || ""}]: returning ${file}`);
    return new Response(
      JSON.stringify({
        data: content,
        ...(Array.isArray(content)
          ? {
              metadata: {
                page,
                size,
                total,
              },
            }
          : {}),
      }),
      {
        status: 200,
        headers,
      }
    );
  };
};

export default function mock() {
  if (typeof window !== "undefined") {
    // can't run in browser env because this mock executes cli commands
    return;
  } else {
    globalThis.fetch = monkeyPatchFunc(globalThis.fetch);
  }
}

interface MockAddOn {
  mock(jsonPath: string): this;
}

export const MockAddOn: WretchAddon<MockAddOn> = {
  wretch: {
    mock(jsonPath: string) {
      return {
        ...this,
        _options: {
          headers: {
            "X-Mochi-Mock": jsonPath,
          },
        },
      };
    },
  },
};
