const prompts = require("prompts");
const fs = require("fs/promises");
const path = require("path");
const Listr = require("listr");
const prettier = require("prettier");
const { Project } = require("ts-morph");
const { ts } = require("ts-morph");

function addToCommandList(commandData) {
  return async function () {
    const project = new Project();
    const sourceFile = project.addSourceFileAtPath(
      path.resolve("src", "commands", "index.ts"),
    );
    sourceFile.addImportDeclaration({
      defaultImport: commandData.command_name,
      moduleSpecifier: `./${commandData.command_name}`,
    });

    sourceFile.forEachDescendant((node) => {
      if (node.isKind(ts.SyntaxKind.ObjectLiteralExpression)) {
        const parent = node.getParent();
        if (parent.isKind(ts.SyntaxKind.VariableDeclaration)) {
          const name = parent.getName();
          if (name === "commands") {
            node.addSpreadAssignment({
              expression: commandData.command_name,
            });
          }
          if (name === "aliases" && commandData.command_alias) {
            node.addPropertyAssignment({
              name: commandData.command_alias,
              initializer: `${commandData.command_name}.${commandData.command_name}`,
            });
          }
        }
      }
    });

    await project.save();
  };
}

function formatText(commandData) {
  const commandFile = path.resolve(
    process.cwd(),
    "src",
    "commands",
    `${commandData.command_name}.ts`,
  );
  const indexFile = path.resolve(process.cwd(), "src", "commands", "index.ts");

  return async function () {
    return await Promise.all([
      fs.writeFile(
        commandFile,
        await prettier.format(await fs.readFile(commandFile, "utf8"), {
          parser: "typescript",
        }),
        "utf8",
      ),
      fs.writeFile(
        indexFile,
        await prettier.format(await fs.readFile(indexFile, "utf8"), {
          parser: "typescript",
        }),
        "utf8",
      ),
    ]);
  };
}

(async () => {
  const { command_name } = await prompts({
    type: "text",
    name: "command_name",
    message: "Command name",
    validate: (v) => Boolean(v) || "Command name is required",
  });

  const { command_alias } = await prompts({
    type: "text",
    name: "command_alias",
    message: "Command alias (empty to skip)",
    validate: (v) =>
      Boolean(v)
        ? v.toLowerCase() !== command_name.toLowerCase() ||
          "Alias should be different from command name"
        : true,
  });

  const commandData = {
    command_name,
    command_alias,
  };

  const { confirmCommand } = await prompts({
    type: "confirm",
    name: "confirmCommand",
    message: `\n${JSON.stringify(commandData, null, 2)}\nConfirm?`,
    initial: true,
  });

  if (confirmCommand) {
    const template = await fs.readFile(
      path.resolve(process.cwd(), "scripts", "command-template.ts"),
      "utf8",
    );
    await new Listr([
      {
        title:
          "A step to simulate long running step but actually it doesn't do anything",
        task: () => new Promise((r) => setTimeout(r, 3000)),
      },
      {
        title: "Creating new command file",
        task: async () =>
          fs.writeFile(
            path.resolve(
              process.cwd(),
              "src",
              "commands",
              `${commandData.command_name}.ts`,
            ),
            template.replace(/__COMMAND_NAME/g, commandData.command_name),
            { parser: "typescript" },
            "utf8",
          ),
      },
      {
        title: "Because other steps run so fast",
        task: () => new Promise((r) => setTimeout(r, 1500)),
      },
      {
        title: "Adding command to list",
        task: addToCommandList(commandData),
      },
      {
        title: "Formatting text",
        task: formatText(commandData),
      },
    ]).run();
    console.log(`
    All done,
    2 files have been created/modified for you:
      + commands/${command_name}.ts
      + commands/index.ts
    
    To see your new command in action:
    - Run \`pnpm dev\`
    - Open Telegram, open bot conversation
    - Type \`/${command_name}\`, send
    - You're good to go! 🚀
`);
  }
  process.exit(0);
})();
