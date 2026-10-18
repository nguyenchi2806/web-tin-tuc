import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {crawlArticle} from './scripts/crawler.mjs';
const root=path.resolve(fileURLToPath(new URL('./docs/',import.meta.url))); 
let busy=false;
const server=http.createServer(async(req,res)=>{
  const u=new URL(req.url,'http://localhost');
  try {
    if(req.method!=='GET'){res.writeHead(405);res.end();return;}
    if(u.pathname==='/api/crawl') {
      res.setHeader('Content-Type','application/json; charset=utf-8');
      if(busy){res.writeHead(429);res.end(JSON.stringify({error:'Đang xử lý bài khác, hãy thử lại.'}));return;}
      busy=true;
      try{res.end(JSON.stringify(await crawlArticle(u.searchParams.get('url'))));}finally{busy=false;}
      return;
    }
    const rel=decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname);
    const target=path.resolve(root,'.'+rel);
    if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
    const data=await readFile(target);
    const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml'};
    res.setHeader('Content-Type',(mime[path.extname(target)]||'application/octet-stream')+'; charset=utf-8');res.end(data);
  } catch(e){res.writeHead(u.pathname==='/api/crawl'?400:404,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:e.message}));}
});
server.listen(process.env.PORT||3000,'0.0.0.0',()=>console.log('Mở cổng 3000 trong tab PORTS của Codespaces.'));
