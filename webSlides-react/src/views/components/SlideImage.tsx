interface SlideImageProps {
  url?: string;
  alt: string;
}

export function SlideImage({ url, alt }: SlideImageProps) {
  if (!url) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-[1cqw] border-2 border-dashed border-slate-300 text-[2cqw] text-slate-400">
        Sin imagen
      </div>
    );
  }
  return <img src={url} alt={alt} className="h-full w-full object-contain" />;
}