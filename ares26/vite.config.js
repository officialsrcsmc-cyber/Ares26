import {defineConfig} from 'vite';
import fs from 'node:fs';
import path from 'node:path';

// In production the SRC site (../site) is copied to the domain root by build.sh, so /consent.js,
// /favicon.ico etc. exist. During `npm run dev` this tiny plugin serves them from ../site.
const siteStatic=()=>({name:'serve-site-root-files',configureServer(server){
  server.middlewares.use((req,res,next)=>{
    const u=(req.url||'').split('?')[0];
    if(u&&u!=='/'&&!u.startsWith('/ares26')&&!u.startsWith('/@')&&!u.startsWith('/src')&&!u.startsWith('/node_modules')){
      const f=path.join(import.meta.dirname,'..','site',u);
      if(f.startsWith(path.join(import.meta.dirname,'..','site'))&&fs.existsSync(f)&&fs.statSync(f).isFile()){res.end(fs.readFileSync(f));return}
    }
    next()})}});

export default defineConfig({
  base: '/ares26/',
  plugins:[siteStatic()],
  build: {
    outDir: '../dist/ares26',
    emptyOutDir: true
  }
});
