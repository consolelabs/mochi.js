import { mochiApi } from "adapters";
import { ModelProductBotCommand } from "types/api";

class ProductMetadata {
  constructor(
    public facts: string[] = [],
    public tips: string[] = [],
    public commands: ModelProductBotCommand[] = []
  ) {}

  async init() {
    const data = await mochiApi.productMetadata.getCopy();
    const commands = await mochiApi.productMetadata.getCommands();

    if (data?.description?.fact) {
      this.facts = data.description.fact ?? [];
    }

    if (data?.description?.tip) {
      this.tips = data.description.tip ?? [];
    }

    if (commands) {
      this.commands = commands;
    }
  }

  randomTip() {
    if (!this.tips.length) {
      this.init();
      return "";
    }
    return (
      this.tips.at(Math.floor(Math.random() * (this.tips.length - 1))) ?? ""
    );
  }

  randomFact() {
    if (!this.facts.length) {
      this.init();
      return "";
    }
    return (
      this.facts.at(Math.floor(Math.random() * (this.facts.length - 1))) ?? ""
    );
  }

  listCommands() {
    return this.commands;
  }
}

export default new ProductMetadata();
