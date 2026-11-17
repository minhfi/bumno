// Dev-only sample data: ~15 orders today across every status, plus ~13 months of past orders for the reports page.
// Deterministic (fixed pseudo-random seed). Do not run against production.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type OrderStatus, type Prisma } from "../src/generated/prisma/client";
import { menu } from "../src/config/menu";
import { shop } from "../src/config/shop";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const names = ["Lan", "Minh", "Hoa", "Tuấn", "Thảo", "Phúc", "Ngọc", "Bảo", "Vy", "Khoa", "Trang", "Đức", "Mai", "Quân", "Hà"];
const statuses: OrderStatus[] = ["NEW", "NEW", "NEW", "NEW", "CONFIRMED", "CONFIRMED", "CONFIRMED", "DELIVERING", "DELIVERING", "COMPLETED", "COMPLETED", "COMPLETED", "COMPLETED", "CANCELLED", "CANCELLED"];

const DAY_MS = 86_400_000;
const HISTORY_DAYS = 395;

function todayAt(minute: number): Date {
  const offsetMs = shop.utcOffsetMinutes * 60_000;
  const local = Date.now() + offsetMs;
  const midnight = local - (local % DAY_MS) - offsetMs;
  return new Date(midnight + minute * 60_000);
}

/** Small deterministic PRNG (mulberry32) so every seed run produces the same history. */
function random(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/** A dish that has since left the menu; reports still list it under its stored name. */
const legacyItem = { id: "phan-nho", name: "Phần nhỏ", price: 25_000 };

/** Past orders, 1 to `HISTORY_DAYS` days ago: COMPLETED, with a few CANCELLED. */
async function seedHistory() {
  const next = random(20261117);
  const slotCount = (shop.deliveryEndMinute - shop.deliveryStartMinute) / shop.slotStepMinutes;
  const orders: Prisma.OrderCreateManyInput[] = [];
  const items: Prisma.OrderItemCreateManyInput[] = [];

  for (let daysAgo = HISTORY_DAYS; daysAgo >= 1; daysAgo--) {
    const dayStart = todayAt(0).getTime() - daysAgo * DAY_MS;
    const weekend = [0, 6].includes(new Date(dayStart + shop.utcOffsetMinutes * 60_000).getUTCDay());
    // Slow growth over the year, busier at weekends.
    const count = Math.round(3 + (HISTORY_DAYS - daysAgo) / 80 + next() * 4 + (weekend ? 3 : 0));
    for (let n = 0; n < count; n++) {
      const id = `seed-${daysAgo}-${n}`;
      const slotMinute = shop.deliveryStartMinute + Math.floor(next() * slotCount) * shop.slotStepMinutes;
      const deliverySlot = new Date(dayStart + slotMinute * 60_000);
      const main = daysAgo > 300 && next() < 0.2 ? legacyItem : menu[next() < 0.55 ? 0 : 1];
      const lines = [{ productId: main.id, name: main.name, unitPrice: main.price, quantity: 1 + Math.floor(next() * 3) }];
      if (next() < 0.35) {
        const extra = menu[2 + Math.floor(next() * 2)];
        lines.push({ productId: extra.id, name: extra.name, unitPrice: extra.price, quantity: 1 + Math.floor(next() * 2) });
      }
      const name = names[Math.floor(next() * names.length)];
      orders.push({
        id,
        customerName: `Chị ${name}`,
        phone: `09${String(Math.floor(next() * 100_000_000)).padStart(8, "0")}`,
        address: `${1 + Math.floor(next() * 200)} Đường Mẫu, Quận 3`,
        deliverySlot,
        status: next() < 0.06 ? "CANCELLED" : "COMPLETED",
        total: lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
        createdAt: new Date(deliverySlot.getTime() - (30 + Math.floor(next() * 150)) * 60_000),
      });
      items.push(...lines.map((line) => ({ orderId: id, ...line })));
    }
  }

  await db.order.createMany({ data: orders });
  await db.orderItem.createMany({ data: items });
  return orders.length;
}

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Seed is for development only");
  await db.order.deleteMany();
  const history = await seedHistory();
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
  console.log(`Seeded ${names.length} orders today and ${history} past orders`);
}

main()
  .finally(() => db.$disconnect())
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
