export function removeBy<T>(arr: T[], predicate: (item: T) => boolean) {
  let indices: number[] = [];

  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) {
      indices.push(i);
    }
  }

  indices.forEach((i) => arr.splice(i, 1));
}
