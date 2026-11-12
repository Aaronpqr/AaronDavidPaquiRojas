import { SlideImage } from './SlideImage';

interface LayoutImageOnlyProps {
  title: string;
  imageUrl?: string;
}

export function LayoutImageOnly({ title, imageUrl }: LayoutImageOnlyProps) {
  return (
    <div data-layout="image-only" className="flex h-full flex-col gap-[2cqw] p-[3cqw]">
      <h2 className="text-[3.5cqw] font-bold leading-tight">{title}</h2>
      <div className="min-h-0 flex-1">
        <SlideImage url={imageUrl} alt={title} />
      </div>
    </div>
  );
}