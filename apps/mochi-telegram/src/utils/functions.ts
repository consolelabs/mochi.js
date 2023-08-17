export async function pipe<T>(
  input: Required<T>,
  ...fnArray: Array<(input: Required<T>) => Promise<Required<T>>>
) {
  let value = input;
  for (const fn of fnArray) {
    value = await fn(value);
  }
  return value;
}
