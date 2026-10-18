# Hướng dẫn làm bài xây dựng web tin tức bằng GitHub

Bộ mã này dùng để làm theo đề trong Bai_tap_lon_Xay_dung_web_tin_tuc.docx. Giao diện dùng HTML, CSS, JavaScript thuần, không React/Vue/Bootstrap, không cơ sở dữ liệu. Bài crawl trong trình duyệt lưu vào LocalStorage; dữ liệu nền lưu thành JSON. Node.js và Cheerio chỉ phục vụ công cụ thu thập dữ liệu và API lấy bài để tránh giới hạn CORS.

Đây là bộ mã để bắt đầu và thực hành, không phải bộ dữ liệu hoàn thành để nộp. `posts.json` khởi tạo rỗng. Bạn phải thu thập dữ liệu, đối chiếu cây chuyên mục, chạy kiểm tra và sửa thông tin cá nhân trước khi nộp. Selector có thể cần cập nhật nếu Dân trí đổi cấu trúc. Đã kiểm tra parser với một bài Dân trí thực tế tại thời điểm chuẩn bị mã, nhưng chưa chạy thu thập toàn bộ chuyên mục.

## 1. Phân biệt ba phần của GitHub

- Repository: nơi lưu mã, JSON và lịch sử sửa bài.
- Codespaces: môi trường VS Code chạy trong trình duyệt; chạy được Node.js, crawler và trang web.
- GitHub Pages: công khai phần HTML/CSS/JS trong thư mục docs. Không chạy được server.mjs hay API crawler.

Để trình diễn đầy đủ chức năng, chạy `npm start` trong Codespaces và mở cổng 3000. Pages là bản xem giao diện và dữ liệu đã thu thập; crawler trực tiếp bằng URL không hoạt động trên Pages nếu chưa triển khai API bên ngoài. Không dùng bản Pages một mình để chứng minh toàn bộ bài đã xong. Codespaces dừng thì bản chạy ở cổng 3000 cũng dừng.

Nếu giảng viên quy định không được có bất kỳ server hỗ trợ nào, cần làm rõ yêu cầu crawler URL: JavaScript trên trình duyệt không thể tự vượt CORS của nguồn. Cheerio ở đây là thư viện trích HTML phía công cụ, không phải framework giao diện. Không dùng `mode: 'no-cors'`: nó không cho JavaScript đọc nội dung phản hồi.

## 2. Tạo repository

1. Tải ZIP và giải nén trên máy tính.
2. Đăng nhập https://github.com/.
3. Bấm dấu + ở góc trên → New repository.
4. Repository name: `web-tin-tuc`.
5. Chọn Public nếu bạn muốn dùng GitHub Pages theo cách phổ biến với tài khoản miễn phí. Không để thông tin riêng tư trong mã.
6. Tích Add a README file → Create repository.
7. Trong repo, chọn Add file → Upload files.
8. Mở thư mục vừa giải nén. Chọn toàn bộ NỘI DUNG bên trong `web-tin-tuc`, kéo vào vùng upload. Giữ cả các thư mục con.
9. Bấm Commit changes. Nếu có README cũ, nội dung README tải lên sẽ thay README đó.
10. Kiểm tra thư mục gốc repo có `package.json`, `package-lock.json`, `server.mjs`, `docs`, `scripts`, `test`. Đừng để bị lồng `web-tin-tuc/web-tin-tuc/`.
11. Không upload `node_modules` và không upload nguyên file ZIP thay cho mã nguồn.

## 3. Mở Codespaces và cài thư viện

1. Ở trang repository, bấm nút Code màu xanh.
2. Chọn tab Codespaces → Create codespace on main.
3. Chờ màn hình VS Code trong trình duyệt xuất hiện.
4. Mở Terminal → New Terminal. Nếu menu trên cùng thu gọn, tìm trong nút ba gạch.
5. Trong terminal, chạy lần lượt:

```bash
pwd
ls
npm ci
npm test
```

`ls` phải thấy `package.json`. Nếu npm báo ENOENT/package.json, bạn đang ở sai thư mục: mở Explorer, xác định thư mục chứa package.json rồi dùng `cd tên-thư-mục` đến đó. `npm ci` cài đúng phiên bản đã khóa trong package-lock.json. Cần Node.js 22 trở lên; kiểm tra bằng `node --version`.

