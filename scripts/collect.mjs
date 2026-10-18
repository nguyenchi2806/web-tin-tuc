import {readFile,writeFile} from 'node:fs/promises';
import {setTimeout as pause} from 'node:timers/promises';
import {fetchHTML,parseMenu,flatten,articleLinks,paginationLinks,crawlArticle} from './crawler.mjs';
import {audit} from './audit.mjs';
const save=(name,x)=>writeFile(`docs/data/${name}.json`,JSON.stringify(x,null,2));
let categories;
// --refresh-menu để thay cây đã kiểm tra bằng cây trích mới.
try{categories=JSON.parse(await readFile('docs/data/categories.json','utf8'));if(!categories.menu.some(x=>x.type==='category'))throw Error();}catch{}
if(!categories?.menu?.some(x=>x.type==='category')||process.argv.includes('--refresh-menu')) {
 categories=parseMenu(await fetchHTML('https://dantri.com.vn/'));await save('categories',categories);
}
let posts=[];try{posts=JSON.parse(await readFile('docs/data/posts.json','utf8'));}catch{}
const all=flatten(categories.menu),cats=all.filter(x=>x.type==='category');
const failures=[];
for(const cat of cats) {
 const count=()=>posts.filter(p=>p.categoryIds?.includes(cat.id)).length;
 if(count()>=10)continue;
 console.log(`Thu thập ${cat.title} (${count()}/10)...`);
 const queue=[cat.url],seenPages=new Set(),seenArticles=new Set();
 while(queue.length&&count()<10&&seenPages.size<8) {
  const page=queue.shift();if(seenPages.has(page))continue;seenPages.add(page);
  try {
   await pause(1200);const html=await fetchHTML(page);
   queue.push(...paginationLinks(html,page).filter(x=>!seenPages.has(x)));
   for(const url of articleLinks(html,page)) {
    if(count()>=10)break;if(seenArticles.has(url))continue;seenArticles.add(url);
    try {
     let p=posts.find(x=>x.url===url);
     if(!p){await pause(1200);p=await crawlArticle(url);}
     const prefix=cat.url.replace(/\.htm$/,'')+'/';
     if(!/\/tin-moi-nhat\.htm$/.test(cat.url)&&!p.category.includes(cat.title)&&!p.url.startsWith(prefix))continue;
     if(!posts.some(x=>x.id===p.id||x.url===p.url))posts.push(p);
     p.categoryIds=[...new Set([...(p.categoryIds||[]),cat.id])];p.category=[...new Set([...p.category,cat.title])];
     // Một bài ở chuyên mục con cũng thuộc các chuyên mục cha trong cây.
     for(const parent of cats.filter(x=>cat.url.startsWith(x.url.replace(/\.htm$/,'')+'/'))) {
      p.categoryIds=[...new Set([...p.categoryIds,parent.id])];p.category=[...new Set([...p.category,parent.title])];
     }
     await save('posts',posts);
    }catch(e){failures.push({url,error:e.message});console.log('Bỏ qua:',e.message);}
   }
  }catch(e){failures.push({url:page,error:e.message});console.log('Lỗi chuyên mục:',e.message);}
 }
 await save('posts',posts);
}
const report={...audit(categories,posts),failures,collectedAt:new Date().toISOString()};await save('audit',report);
console.table(report.counts);console.log(report.passed?'ĐẠT dữ liệu; tiếp tục kiểm tra menu và giao diện.':'CHƯA ĐẠT: đọc docs/data/audit.json và sửa/thu thập tiếp.');process.exitCode=report.passed?0:1;
