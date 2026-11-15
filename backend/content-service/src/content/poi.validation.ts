import type { PoiCreateInput, PoiUpdateInput } from './poi.repository';

/**
 * Kiểm tra dữ liệu thêm/sửa điểm tham quan (PRD 3.3.8, 6.2 - API04, API05).
 *
 * Gom toàn bộ lỗi vào một object `errors` theo tên trường để frontend báo
 * đúng ô nhập. Phạm vi giá trị theo PRD: vĩ độ -90..90, kinh độ -180..180,
 * bán kính 1..100m (mặc định 10m).
 */

export type PoiFieldErrors = Record<string, string>;

export interface PoiValidationResult {
  input: PoiCreateInput | null;
  errors: PoiFieldErrors;
}

export interface PoiUpdateValidationResult {
  input: PoiUpdateInput | null;
  errors: PoiFieldErrors;
}

const DEFAULT_RADIUS_M = 10;
const MIN_RADIUS_M = 1;
const MAX_RADIUS_M = 100;
const MIN_LATITUDE = -90;
const MAX_LATITUDE = 90;
const MIN_LONGITUDE = -180;
const MAX_LONGITUDE = 180;
const DEFAULT_ORDER_INDEX = 0;
const MAX_NAME_LENGTH = 255;

interface ParsedField {
  value: number;
  valid: boolean;
}

/** Nhận số hoặc chuỗi số; trả null nếu không phải số hữu hạn. */
function toNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toInteger(value: unknown): number | null {
  const parsed = toNumber(value);
  return parsed !== null && Number.isInteger(parsed) ? parsed : null;
}

function isEmptyValue(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

/** id bắt buộc và phải là số nguyên dương (locationId). */
function parseRequiredId(value: unknown): ParsedField {
  const parsed = toInteger(value);

  if (parsed === null || parsed <= 0) {
    return { value: 0, valid: false };
  }

  return { value: parsed, valid: true };
}

/** Số nguyên trong khoảng [min, max]; bỏ trống thì dùng `fallback`. */
function parseIntegerWithin(
  value: unknown,
  min: number,
  max: number,
  fallback: number
): ParsedField {
  if (isEmptyValue(value)) {
    return { value: fallback, valid: true };
  }

  const parsed = toInteger(value);

  if (parsed === null || parsed < min || parsed > max) {
    return { value: fallback, valid: false };
  }

  return { value: parsed, valid: true };
}

/** Số thực trong khoảng [min, max]; bỏ trống hoặc sai kiểu đều không hợp lệ. */
function parseCoordinate(
  value: unknown,
  min: number,
  max: number
): ParsedField {
  const parsed = toNumber(value);

  if (parsed === null || parsed < min || parsed > max) {
    return { value: 0, valid: false };
  }

  return { value: parsed, valid: true };
}

function parseName(value: unknown): { value: string; valid: boolean } {
  const name = typeof value === 'string' ? value.trim() : '';

  if (name === '' || name.length > MAX_NAME_LENGTH) {
    return { value: name, valid: false };
  }

  return { value: name, valid: true };
}

/** Các trường chung của API04 và API05 (PRD 3.3.8, 6.2). */
interface PoiFields {
  name: string;
  latitude: number;
  longitude: number;
  radiusM: number;
  orderIndex: number;
}

function validatePoiFields(payload: Record<string, unknown>): {
  fields: PoiFields;
  errors: PoiFieldErrors;
} {
  const errors: PoiFieldErrors = {};

  const name = parseName(payload.name);
  if (!name.valid) {
    errors.name =
      name.value === ''
        ? 'Vui lòng nhập tên điểm tham quan'
        : `Tên điểm tối đa ${MAX_NAME_LENGTH} ký tự`;
  }

  const latitude = parseCoordinate(payload.latitude, MIN_LATITUDE, MAX_LATITUDE);
  if (!latitude.valid) {
    errors.latitude = 'Tọa độ không hợp lệ';
  }

  const longitude = parseCoordinate(
    payload.longitude,
    MIN_LONGITUDE,
    MAX_LONGITUDE
  );
  if (!longitude.valid) {
    errors.longitude = 'Tọa độ không hợp lệ';
  }

  const radiusM = parseIntegerWithin(
    payload.radiusM,
    MIN_RADIUS_M,
    MAX_RADIUS_M,
    DEFAULT_RADIUS_M
  );
  if (!radiusM.valid) {
    errors.radiusM = 'Bán kính phải từ 1 đến 100m';
  }

  const orderIndex = parseIntegerWithin(
    payload.orderIndex,
    0,
    Number.MAX_SAFE_INTEGER,
    DEFAULT_ORDER_INDEX
  );
  if (!orderIndex.valid) {
    errors.orderIndex = 'Thứ tự phải là số nguyên không âm';
  }

  return {
    fields: {
      name: name.value,
      latitude: latitude.value,
      longitude: longitude.value,
      radiusM: radiusM.value,
      orderIndex: orderIndex.value,
    },
    errors,
  };
}

export function validatePoiCreate(body: unknown): PoiValidationResult {
  const payload = (body ?? {}) as Record<string, unknown>;
  const { fields, errors } = validatePoiFields(payload);

  const locationId = parseRequiredId(payload.locationId);
  if (!locationId.valid) {
    errors.locationId = 'Vui lòng chọn địa danh';
  }

  if (Object.keys(errors).length > 0) {
    return { input: null, errors };
  }

  return {
    input: { locationId: locationId.value, ...fields },
    errors,
  };
}

/**
 * API05: cùng quy tắc kiểm tra như API04, chỉ khác không có locationId -
 * điểm giữ nguyên địa danh mà nó đang thuộc về.
 */
export function validatePoiUpdate(body: unknown): PoiUpdateValidationResult {
  const payload = (body ?? {}) as Record<string, unknown>;
  const { fields, errors } = validatePoiFields(payload);

  if (Object.keys(errors).length > 0) {
    return { input: null, errors };
  }

  return { input: fields, errors };
}
