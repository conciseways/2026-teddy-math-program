#!/usr/bin/env node
import { promptAnotherRound, promptSession } from './src/prompts.js';
import { formatScore, formatSession } from './src/summary.js';
import { runNumberRecognition } from './src/numberRecognition.js';

async function main() {
  console.log('Teddy Math Program\n');

  try {
    const session = await promptSession();
    console.log(`\n${formatSession(session)}`);

    if (session.activity === 'number-recognition') {
      const total = { asked: 0, correct: 0 };

      do {
        const round = await runNumberRecognition(session);
        total.asked += round.asked;
        total.correct += round.correct;
        console.log(`Round score: ${formatScore(round)}`);
        console.log(`Total score: ${formatScore(total)}\n`);
      } while (await promptAnotherRound(session.questionCount));

      console.log(`\nNice work, ${session.name}! Final score: ${formatScore(total)}`);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'ExitPromptError') {
      console.log('\nSee you next time!');
      return;
    }
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
