# BACKLOG — Hệ thống thuyết minh tự động đa ngôn ngữ

> Danh sách việc cần làm của cả nhóm, gom về một chỗ. Ai `git pull` về mở ra sẽ thấy
| việc gì còn, ai làm, tới đâu. Cập nhật trực tiếp file này khi nhận/ xong việc.

## Cách dùng (quy tắc chống conflict)

1. **Mỗi việc = một nhánh + một Pull Request.** Không push thẳng `main`.
   `git checkout -b feat/<ma-viec>` → sửa → commit → push → mở PR → người khác approve → merge.
2. **Claim trước khi làm:** đổi `Trạng thái` thành `🔒 doing` + ghi `Owner`, rồi commit PR nhỏ.
   Người khác pull về thấy `doing` thì không làm trùng.
3. **Chia theo vùng thư mục** (bảng dưới) để 3 người sửa file **khác nhau**, hạn chế tối đa xung đột.
4. **Agent làm xong phải kiểm chứng:** `npm run build` (backend + frontend) xanh, test pass,
   rồi mới mở PR. Bắt buộc có 1 người khác review — không merge mù code do agent sinh.
5. **Việc nào xong:** đổi `Trạng thái` thành `✅ done (PR#n)`.

## Phân vùng phụ trách (mỗi người owning một vùng riêng)

| Người | Thành viên | Vùng thư mục (chỉ nên đụng vào đây) | Vai trò |
| :-- | :-- | :-- | :-- |
| **Người 1** | **Phát** | `backend/src/**`, `backend/database/**`, `docker-compose.yml`, `.github/**` | Backend & DevOps |
| **Người 2** | **Nam Anh** | `vite-project/src/pages/{WelcomePage,TourPage}.tsx`, `components/{AudioPlayer,TourMap,DemoGpsPanel,LanguageSelector}.tsx`, `hooks/**`, `store/{useTourStore,useGpsStore}.ts`, `utils/geo.ts`, `i18n/**` | Frontend Du khách |
| **Người 3** | **Nhân** | `vite-project/src/pages/admin/**`, `api/admin*.ts`, `store/useAdminStore.ts`, `docs/**` | Frontend Admin & Tài liệu |

> Vùng `vite-project/src/types.ts`, `App.tsx`, `api/client.ts` là **dùng chung** → ai sửa
> phải báo trước trong nhóm + PR nhỏ, vì cả 3 đều đọc các file này.

---

## 🔴 Ưu tiên CAO — cốt lõi còn thiếu

| ID | Việc | Vùng / File chính | PRD | Ưu tiên | Trạng thái | Owner |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| B1 | Khóa tài khoản sau 5 lần sai: đếm `failed_attempts`, đặt `locked_until`, trả 429 + `retryAfterSeconds` | backend/auth | 2.7.1, API01 | Cao | TODO | Phát |
| F1 | Hiện dải cảnh báo "Tín hiệu GPS yếu" (đang âm thầm bỏ tọa độ >30m) | FE Du khách | BR06, UC02-6b | Cao | TODO | Nam Anh |
| F2 | Hàng chờ bài thuyết minh: điểm mới không cắt ngang audio đang phát | FE Du khách | BR05, UC04-5b | Cao | TODO | Nam Anh |
| F3 | Hướng dẫn bật lại quyền vị trí khi từ chối / mất giữa chừng | FE Du khách | UC02-5a, UC04-1b | Cao | TODO | Nam Anh |
| D1 | Hoàn thiện PRD Chương 1 (Mục đích, Bài toán, Mục tiêu, Phạm vi) | docs | Ch.1 | Cao | TODO | Nhân |
| D2 | Hoàn thiện PRD Chương 4 (Hiệu năng, Bảo mật, Tương thích, Khả năng dùng) | docs | Ch.4 | Cao | TODO | Nhân |

## 🟡 Ưu tiên TRUNG BÌNH — khớp PRD đã ghi

| ID | Việc | Vùng / File chính | PRD | Ưu tiên | Trạng thái | Owner |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| B2 | Dockerfile cho backend + frontend; compose mount volume `/uploads/audio` | backend / DevOps | 4.5.3 | TB | TODO | - |
| B3 | Viết test tự động cho API (POI CRUD + auth + fallback ngôn ngữ) | backend | 4.5.1 | TB | TODO | - |
| F4 | Thông báo "Bạn đang ở ngoài khu tham quan" (>1 km) | FE Du khách | UC06-5a | TB | TODO | - |
| F5 | Phát audio im lặng mở khóa tự phát ngay khi bấm "Bắt đầu" | FE Du khách | UC02-b2, BR07 | TB | TODO | - |
| A1 | Rà + hoàn thiện Admin thêm/sửa/xóa, đồng bộ danh sách sau lưu | FE Admin | UC08 | TB | TODO | - |
| D3 | Bổ sung UC11 (Xem số người truy cập): User Story + đặc tả + wireframe | docs | 3.1, 3.2 | TB | TODO | - |
| D4 | Viết API10/API11 request/response vào PRD mục 6.2 | docs | 6.2 | TB | TODO | - |
| D5 | Sửa PRD khớp code: "4 bảng"→5 bảng, thêm `visitor_sessions`, thêm cột `name` ở `poi_translations`, `oi_id`→`poi_id` | docs | 5.2, 3.3.9 | TB | TODO | - |

## 🟢 Ưu tiên THẤP — ghi điểm bảo vệ

| ID | Việc | Vùng / File chính | PRD | Ưu tiên | Trạng thái | Owner |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| B4 | CI/CD GitHub Actions: lint → type-check → test → build, chặn merge khi đỏ | DevOps | 4.5.1 | Thấp | TODO | - |
| B5 | Bật branch protection cho `main` (yêu cầu PR + review) | DevOps | 4.5.3 | Thấp | TODO | - |
| D6 | Vẽ sơ đồ còn thiếu: 5.1 ERD, 5.3 Component, 5.4 Deployment + Activity Diagram | docs | 5.1, 5.3, 5.4 | Thấp | TODO | - |
| D7 | README hướng dẫn chạy dự án (setup, env, lệnh) | docs | - | Thấp | TODO | - |
| F6 | Định dạng/chèn ảnh 11 sơ đồ UC + activity trong PRD | docs | Ch.3 | Thấp | TODO | - |
| — | Slide bảo vệ + kịch bản demo (QR → ngôn ngữ → GPS/demo → nghe tự động → admin → thống kê) | Chung | - | Thấp | TODO | - |

---

## Ghi chú môi trường (quan trọng)

- **Không đặt repo trong `OneDrive`** — OneDrive khóa file trong `.git` gây treo/xung đột khi
  commit, xóa nhánh. Khuyến nghị chuyển về `C:\Dev\do-an-cnpm-audio-guide`.
- Yêu cầu chạy: **Docker Desktop** + **Node.js 20+**. Mỗi người tự tạo `backend/.env`
  từ `backend/.env.example` (file `.env` đã được `.gitignore`, đừng commit).
