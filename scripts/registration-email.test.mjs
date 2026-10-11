import { test } from 'node:test';
import assert from 'node:assert/strict';
import nodemailer from 'nodemailer';
import { sendApplicationConfirmation } from '../src/lib/iscrizione-email.server.ts';
import { registerCustomerAccount } from '../src/lib/customer-registration.server.ts';
import { registrationEmail } from '../src/lib/registration-email.ts';
import { sendRegistrationConfirmation } from '../src/lib/registration-email.server.ts';
const input={nome:'Cliente test',email:'cliente@example.com',password:'password-di-prova'};
const session={access_token:'access-test',refresh_token:'refresh-test'};
const user=()=>({id:'test',email:input.email,identities:[{id:'identity'}],created_at:new Date().toISOString()});
const client=(data,error=null)=>({auth:{signUp:async()=>({data,error})}});

test('SMTP failure preserves the newly created account and its session', async()=>{
 const result=await registerCustomerAccount(client({user:user(),session}),input,async()=>{throw new Error('SMTP down');});
 assert.equal(result.emailSent,false);assert.deepEqual(result.session,session);assert.equal(result.confirmationRequired,false);
});
test('a new account awaiting email verification receives the welcome without being logged in',async()=>{
 const deliveries=[];
 const result=await registerCustomerAccount(client({user:user(),session:null}),input,async(...args)=>{deliveries.push(args);return true;});
 assert.equal(result.confirmationRequired,true);assert.equal(result.session,null);assert.equal(deliveries.length,1);assert.equal(deliveries[0][1],input.email);
});
test('existing or obfuscated accounts never trigger another welcome',async()=>{
 for(const u of [{...user(),identities:[]},{...user(),created_at:'2020-01-01T00:00:00Z'}]) {
  let sent=false;await registerCustomerAccount(client({user:u,session:null}),input,async()=>{sent=true;return true;});assert.equal(sent,false);
 }
});
test('failed signup never sends a welcome',async()=>{
 let sent=false;await assert.rejects(registerCustomerAccount(client({user:null,session:null},{message:'signup failed'}),input,async()=>{sent=true;return true;}));assert.equal(sent,false);
});
test('both templates confirm receipt and explain the next steps',()=>{
 for(const kind of ['cliente','azienda']) {
  const {subject,text}=registrationEmail(kind,'Gaia');assert.ok(subject);assert.match(text,/Ciao Gaia/);assert.match(text,/Ti terremo aggiornato/);
 }
 assert.match(registrationEmail('azienda','Gaia').text,/esaminerà/);
});
test('an unconfigured mail service reports failure without sending',async()=>{
 for(const name of ['AMUNI_SMTP_HOST','AMUNI_SMTP_USER','AMUNI_SMTP_PASSWORD','AMUNI_NOREPLY_EMAIL','AMUNI_GMAIL_APP_PASSWORD']) delete process.env[name];
 assert.equal(await sendRegistrationConfirmation('cliente',input.email,input.nome),false);
});

test('new profiles notify the team and welcome the customer independently', async t => {
 for (const failure of [null, 'team', 'customer']) {
  await t.test(String(failure), async t => {
   process.env.AMUNI_GMAIL_APP_PASSWORD='test-password';
   t.after(()=>{delete process.env.AMUNI_GMAIL_APP_PASSWORD;});
   const messages=[];
   t.mock.method(nodemailer,'createTransport',()=>({sendMail:async message=>{
    messages.push(message);
    const team=typeof message.to==='string';
    if ((team && failure==='team') || (!team && failure==='customer')) throw new Error('SMTP failure');
    return {accepted:[team ? message.to : message.to[0].address]};
   }}));
   const result=await registerCustomerAccount(client({user:user(),session}),input);
   assert.equal(result.emailSent,failure!=='customer');
   assert.equal(messages.length,2);
   const team=messages.find(message=>typeof message.to==='string');
   assert.equal(team.to,'amunirichieste@gmail.com');
   assert.equal(team.replyTo.address,input.email);
   assert.ok(team.text.includes(input.nome));
   assert.ok(!JSON.stringify(messages).includes(input.password));
   assert.ok(!JSON.stringify(messages).includes(session.access_token));
  });
 }
});

test('company applications notify the team with details and confirm receipt independently', async t => {
 const details={azienda:'Azienda prova',settore:'Agricoltura',provincia:'Palermo',messaggio:'Vorrei aderire'};
 for (const failure of [null,'team','company']) {
  await t.test(String(failure),async t=>{
   process.env.AMUNI_GMAIL_APP_PASSWORD='test-password';
   t.after(()=>{delete process.env.AMUNI_GMAIL_APP_PASSWORD;});
   const messages=[];
   t.mock.method(nodemailer,'createTransport',()=>({sendMail:async message=>{
    messages.push(message);
    const team=typeof message.to==='string';
    if ((team && failure==='team') || (!team && failure==='company')) throw new Error('SMTP failure');
    return {accepted:[team ? message.to : message.to[0].address]};
   }}));
   assert.equal(await sendApplicationConfirmation(input.email,input.nome,details),failure!=='company');
   assert.equal(messages.length,2);
   const team=messages.find(message=>typeof message.to==='string');
   assert.equal(team.to,'amunirichieste@gmail.com');
   assert.equal(team.replyTo.address,input.email);
   for (const value of Object.values(details)) assert.ok(team.text.includes(value));
   const company=messages.find(message=>Array.isArray(message.to));
   assert.match(company.text,/esaminerà/);
   assert.equal(company.replyTo,'amunirichieste@gmail.com');
  });
 }
});