`npm test` phải chạy thành công các bài kiểm tra parser, phân cấp menu, quota, chống trùng bài và thứ tự thời gian. Kiểm tra tự động không thay thế việc xem nội dung thực tế.

Codespaces có hạn mức theo tài khoản. Nếu GitHub báo hết hạn mức hoặc chưa có quyền sử dụng, đừng tự bật tính phí; bạn có thể dùng VS Code cục bộ với Node.js 22+ và cùng các lệnh ở tài liệu này.

## 4. Hiểu các file trước khi sửa

| File | Chức năng |
| --- | --- |
| docs/index.html | Trang chủ, chuyên mục và chi tiết qua query string |
| docs/crawler.html | Trang nhập URL, xem JSON, lưu và nhập/xuất bài |
| docs/assets/style.css | Màu sắc, layout desktop, tablet, mobile |
| docs/assets/app.js | Render menu, lọc bài, bố cục 3 bài mới nhất, trang chi tiết |
| docs/assets/store.js | LocalStorage, gộp bài, xác thực dữ liệu, footer |
| docs/assets/crawler.js | Hàm JavaScript nhận URL và gọi API crawler |
| docs/data/categories.json | Object chứa cây chuyên mục |
| docs/data/posts.json | Mảng bài viết thật sau khi thu thập |
| docs/data/audit.json | Báo cáo số bài và lỗi, tạo sau khi crawl/audit |
| scripts/crawler.mjs | Lấy HTML và chuẩn hóa một bài thành object JSON |
| scripts/collect.mjs | Thu thập menu và ít nhất 10 bài từng chuyên mục |
| scripts/audit.mjs | Kiểm tra đủ trường, trùng ID/URL, số bài từng mục |
| server.mjs | Phục vụ docs và endpoint GET /api/crawl |
| test/crawler.test.mjs | Kiểm tra tự động với dữ liệu giả lập |

Trang chi tiết có URL `index.html?post=ID`. Chuyên mục có URL `index.html?category=ID`. Đây vẫn là các màn hình chi tiết/chuyên mục riêng theo chức năng, không bắt buộc mỗi bài có một file HTML.

## 5. Thu thập cây chuyên mục và dữ liệu thật

Trong terminal, chạy:

```bash
npm run crawl
```

Lần đầu, chương trình lấy HTML trang chủ Dân trí, trích menu cha con, ghi `categories.json`. Tiếp theo, nó mở từng chuyên mục và thu thập bài cho đến khi đủ 10 bài gắn với chuyên mục đó. Chuyên mục con cũng được kiểm tra riêng. Một bài có thể thuộc cả chuyên mục cha và con; bài được lưu một lần, quan hệ nằm trong categoryIds.

Các liên kết đặc biệt được nhận diện là external, không tính như chuyên mục bài báo. Vì menu website có thể có trang sự kiện, công cụ, video hoặc liên kết đặc biệt, bạn phải mở `categories.json` và đối chiếu menu Dân trí trực tiếp. Kiểm tra cả tên, URL, children, type. Không gán external cho một chuyên mục tin tức chỉ để bỏ qua yêu cầu 10 bài. Bộ trích menu dựa trên cấu trúc URL; kiểm tra thủ công là bước bắt buộc để xác nhận cây đầy đủ và đúng quan hệ.

Chương trình có khoảng nghỉ giữa các lượt lấy dữ liệu; không đổi thành chạy hàng trăm yêu cầu đồng thời. Với nhiều chuyên mục, có thể cần chạy khá lâu. Nếu nguồn trả 403/429 thì dừng và thử sau; không có lời hứa mọi trang đều lấy được.

Để dừng, nhấn Ctrl+C. Mỗi bài lấy thành công được ghi vào file nên có thể chạy lại `npm run crawl` để tiếp tục. Chuyên mục đã đủ 10 bài được bỏ qua. Nếu đã sửa cây chuyên mục bằng tay, lệnh chạy bình thường giữ cây đó. Muốn trích lại menu từ đầu:

```bash
npm run crawl -- --refresh-menu
```

Sau khi chạy xong:

```bash
npm run audit
```

Điều kiện kiểm tra dữ liệu đạt: mỗi chuyên mục type=category, gồm cả chuyên mục con, phải có ít nhất 10 bài. File báo cáo phải có `passed: true`. Nếu chương trình chỉ ghi 4/10 hoặc 0/10 thì chưa hoàn thành đề, dù giao diện đã mở được.

