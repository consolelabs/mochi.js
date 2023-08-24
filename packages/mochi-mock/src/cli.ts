import { access } from "fs/promises";
import path from "path";
import p from "prompts";
import { exec } from "child_process";
import Listr from "listr";

(async () => {
  const exist = await access(path.resolve(process.cwd(), "mochi-mocks"))
    .then(() => true)
    .catch(() => false);
  if (exist) {
    const { confirm_overwrite } = await p({
      type: "confirm",
      name: "confirm_overwrite",
      message:
        "There is already a mochi-mocks directory, are you sure you want to overwrite?\n(this will wipe out all local changes that you have)",
      initial: false,
    });
    if (!confirm_overwrite) {
      console.log("Bye 👋");
      process.exit(0);
    }
  }

  await new Listr([
    {
      title: "Check if Git is installed",
      task: () =>
        new Promise<void>((res, rej) => {
          exec("git -v", (error) => {
            if (error) {
              console.error(error.message);
              rej(
                new Error(
                  "Git was not detected in your machine, we recommend installing it to make things easier"
                )
              );
              return;
            }
            res();
          });
        }),
    },
    ...(exist
      ? [
          {
            title: "Clean up mochi-mocks",
            task: () =>
              new Listr([
                {
                  title: "Unregister submodule",
                  task: () =>
                    new Promise<void>((res, rej) => {
                      exec(
                        "git submodule deinit -f -- mochi-mocks",
                        (error) => {
                          if (error) {
                            console.error(error.message);
                            rej(error);
                            return;
                          }
                          res();
                        }
                      );
                    }),
                },
                {
                  title: "Remove entry in .git",
                  task: () =>
                    new Promise<void>((res, rej) => {
                      exec("rm -rf .git/modules/mochi-mocks", (error) => {
                        if (error) {
                          console.error(error.message);
                          rej(error);
                          return;
                        }
                        res();
                      });
                    }),
                },
                {
                  title: "Remove submodule directory",
                  task: () =>
                    new Promise<void>((res, rej) => {
                      exec("git rm -f mochi-mocks", (error) => {
                        if (error) {
                          console.error(error.message);
                          rej(error);
                          return;
                        }
                        res();
                      });
                    }),
                },
              ]),
          },
        ]
      : []),
    {
      title: "Pulling mock data submodule",
      task: () =>
        new Promise<void>((res, rej) => {
          exec(
            "git submodule add git@github.com:consolelabs/data-mock.git mochi-mocks",
            (error) => {
              if (error) {
                console.error(error.message);
                rej(error);
              }
              res();
            }
          );
        }),
    },
  ]).run();

  console.log(`
    All done, your mock data is ready to use, some few steps that you can do:

      1. Enable the mock data wrapper inside your code, refer to README

      2. During development, feel free to change the mock data shape/value

      3. After you're done, if there are new changes to the mock data,
         submit a PR > get merged > profit

    Happy coding 🤙
`);
})();
