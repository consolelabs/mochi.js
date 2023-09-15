import { z } from "zod";

export const PaginationSchema = z.object({
  total: z.number().nonnegative(),
  // index-based
  page: z.number().nonnegative(),
  // records per page
  size: z.number().positive(),
});

export type Pagination = z.infer<typeof PaginationSchema>;
