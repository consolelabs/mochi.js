import { z } from "zod";
import { TokenSchema } from "./defi";

const PaylinkStatusSchema = z.enum(["pending", "success", "failed", "expired"]);

const BaseSchema = z.object({
  amount: z.string().nonempty(),
  settle_tx: z.string(),
  settled_at: z.string().datetime().or(z.null()),
  code: z.string(),
  created_at: z.string().datetime().nonempty(),
  expired_at: z.string().datetime().nonempty(),
  from_profile_id: z.string().nonempty(),
  is_evm: z.boolean(),
  note: z.string(),
  status: PaylinkStatusSchema,
  to_profile_id: z.string(),
  token: TokenSchema,
  token_id: z.string().uuid().nonempty(),
  type: z.enum(["in", "out"]),
  action: z.enum(["paylink", "payme"]),
});

const PayLinkSchema = BaseSchema.extend({
  action: z.literal("paylink"),
});
export type PayLink = z.infer<typeof PayLinkSchema>;

const PayMeSchema = BaseSchema.extend({
  action: z.literal("payme"),
});
export type PayMe = z.infer<typeof PayMeSchema>;

export const ListPayLinkSchema = z.array(PayLinkSchema);
export const ListPayMeSchema = z.array(PayMeSchema);

export type PaylinkStatus = z.infer<typeof PaylinkStatusSchema>;
