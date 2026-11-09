export const shop = {
  name: "Bumno",
  tagline: "Bánh ướt lòng gà",
  // TODO(nội dung): địa chỉ, SĐT, Zalo và khu vực giao thật của quán.
  address: "123 Đường Ví Dụ, Phường 1, Quận 3, TP.HCM",
  phone: "0900000000",
  phoneDisplay: "0900 000 000",
  zaloUrl: "https://zalo.me/0900000000",
  deliveryArea: "Giao trong nội thành, quán gọi xác nhận phí ship (nếu có) khi xác nhận đơn.",
  // TODO(nội dung): giờ mở cửa thật (giả định tạm 6:00–11:00).
  openMinute: 6 * 60,
  closeMinute: 11 * 60,
  slotStepMinutes: 30,
  minLeadMinutes: 30,
  timeZone: "Asia/Ho_Chi_Minh",
  /** Vietnam has no DST, so a fixed UTC offset is exact. */
  utcOffsetMinutes: 7 * 60,
} as const;

export function formatMinuteOfDay(minute: number): string {
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}
