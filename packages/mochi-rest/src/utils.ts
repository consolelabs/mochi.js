import { Any } from "./schemas";

export type Fetcher<
  I extends string | number | boolean | object | void = void,
  O extends Any = Any,
  Ok = { ok: true; data: O; error: null },
  Err = { ok: false; data: null; error: any }
> = I extends string | number | boolean
  ? (i?: I) => Promise<Ok | Err>
  : (i: I) => Promise<Ok | Err>;
