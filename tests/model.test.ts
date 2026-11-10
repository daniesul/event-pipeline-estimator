import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTIVATION_OPTIONS,
  DEFAULT_INPUTS,
  type ForecastInputs,
  SPONSORSHIP_OPTIONS,
  calculateForecast,
  compareScenarios,
} from '../src/lib/model.ts';
import { formatCount, formatCurrency } from '../src/lib/format.ts';

const base = (): ForecastInputs => ({
  ...DEFAULT_INPUTS,
  activations: [],
  conversions: { ...DEFAULT_INPUTS.conversions },
});

const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-6, `${a} ≈ ${b}`);

test('default scenario matches the specification', () => {
  const r = calculateForecast(base());
  assert.equal(r.engagementRate, 10);
  close(r.engagedAttendees, 2000);
  close(r.mqls, 320);
  close(r.meetings, 64);
  close(r.opportunities, 21.76);
  close(r.pipeline, 1_088_000);
  assert.equal(formatCount(r.opportunities), '22');
  assert.equal(formatCurrency(r.pipeline), '$1,088,000');
});

test('intermediate values are not rounded', () => {
  // Rounding opportunities to 22 first would give $1,100,000.
  const r = calculateForecast(base());
  assert.notEqual(Math.round(r.opportunities) * 50_000, r.pipeline);
});

test('each sponsorship footprint uses its base rate', () => {
  const expected = { small: 5, standard: 10, large: 13, premier: 16 };
  for (const option of SPONSORSHIP_OPTIONS) {
    const r = calculateForecast({ ...base(), sponsorship: option.id });
    assert.equal(r.engagementRate, expected[option.id]);
    close(r.pipeline, 20_000 * (expected[option.id] / 100) * 0.16 * 0.2 * 0.34 * 50_000);
  }
});

test('each activation adds its uplift', () => {
  const expected = { speaking: 2, demos: 1.5, swag: 1, vip: 3, partner: 1.5 };
  for (const a of ACTIVATION_OPTIONS) {
    const r = calculateForecast({ ...base(), activations: [a.id] });
    close(r.engagementRate, 10 + expected[a.id]);
  }
});

test('activations combine and engagement is capped at 25%', () => {
  const all = ACTIVATION_OPTIONS.map((a) => a.id);
  const standard = calculateForecast({ ...base(), activations: all });
  close(standard.engagementRate, 19);
  assert.equal(standard.isCapped, false);

  const premier = calculateForecast({ ...base(), sponsorship: 'premier', activations: all });
  assert.equal(premier.engagementRate, 25);
  assert.equal(premier.isCapped, false); // 16 + 9 = exactly 25

  const dupes = calculateForecast({ ...base(), sponsorship: 'premier', activations: [...all, 'vip', 'vip'] });
  assert.equal(dupes.engagementRate, 25, 'duplicate ids are ignored');
});

test('conversion rates flow downstream', () => {
  const r = calculateForecast({
    ...base(),
    conversions: { engagementToMql: 25, mqlToMeeting: 50, meetingToOpportunity: 10 },
  });
  close(r.mqls, 500);
  close(r.meetings, 250);
  close(r.opportunities, 25);
  close(r.pipeline, 1_250_000);
});

test('0% and 100% conversion boundaries', () => {
  const zero = calculateForecast({ ...base(), conversions: { ...base().conversions, mqlToMeeting: 0 } });
  assert.equal(zero.pipeline, 0);
  const full = calculateForecast({
    ...base(),
    conversions: { engagementToMql: 100, mqlToMeeting: 100, meetingToOpportunity: 100 },
  });
  close(full.opportunities, 2000);
});

test('invalid inputs never produce NaN, Infinity or negatives', () => {
  const bad = [NaN, Infinity, -Infinity, -500];
  for (const v of bad) {
    const r = calculateForecast({
      ...base(),
      attendees: v,
      avgOpportunityValue: v,
      conversions: { engagementToMql: v, mqlToMeeting: v, meetingToOpportunity: v },
    });
    for (const n of Object.values(r)) {
      if (typeof n === 'number') {
        assert.ok(Number.isFinite(n) && n >= 0, `got ${n} for input ${v}`);
      }
    }
  }
  assert.equal(formatCurrency(NaN), '$0');
});

test('scenario comparison keeps activations and conversions constant', () => {
  const inputs = { ...base(), activations: ['speaking' as const], conversions: { engagementToMql: 20, mqlToMeeting: 20, meetingToOpportunity: 34 } };
  const rows = compareScenarios(inputs);
  assert.deepEqual(
    rows.map((r) => r.result.engagementRate),
    [7, 12, 15, 18],
  );
  const selected = rows.find((r) => r.option.id === inputs.sponsorship)!;
  assert.equal(selected.result.pipeline, calculateForecast(inputs).pipeline);
});
