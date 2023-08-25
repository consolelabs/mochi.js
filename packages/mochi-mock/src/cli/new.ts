import p from "prompts";
import path from "path";
import { access, mkdir, writeFile } from "fs/promises";
import { faker } from "@faker-js/faker";
import { mockDirRoot } from ".";

export default async function newScript() {
  let exist = false,
    file = "";
  do {
    const result = await p({
      type: "text",
      name: "file",
      message: exist
        ? "There is already a file at that path, please choose another path"
        : "Where should we put your new file?",
    });
    file = result.file;

    exist = await access(path.resolve(mockDirRoot, file))
      .then(() => true)
      .catch(() => false);
  } while (exist);

  const splitted = file.split("/");
  const filePath = splitted.slice(0, -1).join("/");
  await mkdir(`${path.join(mockDirRoot, filePath)}/`, { recursive: true });

  const result: Record<string, any> = {};

  do {
    const { addKey } = await p({
      type: "select",
      name: "addKey",
      message: "Should we add a key?",
      choices: [
        { title: "Yes", value: true },
        { title: "I'm done", value: false },
      ],
    });
    if (!addKey) {
      break;
    }

    const { key } = await p({
      type: "text",
      name: "key",
      message: "What is the name of this key",
    });

    const { value } = await p({
      type: "select",
      name: "value",
      message: "Please select a type for your value",
      choices: [
        { title: "web3 address", value: "address", description: "EVM" },
        {
          title: "token",
          value: "token",
          description: "random token with symbol, decimal, chain object",
        },
        { title: "uuid", value: "uuid", description: "random uuid" },
        { title: "text", value: "text", description: "random text" },
        { title: "number", value: "number", description: "random number" },
      ],
    });

    result[key] = value;
  } while (true);

  const list = Array(100)
    .fill(0)
    .map(() => {
      const obj: Record<string, any> = {};
      for (const [k, v] of Object.entries(result)) {
        switch (v) {
          case "address":
            obj[k] = faker.finance.ethereumAddress();
            break;
          case "token":
            obj[k] = {
              name: faker.commerce.productName(),
              symbol: faker.string.alpha({ length: 3, casing: "upper" }),
              decimal: faker.number.int({ min: 6, max: 18 }),
              chain: {
                chainId: faker.number.int({ min: 1, max: 1000 }),
                name: faker.commerce.productName(),
              },
            };
            break;
          case "uuid":
            obj[k] = faker.string.uuid();
            break;
          case "text":
            obj[k] = faker.string.sample();
            break;
          case "number":
            obj[k] = faker.number.int();
            break;
          default:
            break;
        }
      }

      return obj;
    });

  await writeFile(path.join(mockDirRoot, file), JSON.stringify(list, null, 2));

  console.log("✅ All done");
}
