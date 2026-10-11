import { loadEnvFile } from 'node:process';
import { randomBytes } from 'node:crypto';
import { writeFile, readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
loadEnvFile('.env');
const email = process.argv[2];
if(!email || !email.includes('@')) throw new Error('Provide an administrator email.');
const secretPath = '/private/tmp/amuni-admin-credentials.json';
const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
let existing;
for(let page=1;;page++) {
 const {data,error}=await admin.auth.admin.listUsers({page,perPage:1000});
 if(error)throw new Error(error.message);
 existing=data.users.find(u=>u.email?.toLowerCase()===email.toLowerCase());
 if(existing || data.users.length<1000)break;
}
let password;
if(existing) {
 const saved=await readFile(secretPath,'utf8').then(JSON.parse).catch(()=>null);
 if(saved?.email!==email || saved?.id!==existing.id) throw new Error('Account already exists; its password has not been changed.');
 password=saved.password;
} else {
 password=`Amu!${randomBytes(20).toString('base64url')}7a`;
 const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{nome:'Amministrazione A.M.U.N.Ì.'}});
 if(error)throw new Error(error.message);
 existing=data.user;
 await writeFile(secretPath,JSON.stringify({email,password,id:existing.id},null,2),{mode:0o600});
}
const {error:roleError}=await admin.from('user_roles').upsert({user_id:existing.id,role:'admin'},{onConflict:'user_id,role'});
if(roleError)throw new Error(roleError.message);
const client=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const {error:loginError}=await client.auth.signInWithPassword({email,password});
if(loginError)throw new Error(loginError.message);
const {data:role,error:verifyError}=await client.from('user_roles').select('role').eq('user_id',existing.id).eq('role','admin').single();
if(verifyError || role?.role!=='admin')throw new Error('Admin access verification failed.');
for(const table of ['iscrizioni','aziende','prodotti','bundle','prodotto_del_mese','richieste_prodotti','richieste_interesse','acquirenti','profili','abbonamenti']) {
 const {error}=await client.from(table).select('id').limit(1);
 if(error)throw new Error(`Cannot read ${table}: ${error.message}`);
}
await client.auth.signOut();
console.log('Administrator created. Login and access to all dashboard tables verified. Credentials saved privately outside the repository.');
