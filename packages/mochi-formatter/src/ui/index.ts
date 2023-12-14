import components from "../components";
import Redis from "ioredis";
import API from "@consolelabs/mochi-rest";
import render, { Platform, Profile, UsernameFmt } from "./render";

export { Platform };
const ui: {
  components: typeof components;
  redis: Redis | null;
  api: API | null;
  render: (
    on: Platform.Web | Platform.Telegram | Platform.Discord,
    A: Profile,
    B?: Profile
  ) => [UsernameFmt, UsernameFmt] | [];
  formatProfile: (
    on: Platform.Web | Platform.Telegram | Platform.Discord,
    A: string | { id: string; type: "vault" },
    B?: string | { id: string; type: "vault" }
  ) => Promise<[UsernameFmt, UsernameFmt] | []>;
} = {
  components,
  redis: null,
  api: null,
  render,
  formatProfile: async function (on, A, B = A) {
    if (!this.api) throw new Error("MochiUI: api property must be set");
    let pA: Profile, pB: Profile;
    if (typeof A === "string") {
      const { data } = await this.api.profile.mochi.getById(A);
      pA = data;
    } else {
      const { data } = await this.api.base.vault.getById(Number(A.id));
      pA = data;
    }

    if (typeof B === "string") {
      const { data } = await this.api.profile.mochi.getById(B);
      pB = data;
    } else {
      const { data } = await this.api.base.vault.getById(Number(B.id));
      pB = data;
    }

    return this.render(on, pA, pB);
  },
};

export const UI = new Proxy(ui, {
  set(target, key, newVal) {
    if (key === "api" && newVal) {
      for (const e of Object.entries(target.components)) {
        const [k, func] = e;

        (target.components as any)[k] = function (args: any) {
          return func({ ...args, api: newVal } as any);
        };
      }
    }
    return Reflect.set(target, key, newVal);
  },
});
