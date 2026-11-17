// Dev-only sample data: ~15 orders today across every status. Do not run against production.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type OrderStatus } from "../src/generated/prisma/client";
import { menu } from "../src/config/menu";
import { shop } from "../src/config/shop";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const names = ["Lan", "Minh", "Hoa", "Tuấn", "Thảo", "Phúc", "Ngọc", "Bảo", "Vy", "Khoa", "Trang", "Đức", "Mai", "Quân", "Hà"];
const statuses: OrderStatus[] = ["NEW", "NEW", "NEW", "NEW", "CONFIRMED", "CONFIRMED", "CONFIRMED", "DELIVERING", "DELIVERING", "COMPLETED", "COMPLETED", "COMPLETED", "COMPLETED", "CANCELLED", "CANCELLED"];

function todayAt(minute: number): Date {
  const offsetMs = shop.utcOffsetMinutes * 60_000;
  const local = Date.now() + offsetMs;
  const midnight = local - (local % 86_400_000) - offsetMs;
  return new Date(midnight + minute * 60_000);
}

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Seed is for development only");
  await db.order.deleteMany();
  for (const [index, name] of names.entries()) {
    const product = menu[index % 2];
    const extra = menu[2 + (index % 2)];
    const items = [
      { productId: product.id, name: product.name, unitPrice: product.price, quantity: 1 + (index % 3) },
      ...(index % 3 === 0 ? [{ productId: extra.id, name: extra.name, unitPrice: extra.price, quantity: 1 }] : []),
    ];
    const createdMinute = 6 * 60 + index * 10;
    await db.order.create({
      data: {
        customerName: `Chị ${name}`,
        phone: `09${String(10_000_000 + index * 137_531).padStart(8, "0")}`,
        address: `${10 + index} Đường Mẫu, Phường ${1 + (index % 5)}, Quận 3`,
        deliverySlot: todayAt(Math.ceil((createdMinute + 30) / 30) * 30),
        note: index % 4 === 0 ? "Ít hành, nhiều rau răm" : null,
        internalNote: statuses[index] === "CANCELLED" ? "Khách gọi huỷ" : null,
        status: statuses[index],
        total: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
        createdAt: todayAt(createdMinute),
        items: { create: items },
      },
    });
  }
  console.log(`Seeded ${names.length} orders`);
}

main()
  .finally(() => db.$disconnect())
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
