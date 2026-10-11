import { loadEnvFile } from 'node:process';
import { createClient } from '@supabase/supabase-js';
loadEnvFile('.env');
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {auth:{persistSession:false}});
const { data, error } = await db.auth.admin.listUsers({page:1, perPage:1000});
if(error) throw new Error(error.message);
console.log(JSON.stringify({users:data.users.length, contactAccountExists:data.users.some(u=>u.email==='formamentisonlus@gmail.com')}));
const {data:roles,error:rolesError}=await db.from('user_roles').select('user_id').eq('role','admin');
if(rolesError)throw new Error(rolesError.message);
console.log(JSON.stringify({administrators:data.users.filter(u=>roles.some(r=>r.user_id===u.id)).map(u=>u.email)}));
for(const table of ['user_roles','aziende','prodotti','bundle','prodotto_del_mese','richieste_interesse','acquirenti','profili','iscrizioni']) {
 const {count,error} = await db.from(table).select('*',{count:'exact',head:true});
 console.log(JSON.stringify({table,count,error:error?.message}));
}
