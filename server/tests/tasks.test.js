const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeDate, validDate, formatTask } = require('../routes/tasks');

test('normalizeDate extracts YYYY-MM-DD from various date formats', () => {
  assert.equal(normalizeDate('2026-09-05'), '2026-09-05');
  assert.equal(normalizeDate('2026-09-05T00:00:00.000Z'), '2026-09-05');
  assert.equal(normalizeDate('2026-09-05T17:30:00.000Z'), '2026-09-05');
  assert.equal(normalizeDate(new Date('2026-09-05T00:00:00.000Z')), '2026-09-05');
  assert.equal(normalizeDate(null), null);
  assert.equal(normalizeDate(undefined), undefined);
});

test('validDate validates YYYY-MM-DD strings, ISO strings, and Date objects', () => {
  assert.equal(validDate('2026-09-05'), true);
  assert.equal(validDate('2026-09-05T00:00:00.000Z'), true);
  assert.equal(validDate(new Date('2026-09-05T00:00:00.000Z')), true);

  // Invalid cases
  assert.equal(validDate('invalid-date'), false);
  assert.equal(validDate('2026-02-30'), false);
  assert.equal(validDate('2026-13-01'), false);
  assert.equal(validDate(''), false);
  assert.equal(validDate(null), false);
  assert.equal(validDate(undefined), false);
});

test('formatTask ensures due_date is formatted as YYYY-MM-DD', () => {
  const taskWithIso = {
    id: 1,
    title: 'Spade',
    due_date: '2026-09-05T00:00:00.000Z',
    status: 'IN_PROGRESS'
  };
  const formatted = formatTask(taskWithIso);
  assert.equal(formatted.due_date, '2026-09-05');

  const taskWithDateObj = {
    id: 2,
    title: 'Test',
    due_date: new Date('2026-09-05T00:00:00.000Z'),
    status: 'PENDING'
  };
  const formatted2 = formatTask(taskWithDateObj);
  assert.equal(formatted2.due_date, '2026-09-05');
});
