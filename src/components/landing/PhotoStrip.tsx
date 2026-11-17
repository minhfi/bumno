import Image from "next/image";

/** Wide real photo of the bowls ready to go, between the menu and the reasons. */
export function PhotoStrip() {
  return (
    <section aria-label="Ảnh thực tế" className="mx-auto max-w-[1120px] px-5 pt-12 sm:px-8 md:pt-16">
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border-4 border-rim sm:aspect-[16/9]">
        <Image
          src="/images/bumno-bowls.jpg"
          alt="Những tô bánh ướt lòng gà Bumno vừa làm xong, xếp sẵn trên bàn"
          fill
          sizes="(min-width: 1120px) 1120px, 100vw"
          className="object-cover object-[50%_60%]"
        />
      </div>
    </section>
  );
}