Lưu ý: công cụ chỉ theo liên kết phân trang tìm được trong HTML và giới hạn 8 trang danh sách mỗi chuyên mục ở phiên bản này. Nếu thiếu bài do trang tải thêm bằng JavaScript, cần cập nhật selector phân trang/nguồn danh sách trong `paginationLinks`, hoặc lấy URL các bài thuộc đúng chuyên mục rồi dùng crawler từng bài và gộp dữ liệu. Không thay lỗi bằng tin giả, không lấy nội dung tóm tắt làm toàn văn.

## 6. Cấu trúc JSON và điểm không thống nhất trong đề

Bảng trường trong đề nói author là object và category là array, nhưng JSON mẫu dùng chuỗi. Bộ mã theo bảng trường. Dưới đây là cấu trúc minh họa, không phải bài báo thật:

```json
{
  "id": "dtri-ID_GOC",
  "title": "Tiêu đề lấy từ bài nguồn",
  "slug": "tieu-de-lay-tu-bai-nguon",
  "excerpt": "Tóm tắt lấy từ bài nguồn",
  "content": "Toàn văn dạng chữ, giữ các đoạn bằng ký tự xuống dòng",
  "author": {"name": "Tên tác giả lấy từ nguồn"},
  "category": ["Thời sự", "Chính trị"],
  "publishedAt": "2026-10-18T10:42:02.000Z",
  "source": "dantri.com.vn",
  "url": "https://dantri.com.vn/DUONG_DAN_BAI_GOC.htm",
  "image": "URL ảnh lấy từ nguồn nếu có",
  "categoryIds": ["thoi-su", "thoi-su--chinh-tri"]
}
```

`image` là trường bổ sung để hiển thị ảnh; `categoryIds` là trường bổ sung để lọc bài chính xác. Không đổi category thành mảng ID vì bảng yêu cầu tên chuyên mục. `publishedAt` lưu ISO 8601 để sắp xếp; giao diện hiển thị theo múi giờ Việt Nam. Không dùng ngày crawl thay ngày đăng. Nếu nguồn không nêu tác giả thì name để rỗng và giao diện báo rõ, không gán tác giả giả.

Bài có cùng ID hoặc URL được cập nhật/gộp thay vì nhân bản. Crawler lấy toàn văn dạng chữ và ảnh đại diện, không giữ bố cục HTML nhúng/video của báo gốc.

## 7. Mở và kiểm tra website

Trong terminal, chạy:

```bash
npm start
```

Giữ terminal đó hoạt động. Trong bảng dưới của VS Code, mở tab PORTS. Nếu chưa có cổng, bấm Forward a Port và nhập 3000. Ở cổng 3000, bấm biểu tượng quả địa cầu/Open in Browser. GitHub có thể hiện thông báo tự phát hiện cổng với nút Open in Browser.

Cổng private phù hợp cho bạn tự kiểm tra. Nếu cần người khác truy cập bản demo, đổi Port Visibility sang Public khi tài khoản/chính sách cho phép; không cần làm để tự dùng. Bản demo Codespaces chỉ sống trong khi môi trường đang chạy.

Sau khi crawl xong, tải lại trang. Nếu muốn chạy web và crawl cùng lúc, giữ terminal npm start, bấm dấu + để mở terminal thứ hai rồi chạy npm run crawl trong terminal mới.

Kiểm tra lần lượt:

1. Navbar có tên chuyên mục và chuyên mục con, bấm vào được.
2. Vào một chuyên mục có ít nhất 10 bài.
3. Ba bài mới nhất nằm trên cùng: một bài lớn bên trái, hai bài nhỏ bên phải trên desktop.
4. Các bài từ vị trí thứ tư xếp dọc bên dưới, ngày mới đứng trước ngày cũ.
5. Bấm một bài, kiểm tra tiêu đề, ảnh nếu có, toàn văn, tác giả, ngày giờ và chuyên mục.
6. Dòng nguồn mở đúng URL bài gốc.
7. Footer có tên/mô tả, trang chủ/tin mới/liên hệ, chuyên mục, email/địa chỉ, biểu tượng Facebook/YouTube/TikTok, bản quyền.
8. Nhấn F12, dùng chế độ thiết bị để thử bề rộng 390 px và 768 px. Bài featured lên trước, các bài còn lại một cột, footer xếp dọc ở mobile. Không có thanh cuộn ngang.
9. Thử bàn phím Tab để truy cập menu con và đường dẫn.

