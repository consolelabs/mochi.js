async function pipe<T>(
  input: T,
  ...fnArray: Array<(input: T) => Required<T> | Promise<Required<T>>>
) {
  let value = input;
  for (const fn of fnArray) {
    value = await fn(value);
  }
  return value;
}

export default {
  pipe,
};
