const test = require('node:test');
const assert = require('node:assert/strict');
const { getTokenAssuranceLevel, requiresMfaVerification } = require('../middleware/auth');

const tokenWithAal = (aal) => `header.${Buffer.from(JSON.stringify({ aal })).toString('base64url')}.signature`;

test('MFA enforcement requires aal2 for users with a verified factor', () => {
  const user = { factors: [{ id: 'factor-1', status: 'verified', factor_type: 'totp' }] };

  assert.equal(requiresMfaVerification(user, tokenWithAal('aal1')), true);
  assert.equal(requiresMfaVerification(user, tokenWithAal('aal2')), false);
});

test('MFA enforcement leaves users without a verified factor at aal1', () => {
  assert.equal(requiresMfaVerification({ factors: [] }, tokenWithAal('aal1')), false);
  assert.equal(requiresMfaVerification({ factors: [{ status: 'unverified' }] }, tokenWithAal('aal1')), false);
});

test('assurance-level parsing fails closed for enrolled MFA users', () => {
  const user = { factors: [{ status: 'verified' }] };

  assert.equal(getTokenAssuranceLevel('invalid-token'), null);
  assert.equal(requiresMfaVerification(user, 'invalid-token'), true);
});
