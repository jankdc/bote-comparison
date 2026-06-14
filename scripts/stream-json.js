import { createReadStream } from 'node:fs';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

import { parser } from 'stream-json';
import { pick } from 'stream-json/filters/pick.js';
import { streamArray } from 'stream-json/streamers/stream-array.js';
import { chain } from 'stream-chain';

const filePath = process.argv[2] ?? fileURLToPath(new URL('../citylots.json', import.meta.url));

const pipeline = chain([
  createReadStream(filePath),
  parser(),
  pick({ filter: 'features' }),
  streamArray(),
]);

const byStreet = new Map();
pipeline.on('data', ({ value }) => {
  const street = value.properties?.STREET;
  if (typeof street === 'string') {
    byStreet.set(street, (byStreet.get(street) ?? 0) + 1);
  }
});

await once(pipeline, 'end');

console.log([...byStreet].sort((a, b) => b[1] - a[1]).slice(0, 10));
