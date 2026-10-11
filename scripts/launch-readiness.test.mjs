import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkFormTrap, consumeFormLimit} from '../src/lib/public-form-guard.server.ts';
import {purgeExpiredRequests, retentionCutoff} from '../src/lib/retention.server.ts';
import {passwordRedirectUrl} from '../src/lib/auth-redirect.ts';

test('filled trap and repeated submissions are rejected; limits expire', () => {
 assert.throws(() => checkFormTrap('spam.example'));
 assert.doesNotThrow(() => checkFormTrap(''));
 for (let i = 0; i < 3; i++) consumeFormLimit('test-limit', 10000, 3);
 assert.throws(() => consumeFormLimit('test-limit', 10001, 3));
 assert.doesNotThrow(() => consumeFormLimit('test-limit', 610001, 3));
});

test('normal customer recovery has its own page', () => {
 assert.equal(passwordRedirectUrl('https://amuni-sicilia.vercel.app', 'customer'), 'https://amuni-definitivo.vercel.app/imposta-password');
});

test('retention preserves approved applications and never deletes profiles or company pages', async () => {
 const calls = [];
 const db = {from: table => {
  const call = {table}; calls.push(call);
  const query = {select: () => {call.dryRun = true; return query;}, delete: () => {call.deleted = true; return query;}, lt: (column, cutoff) => {call.column = column; call.cutoff = cutoff; return query;}, in: (column, states) => {call.states = states; return query;}, then: resolve => resolve({count: 2, error: null})};
  return query;
 }};
 const now = new Date('2026-10-11T18:00:00Z');
 const report = await purgeExpiredRequests(db, false, now);
 assert.deepEqual(calls.map(call => call.table), ['iscrizioni', 'richieste_prodotti', 'richieste_interesse', 'acquirenti']);
 assert.deepEqual(calls[0].states, ['in_attesa', 'rifiutata']);
 assert.equal(calls.some(call => call.states?.includes('approvata')), false);
 assert.ok(calls.every(call => call.column === 'created_at' && call.cutoff === '2025-10-11T00:00:00.000Z'));
 assert.equal(report.removed.iscrizioni, 2);
 calls.length = 0;
 await purgeExpiredRequests(db, true, now);
 assert.ok(calls.every(call => call.dryRun && !call.deleted));
});

test('retention reports database failure rather than successful deletion', async () => {
 const query = {lt: () => query, in: () => query, then: resolve => resolve({error: {message: 'failure'}})};
 const db = {from: () => ({delete: () => query})};
 await assert.rejects(purgeExpiredRequests(db));
 assert.equal(retentionCutoff(new Date('2028-02-29T18:00:00Z')), '2027-02-28T00:00:00.000Z');
 assert.equal(retentionCutoff(new Date('2026-10-11T18:00:00Z')), '2025-10-11T00:00:00.000Z');
});
