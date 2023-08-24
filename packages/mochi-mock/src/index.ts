import { readFile } from "fs/promises";
import path from "path";
import recursiveRead from "recursive-readdir";
import { minimatch } from "minimatch";
import { logger } from "./logger";

const mockDir = path.resolve(process.cwd(), "mochi-mocks", "mocks");

const hostMap = {
  "*.mochi-pay.console.so": "mochi-pay",
  "*.mochi-profile.console.so": "mochi-profile",
  "*.mochi.pod.town": "mochi",
};

function getModule(url: string) {
  for (const [k, v] of Object.entries(hostMap)) {
    if (minimatch(url, k)) {
      return v;
    }
  }

  throw new Error("Couldn't find a host");
}

// interceptor
const monkeyPatchFunc = function (func: any) {
  return async function (...args: any[]) {
    let [urlString, opts] = args;
    let files = await recursiveRead(
      path.resolve(process.cwd(), "mochi-mocks", "mocks")
    );
    const url = new URL(urlString);
    const module = getModule(url.host);
    let pathname: string | string[] = url.pathname;
    pathname = pathname.split("/");
    // remove ""
    pathname.shift();
    // remove "api"path
    pathname.shift();
    // remove "v1"
    pathname.shift();
    pathname = `/${pathname.join("/")}`;

    const trimmed = files
      .map((f) => f.replace(mockDir, ""))
      .filter((f) => f.startsWith(`/${module}`))
      .map((f) => f.replace(`/${module}`, ""));

    let file, fileShorten;
    trimmed.forEach((f, i) => {
      const withoutFilename = f.split(".").at(0) as string;
      if (minimatch(pathname as string, withoutFilename)) {
        file = files[i];
        fileShorten = f;
      }
    });

    if (!file) {
      return await func.call(
        typeof window === "undefined" ? globalThis : window,
        ...args
      );
    }
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    const fileContent = await readFile(file, { encoding: "utf8" });
    logger.info(
      `[Mock ok - ${opts.method}]: ${urlString} -> /${module}${fileShorten}`
    );
    return new Response(fileContent, {
      status: 200,
      headers,
    });
  };
};

export default function mock() {
  const mockDataState = process.env.MOCHI_MOCK ?? "off";
  if (mockDataState?.toLowerCase() === "off") {
    logger.info('"MOCHI_MOCK" env not found, data mocker OFF');
    return;
  }
  logger.info('"MOCHI_MOCK" env found, data mocker ON');
  if (typeof window !== "undefined") {
    window.fetch = monkeyPatchFunc(window.fetch);
  } else {
    globalThis.fetch = monkeyPatchFunc(globalThis.fetch);
  }
}
