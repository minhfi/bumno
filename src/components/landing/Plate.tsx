import Image from "next/image";

/** Enamel plate with a thick yellow-orange rim, holding the real photo of a bowl. */
export function Plate({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative aspect-square overflow-hidden rounded-full border-[14px] border-rim bg-surface shadow-[0_18px_40px_-24px_rgb(26_34_48/0.45)] sm:border-[18px] ${className}`}
    >
      <Image
        src="/images/bumno-bowl.jpg"
        alt="Tô bánh ướt lòng gà Bumno kèm chén nước mắm"
        fill
        priority
        sizes="(min-width: 768px) 420px, 82vw"
        className="object-cover object-[60%_85%] origin-[60%_65%] scale-[1.3]"
      />
    </div>
  );
}
