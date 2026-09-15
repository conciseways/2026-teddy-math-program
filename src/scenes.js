export const NAMES = ['Joe', 'Mary', 'Teddy', 'Ava', 'Liam', 'Sofia', 'Noah', 'Ella'];

// `edible` gates wordings like "ate" that only make sense for food.
export const ITEMS = [
  { one: 'apple', many: 'apples', edible: true },
  { one: 'carrot', many: 'carrots', edible: true },
  { one: 'piece of candy', many: 'pieces of candy', edible: true },
  { one: 'cookie', many: 'cookies', edible: true },
  { one: 'sticker', many: 'stickers', edible: false },
  { one: 'marble', many: 'marbles', edible: false },
  { one: 'pencil', many: 'pencils', edible: false },
  { one: 'coin', many: 'coins', edible: false }
];

export const pick = (list) => list[Math.floor(Math.random() * list.length)];

export const between = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

export function shuffle(values) {
  const shuffled = [...values];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Two distinct kids and an item — the cast every word problem needs.
export function castAndItem() {
  const owner = pick(NAMES);
  return {
    item: pick(ITEMS),
    owner,
    other: pick(NAMES.filter((name) => name !== owner))
  };
}

export const amount = ({ item }, count) => `${count} ${count === 1 ? item.one : item.many}`;

export const more = ({ item }, count) => `${count} more ${count === 1 ? item.one : item.many}`;

// Four options around the answer, never zero or negative.
export function choicesAround(answer) {
  const offsets = answer > 0 ? [0, 1, -1, 10] : [0, 1, 2, 10];
  return shuffle([...new Set(offsets.map((offset) => answer + offset))].filter((value) => value >= 0));
}

export function pickScriptFor(scripts, scene) {
  return pick(scripts.filter((script) => !script.skipWhen?.(scene)));
}
