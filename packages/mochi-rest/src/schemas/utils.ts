import type { WretchResponseChain } from "wretch";
import { WretchError } from "wretch/resolver";
import { Schema, ZodError, z } from "zod";
import { Pagination } from "./pagination";
import { Err, Meta, Ok } from "../utils";

export const AnySchema = z.any();

export type Any = z.infer<typeof AnySchema>;

export function getParser(catcher?: (error: WretchError | ZodError) => void) {
  return function parse<
    S extends Schema,
    R extends WretchResponseChain<any, any, any>
  >(schema: S) {
    return async function <P extends void | Pagination, O = z.infer<S>>(
      r: R
    ): Promise<(Ok<O> & Meta<P>) | Err> {
      const json = await r.json<any>();
      let data = json;

      if ("data" in json) {
        data = json.data;
      }

      let result;
      if ("passthrough" in schema && typeof schema.passthrough === "function") {
        result = (schema.passthrough() as Schema).safeParse(data);
      } else {
        result = schema.safeParse(data);
      }

      if (!result.success) {
        catcher?.(result.error);
        return {
          ok: false,
          data: null,
          error: result.error,
        };
      }

      return {
        ok: true,
        data: result.data as z.infer<S>,
        error: null,
        metadata: json.metadata,
        pagination: json.pagination,
      } as unknown as Ok<O> & Meta<P>;
    };
  };
}
