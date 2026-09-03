import {
  REIMBURSEMENT_AUDIT_STATUSES,
  type ReimbursementAudit,
  type ReimbursementAuditStatus,
  type ReimbursementAuditTrip,
} from '@reimburse/shared';

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function isAuditStatus(value: unknown): value is ReimbursementAuditStatus {
  return typeof value === 'string'
    && REIMBURSEMENT_AUDIT_STATUSES.includes(value as ReimbursementAuditStatus);
}

function mapTrip(value: unknown): ReimbursementAuditTrip | null {
  if (!isJsonObject(value)
    || typeof value['班次日期'] !== 'string'
    || !isNullableString(value['上班打卡时间'])
    || !isNullableString(value['下班打卡时间'])
    || !isNullableString(value['打车时间'])
    || typeof value['金额'] !== 'number'
    || !Number.isFinite(value['金额'])) {
    return null;
  }

  return {
    amount: value['金额'],
    clockInTime: value['上班打卡时间'],
    clockOutTime: value['下班打卡时间'],
    shiftDate: value['班次日期'],
    taxiTime: value['打车时间'],
  };
}

export function mapReimbursementAudit(value: unknown): ReimbursementAudit | null {
  if (!isJsonObject(value)
    || typeof value['姓名'] !== 'string'
    || typeof value['审核时间'] !== 'string'
    || typeof value['报销总金额'] !== 'number'
    || !Number.isFinite(value['报销总金额'])
    || !Array.isArray(value['行程列表'])
    || !isAuditStatus(value['审核状态'])
    || !Array.isArray(value['不通过原因'])
    || !value['不通过原因'].every((reason) => typeof reason === 'string')) {
    return null;
  }

  const trips = value['行程列表'].map(mapTrip);
  if (trips.some((trip) => trip === null)) return null;

  return {
    auditedAt: value['审核时间'],
    name: value['姓名'],
    rejectionReasons: value['不通过原因'],
    status: value['审核状态'],
    totalAmount: value['报销总金额'],
    trips: trips as ReimbursementAuditTrip[],
  };
}
