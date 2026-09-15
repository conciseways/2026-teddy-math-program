export const PLACES = [
  { name: 'ones', value: 1 },
  { name: 'tens', value: 10 },
  { name: 'hundreds', value: 100 },
  { name: 'thousands', value: 1000 }
];

export const DIFFICULTY_RANGES = {
  easy: { min: 10, max: 99 },
  medium: { min: 100, max: 999 },
  hard: { min: 1000, max: 9999 }
};

export function randomNumber(difficulty) {
  const { min, max } = DIFFICULTY_RANGES[difficulty] ?? DIFFICULTY_RANGES.medium;
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function largestPlace(number) {
  const digits = String(Math.abs(number)).length;
  return PLACES[Math.min(digits, PLACES.length) - 1].name;
}

// Digits from the largest place down to ones, e.g. 527 -> [hundreds:5, tens:2, ones:7].
export function digitsByPlace(number) {
  const places = PLACES.slice(0, String(Math.abs(number)).length).reverse();
  return places.map(({ name, value }) => ({
    place: name,
    digit: Math.floor(Math.abs(number) / value) % 10
  }));
}
