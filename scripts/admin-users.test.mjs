import { test } from 'node:test';
import assert from 'node:assert/strict';
import nodemailer from 'nodemailer';
import { verifyAdministrator, grantAdministrator, sendAdministratorInvite } from '../src/lib/admin-users.server.ts';
import { passwordRedirectUrl } from '../src/lib/auth-redirect.ts';

function roleClient({ user = { id: 'caller' }, authError = null, role = { role: 'admin' }, roleError = null } = {}) {
  const filters = [];
  const query = {
    select: () => query,
    eq: (key, value) => { filters.push([key, value]); return query; },
    maybeSingle: async () => ({ data: role, error: roleError }),
  };
  return { client: { auth: { getUser: async () => ({ data: { user }, error: authError }) }, from: () => query }, filters };
}

test('anonymous, invalid and non-admin sessions cannot manage administrators', async () => {
  for (const state of [{ user: null }, { authError: new Error('invalid token') }, { role: null }, { roleError: new Error('denied') }]) {
    await assert.rejects(verifyAdministrator(roleClient(state).client, 'untrusted-token'));
  }
});

test('administrator authorization checks the verified user ID and admin role', async () => {
  const { client, filters } = roleClient();
  await verifyAdministrator(client, 'token');
  assert.deepEqual(filters, [['user_id', 'caller'], ['role', 'admin']]);
});

test('existing accounts are found beyond the first page and keep their password', async () => {
  const pages = [];
  const grants = [];
  const db = {
    auth: { admin: {
      listUsers: async ({ page }) => { pages.push(page); return { data: { users: page === 1 ? Array.from({ length: 1000 }, (_, id) => ({ id: `${id}`, email: `${id}@example.com` })) : [{ id: 'target', email: 'PERSON@example.com' }] }, error: null }; },
      generateLink: async () => { throw new Error('Existing account must not be recreated'); },
    } },
    from: () => ({ upsert: async (value, options) => { grants.push([value, options]); return { error: null }; } }),
  };
  assert.deepEqual(await grantAdministrator(db, 'person@example.com'), { email: 'person@example.com', invitationLink: undefined });
  assert.deepEqual(pages, [1, 2]);
  assert.deepEqual(grants[0][0], { user_id: 'target', role: 'admin' });
});

test('new accounts receive the admin role only after invitation creation succeeds', async () => {
  const calls = [];
  const db = {
    auth: { admin: {
      listUsers: async () => ({ data: { users: [] }, error: null }),
      generateLink: async input => { calls.push(input); return { data: { user: { id: 'new' }, properties: { action_link: 'private-invitation-link' } }, error: null }; },
    } },
    from: () => ({ upsert: async value => { calls.push(value); return { error: null }; } }),
  };
  const result = await grantAdministrator(db, 'new@example.com');
  assert.equal(result.invitationLink, 'private-invitation-link');
  assert.equal(calls[0].type, 'invite');
  assert.equal(calls[0].options.redirectTo, 'https://amuni-definitivo.vercel.app/admin/reset-password');
  assert.deepEqual(calls[1], { user_id: 'new', role: 'admin' });
  db.auth.admin.generateLink = async () => ({ data: {}, error: new Error('failed') });
  await assert.rejects(grantAdministrator(db, 'bad@example.com'));
  assert.equal(calls.length, 2);
});

test('recovery redirects use the domain Supabase allows and support localhost', () => {
  assert.equal(passwordRedirectUrl('https://amuni-sicilia.vercel.app'), 'https://amuni-definitivo.vercel.app/admin/reset-password');
  assert.equal(passwordRedirectUrl('http://localhost:8080'), 'http://localhost:8080/admin/reset-password');
});

test('failed invitation delivery is reported without logging or returning the personal link', async t => {
  const previous = process.env.AMUNI_GMAIL_APP_PASSWORD;
  process.env.AMUNI_GMAIL_APP_PASSWORD = 'test-only';
  t.after(() => { if (previous === undefined) delete process.env.AMUNI_GMAIL_APP_PASSWORD; else process.env.AMUNI_GMAIL_APP_PASSWORD = previous; });
  const messages = [];
  t.mock.method(nodemailer, 'createTransport', () => ({ sendMail: async message => { messages.push(message); return { accepted: [] }; } }));
  assert.equal(await sendAdministratorInvite('new@example.com', 'private-link'), false);
  assert.equal(messages[0].to, 'new@example.com');
  assert.ok(messages[0].text.includes('private-link'));
});
