// Every activity is checked against this many generated questions, per difficulty.
export const SAMPLE_SIZE = 30;

export const DIFFICULTIES = ['easy', 'medium', 'hard'];

export const times = (count, build) => Array.from({ length: count }, (_, index) => build(index));

// Numbers as the student reads them in the prompt, e.g. "Is 4 + 3 = 9?" -> [4, 3, 9].
export const numbersIn = (message) => (message.match(/\d+/g) ?? []).map(Number);
