import {init,getPosts,getMenu,savePost,footer,escapeHTML as E} from './store.js';
const status=document.querySelector('#status'),result=document.querySelector('#result'),button=document.querySelector('#submit');
try {await init();footer(getMenu().menu);}catch(e){status.textContent=e.message;}
// Trên Codespaces, frontend và API cùng origin nên không gặp CORS.
export async function crawlArticle(url){
 const u=new URL(url);if(u.protocol!=='https:'||u.hostname!=='dantri.com.vn')throw Error('Nhập URL HTTPS của dantri.com.vn.');
 const r=await fetch('/api/crawl?url='+encodeURIComponent(u.href));
 if(!r.headers.get('content-type')?.includes('application/json'))throw Error('Không có API crawler ở địa chỉ này. Mở bản chạy bằng npm start trong Codespaces. GitHub Pages chỉ phục vụ phần web tĩnh.');
 const data=await r.json();if(!r.ok)throw Error(data.error||'Không lấy được bài.');return data;
}
document.querySelector('#crawl-form').addEventListener('submit',async e=>{
 e.preventDefault();button.disabled=true;status.textContent='Đang lấy nội dung từ nguồn…';result.replaceChildren();
 try{const p=savePost(await crawlArticle(document.querySelector('#url').value.trim()));status.textContent='Đã lưu bài vào LocalStorage.';
 result.innerHTML=`<h2>${E(p.title)}</h2><p><a href="index.html?post=${encodeURIComponent(p.id)}">Đọc bài vừa lưu →</a></p><details><summary>Xem JSON chuẩn hóa</summary><pre></pre></details>`;result.querySelector('pre').textContent=JSON.stringify(p,null,2);footer(getMenu().menu);
 }catch(err){status.textContent=err.message;}finally{button.disabled=false;}
});
document.querySelector('#export').onclick=()=>{const blob=new Blob([JSON.stringify(getPosts(),null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='posts-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
document.querySelector('#import').onchange=async e=>{
 try{const file=e.target.files[0];if(!file)return;if(file.size>10000000)throw Error('Chỉ nhập file nhỏ hơn 10 MB.');const posts=JSON.parse(await file.text());if(!Array.isArray(posts))throw Error('File phải là mảng các bài viết.');
 const {validatePost}=await import('./store.js');posts.forEach(validatePost);posts.forEach(savePost);status.textContent=`Đã nhập/gộp ${posts.length} bài viết.`;footer(getMenu().menu);
 }catch(err){status.textContent=err.message;}
};
