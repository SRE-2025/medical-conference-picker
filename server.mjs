import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.dirname(fileURLToPath(import.meta.url));
const types={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".mjs":"text/javascript; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".svg":"image/svg+xml"};
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,"http://localhost");
  const relative=decodeURIComponent(url.pathname).replace(/^\/+/,"")||"index.html";
  const target=path.resolve(root,relative);
  if(target!==root&&!target.startsWith(root+path.sep)||relative.split(/[\\/]/).some(s=>s.startsWith("."))){res.writeHead(403);res.end("Forbidden");return;}
  const content=await fs.readFile(target);
  res.writeHead(200,{"Content-Type":types[path.extname(target)]||"application/octet-stream","Cache-Control":"no-store"});
  res.end(req.method==="HEAD"?undefined:content);
 }catch{res.writeHead(404);res.end("Not found");}
});
server.listen(Number(process.env.PORT)||4178,"127.0.0.1",()=>console.log("Conference Circuit: http://127.0.0.1:"+server.address().port));
