import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import checker from "vite-plugin-checker";

// https://vitejs.dev/config/
export default defineConfig({
  plugins:
    process.env.NODE_ENV === "production"
      ? [tsconfigPaths()]
      : [checker({ typescript: true }), tsconfigPaths()],
});
