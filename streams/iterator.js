import { setTimeout as sleep } from 'timers/promises';
import { Readable } from 'node:stream';

async function* generate() {
  yield 'hello';
  await sleep(10);  // Simulates a delay
  yield ' ';
  await sleep(10);  // Simulates another delay
  yield 'world';
}

Readable.from(generate()).on('data', chunk => console.log(chunk));