## 8. Kiểm tra trang crawler và LocalStorage

1. Mở trang Crawler trên bản Codespaces, không phải Pages.
2. Vào Dân trí, mở một bài báo thông thường và copy URL từ thanh địa chỉ.
3. Dán vào ô URL → Lấy bài và lưu.
4. Phải hiện thông báo đã lưu và link đọc bài; bấm Xem JSON chuẩn hóa để đối chiếu các trường với bài nguồn.
5. Nhấn F12 → Application → Local Storage → chọn đúng origin của bản đang mở.
6. Kiểm tra `tinviet.posts.v1` và `tinviet.menu.v1`.
7. Tải lại trang và mở lại bài, dữ liệu vẫn còn.
8. Crawl lại cùng URL: bài không bị nhân đôi.
9. Thử URL không hợp lệ và trang khác Dân trí: phải có thông báo lỗi.

Dữ liệu nền trong posts.json được đọc từ file; chỉ bài crawl/nhập thêm lưu trong LocalStorage để tránh nhồi toàn bộ kho tin vào hạn mức lưu trữ trình duyệt. Yêu cầu lưu bài vừa crawl vào LocalStorage được thực hiện tại `savePost`.

LocalStorage thuộc từng trình duyệt và từng origin. Bạn mở trên máy khác, Pages khác Codespaces, hoặc xóa dữ liệu trình duyệt thì bài riêng sẽ không tự đồng bộ. Không coi LocalStorage là tệp đã nộp trong repository.

Nút Xuất bài viết JSON sao lưu những bài crawl/nhập thêm của trình duyệt. Nếu muốn nộp cả các bài đó trong dữ liệu nền, tải file về rồi upload vào Codespaces; dùng JavaScript gộp với posts.json theo ID/URL, hoặc thay posts.json nếu file xuất đã chứa đủ kho bài cần nộp. Không thay file nền bằng một file backup chỉ có 1–2 bài. Để gộp một backup đặt ở gốc repo:

```bash
node --input-type=module - <<'JS'
import {readFile,writeFile} from 'node:fs/promises';
import {mergePosts,validatePost} from './docs/assets/store.js';
const base=JSON.parse(await readFile('docs/data/posts.json','utf8'));
const extra=JSON.parse(await readFile('posts-backup.json','utf8')).map(validatePost);
await writeFile('docs/data/posts.json',JSON.stringify(mergePosts(base,extra),null,2));
JS
npm run audit
```

Các bài xuất từ bộ mã đã mang categoryIds. Nếu sửa thủ công, phải bảo đảm categoryIds khớp id trong categories.json để bộ đếm nhận đúng.

## 9. Chỉnh bài thành sản phẩm của bạn

Trong `docs/assets/store.js`, tìm `sinhvien@example.com`, `Điền trường và lớp của bạn` và sửa thành thông tin dùng cho bài tập. Có thể dùng email học tập thay thông tin riêng. Thay link mạng xã hội bằng các trang phù hợp với bài của bạn nếu có.

Trong index.html, crawler.html và footer, sửa tên Tin Việt nếu muốn. Đổi màu chủ đạo ở biến `--accent` trong style.css. Không đổi bố cục ba bài mới nhất thành ba cột bằng nhau vì khác đề.

Bổ sung cuối README: họ tên, mã sinh viên, lớp, mục đích, cách chạy, ngày thu thập, số chuyên mục/số bài thật từ audit.json, tính năng và hạn chế. Nếu có yêu cầu báo cáo riêng từ giảng viên, làm thêm theo yêu cầu đó; file đề đã cung cấp không nêu định dạng nộp báo cáo cụ thể.

## 10. Lưu thay đổi lên GitHub

Trong terminal thứ hai, sau khi sửa và thu thập xong:

```bash
npm test
npm run audit
git status
git add .
git commit -m "Hoan thien web tin tuc va du lieu thu thap"
git push origin main
```

Nếu git nói nothing to commit là chưa có thay đổi mới. Nếu push bị từ chối do repo có cập nhật từ nơi khác, đọc thông báo và đồng bộ trước; không dùng force push tùy tiện. Trong Codespaces thường đã có xác thực GitHub; nếu GitHub yêu cầu cấp quyền thì làm theo màn hình của GitHub.

Trở lại trang repo trên github.com, tải lại và xác nhận có posts.json với dữ liệu thật cùng audit.json mới. Chụp lại màn hình cần thiết trước khi dừng Codespaces. Khi xong phiên làm việc, vào danh sách Codespaces và Stop để tránh tiếp tục tiêu tốn thời gian chạy.

