import { readFile } from "fs/promises";
import path from "path";
import recursiveRead from "recursive-readdir";
import { logger } from "./logger";
import qs from "querystring";
import type { WretchAddon } from "wretch";
import { CUSTOM_HEADER } from "./constant";

const mockDirRoot = path.resolve(process.cwd(), "mochi-mocks", "mocks");

// interceptor
const monkeyPatchFunc = function (func: any) {
  return async function (url: RequestInfo | URL, opts?: RequestInit) {
    let mockHeaderValue = "";
    if (typeof opts?.headers?.forEach !== "string") {
      for (const [k, v] of Object.entries(opts?.headers ?? {})) {
        if (k.toLowerCase() === CUSTOM_HEADER.toLowerCase()) {
          mockHeaderValue = v;
        }
      }
    }

    // no mock header found, call api as usual
    if (!mockHeaderValue) {
      return await func.apply(
        typeof window === "undefined" ? globalThis : window,
        [url.toString(), opts]
      );
    }

    const [jsonFile, queryString] = mockHeaderValue.split("?");

    let files = await recursiveRead(
      path.resolve(process.cwd(), "mochi-mocks", "mocks")
    );

    files = files.map((f) => f.replace(mockDirRoot, ""));

    let file: string | null = null;
    for (let f of files.values()) {
      if (path.normalize(`/${jsonFile}`) === path.normalize(f)) {
        // mock found
        file = f;
        break;
      }
    }

    // mock not found, call real api
    if (!file) {
      return await func.apply(
        typeof window === "undefined" ? globalThis : window,
        [url.toString(), opts]
      );
    }

    // mock found, read content from mock then return response
    const headers = new Headers();
    headers.set("Content-Type", "application/json");

    const query = qs.parse(queryString);
    const { page: _page, size: _size, id: _id, ...rest } = query;

    let content = JSON.parse(
      await readFile(path.join(mockDirRoot, file), { encoding: "utf8" })
    );

    if (_id) {
      const first = content.find((c: any) => c.id == _id);
      if (first) {
        content = first;
      }
    }

    // if not list then return as it
    if (!Array.isArray(content)) {
      logger.info(`[Mock ok - ${opts?.method || ""}]: returning ${file}`);
      return new Response(JSON.stringify({ data: content }), {
        status: 200,
        headers,
      });
    }

    let total = Array.isArray(content) ? content.length : 0;

    for (const [k, v] of Object.entries(rest)) {
      if (!v || Array.isArray(v)) continue;
      content = content.filter((c: any) => c[k].includes(v));
      total = Array.isArray(content) ? content.length : 0;
    }

    let page = 0,
      size = 10;

    if (_page !== undefined && !Number.isNaN(Number(_page))) {
      page = Number(_page);
    }

    if (_size !== undefined && !Number.isNaN(Number(_size))) {
      size = Number(_size);
    }

    content = content.slice(page * size, page * size + size);

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
    // @ts-ignore
    globalThis.fetch = monkeyPatchFunc(globalThis.fetch);
  }
}

interface MockAddOn {
  mock(jsonPath: string, query?: Record<string, any>): this;
}

export const MockAddOn: WretchAddon<MockAddOn> = {
  wretch: {
    mock(jsonPath: string, query: Record<string, any> = {}) {
      return {
        ...this,
        _options: {
          headers: {
            [CUSTOM_HEADER]: `${jsonPath}?${qs.stringify(query)}`,
          },
        },
      };
    },
  },
};
