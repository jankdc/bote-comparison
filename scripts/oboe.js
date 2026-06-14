import { createReadStream } from 'node:fs';
import { fileURLToPath } from 'node:url';

import oboe from 'oboe';

const filePath = process.argv[2] ?? fileURLToPath(new URL('../citylots.json', import.meta.url));

const byStreet = new Map();

await new Promise((resolve, reject) => {
  oboe(createReadStream(filePath))
    .node('features.*', (feature) => {
      const street = feature.properties?.STREET;
      if (typeof street === 'string') {
        byStreet.set(street, (byStreet.get(street) ?? 0) + 1);
      }
      return oboe.drop; // free this feature's subtree so the heap stays flat
    })
    .done(() => resolve())
    .fail((err) => reject(err.thrown ?? err));
});

console.log([...byStreet].sort((a, b) => b[1] - a[1]).slice(0, 10));
