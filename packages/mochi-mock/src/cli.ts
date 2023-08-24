import { access } from "fs/promises";
import path from "path";
import p from "prompts";
import { exec } from "child_process";
import Listr from "listr";

(async () => {
  const gitInstalled = await new Promise((r) => {
    exec("git -v", (error) => {
      if (error) {
        console.error(error.message);
        r(false);
        return;
      }
      r(true);
    });
  });
  if (!gitInstalled) {
    console.error(
      "Git was not detected in your machine, we recommend installing it to make things easier"
    );
    process.exit(1);
  }
  const exist = await access(path.resolve(process.cwd(), "mochi-mocks"))
    .then(() => true)
    .catch(() => false);
  if (exist) {
    const { confirm_overwrite } = await p({
      type: "confirm",
      name: "confirm_overwrite",
      message:
        "There is already a mochi-mocks directory, are you sure you want to overwrite?",
      initial: false,
    });
    if (!confirm_overwrite) {
      console.log("Bye 👋");
      process.exit(0);
    }
  }

  await new Listr([
    ...(exist
      ? [
          {
            title: "Clean up mochi-mocks",
            task: () =>
              new Promise<void>((r) => {
                exec("rm -rf mochi-mocks", (error) => {
                  if (error) {
                    console.error(error.message);
                    process.exit(1);
                  }
                  r();
                });
              }),
          },
        ]
      : []),
    {
      title: "Pulling mock data",
      task: () =>
        new Promise<void>((r) => {
          exec(
            "git clone git@github.com:consolelabs/data-mock.git mochi-mocks",
            (error) => {
              if (error) {
                console.error(error.message);
                process.exit(1);
              }
              r();
            }
          );
        }),
    },
    {
      title: "Remove .git inside mochi-mocks",
      task: () =>
        new Promise<void>((r) => {
          exec("rm -rf mochi-mocks/.git", (error) => {
            if (error) {
              console.error(error.message);
              process.exit(1);
            }
            r();
          });
        }),
    },
  ]).run();

  console.log(`
    All done, your mock data is ready to use, some few steps that you can do:

      1. Enable the mock data wrapper inside your code, refer to README

      2. During development, feel free to change the mock data shape/value

      3. After you're done, if there are new changes to the mock data, please submit a PR
         at https://github.com/consolelabs/data-mock so others can use it too

    Happy coding 🤙
`);
})();
