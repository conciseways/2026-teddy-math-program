import { ACTIVITIES, DIFFICULTIES } from './prompts.js';

const labelOf = (choices, value) =>
  choices.find((choice) => choice.value === value)?.name ?? value;

export function formatSession({ name, activity, difficulty, questionCount }) {
  return [
    `Student:    ${name}`,
    `Activity:   ${labelOf(ACTIVITIES, activity)}`,
    `Difficulty: ${labelOf(DIFFICULTIES, difficulty)}`,
    `Per round:  ${questionCount} ${questionCount === 1 ? 'question' : 'questions'}`
  ].join('\n');
}

export function formatScore({ asked, correct }) {
  const percent = asked === 0 ? 0 : Math.round((correct / asked) * 100);
  return `${correct}/${asked} (${percent}%)`;
}
