import {setTimeout as sleep} from 'node:timers/promises'
import {Readable} from 'node:stream'

function * iter () {
  yield 1;
  yield 2;
  yield 3;
}

const mapped = iter().map(v => v * 2);

for (let v of mapped) {
  console.log(v)
}

async function * aiter () {
  await sleep(200)
  yield 1;
  await sleep(200)
  yield 2;
  await sleep(200)
  yield 3;
}

{
  const amapped = Readable.from(aiter()).map(v => v * 2);

  for await (let v of amapped) {
    console.log(v)
  }
}

{
  const amapped = Readable.from(aiter()).map(v => v * 2);
  console.log(await Array.fromAsync(amapped))
}
