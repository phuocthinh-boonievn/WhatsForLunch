const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { execFileSync } = require('node:child_process');

const root = join(__dirname, '..');
const out = mkdtempSync(join(tmpdir(), 'lunch-selection-'));

try {
  execFileSync(
    process.execPath,
    [
      require.resolve('typescript/bin/tsc'),
      'src/lib/foods.ts',
      'src/lib/case-mechanics.ts',
      '--ignoreConfig',
      '--outDir',
      out,
      '--module',
      'commonjs',
      '--target',
      'es2020',
      '--skipLibCheck',
    ],
    { cwd: root, stdio: 'inherit' },
  );

  const { foods } = require(join(out, 'foods.js'));
  const { createFoodSelector, priceRarity, TARGET_LUNCH_PRICE } = require(
    join(out, 'case-mechanics.js'),
  );

  assert.equal(foods.length, 116);
  assert.equal(foods.filter((f) => f.veg).length, 8);
  assert.equal(TARGET_LUNCH_PRICE, 50);
  foods.forEach((f) => assert.equal(f.rarity, priceRarity(f.price)));

  const bands = [
    [40, 0],
    [65, 1],
    [100, 2],
    [130, 3],
    [999, 4],
  ];
  for (const [max, rarity] of bands) {
    const sample = foods.find((f) => f.price <= max && priceRarity(f.price) === rarity);
    assert.ok(sample, `missing rarity ${rarity}`);
  }

  let seed = 12345;
  const rng = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);

  for (const target of [30, 35, 50, 75, 100, 150, 180]) {
    const selector = createFoodSelector(foods, target);
    const mass = (f) => selector.probabilities.get(f);
    assert.ok(Math.abs(selector.expectedPrice - target) < 1e-9);
    assert.ok(Math.abs([...selector.probabilities.values()].reduce((a, b) => a + b, 0) - 1) < 1e-12);

    let spend = 0;
    for (let i = 0; i < 20000; i++) spend += selector.choose(foods, rng).price;
    assert.ok(Math.abs(spend / 20000 - target) < 1.5);

    for (const pool of [foods, foods.filter((f) => f.veg)]) {
      let cum = 0;
      const total = pool.reduce((a, f) => a + mass(f), 0);
      for (const f of pool) {
        assert.equal(selector.choose(pool, () => (cum + mass(f) / 2) / total), f);
        cum += mass(f);
      }
      assert.ok(
        Math.abs(selector.meanFor(pool) - pool.reduce((a, f) => a + f.price * mass(f), 0) / total) <
          1e-9,
      );
    }
  }

  let previous = [0, 0, 0, 0];
  for (let m = 30; m <= 180; m++) {
    const selector = createFoodSelector(foods, m);
    const tails = [1, 2, 3, 4].map((t) =>
      foods.filter((f) => f.rarity >= t).reduce((a, f) => a + selector.probabilities.get(f), 0),
    );
    tails.forEach((x, i) => assert.ok(x >= previous[i] - 1e-12));
    previous = tails;
  }

  const veg = foods.filter((f) => f.veg);
  const vegSelector = createFoodSelector(foods, 150);
  const vegTotal = veg.reduce((a, x) => a + vegSelector.probabilities.get(x), 0);
  assert.ok(Math.max(...veg.map((f) => vegSelector.probabilities.get(f) / vegTotal)) < 0.8);

  assert.throws(() => createFoodSelector([], 50));
  for (const m of [0, NaN, Infinity, 24, 261]) assert.throws(() => createFoodSelector(foods, m));

  console.log('PASS: 116 meals, 8 vegetarian, means, rarity bands, vegetarian conditioning');
} finally {
  rmSync(out, { recursive: true, force: true });
}
