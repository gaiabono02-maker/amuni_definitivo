import { test } from 'node:test';
import assert from 'node:assert/strict';
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
