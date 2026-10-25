import { Router } from 'express';

/**
 * Module content (PRD 2.2 - giai đoạn 1, sau tách thành content-service).
 *
 * Phạm vi: địa danh, điểm tham quan, nội dung thuyết minh và file audio
 * (UC01, UC03, UC05, UC06, UC08, UC09, UC10); sở hữu các bảng
 * `locations`, `pois`, `poi_translations`.
 * Quy ước: KHÔNG import code từ `src/auth`; tự kiểm tra JWT bằng secret
 * dùng chung thay vì gọi sang auth.
 *
 * Chưa cài API nào - route sẽ được thêm ở bước tiếp theo (API02 - API08).
 */
export const contentRouter = Router();
