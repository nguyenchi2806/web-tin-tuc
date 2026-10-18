import {readFile,writeFile} from 'node:fs/promises';
import {flatten} from './crawler.mjs';
export function audit(categories,posts) {
 const cats=flatten(categories.menu).filter(x=>x.type==='category');
 const errors=[]; const ids=new Set(),urls=new Set();
 for(const p of posts){
  if(ids.has(p.id)||urls.has(p.url))errors.push(`Bài trùng ${p.id}`);ids.add(p.id);urls.add(p.url);
  for(const k of ['id','title','slug','excerpt','content','source','url'])if(typeof p[k]!=='string'||!p[k].trim())errors.push(`${p.id}: thiếu ${k}`);
  if(!p.author||typeof p.author.name!=='string')errors.push(`${p.id}: author phải là object {name}`);
  if(!Array.isArray(p.category)||!p.category.length)errors.push(`${p.id}: thiếu category[]`);
  if(!Array.isArray(p.categoryIds))errors.push(`${p.id}: thiếu categoryIds[]`);
  if(!Number.isFinite(Date.parse(p.publishedAt)))errors.push(`${p.id}: ngày đăng sai`);
 }
 const counts=cats.map(c=>({id:c.id,title:c.title,count:posts.filter(p=>p.categoryIds?.includes(c.id)).length}));
 for(const c of counts)if(c.count<10)errors.push(`${c.title}: ${c.count}/10 bài`);
 if(!cats.length)errors.push('Chưa có chuyên mục; hãy chạy npm run crawl.');
 return {passed:errors.length===0,totalCategories:cats.length,totalPosts:posts.length,counts,errors};
}
if(process.argv[1]?.endsWith('/audit.mjs')) {
 const categories=JSON.parse(await readFile('docs/data/categories.json','utf8'));
 const posts=JSON.parse(await readFile('docs/data/posts.json','utf8'));
 const report=audit(categories,posts);await writeFile('docs/data/audit.json',JSON.stringify(report,null,2));
 console.table(report.counts);console.log(report.passed?'ĐẠT kiểm tra dữ liệu.':'CHƯA ĐẠT',report.errors);process.exitCode=report.passed?0:1;
}
