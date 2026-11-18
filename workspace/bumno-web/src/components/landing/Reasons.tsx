// TODO(nội dung): câu chuyện thật của quán.
const reasons = [
  {
    title: "Bánh tráng tại chỗ",
    body: "Bột gạo xay mỗi đêm, sáng ra mới tráng. Bánh mỏng, dẻo, không bở, cuốn lòng không rách.",
  },
  {
    title: "Lòng gà trong ngày",
    body: "Lòng, tim, gan, trứng non lấy buổi sớm, luộc gừng cho hết mùi, giữ độ giòn.",
  },
  {
    title: "Nước mắm pha riêng",
    body: "Nước mắm chua ngọt pha theo công thức nhà, thêm tỏi ớt tươi. Gói riêng để bánh không bị ướt.",
  },
];

export function Reasons() {
  return (
    <section aria-labelledby="reasons-title" className="mx-auto max-w-[1120px] px-5 py-12 sm:px-8 md:py-16">
      <h2 id="reasons-title" className="font-display text-[40px] font-extrabold uppercase leading-none text-rim-strong">
        Vì sao chọn Bumno
      </h2>
      <div className="mt-8 grid gap-8 md:grid-cols-3 md:gap-10">
        {reasons.map((reason) => (
          <div key={reason.title}>
            <h3 className="font-display text-[28px] font-bold leading-tight">{reason.title}</h3>
            <p className="mt-2 max-w-[60ch] text-ink/80">{reason.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
