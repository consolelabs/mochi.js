import { PageSize } from "../constant";

export * from "./chain";
export * from "./token";

export type Paging = {
  page?: number;
  size?: PageSize;
  total?: number;
};
