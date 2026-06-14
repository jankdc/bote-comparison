import { createReadStream } from 'node:fs';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

import JSONStream from 'JSONStream';

const filePath = process.argv[2] ?? fileURLToPath(new URL('../citylots.json', import.meta.url));
const parser = JSONStream.parse(['features', true]);

const byStreet = new Map();

parser.on('data', (feature) => {
  const street = feature.properties?.STREET;
  if (typeof street === 'string') {
    byStreet.set(street, (byStreet.get(street) ?? 0) + 1);
  }
});

createReadStream(filePath).pipe(parser);
await once(parser, 'end');

console.log([...byStreet].sort((a, b) => b[1] - a[1]).slice(0, 10));
