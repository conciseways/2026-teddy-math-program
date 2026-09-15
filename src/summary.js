import { OPERATIONS, DIFFICULTIES } from './prompts.js';

const labelOf = (choices, value) =>
  choices.find((choice) => choice.value === value)?.name ?? value;

export function formatSession({ name, operation, difficulty, questionCount, timed }) {
  return [
    `Student:    ${name}`,
    `Practice:   ${labelOf(OPERATIONS, operation)}`,
    `Difficulty: ${labelOf(DIFFICULTIES, difficulty)}`,
    `Questions:  ${questionCount}`,
    `Timer:      ${timed ? 'on' : 'off'}`
  ].join('\n');
}
