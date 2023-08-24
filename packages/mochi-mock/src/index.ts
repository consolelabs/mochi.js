import { readFile } from "fs/promises";
import path from "path";
import recursiveRead from "recursive-readdir";
import { minimatch } from "minimatch";

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

const monkeyPatchFunc = function (func: any) {
  return async function (...args: any[]) {
    let [urlString] = args;
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

    let file;
    trimmed.forEach((f, i) => {
      const withoutFilename = f.split(".").at(0) as string;
      if (minimatch(pathname as string, withoutFilename)) {
        file = files[i];
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
    return new Response(fileContent, {
      status: 200,
      headers,
    });
  };
};

export default function mock() {
  if (typeof window !== "undefined") {
    window.fetch = monkeyPatchFunc(window.fetch);
  } else {
    globalThis.fetch = monkeyPatchFunc(globalThis.fetch);
  }
}
