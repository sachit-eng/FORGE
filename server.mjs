import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import analyzeFood from './api/analyze-food.js';
import requestReset from './api/request-reset.js';
import verifyReset from './api/verify-reset.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon'};

function runHandler(handler, req, res, body) {
  const out = { statusCode: 200, headers: {'Content-Type':'application/json'}, body: '' };
  const response = { status(code){out.statusCode=code;return response;}, json(data){out.body=JSON.stringify(data);res.writeHead(out.statusCode,out.headers);res.end(out.body);} };
  handler({method:req.method,body}, response);
}

const server = http.createServer((req,res)=>{
  if(req.url.startsWith('/api/')){
    let raw='';req.on('data',c=>{raw+=c;if(raw.length>8_000_000){res.writeHead(413);res.end('Request too large');req.destroy();}});req.on('end',()=>{let body={};try{body=raw?JSON.parse(raw):{}}catch{res.writeHead(400);return res.end('Invalid JSON')}const h=req.url==='/api/analyze-food'?analyzeFood:req.url==='/api/request-reset'?requestReset:req.url==='/api/verify-reset'?verifyReset:null;if(!h){res.writeHead(404);return res.end('Not found')}runHandler(h,req,res,body)});return;
  }
  const clean=decodeURIComponent((req.url||'/').split('?')[0]);
  const rel=clean==='/'?'/index.html':clean;
  const file=path.join(root,rel);
  if(!file.startsWith(root)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end('Not found')}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
});
server.listen(port,()=>console.log(`FORGE running at http://localhost:${port}`));
