import { test } from 'node:test';
import assert from 'node:assert/strict';
import nodemailer from 'nodemailer';
import { sendProductRequestEmails, confirmationText } from '../src/lib/richiesta-email.server.ts';

const mailbox = 'amunirichieste@gmail.com';
const data = { email: 'cliente@example.com', nome_prodotto: 'Arance', categoria: 'Frutta', note: 'Una cassetta' };

function mockDelivery(t, sendMail) {
  const original = process.env.AMUNI_GMAIL_APP_PASSWORD;
  process.env.AMUNI_GMAIL_APP_PASSWORD = 'test password';
  t.after(() => {
    if (original === undefined) delete process.env.AMUNI_GMAIL_APP_PASSWORD;
    else process.env.AMUNI_GMAIL_APP_PASSWORD = original;
  });
  t.mock.method(nodemailer, 'createTransport', () => ({ sendMail }));
}

test('team receives request details; customer receives only the preset confirmation', async t => {
  const messages = [];
  mockDelivery(t, async message => {
    messages.push(message);
    return { accepted: [message.to[0].address.toUpperCase()] };
  });
  assert.deepEqual(await sendProductRequestEmails(data, 'request-test'), { notificationSent: true, emailSent: true });
  assert.equal(messages.length, 2);
  const team = messages.find(message => message.to[0].address === mailbox);
  const customer = messages.find(message => message.to[0].address === data.email);
  for (const value of Object.values(data)) assert.ok(team.text.includes(value));
  assert.equal(team.replyTo.address, data.email);
  assert.equal(customer.replyTo, mailbox);
  assert.equal(customer.text, confirmationText);
  assert.notEqual(team.messageId, customer.messageId);
  for (const message of messages) {
    assert.equal(message.from.address, mailbox);
    assert.equal(message.headers['Auto-Submitted'], 'auto-generated');
    assert.equal(message.to.length, 1);
    assert.equal(message.cc, undefined);
  }
});

test('either delivery may fail without preventing the other', async t => {
  for (const failingAddress of [mailbox, data.email]) {
    await t.test(failingAddress, async t => {
      const attempted = [];
      mockDelivery(t, async message => {
        const recipient = message.to[0].address;
        attempted.push(recipient);
        if (recipient === failingAddress) throw new Error('SMTP unavailable');
        return { accepted: [recipient] };
      });
      const result = await sendProductRequestEmails(data, 'request-test');
      assert.equal(result.notificationSent, failingAddress !== mailbox);
      assert.equal(result.emailSent, failingAddress !== data.email);
      assert.equal(attempted.length, 2);
    });
  }
});

test('SMTP rejection is not reported as success', async t => {
  mockDelivery(t, async () => ({ accepted: [] }));
  assert.deepEqual(await sendProductRequestEmails(data, 'request-test'), { notificationSent: false, emailSent: false });
});

test('missing configuration attempts no delivery', async t => {
  mockDelivery(t, async () => { throw new Error('Must not send'); });
  delete process.env.AMUNI_GMAIL_APP_PASSWORD;
  assert.deepEqual(await sendProductRequestEmails(data, 'request-test'), { notificationSent: false, emailSent: false });
  assert.equal(nodemailer.createTransport.mock.callCount(), 0);
});
