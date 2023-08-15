import { Any } from "./schemas";

export type Fetcher<
  I extends any = any,
  O extends Any = Any,
  Ok = { ok: true; data: O },
  Err = { ok: false; error: any }
> = I extends string | number | boolean | undefined
  ? (i?: I) => Promise<Ok | Err>
  : (i: I) => Promise<Ok | Err>;
