export const shop = {
  name: "Bumno",
  tagline: "Bánh ướt lòng gà",
  address: "Số 71, Tân Hưng, TP. Hồ Chí Minh",
  phone: "0355903977",
  phoneDisplay: "0355 903 977",
  zaloUrl: "https://zalo.me/0355903977",
  /** Shipping fee rules shown to customers; the shop still enters each order's fee by hand. */
  shippingRates: ["Free ship từ 2 phần, dưới 1 km.", "Từ 1–3 km: ship 10.000đ.", "Trên 3 km: theo giá app."],
  /** Delivery slots run from this minute of the day (inclusive) to `deliveryEndMinute` (exclusive). */
  deliveryStartMinute: 6 * 60,
  deliveryEndMinute: 20 * 60,
  slotStepMinutes: 30,
  minLeadMinutes: 30,
  timeZone: "Asia/Ho_Chi_Minh",
  /** Vietnam has no DST, so a fixed UTC offset is exact. */
  utcOffsetMinutes: 7 * 60,
} as const;
