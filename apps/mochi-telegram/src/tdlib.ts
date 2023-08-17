// @ts-ignore
import MTP from "@mtproto/core";
import { MTPROTO_API_HASH, MTPROTO_API_ID, TELEGRAM_TOKEN } from "env";
import { logger } from "logger";
import path from "path";

class MTProto {
  private mtproto: any;
  constructor() {
    this.mtproto = new MTP({
      api_id: MTPROTO_API_ID,
      api_hash: MTPROTO_API_HASH,

      storageOptions: {
        path: path.resolve(__dirname, "../data/1.json"),
      },
    });
  }

  async call(method: string, params: any, options = {}): Promise<any> {
    try {
      const result = await this.mtproto.call(method, params, options);

      return result;
    } catch (error) {
      const { error_code, error_message } = error as any;

      if (error_code === 420) {
        const seconds = Number(error_message.split("FLOOD_WAIT_")[1]);
        const ms = seconds * 1000;

        await new Promise((r) => setTimeout(r, ms));

        return this.call(method, params, options);
      }

      if (error_code === 303) {
        const [type, dcIdAsString] = error_message.split("_MIGRATE_");

        const dcId = Number(dcIdAsString);

        // If auth.sendCode call on incorrect DC need change default DC, because
        // call auth.signIn on incorrect DC return PHONE_CODE_EXPIRED error
        if (type === "PHONE") {
          await this.mtproto.setDefaultDc(dcId);
        } else {
          Object.assign(options, { dcId });
        }

        return this.call(method, params, options);
      }

      logger.error(`${method} error:`, error);
      return Promise.reject(error);
    }
  }
}

export const mtproto = new MTProto();

mtproto
  .call("auth.importBotAuthorization", {
    api_id: MTPROTO_API_ID,
    api_hash: MTPROTO_API_HASH,
    bot_auth_token: TELEGRAM_TOKEN,
  })
  .then(() => {
    logger.info("MTProto ready");
  });
