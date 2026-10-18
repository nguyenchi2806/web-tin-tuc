export const KEYS={posts:'tinviet.posts.v1',menu:'tinviet.menu.v1'};
export const flat=menu=>menu.flatMap(c=>[c,...flat(c.children||[])]);
export const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeURL(s){try{const u=new URL(s,location.href);return ['http:','https:'].includes(u.protocol)?u.href:'';}catch{return '';}}
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
function write(key,data){try{localStorage.setItem(key,JSON.stringify(data));}catch{throw new Error('Không lưu được LocalStorage. Có thể bộ nhớ đầy hoặc trình duyệt chặn lưu trữ. Hãy xuất JSON để sao lưu.');}}
export const getPosts=()=>read(KEYS.posts,[]);
export const getMenu=()=>read(KEYS.menu,{menu:[]});
export function validatePost(p){
 if(!p||['id','title','slug','excerpt','content','source','url'].some(k=>typeof p[k]!=='string'||!p[k].trim())||!p.author||typeof p.author.name!=='string'||!Array.isArray(p.category)||!p.category.length||!Number.isFinite(Date.parse(p.publishedAt)))throw new Error('JSON bài viết thiếu trường hoặc sai kiểu dữ liệu.');
 const u=new URL(p.url);if(u.protocol!=='https:'||u.hostname!=='dantri.com.vn')throw new Error('URL nguồn không hợp lệ.');
 return {...p,categoryIds:Array.isArray(p.categoryIds)?p.categoryIds:[]};
}
export function mergePosts(existing,incoming){const out=[...existing];for(const p of incoming){const i=out.findIndex(x=>x.id===p.id||x.url===p.url);if(i<0)out.push(p);else out[i]={...out[i],...p,categoryIds:[...new Set([...(out[i].categoryIds||[]),...(p.categoryIds||[])])]};}return out;}
export function savePosts(posts){write(KEYS.posts,posts);}
export function savePost(post){const p=validatePost(post),tree=getMenu();const cats=flat(tree.menu).filter(c=>c.type==='category');
 const matches=cats.filter(c=>p.category.includes(c.title));
 p.categoryIds=[...new Set([...p.categoryIds,...matches.map(c=>c.id)])];
 for(const c of cats)if(matches.some(m=>m.url.startsWith(c.url.replace(/\.htm$/,'')+'/')))p.categoryIds.push(c.id);
 p.categoryIds=[...new Set(p.categoryIds)];
 for(const title of p.category){if(cats.some(c=>c.title===title))continue;tree.menu.push({id:'import-'+encodeURIComponent(title),title,type:'category',url:p.url,children:[]});p.categoryIds.push(tree.menu.at(-1).id);cats.push(tree.menu.at(-1));}
 write(KEYS.menu,tree);savePosts(mergePosts(getPosts(),[p]));return p;
}
export async function init(){
 const [mr,pr]=await Promise.all([fetch('data/categories.json'),fetch('data/posts.json')]);
 if(!mr.ok||!pr.ok)throw new Error('Không tải được file JSON. Hãy mở qua web server và kiểm tra thư mục docs/data.');
 const menu=await mr.json(),posts=await pr.json();
 // File JSON là dữ liệu nền; chỉ bài crawl/nhập thêm được lưu LocalStorage để tránh vượt quota.
 const old=getMenu(),ids=new Set(flat(menu.menu).map(c=>c.id));
 menu.menu.push(...old.menu.filter(c=>!ids.has(c.id)&&c.id.startsWith('import-')));
 write(KEYS.menu,menu);return {menu:menu.menu,posts:mergePosts(posts,getPosts())};
}
export const latest=posts=>[...posts].sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
export function footer(menu){const E=escapeHTML;document.querySelector('#footer').innerHTML=`<div class="footer-grid"><section><h2>TIN VIỆT</h2><p>Website thực hành tổng hợp tin tức.<br>Nguồn bài viết: Báo Dân trí.</p></section><section><h3>Liên kết nhanh</h3><a href="index.html">Trang chủ</a><a href="index.html?view=latest">Tin mới</a><a href="#contact">Liên hệ</a><a href="crawler.html">Crawler</a></section><section><h3>Chuyên mục</h3>${menu.filter(c=>c.type==='category').map(c=>`<a href="index.html?category=${encodeURIComponent(c.id)}">${E(c.title)}</a>`).join('')||'<p>Chưa thu thập chuyên mục.</p>'}</section><section id="contact"><h3>Liên hệ</h3><p>Email: sinhvien@example.com<br>Địa chỉ: Điền trường và lớp của bạn</p><div class="social"><a href="https://www.facebook.com/" aria-label="Facebook"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 22v-9h3l1-4h-4V7c0-1 .5-2 2-2h2V1h-3c-4 0-5 3-5 6v2H7v4h3v9z"/></svg></a><a href="https://www.youtube.com/" aria-label="YouTube"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 6c-1-2-19-2-20 0-1 3-1 9 0 12 1 2 19 2 20 0 1-3 1-9 0-12zM10 16V8l7 4z" fill-rule="evenodd"/></svg></a><a href="https://www.tiktok.com/" aria-label="TikTok"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 1h4c0 3 2 5 5 5v4c-2 0-4-1-5-2v9a7 7 0 1 1-7-7v4a3 3 0 1 0 3 3z"/></svg></a></div></section></div><p class="copyright">© ${new Date().getFullYear()} Tin Việt · Bài tập sinh viên · Nội dung thuộc nguồn gốc được dẫn.</p>`;}
