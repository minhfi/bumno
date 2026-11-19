import { shop } from "@/config/shop";

export function ShopInfo() {
  return (
    <section id="thong-tin" aria-labelledby="info-title" className="bg-rim text-on-rim">
      <div className="mx-auto grid max-w-[1120px] gap-8 px-5 py-12 sm:px-8 md:grid-cols-[1fr_1.4fr] md:py-16">
        <h2 id="info-title" className="font-display text-[40px] font-extrabold uppercase leading-none">
          Thông tin quán
        </h2>
        <dl className="grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-semibold text-on-rim/80">Địa chỉ</dt>
            <dd className="mt-1">{shop.address}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-on-rim/80">Giờ giao hàng</dt>
            <dd className="mt-1">
              {shop.deliveryStartMinute / 60}:00–{shop.deliveryEndMinute / 60}:00 mỗi ngày.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-on-rim/80">Điện thoại / Zalo</dt>
            <dd className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              <a href={`tel:${shop.phone}`} className="font-semibold underline underline-offset-4">
                {shop.phoneDisplay}
              </a>
              <a href={shop.zaloUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">
                Nhắn Zalo
              </a>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
