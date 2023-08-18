import { Any } from './schemas';

export type Fetcher<
  I extends void | string | number | boolean | object = void,
  O extends Any = Any,
  Ok = { ok: true; data: O; error: null },
  Err = { ok: false; data: null; error: any },
  Result = Promise<Ok | Err>
> = Extract<I, void> extends never
  ? (i: Exclude<I, void>) => Result
  : (i?: Exclude<I, void>) => Result;
