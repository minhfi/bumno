/** Hand-drawn style plate of bánh ướt lòng gà, shown beside the admin sign-in form. Purely decorative. */
export function LoginArt() {
  return (
    <div className="relative hidden flex-col items-center justify-center gap-10 overflow-hidden bg-rim p-10 text-on-rim md:flex">
      <div className="relative aspect-square w-[min(80%,440px)] rounded-full border-[18px] border-white bg-white shadow-[0_24px_48px_-24px_rgb(26_34_48/0.5)]">
        <div aria-hidden className="absolute inset-[6%] rounded-full border border-ink/10" />
        <svg viewBox="0 0 200 200" aria-hidden className="absolute inset-0 h-full w-full">
          {/* bánh ướt folds */}
          <g fill="#f3efe6" stroke="#e2dccd" strokeWidth="1.5">
            <path d="M45 92c18-26 70-30 100-12 10 6 6 18-6 18-30-2-64 2-88 10-10 3-12-8-6-16z" />
            <path d="M50 118c22-18 74-20 102-4 9 5 4 16-7 16-28-3-60 1-86 8-11 2-15-11-9-20z" />
            <path d="M60 142c20-12 60-12 82 0 7 4 2 13-6 13-22-2-46 0-68 4-9 2-14-10-8-17z" />
          </g>
          {/* lòng gà */}
          <g fill="#b9790f" opacity="0.85">
            <ellipse cx="82" cy="86" rx="12" ry="7" transform="rotate(-18 82 86)" />
            <ellipse cx="118" cy="104" rx="11" ry="6.5" transform="rotate(12 118 104)" />
            <ellipse cx="96" cy="128" rx="10" ry="6" transform="rotate(-6 96 128)" />
          </g>
          <g fill="#8a4b2a">
            <circle cx="104" cy="82" r="6" />
            <circle cx="132" cy="124" r="5" />
          </g>
          {/* trứng non */}
          <g fill="#f2b33d">
            <circle cx="70" cy="110" r="5" />
            <circle cx="126" cy="88" r="4.5" />
            <circle cx="112" cy="140" r="4" />
          </g>
          {/* rau răm + ớt */}
          <g fill="#2f6b3a">
            <path d="M140 70c8-6 18-4 20 2-6 6-14 6-20-2z" />
            <path d="M60 70c-8-4-16 0-16 6 6 4 12 2 16-6z" />
            <path d="M146 140c6-8 16-8 18-2-4 6-12 8-18 2z" />
          </g>
          <g fill="#c8261c">
            <circle cx="152" cy="80" r="2.6" />
            <circle cx="158" cy="86" r="2.2" />
            <circle cx="52" cy="80" r="2.4" />
          </g>
        </svg>
      </div>
      <div className="text-center">
        <p className="font-display text-5xl font-extrabold uppercase leading-none lg:text-6xl">Bumno</p>
        <p className="mt-3 text-lg">Bánh ướt lòng gà, hấp nóng mỗi ngày.</p>
      </div>
    </div>
  );
}
