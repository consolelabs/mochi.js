import { z } from "zod";
import { TokenSchema } from "./defi";

const PayLinkSchema = z.object({
  amount: z.string().nonempty(),
  claim_tx: z.string(),
  claimed_at: z.string().datetime(),
  claimer: z.string(),
  code: z.string(),
  created_at: z.string().datetime().nonempty(),
  expired_at: z.string().datetime().nonempty(),
  from_profile_id: z.string().nonempty(),
  is_evm: z.boolean(),
  note: z.string(),
  status: z.enum(["expired", "claimed", "new", "submitted"]),
  to_profile_id: z.string(),
  token: TokenSchema,
  token_id: z.string().uuid().nonempty(),
  type: z.enum(["paylink"]),
});

export const ListPayLinkSchema = z.array(PayLinkSchema);

export type PayLink = z.infer<typeof PayLinkSchema>;
