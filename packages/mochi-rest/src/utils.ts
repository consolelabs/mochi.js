export type Fetcher<I extends any = any, O extends any = any> = (
  i: I
) => Promise<{ ok: boolean; data: O }>;
