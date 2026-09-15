import { ACTIVITIES, OPERATIONS, DIFFICULTIES } from './prompts.js';

const labelOf = (choices, value) =>
  choices.find((choice) => choice.value === value)?.name ?? value;

export function formatSession({ name, activity, operation, difficulty, questionCount, timed }) {
  const lines = [
    `Student:    ${name}`,
    `Activity:   ${labelOf(ACTIVITIES, activity)}`
  ];

  if (operation) {
    lines.push(`Practice:   ${labelOf(OPERATIONS, operation)}`);
  }

  lines.push(
    `Difficulty: ${labelOf(DIFFICULTIES, difficulty)}`,
    `Per round:  ${questionCount} ${questionCount === 1 ? 'question' : 'questions'}`,
    `Timer:      ${timed ? 'on' : 'off'}`
  );

  return lines.join('\n');
}

export function formatScore({ asked, correct }) {
  const percent = asked === 0 ? 0 : Math.round((correct / asked) * 100);
  return `${correct}/${asked} (${percent}%)`;
}
