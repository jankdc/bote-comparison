import { fileURLToPath } from 'node:url';

import { open, fromFile } from '@botejs/core';

const filePath = process.argv[2] ?? fileURLToPath(new URL('../citylots.json', import.meta.url));

await using cursor = await open(fromFile(filePath));

const byStreet = await cursor
  .iter('features', {
    select: ['properties', 'STREET'],
  })
  .reduce((tally, street) => {
    if (typeof street === 'string') {
      tally.set(street, (tally.get(street) ?? 0) + 1);
    }
    return tally;
  }, new Map());

console.log([...byStreet].sort((a, b) => b[1] - a[1]).slice(0, 10));
