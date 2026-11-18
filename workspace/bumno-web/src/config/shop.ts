export const shop = {
  name: "Bumno",
  tagline: "Bánh ướt lòng gà",
  address: "Số 71, Tân Hưng, TP. Hồ Chí Minh",
  phone: "0355903977",
  phoneDisplay: "0355 903 977",
  zaloUrl: "https://zalo.me/0355903977",
  deliveryArea: "Miễn phí ship trong vòng 2 km.",
  /** Delivery slots run from this minute of the day (inclusive) to `deliveryEndMinute` (exclusive). */
  deliveryStartMinute: 6 * 60,
  deliveryEndMinute: 20 * 60,
  slotStepMinutes: 30,
  minLeadMinutes: 30,
  timeZone: "Asia/Ho_Chi_Minh",
  /** Vietnam has no DST, so a fixed UTC offset is exact. */
  utcOffsetMinutes: 7 * 60,
} as const;
