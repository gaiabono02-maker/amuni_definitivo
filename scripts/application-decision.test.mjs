import { test } from 'node:test';
import assert from 'node:assert/strict';
import nodemailer from 'nodemailer';
import { applicationDecisionEmail, sendApplicationDecisionEmail } from '../src/lib/application-decision-email.server.ts';
import { saveApplicationDecision } from '../src/lib/application-decision.server.ts';

const recipient = { nome: 'Maria', azienda: 'Azienda esempio', email: 'referente@example.com' };
const input = { id: 'application-id', stato: 'approvata', retryEmail: false };

function database(stato = 'in_attesa', { writeError = null, conflict = false, readError = null } = {}) {
  const stored = { id: input.id, ...recipient, stato };
  const updates = [];
  const db = { from: table => {
    assert.equal(table, 'iscrizioni');
    let patch;
    const filters = [];
    const query = {
      select: () => query,
      eq: (key, value) => { filters.push([key, value]); return query; },
      update: values => { patch = values; return query; },
      single: async () => ({ data: readError ? null : {...stored}, error: readError }),
      maybeSingle: async () => {
        updates.push({ patch, filters });
        if (writeError) return { data: null, error: writeError };
        if (conflict || filters.some(([key, value]) => stored[key] !== value)) return { data: null, error: null };
        Object.assign(stored, patch);
        return { data: {id: stored.id}, error: null };
      },
    };
    return query;
  } };
  return { db, stored, updates };
}

test('approval and refusal use distinct personal replies and do not claim the company is published', () => {
  const approved = applicationDecisionEmail(recipient, 'approvata');
  const refused = applicationDecisionEmail(recipient, 'rifiutata');
  for (const email of [approved, refused]) {
    assert.ok(email.text.includes(recipient.nome));
    assert.ok(email.text.includes(recipient.azienda));
    assert.match(email.text, /rispondere direttamente/);
    assert.doesNotMatch(email.text, /azienda è già pubblicata/);
  }
  assert.match(approved.text, /è stata approvata/);
  assert.match(refused.text, /non possiamo accogliere/);
  assert.notEqual(approved.subject, refused.subject);
});

test('the decision is saved before its email and the stored applicant is the recipient', async () => {
  for (const stato of ['approvata', 'rifiutata']) {
    const { db, stored, updates } = database();
    const deliveries = [];
    const result = await saveApplicationDecision(db, {...input, stato}, async (application, decision) => {
      assert.equal(stored.stato, stato);
      deliveries.push({application, decision});
      return true;
    });
    assert.equal(result.emailSent, true);
    assert.equal(deliveries[0].application.email, recipient.email);
    assert.equal(deliveries[0].decision, stato);
    assert.deepEqual(updates[0].filters, [['id', input.id], ['stato', 'in_attesa']]);
  }
});

test('repeating the same decision does not send duplicate mail; explicit retry sends without changing state', async () => {
  const { db, updates } = database();
  let sent = 0;
  const send = async () => { sent++; return true; };
  await saveApplicationDecision(db, input, send);
  const unchanged = await saveApplicationDecision(db, input, send);
  assert.equal(unchanged.emailAttempted, false);
  assert.equal(sent, 1);
  await saveApplicationDecision(db, {...input, retryEmail: true}, send);
  assert.equal(sent, 2);
  assert.equal(updates.length, 1);
});

test('mail failure preserves the saved decision and reports the failure', async () => {
  for (const send of [async () => false, async () => { throw new Error('SMTP failed'); }]) {
    const { db, stored } = database();
    const result = await saveApplicationDecision(db, input, send);
    assert.equal(result.emailAttempted, true);
    assert.equal(result.emailSent, false);
    assert.equal(stored.stato, 'approvata');
  }
});

test('failed, missing or concurrent database updates never send a decision email', async () => {
  for (const options of [{writeError: new Error('write failed')}, {conflict: true}, {readError: new Error('missing')}]) {
    let sent = false;
    const { db } = database('in_attesa', options);
    await assert.rejects(saveApplicationDecision(db, input, async () => { sent = true; return true; }));
    assert.equal(sent, false);
  }
});

test('returning to pending sends no mail and stale retries cannot announce a different decision', async () => {
  const { db, stored } = database('approvata');
  let sent = false;
  const send = async () => { sent = true; return true; };
  const result = await saveApplicationDecision(db, {...input, stato: 'in_attesa'}, send);
  assert.equal(result.emailAttempted, false);
  assert.equal(stored.stato, 'in_attesa');
  await assert.rejects(saveApplicationDecision(db, {...input, retryEmail: true}, send));
  assert.equal(sent, false);
});

function configureMail(t) {
  const names = ['AMUNI_SMTP_HOST', 'AMUNI_SMTP_USER', 'AMUNI_SMTP_PASSWORD', 'AMUNI_NOREPLY_EMAIL', 'AMUNI_SMTP_PORT', 'AMUNI_GMAIL_APP_PASSWORD'];
  const previous = Object.fromEntries(names.map(name => [name, process.env[name]]));
  names.forEach(name => delete process.env[name]);
  process.env.AMUNI_GMAIL_APP_PASSWORD = 'test-password';
  t.after(() => { for (const [name, value] of Object.entries(previous)) { if (value === undefined) delete process.env[name]; else process.env[name] = value; } });
}

test('SMTP acceptance is required and replies reach the project mailbox', async t => {
  configureMail(t);
  const messages = [];
  t.mock.method(nodemailer, 'createTransport', () => ({ sendMail: async message => { messages.push(message); return {accepted: [recipient.email.toUpperCase()]}; } }));
  assert.equal(await sendApplicationDecisionEmail(recipient, 'approvata'), true);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].to[0].address, recipient.email);
  assert.equal(messages[0].replyTo, 'amunirichieste@gmail.com');
  assert.equal(messages[0].from.address, 'amunirichieste@gmail.com');
});

test('SMTP rejection, delivery exception and missing configuration report failed email', async t => {
  configureMail(t);
  t.mock.method(nodemailer, 'createTransport', () => ({ sendMail: async () => ({accepted: []}) }));
  assert.equal(await sendApplicationDecisionEmail(recipient, 'rifiutata'), false);
  t.mock.method(nodemailer, 'createTransport', () => ({ sendMail: async () => { throw new Error('failed'); } }));
  assert.equal(await sendApplicationDecisionEmail(recipient, 'rifiutata'), false);
  delete process.env.AMUNI_GMAIL_APP_PASSWORD;
  t.mock.method(nodemailer, 'createTransport', () => { throw new Error('must not try unconfigured SMTP'); });
  assert.equal(await sendApplicationDecisionEmail(recipient, 'rifiutata'), false);
});
