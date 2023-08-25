import meow from "meow";
import newScript from "./new";
import init from "./init";
import path from "path";

export const mockDirRoot = path.resolve(process.cwd(), "mochi-mocks", "mocks");

(async () => {
  const cli = meow(
    `
    Usage              
      $ npx mochi-mocks
      $ pnpm exec mochi-mocks

    Options
      --init, -i     Pull data from remote mock repo
      --new, -n      Generate a new resource interactively
      --help, -h     Bring up this help menu
      --version, -v  Show version

    Examples
      $ pnpm exec mochi-mocks --init
      $ npx exec mochi-mocks --new
`,
    {
      flags: {
        init: {
          type: "boolean",
          shortFlag: "r",
        },
        new: {
          type: "boolean",
          shortFlag: "n",
        },
        help: {
          type: "boolean",
          shortFlag: "h",
        },
        version: {
          type: "boolean",
          shortFlag: "v",
        },
      },
    }
  );

  switch (true) {
    case cli.flags.new || cli.flags.n:
      newScript();
      break;
    case cli.flags.init || cli.flags.i:
      await init();
      break;
    case cli.flags.help || cli.flags.h:
      cli.showHelp();
      break;
    case cli.flags.version || cli.flags.v:
      cli.showVersion();
      break;
    default:
      cli.showHelp();
      break;
  }
})();
