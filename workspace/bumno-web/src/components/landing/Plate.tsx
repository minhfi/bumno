import Image from "next/image";

/** Enamel plate with a thick yellow-orange rim, holding the shop logo. */
export function Plate({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative aspect-square overflow-hidden rounded-full border-[14px] border-rim bg-surface shadow-[0_18px_40px_-24px_rgb(26_34_48/0.45)] sm:border-[18px] ${className}`}
    >
      <Image
        src="/images/bumno-logo.jpg"
        alt="Logo Bánh ướt lòng gà BumNo: chú gà đầu bếp bên đĩa bánh ướt lòng gà, khẩu hiệu Ngon - Sạch - Đậm vị"
        fill
        priority
        sizes="(min-width: 768px) 420px, 82vw"
        className="bg-white object-contain"
      />
    </div>
  );
}
