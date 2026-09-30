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
      'src/lib/pool.ts',
      'src/lib/sprite.ts',
      'src/lib/surprises.ts',
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
  const { poolFor, mealSegmentForHour, priceBounds } = require(join(out, 'pool.js'));
  const { artUri, spriteFor } = require(join(out, 'sprite.js'));
  const surprises = require(join(out, 'surprises.js'));
  const {
    createFoodSelector,
    priceRarity,
    createSpinProfile,
    spinProgress,
    clampTarget,
    budgetTargetFor,
    budgetLabel,
    BUDGET_SLOTS,
  } = require(join(out, 'case-mechanics.js'));

  const byKind = (kind) => foods.filter((food) => food.kind === kind);
  assert.equal(foods.length, 384);
  assert.equal(byKind('food').length, 168);
  assert.equal(byKind('drink').length, 72);
  assert.equal(byKind('snack').length, 96);
  assert.equal(byKind('nhau').length, 48);
  assert.equal(foods.filter((food) => food.veg).length, 15);

  const comTam = foods.find((food) => food.name === 'Cơm tấm');
  assert.equal(comTam.price, 70);
  assert.equal(comTam.category, 'rice');
  assert.equal(comTam.rarity, 2);
  const sushi = foods.find((food) => food.name === 'Sushi cá hồi');
  assert.equal(sushi.price, 150);
  assert.equal(sushi.rarity, 3);
  const steak = foods.find((food) => food.name === 'Bò bít tết');
  assert.equal(steak.rarity, 4);
  assert.equal(foods.some((food) => food.name === 'Burger'), false);
  assert.ok(foods.some((food) => food.name === 'Burger bò' && food.price === 65));
  assert.equal(foods.find((food) => food.name === 'Falafel kèm pita').price, 90);
  assert.equal(foods.find((food) => food.image === 94).category, 'noodles');
  assert.equal(foods.find((food) => food.name === 'Cà phê đen đá').kind, 'drink');
  assert.equal(foods.find((food) => food.name === 'Cà phê đen đá').rarity, priceRarity(25, 'drink'));
  assert.equal(priceRarity(25, 'drink'), 1);
  assert.equal(priceRarity(25, 'food'), 0);
  assert.equal(priceRarity(151, 'food'), 4);
  assert.equal(priceRarity(150, 'food'), 3);
  foods.forEach((food) => assert.equal(food.rarity, priceRarity(food.price, food.kind)));

  const lunch = poolFor(foods, 'food', 'lunch');
  assert.equal(lunch.length, 144);
  assert.equal(lunch.some((food) => food.image >= 600 && food.image <= 623), false);
  const breakfast = poolFor(foods, 'food', 'breakfast');
  assert.ok(breakfast.some((food) => food.image === 600));
  assert.ok(breakfast.some((food) => food.name === 'Cơm tấm'));
  const dinner = poolFor(foods, 'food', 'dinner');
  assert.ok(dinner.some((food) => food.image === 623));
  assert.ok(dinner.some((food) => food.name === 'Cơm tấm'));
  assert.equal(poolFor(foods, 'drink', 'lunch').length, 72);
  assert.equal(poolFor(foods, 'snack', null).length, 96);

  assert.equal(mealSegmentForHour(3), 'night');
  assert.equal(mealSegmentForHour(9), 'breakfast');
  assert.equal(mealSegmentForHour(12), 'lunch');
  assert.equal(mealSegmentForHour(18), 'dinner');

  assert.deepEqual(
    BUDGET_SLOTS.map((slot) => budgetTargetFor('food', slot)),
    [30, 50, 80, 120, 180],
  );
  assert.equal(budgetLabel('drink', '30'), 'Hết tiền rồi · 20k');
  assert.equal(budgetLabel('food', 'unlimited'), 'Mới nhận lương · 180k');
  assert.equal(budgetLabel('snack', '100'), '35k');
  assert.equal(clampTarget([25, 270], 10), 25);
  assert.equal(clampTarget([25, 270], 400), 270);

  const art = artUri(0);
  assert.match(art, /^https:\/\/truanayangi\.com\/optimized\/art-food-0-/);
  assert.equal(artUri(600), null);
  assert.match(spriteFor(600).uri, /food-meals-0/);
  assert.match(spriteFor(132).uri, /drink-0/);
  assert.match(spriteFor(400).uri, /nhau-0/);
  assert.equal(spriteFor(0).cols, 2);

  const reduced = createSpinProfile(() => 0, true);
  assert.equal(reduced.durationMs, 4000);
  assert.equal(reduced.tiles, 10);
  const full = createSpinProfile(() => 0.999, false);
  assert.ok(full.durationMs >= 7500 && full.durationMs <= 9500);
  assert.ok(full.tiles >= 30 && full.tiles <= 40);
  assert.equal(spinProgress(1, full.friction), 1);
  assert.equal(spinProgress(0, 3), 0);

  let seed = 12345;
  const rng = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);

  for (const slot of BUDGET_SLOTS) {
    const target = budgetTargetFor('food', slot);
    const selector = createFoodSelector(lunch, target);
    assert.ok(Math.abs(selector.expectedPrice - target) < 1e-6);
    let spend = 0;
    for (let i = 0; i < 4000; i++) spend += selector.choose(lunch, rng).price;
    assert.ok(Math.abs(spend / 4000 - target) < 2.5, `food mean ${slot}`);
  }

  const veg = lunch.filter((food) => food.veg);
  assert.ok(veg.length >= 8);
  const vegSelector = createFoodSelector(lunch, 150);
  const vegTotal = veg.reduce((sum, food) => sum + vegSelector.probabilities.get(food), 0);
  assert.ok(Math.max(...veg.map((food) => vegSelector.probabilities.get(food) / vegTotal)) < 0.8);

  const drinks = poolFor(foods, 'drink', null);
  for (const target of [20, 25, 35, 45, 50]) {
    const selector = createFoodSelector(drinks, target);
    assert.ok(Math.abs(selector.expectedPrice - target) < 1e-6);
  }

  let previous = [0, 0, 0, 0];
  const { min, max } = priceBounds(lunch);
  for (let money = min; money <= max; money += 15) {
    const selector = createFoodSelector(lunch, money);
    const tails = [1, 2, 3, 4].map((tier) =>
      lunch.filter((food) => food.rarity >= tier).reduce((sum, food) => sum + selector.probabilities.get(food), 0),
    );
    tails.forEach((value, index) => assert.ok(value >= previous[index] - 1e-9));
    previous = tails;
  }

  assert.throws(() => createFoodSelector([], 50));
  assert.throws(() => createFoodSelector(lunch, 0));
  assert.throws(() => createFoodSelector(lunch, min - 1));

  assert.equal(surprises.applyTitleTap(null, 0).unlocked, false);
  let state = null;
  let unlocked = false;
  for (let tap = 0; tap < surprises.KNIFE_TAPS; tap++) {
    const next = surprises.applyTitleTap(state, 1000 + tap * 100);
    state = next.state;
    unlocked = next.unlocked;
  }
  assert.equal(unlocked, true);
  const expired = surprises.applyTitleTap({ count: 6, startedAt: 0 }, surprises.KNIFE_WINDOW_MS + 1);
  assert.equal(expired.unlocked, false);
  assert.equal(expired.state.count, 1);
  assert.equal(surprises.nextRareStreak(2, 3), 3);
  assert.equal(surprises.nextRareStreak(2, 1), 0);
  assert.equal(surprises.shouldCelebrateGold(4, false), true);
  assert.equal(surprises.shouldCelebrateGold(4, true), false);
  assert.equal(surprises.shouldCelebrateGold(3, false), false);
  assert.equal(surprises.shouldHaptic(true, false), true);
  assert.equal(surprises.shouldHaptic(false, false), false);
  assert.equal(surprises.shouldHaptic(true, true), false);
  assert.equal(surprises.isShake({ x: 0, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }), true);
  assert.equal(surprises.isShake({ x: 0, y: 0, z: 0 }, { x: 0.2, y: 0, z: 0 }), false);

  console.log('PASS: 384 dishes, kind pools, rarity bands, meal windows, sprites, surprises');
} finally {
  rmSync(out, { recursive: true, force: true });
}
