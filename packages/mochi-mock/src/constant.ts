import { name, version } from "../package.json";

export const PACKAGE_ID = `${name}@${version}` as const;
export const CUSTOM_HEADER = "X-Mochi-Mock" as const;
