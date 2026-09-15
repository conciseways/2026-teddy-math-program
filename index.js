#!/usr/bin/env node
import { promptSession } from './src/prompts.js';
import { formatScore, formatSession } from './src/summary.js';
import { runNumberRecognition } from './src/numberRecognition.js';

async function main() {
  console.log('Teddy Math Program\n');

  try {
    const session = await promptSession();
    console.log(`\n${formatSession(session)}`);

    if (session.activity === 'number-recognition') {
      const score = await runNumberRecognition(session);
      console.log(formatScore(score));
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
