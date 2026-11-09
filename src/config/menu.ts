export type MenuItem = {
  id: string;
  name: string;
  description: string;
  /** Price in VND. */
  price: number;
};

// TODO(nội dung): tên món, mô tả và giá thật.
export const menu = [
  {
    id: "phan-thuong",
    name: "Phần thường",
    description: "Bánh ướt, lòng gà, trứng non, rau răm, hành phi.",
    price: 35_000,
  },
  {
    id: "phan-dac-biet",
    name: "Phần đặc biệt",
    description: "Gấp đôi lòng, thêm tim gan, trứng non và chả.",
    price: 50_000,
  },
  {
    id: "them-long",
    name: "Thêm lòng",
    description: "Một phần lòng gà luộc thêm.",
    price: 15_000,
  },
  {
    id: "them-banh",
    name: "Thêm bánh",
    description: "Một phần bánh ướt thêm.",
    price: 10_000,
  },
] as const satisfies readonly MenuItem[];

export type ProductId = (typeof menu)[number]["id"];

export const productIds = menu.map((item) => item.id) as [ProductId, ...ProductId[]];

export function findMenuItem(id: string): MenuItem | undefined {
  return menu.find((item) => item.id === id);
}

export function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)}đ`;
}
