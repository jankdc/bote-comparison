import { createReadStream } from 'node:fs';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

import { JSONParser } from '@streamparser/json';

const filePath = process.argv[2] ?? fileURLToPath(new URL('../citylots.json', import.meta.url));

const parser = new JSONParser({
  paths: ['$.features.*.properties.STREET'],
  keepStack: false,
});

const byStreet = new Map();

parser.onValue = ({ value }) => {
  const street = value;
  if (typeof street === 'string') {
    byStreet.set(street, (byStreet.get(street) ?? 0) + 1);
  }
};

const stream = createReadStream(filePath);
stream.on('data', (chunk) => parser.write(chunk));
await once(stream, 'end');

console.log([...byStreet].sort((a, b) => b[1] - a[1]).slice(0, 10));
