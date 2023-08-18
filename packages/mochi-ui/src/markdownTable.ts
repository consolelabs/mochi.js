import merge from "lodash.merge";
import zip from "lodash.zip";

const VERTICAL_BAR = "｜" as const;

export type Alignment = "left" | "center" | "right";
type Option<C, L = number | null> = {
  row?: (formatted: string, index: number) => string;
  cols: C[];
  alignment?: Alignment[];
  separator?: string[];
  wrapLastCol?: boolean;
  textLimit?: L;
};
type Data = Record<string, string | number>;

export function mdTable<
  DT extends Data,
  O extends Option<keyof DT>,
  L = Pick<O, "textLimit">,
  R = L extends { textLimit: number } ? string[] : string
>(data: Array<DT>, options: O): R {
  if (!data || !data.length || !options.cols.length) {
    if (typeof options.textLimit === "number") {
      return [] as unknown as R;
    }
    return "" as unknown as R;
  }
  const segments = [];
  const allColsExceptLast = Array(options.cols.length - 1);
  const resolvedOptions = merge<
    Omit<Required<Option<keyof DT>>, "textLimit">,
    Partial<Option<keyof DT>>
  >(
    {
      cols: [],
      alignment: [
        ...allColsExceptLast.slice().fill("left"),
        allColsExceptLast.length ? "right" : "left",
      ],
      row: (str: string) => str,
      separator: allColsExceptLast.slice().fill(VERTICAL_BAR),
      wrapLastCol: true,
    },
    options
  );
  const longestTextByColumns = new Map<keyof DT, number>();

  // find the longest text by columns to add proper padding to other cell in the same column
  for (const d of data) {
    Object.entries(d).forEach((e) => {
      if (!longestTextByColumns.has(e[0])) {
        longestTextByColumns.set(e[0], 0);
      }

      longestTextByColumns.set(
        e[0],
        Math.max(longestTextByColumns.get(e[0]) ?? 0, String(e[1]).length)
      );
    });
  }

  let lines: string[] = [];
  for (const [i, d] of data.entries()) {
    let row = [];

    for (const [colIdx, col] of resolvedOptions.cols.entries()) {
      let content = String(d[col] ?? "");

      const padding = " ".repeat(
        Math.max(
          (longestTextByColumns.get(col) ?? 0) - String(content).length,
          0
        )
      );
      const halfPadding = padding.slice(0, padding.length / 2);
      const isEven = Number.isInteger(padding.length / 2);

      if (
        colIdx === resolvedOptions.cols.length - 1 &&
        resolvedOptions.alignment[colIdx] !== "right"
      ) {
        row.push(content);
        continue;
      }
      switch (resolvedOptions.alignment[colIdx]) {
        case "center":
          content = `${halfPadding}${
            isEven ? "" : " "
          }${content}${halfPadding}`;
          break;
        case "right":
          content = `${padding}${content}`;
          break;
        case "left":
        default:
          content = `${content}${padding}`;
          break;
      }

      row.push(content);
    }

    row = row.filter(Boolean);
    row = zip(
      row.map((r, i) => {
        if (i !== resolvedOptions.cols.length - 1) return `\`${r}\``;
        if (resolvedOptions.wrapLastCol) return `\`${r}\``;
        return r;
      }),
      resolvedOptions.separator.slice(0, row.length - 1)
    ).flat();
    row = row.filter(Boolean);

    const line = resolvedOptions.row(row.join(""), i);

    if (
      i !== 0 &&
      (lines.join("\n") + line).length > (resolvedOptions.textLimit || 0)
    ) {
      segments.push([...lines]);
      lines = [line];
    } else {
      lines.push(line);
    }

    if (i === data.length - 1) {
      segments.push([...lines]);
    }
  }
  if (typeof resolvedOptions.textLimit === "number") {
    return segments.map((s) => s.join("\n")) as unknown as R;
  }

  return segments.map((s) => s.join("\n")).join("\n") as unknown as R;
}
