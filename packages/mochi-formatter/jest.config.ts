import type { Config } from "jest";

const config: Config = {
  transformIgnorePatterns: ["node_module/(?!(remark)/)"],
};

export default config;
