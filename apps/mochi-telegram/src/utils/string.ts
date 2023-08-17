const SPECIAL_CHARACTERS = [
  "_",
  "*",
  "[",
  "]",
  "(",
  ")",
  "~",
  "`",
  ">",
  "#",
  "+",
  "-",
  "=",
  "|",
  "{",
  "}",
  ".",
  "!",
];
export function equal(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase();
}

export function escape(val: string) {
  return val
    .replaceAll(".", "\\.")
    .replaceAll("=", "\\=")
    .replaceAll("+", "\\+")
    .replaceAll("-", "\\-")
    .replaceAll("_", "\\_")
    .replaceAll("!", "\\!");
}

export function capFirst(str = "") {
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
}

export function ellipsis(str: string | undefined = "", length = 20) {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

export function escapeAll(val: string) {
  return SPECIAL_CHARACTERS.reduce((acc, character) => {
    return acc.replaceAll(character, `\\${character}`);
  }, val);
}

export function isValidEmail(target?: string): boolean {
  if (!target) return false;
  const expression: RegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return expression.test(target);
}
