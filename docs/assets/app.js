import {init,flat,latest,escapeHTML as E,safeURL,footer} from './store.js';
const app=document.querySelector('#app');
const detail=p=>`index.html?post=${encodeURIComponent(p.id)}`;
const date=s=>new Date(s).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'});
function image(p){const url=safeURL(p.image);return url?`<img src="${E(url)}" alt="${E(p.title)}" loading="lazy" referrerpolicy="no-referrer">`:'<div class="image-placeholder">TIN VIỆT</div>';}
function card(p,featured=false){return `<article class="card ${featured?'featured':''}"><a href="${detail(p)}">${image(p)}</a><div><p class="meta">${E(p.category.join(' · '))} · ${E(date(p.publishedAt))}</p><h2><a href="${detail(p)}">${E(p.title)}</a></h2><p class="excerpt">${E(p.excerpt)}</p></div></article>`;}
try {
 const {menu,posts}=await init();footer(menu);
 function nav(items){return items.map(c=>{if(c.type==='home')return '';const external=c.type==='external';return `<li><a href="${external?E(safeURL(c.url)):'index.html?category='+encodeURIComponent(c.id)}" ${external?'target="_blank" rel="noopener"':''}>${E(c.title)}</a>${c.children?.length?`<ul>${nav(c.children)}</ul>`:''}</li>`;}).join('');}
 document.querySelector('#menu').innerHTML=`<ul>${nav(menu)}</ul>`;
 const q=new URLSearchParams(location.search),id=q.get('post'),category=q.get('category');
 if(id){const p=posts.find(p=>p.id===id);if(!p)throw Error('Không tìm thấy bài viết.');document.title=p.title+' · Tin Việt';app.innerHTML=`<article class="article-detail"><a href="index.html">← Trang chủ</a><p class="eyebrow">${E(p.category.join(' / '))}</p><h1>${E(p.title)}</h1><p class="meta">${E(p.author.name||'Nguồn không nêu tác giả')} · ${E(date(p.publishedAt))}</p><p class="lead">${E(p.excerpt)}</p>${image(p)}<div class="body">${p.content.split(/\n\s*\n/).filter(Boolean).map(s=>`<p>${E(s)}</p>`).join('')}</div><p>Nguồn: <a href="${E(safeURL(p.url))}" target="_blank" rel="noopener">${E(p.source)}</a></p></article>`;}
 else {
 const c=flat(menu).find(c=>c.id===category);if(category&&!c)throw Error('Không tìm thấy chuyên mục.');
 const selected=latest(category?posts.filter(p=>p.categoryIds?.includes(category)):posts);
 app.innerHTML=`<p class="eyebrow">BẢN TIN HÔM NAY</p><h1>${E(c?.title||(q.get('view')==='latest'?'Tin mới nhất':'Dòng tin mới'))}</h1><p class="summary">${selected.length} bài viết · Mới nhất trước</p>${selected.length?`<section class="top-news" aria-label="Ba bài mới nhất"><div>${card(selected[0],true)}</div><div class="side-news">${selected.slice(1,3).map(p=>card(p)).join('')}</div></section><section class="news-list" aria-label="Các bài tiếp theo">${selected.slice(3).map(p=>card(p)).join('')}</section>`:'<p>Chưa có bài viết. Hãy chạy <code>npm run crawl</code> trong Codespaces để thu thập dữ liệu, sau đó tải lại trang; hoặc mở <a href="crawler.html">trang Crawler</a>.</p>'}`;
 }
}catch(e){app.textContent=e.message;}