## 11. Bật GitHub Pages để có link giao diện

1. Vào repository → Settings → Pages.
2. Mục Build and deployment → Source: Deploy from a branch.
3. Branch: main. Folder: /docs. Bấm Save.
4. Chờ đợt deploy hoàn thành; xem tab Actions nếu chưa có link.
5. Mở link GitHub cung cấp, thường có dạng https://TEN_GITHUB.github.io/web-tin-tuc/.
6. Kiểm tra trang chủ, chuyên mục, chi tiết và đường dẫn CSS/JS. Bộ mã dùng đường dẫn tương đối cho tài nguyên nên phù hợp project Pages.

Trên Pages, đọc tin có sẵn và nhập/xuất JSON vẫn dùng được. Crawl trực tiếp từ URL cần API đang chạy; phiên bản đi kèm dùng API cùng origin tại Codespaces. Nếu giảng viên yêu cầu crawler hoạt động ngay trên link công khai lâu dài, cần triển khai server/API lên môi trường hỗ trợ Node.js rồi cấu hình frontend gọi API HTTPS và CORS cho đúng origin Pages. Việc này chưa được triển khai trong gói; đừng báo rằng Pages tự chạy API Node.js.

## 12. Bảng đối chiếu trước khi nộp

| Yêu cầu của đề | Nơi thực hiện | Bằng chứng cần tự kiểm tra |
| --- | --- | --- |
| Thu thập cây chuyên mục Dân trí | parseMenu, categories.json | Đối chiếu menu thật, đủ children |
| Ít nhất 10 bài mỗi chuyên mục | collect.mjs, posts.json | audit.json passed=true, gồm chuyên mục con |
| Hàm JS nhận URL, trả object chuẩn hóa | crawlArticle ở crawler.mjs và crawler.js | Thử URL thật và so JSON với nguồn |
| Đầy đủ trường bài viết | parseArticle | author object, category array, ngày hợp lệ |
| HTML/CSS/JS thuần và LocalStorage | docs/assets | Không framework frontend; tải lại còn bài crawl |
| Navbar load từ JSON/LocalStorage | init và nav trong app.js | Bấm cả mục cha và mục con |
| Một bài lớn trái, hai bài nhỏ phải | top-news, side-news | Desktop >= 901 px |
| Bài tiếp theo xếp dọc, mới đến cũ | latest, news-list | So ngày 10 bài trong một chuyên mục |
| Tablet/mobile xếp một cột | style.css | Thử 768 px, 390 px |
| Trang chi tiết đủ thông tin | app.js, ?post=ID | Đối chiếu toàn văn/tác giả/ảnh/thời gian |
| Footer đủ thành phần | footer trong store.js | Có icon, liên hệ, chuyên mục, bản quyền |
| Trang crawler riêng, lưu JSON LocalStorage | crawler.html, savePost | Nhập URL → lưu → F5 vẫn đọc được |

## 13. Lỗi thường gặp

- Web trống/0 bài: chưa chạy crawl hoặc crawl thất bại; kiểm tra posts.json và terminal.
- 404 trên Pages: kiểm tra main + /docs và index.html nằm trong docs.
- Trang chi tiết trắng: kiểm tra ID trong URL có tồn tại trong JSON/LocalStorage của origin hiện tại không.
- HTTP 403/429 từ nguồn: không có dữ liệu thật để lưu; chờ thử lại, không tạo dữ liệu thay thế.
- Thiếu tiêu đề/nội dung/ngày đăng: mở HTML nguồn, cập nhật parseArticle; không dùng ngày hiện tại thay ngày đăng.
- Thiếu 10 bài: đọc counts/errors của audit.json, kiểm tra selector danh sách, phân trang và quan hệ chuyên mục.
- Không lưu LocalStorage: kiểm tra hạn mức/quyền trình duyệt; xuất backup trước khi xóa dữ liệu.
- Crawl được ở Codespaces nhưng lỗi ở Pages: Pages không có endpoint /api/crawl; đây là khác biệt môi trường, không phải lỗi tên file.
- Dữ liệu mới không lên Pages: phải git add/commit/push rồi chờ deploy.

## Tài liệu kỹ thuật

- GitHub Codespaces: https://docs.github.com/en/codespaces/quickstart
- Tạo Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- CORS: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
