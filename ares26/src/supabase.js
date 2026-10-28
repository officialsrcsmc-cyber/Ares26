import {createClient} from '@supabase/supabase-js';

const url=import.meta.env.VITE_SUPABASE_URL,key=import.meta.env.VITE_SUPABASE_ANON_KEY;

// null when the .env file is missing, so the app can show a setup message instead of a blank page
export const sb=url&&key?createClient(url,key,{auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}}):null;

export const MAX_FILE=5*1024*1024;
const ext=n=>((n.split('.').pop()||'bin').toLowerCase().replace(/[^a-z0-9]/g,''))||'bin';

// Uploads to <bucket>/<userId>/<timestamp>.<ext> and returns the stored path
export async function upload(bucket,uid,file){
  const path=uid+'/'+Date.now()+'.'+ext(file.name);
  const {error}=await sb.storage.from(bucket).upload(path,file,{contentType:file.type||undefined});
  if(error)throw error;
  return path;
}
// Private files are opened through short-lived signed links (5 minutes)
export async function signed(bucket,path){
  const {data,error}=await sb.storage.from(bucket).createSignedUrl(path,300);
  if(error)throw error;
  return data.signedUrl;
}
