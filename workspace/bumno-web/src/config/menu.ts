export type MenuItem = {
  id: string;
  name: string;
  description: string;
  /** Price in VND. */
  price: number;
  /** Extra portion ordered alongside a main dish; shown as "món thêm" in reports. */
  addon?: boolean;
};

export const menu = [
  {
    id: "phan-thuong",
    name: "Phần thường",
    description: "Thịt xé, trứng non, lòng, da, xương.",
    price: 30_000,
  },
  {
    id: "phan-canh",
    name: "Phần cánh",
    description: "",
    price: 30_000,
  },
  {
    id: "phan-dac-biet",
    name: "Phần đặc biệt",
    description: "Đùi hoặc má đùi, trứng non, lòng, da, xương.",
    price: 40_000,
  },
  {
    id: "them-long",
    name: "Lòng hoặc thịt thêm",
    description: "Một phần lòng hoặc thịt thêm.",
    price: 10_000,
    addon: true,
  },
  {
    id: "them-banh",
    name: "Bánh thêm",
    description: "Một phần bánh ướt thêm.",
    price: 5_000,
    addon: true,
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
