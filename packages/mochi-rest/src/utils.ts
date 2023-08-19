import { Any, Pagination } from "./schemas";

export type Ok<O> = {
  ok: true;
  data: O;
  error: null;
};

export type Err = {
  ok: false;
  data: null;
  error: any;
};

export type Meta<P> = Extract<P, void> extends never
  ? { metadata: Pagination }
  : { metadata?: never };

export type Fetcher<
  I extends void | string | number | boolean | object = void,
  O extends Any = Any,
  P extends void | Pagination = void,
  Result = Promise<(Ok<O> & Meta<P>) | Err>
> = Extract<I, void> extends never
  ? (i: Exclude<I, void>) => Result
  : (i?: Exclude<I, void>) => Result;
