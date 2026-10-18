import * as cheerio from 'cheerio';
const BASE='https://dantri.com.vn/';
export function allowedURL(input) {
  const u=new URL(input);
  if(u.protocol!=='https:' || u.hostname!=='dantri.com.vn' || u.port || u.username || u.password) throw new Error('Chỉ hỗ trợ URL HTTPS của dantri.com.vn');
  u.hash=''; return u;
}
export async function fetchHTML(input) {
  let u=allowedURL(input);
  for(let i=0;i<4;i++) {
    const r=await fetch(u,{redirect:'manual',signal:AbortSignal.timeout(20000),headers:{'User-Agent':'UniversityNewsProject/1.0','Accept':'text/html'}});
    if([301,302,303,307,308].includes(r.status)) {u=allowedURL(new URL(r.headers.get('location'),u)); continue;}
    if(!r.ok) throw new Error(`Nguồn trả HTTP ${r.status}`);
    if(!r.headers.get('content-type')?.includes('text/html')) throw new Error('Nguồn không phải HTML');
    const html=await r.text(); if(html.length>8000000) throw new Error('HTML quá lớn'); return html;
  }
  throw new Error('Quá nhiều lần chuyển hướng');
}
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
function absolute(s,base=BASE) {try{return new URL(s,base).href;}catch{return '';}}
export function parseMenu(html) {
  const $=cheerio.load(html), items=new Map();
  const roots=$('nav, .menu-wrap, .menu, .navigation, .nav, .menu-container');
  if(!roots.length) throw new Error('Không tìm thấy vùng menu. Kiểm tra selector theo HTML Dân trí hiện tại.');
  roots.find('a[href]').each((_,el)=>{
    const url=absolute($(el).attr('href')); let u;
    try{u=allowedURL(url);}catch{return;}
    if(!/^\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.htm$/.test(u.pathname) || /-\d{12,}\.htm$/.test(u.pathname)) return;
    const title=clean($(el).text()); if(!title || title.length>65) return;
    const path=u.pathname.replace(/^\//,'').replace(/\.htm$/,'');
    if(/^(tag|tac-gia|tim-kiem|su-kien)\//.test(path)) return;
    const type=/^(dt360|video|photo|infographic|emagazine|dmagazine|dnews|d-buzz|interactive|su-kien|thoi-tiet|lien-he|toa-dam)/.test(path)?'external':'category';
    items.set(path,{id:path.replaceAll('/','--'),title,url:u.origin+u.pathname,type,children:[]});
  });
  const top=[];
  for(const [path,item] of items) {
    const parent=path.includes('/')?items.get(path.slice(0,path.lastIndexOf('/'))):null;
    if(parent) parent.children.push(item); else top.push(item);
  }
  if(!top.some(x=>x.type==='category')) throw new Error('Menu rỗng; cần cập nhật selector.');
  return {menu:[{id:'home',title:'Trang chủ',url:BASE,type:'home'},...top]};
}
export function flatten(menu) {return menu.flatMap(x=>[x,...flatten(x.children||[])]);}
export function articleLinks(html,base) {
  const $=cheerio.load(html), out=new Set();
  $('h2 a[href], h3 a[href], .article-title a[href]').each((_,el)=>{
    const url=absolute($(el).attr('href'),base);
    try{const u=allowedURL(url);if(/-\d{12,}\.htm$/.test(u.pathname)) out.add(u.origin+u.pathname);}catch{}
  }); return [...out];
}
export function paginationLinks(html,base) {
  const $=cheerio.load(html), out=new Set();
  $('.pagination a[href], .paging a[href], a[rel="next"]').each((_,el)=>{
    try {const u=allowedURL(absolute($(el).attr('href'),base));if(u.pathname===new URL(base).pathname) out.add(u.href);}catch{}
  }); return [...out];
}
function jsonNodes($) {
  const nodes=[];
  function visit(x){if(Array.isArray(x)) x.forEach(visit); else if(x&&typeof x==='object'){nodes.push(x);if(x['@graph'])visit(x['@graph']);}}
  $('script[type="application/ld+json"]').each((_,el)=>{try{visit(JSON.parse($(el).text()));}catch{}});return nodes;
}
export function parseArticle(html,input) {
  const u=allowedURL(input), $=cheerio.load(html);
  const ld=jsonNodes($).find(x=>[x['@type']].flat().some(t=>['NewsArticle','Article','ReportageNewsArticle'].includes(t)))||{};
  const meta=key=>$(`meta[property="${key}"],meta[name="${key}"]`).first().attr('content');
  const title=clean($('h1.title-page, h1.article-title, h1').first().text()||ld.headline||meta('og:title'));
  const excerpt=clean($('.singular-sapo, .article-sapo, .sapo').first().text()||ld.description||meta('description'));
  const root=$('#articleContent, .singular-content, .article-content, [itemprop="articleBody"]').first().clone();
  root.find('script,style,iframe,.ads,.advertisement,.related-news,.related-box,.author-wrap').remove();
  const blocks=root.find('p,h2,h3,h4,li,figcaption,td').map((_,e)=>clean($(e).text())).get().filter(Boolean);
  const content=blocks.join('\n\n') || clean(ld.articleBody);
  const authors=[ld.author].flat().filter(Boolean).map(a=>typeof a==='string'?a:a.name).filter(Boolean);
  const authorName=clean(authors.join(', ')||$('.author-name, .author-wrap .author-name, a[rel="author"]').map((_,e)=>$(e).text()).get().join(', ')||meta('author'));
  let date=ld.datePublished||meta('article:published_time')||$('time[datetime]').first().attr('datetime');
  if(!date) {
    const t=clean($('time, .author-time, .article-date').first().text());
    const m=t.match(/(\d{1,2})\/(\d{1,2})\/(\d{4}).*?(\d{1,2}):(\d{2})/);
    if(m)date=`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}T${m[4].padStart(2,'0')}:${m[5]}:00+07:00`;
  }
  // Không thay ngày thiếu bằng ngày crawl; báo lỗi để tránh sắp xếp sai.
  if(!title||content.length<80||!date||!Number.isFinite(Date.parse(date))) throw new Error('Thiếu tiêu đề/nội dung/ngày đăng; cần kiểm tra selector hoặc bài bị chặn.');
  const category=[...new Set($('.breadcrumbs a, .breadcrumb a').map((_,e)=>clean($(e).text())).get().filter(x=>x&&!/^(trang chủ|home)$/i.test(x)))];
  if(!category.length && ld.articleSection)category.push(...[ld.articleSection].flat().flatMap(x=>String(x).split(',').map(clean)).filter(Boolean));
  let image=meta('og:image')||([ld.image].flat()[0]);if(image&&typeof image==='object')image=image.url;
  const stem=u.pathname.split('/').pop().replace(/\.htm$/,'');const match=stem.match(/-(\d{12,})$/);
  return {id:match?`dtri-${match[1]}`:stem,title,slug:stem.replace(/-\d{12,}$/,''),excerpt,content,author:{name:authorName},category,publishedAt:new Date(date).toISOString(),source:u.hostname,url:u.href,image:image?absolute(image,u.href):'',categoryIds:[]};
}
// Hàm JavaScript nhận URL và trả về object JSON chuẩn hóa theo yêu cầu.
export async function crawlArticle(url) {return parseArticle(await fetchHTML(url),url);}
