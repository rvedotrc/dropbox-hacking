const maxLength = (iter: Iterable<string>) => {
  let l = -1;
  for (const s of iter) {
    if (s.length > l) l = s.length;
  }
  return l;
};

const isUnambiguous = (items: ReadonlySet<string>, prefixLength: number) => {
  const shortItems = [...items].map((s) => s.substring(0, prefixLength));
  return new Set(shortItems).size === items.size;
};

export const unambiguousPrefixLength = (items: ReadonlySet<string>): number => {
  if (items.size <= 1) return 1;

  let bad = 0;
  let good = maxLength(items);

  while (good > bad + 1) {
    const maybe = Math.floor((good + bad) / 2);

    if (isUnambiguous(items, maybe)) good = maybe;
    else bad = maybe;
  }

  return good;
};
