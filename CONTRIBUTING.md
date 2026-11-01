# Hướng dẫn làm việc nhóm (Contributing Guide)

Tài liệu này mô tả quy trình các thành viên cùng phát triển đồ án trên GitHub,
nhằm tránh giẫm chân nhau và giữ cho nhánh `main` luôn sạch, chạy được.

## 1. Nguyên tắc cốt lõi

- **Không làm việc trực tiếp trên `main`.** Mỗi tính năng/sửa lỗi tạo một nhánh riêng.
- **`main` luôn ổn định.** Code chỉ vào `main` sau khi đã review qua Pull Request (PR).
- **Pull thường xuyên.** Kéo code mới của nhóm về trước khi bắt đầu và trước khi push.

## 2. Quy trình từng bước

Lặp lại vòng này cho mỗi tính năng:

```bash
# 1. Về main và kéo mới nhất
git checkout main
git pull

# 2. Tạo nhánh cho tính năng (đặt tên thể loại/tên-ngắn-gọn)
git checkout -b feat/khoa-tai-khoan

# 3. Sửa code, commit theo từng chặng nhỏ
git add <đường-dẫn-file>
git commit -m "feat(auth): khóa tài khoản sau 5 lần sai"

# 4. Push nhánh lên GitHub (lần đầu dùng -u)
git push -u origin feat/khoa-tai-khoan

# 5. Vào GitHub -> bấm "Compare & pull request" -> tạo PR, gán người review

# 6. Sau khi được duyệt và merge, dọn dẹp local
git checkout main
git pull
git branch -d feat/khoa-tai-khoan
```

## 3. Tiền tố commit

Dùng theo quy ước để lịch sử dễ đọc:

| Tiền tố | Khi nào dùng |
| :-- | :-- |
| `feat:` | Thêm tính năng mới |
| `fix:` | Sửa lỗi |
| `docs:` | Viết/sửa tài liệu |
| `refactor:` | Tái cấu trúc, không đổi hành vi |
| `chore:` | Vặt (cấu hình, dependency, ...) |

Ví dụ: `feat(content): thêm API08 tải audio`, `fix(auth): sửa luồng khóa tài khoản`.

## 4. Xử lý xung đột (conflict)

Xung đột xảy ra khi hai người sửa **cùng một dòng**. Git đánh dấu trong file:

```
<<<<<<< HEAD
phần của bạn
=======
phần của người kia
>>>>>>> tên-nhánh
```

Cách xử lý:

1. Mở file, chọn/gộp nội dung đúng, **xóa sạch các dòng dấu `<<<<<<<`, `=======`, `>>>>>>>`**.
2. `git add <file>` để báo đã giải quyết.
3. `git commit` (hoặc tiếp tục thao tác merge/rebase đang dở).

**Mẹo tránh conflict:** chia việc rõ (người backend / người frontend) và `git pull` thường xuyên.

## 5. Setup môi trường cục bộ

Yêu cầu: **Docker Desktop** và **Node.js 20+**.

```bash
git clone https://github.com/tphat-cloud/do-an-cnpm-audio-guide.git
docker compose up -d                       # chạy MySQL 8.0 (container: doan-mysql)
# tạo backend/.env từ backend/.env.example, điền JWT_SECRET
npm install                                # chạy trong backend/ và vite-project/
```

> Lưu ý: `backend/.env`, `node_modules/`, `dist/` đã được `.gitignore` —
> **không commit** các file này (đặc biệt là bí mật).

Xem dữ liệu bằng client CSDL cá nhân (DBeaver, TablePlus, ...), không dùng phpMyAdmin
để đỡ chiếm port: host `localhost`, port `3306`, user `doan_user`,
password `doan_pass123`, database `narration_db`.

## 6. Bảo vệ nhánh `main`

Khuyến nghị bật **branch protection** cho `main` (GitHub → Settings → Branches):
yêu cầu mở PR và có review trước khi merge, không push thẳng vào `main`.
