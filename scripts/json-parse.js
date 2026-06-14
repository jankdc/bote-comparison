import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const filePath = process.argv[2] ?? fileURLToPath(new URL('../citylots.json', import.meta.url));

const doc = JSON.parse(readFileSync(filePath, 'utf8'));

const byStreet = doc.features.reduce((tally, feature) => {
  const street = feature.properties?.STREET;
  if (typeof street === 'string') {
    tally.set(street, (tally.get(street) ?? 0) + 1);
  }
  return tally;
}, new Map());

console.log([...byStreet].sort((a, b) => b[1] - a[1]).slice(0, 10));
