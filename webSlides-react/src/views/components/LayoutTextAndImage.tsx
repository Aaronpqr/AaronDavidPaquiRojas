import { SlideImage } from './SlideImage';

interface LayoutTextAndImageProps {
  title: string;
  text: string;
  imageUrl?: string;
}

export function LayoutTextAndImage({ title, text, imageUrl }: LayoutTextAndImageProps) {
  return (
    <div data-layout="text-and-image" className="flex h-full flex-col gap-[2cqw] p-[3cqw]">
      <h2 className="text-[3.5cqw] font-bold leading-tight">{title}</h2>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-[3cqw]">
        <p className="whitespace-pre-wrap text-[2.4cqw] leading-relaxed">{text}</p>
        <SlideImage url={imageUrl} alt={title} />
      </div>
    </div>
  );
}
