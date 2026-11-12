interface LayoutTextOnlyProps {
  title: string;
  text: string;
}

export function LayoutTextOnly({ title, text }: LayoutTextOnlyProps) {
  return (
    <div data-layout="text-only" className="flex h-full flex-col gap-[2.5cqw] p-[4cqw]">
      <h2 className="text-[4.5cqw] font-bold leading-tight">{title}</h2>
      <p className="whitespace-pre-wrap text-[2.6cqw] leading-relaxed">{text}</p>
    </div>
  );
}
