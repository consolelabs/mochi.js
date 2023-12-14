type Props = {
  /**
   * index base, start from 0
   */
  page: number;
  totalPage: number;
};

export default async function ({ page, totalPage }: Props) {
  page = Math.min(page, totalPage - 1);

  if (totalPage <= 1) {
    return {
      text: "",
    };
  }

  return {
    text: `Page ${page + 1} of ${totalPage}`,
  };
}
