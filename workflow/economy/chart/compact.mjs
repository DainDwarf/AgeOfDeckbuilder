import { readFileSync, writeFileSync } from 'node:fs';

const dir = process.argv[2];
const curve = JSON.parse(readFileSync(`${dir}/curve.json`, 'utf8'));
const endings = JSON.parse(readFileSync(`${dir}/endings.json`, 'utf8'));
const runs = new Map();
for (const r of curve) {
  const key = `${r.cell}|${r.seed}`;
  if (!runs.has(key)) runs.set(key, { cell: r.cell, seed: r.seed, rows: [] });
  runs
    .get(key)
    .rows.push([
      r.turn,
      r.food,
      r.production,
      r.military,
      r.money,
      r.science,
      r.culture,
      r.population,
      r.held,
    ]);
}
for (const e of endings) {
  const run = runs.get(`${e.cell}|${e.seed}`);
  if (!run) continue;
  run.ending = e.ending;
  run.cause = e.cause;
  run.endTurn = e.turn;
  run.endPop = e.population;
  run.endHeld = e.held;
}
const data = [...runs.values()];
const html = readFileSync(`${process.argv[3]}`, 'utf8').replace('/*DATA*/', JSON.stringify(data));
writeFileSync(process.argv[4], html);
console.log(data.length, 'runs;', html.length, 'bytes');
