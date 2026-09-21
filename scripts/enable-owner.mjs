import { loadEnvFile } from 'node:process';
import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
loadEnvFile('.env');
const email = process.argv[2]?.trim().toLowerCase();
if (!email || !email.includes('@')) throw new Error('Provide the owner email.');
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {auth:{persistSession:false,autoRefreshToken:false}});
const users=[];
for(let page=1;;page++) {
 const {data,error}=await db.auth.admin.listUsers({page,perPage:1000});
 if(error) throw error;
 users.push(...data.users);
 if(data.users.length<1000) break;
}
let user=users.find(u=>u.email?.toLowerCase()===email);
let created=false;
if(!user) {
 const password=`Amu!${randomBytes(20).toString('base64url')}7a`;
 const {data,error}=await db.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{nome:'Gaia Bono'}});
 if(error) throw error;
 user=data.user; created=true;
 await writeFile('/private/tmp/amuni-owner-access.txt',`Area amministratore: https://amuni-definitivo.vercel.app/admin/login\nEmail: ${email}\nPassword iniziale: ${password}\n\nDopo l’accesso, cambia la password nella scheda Il mio account.\n`,{mode:0o600});
 users.push(user);
}
const {error}=await db.from('user_roles').upsert({user_id:user.id,role:'admin'},{onConflict:'user_id,role'});
if(error) throw error;
// Backfill accounts created before the profile trigger, preserving existing profiles.
for(let start=0;start<users.length;start+=500) {
 const {error}=await db.from('profili').upsert(users.slice(start,start+500).map(u=>({user_id:u.id,email:u.email ?? '',nome:u.user_metadata?.nome ?? '',created_at:u.created_at})),{onConflict:'user_id',ignoreDuplicates:true});
 if(error) throw error;
}
console.log(JSON.stringify({ownerEnabled:true,created,passwordChanged:false,profilesBackfilled:true,credentialsFile:created?'/private/tmp/amuni-owner-access.txt':null}));
