import type { ImageTransform } from '../../models/Slide';
import { getDefaultImageTransform } from '../../utils/imageTransform';
import { EditableImage, type SlideImageInteractionProps } from './EditableImage';
import { SlideImage } from './SlideImage';

interface LayoutTextAndImageProps extends SlideImageInteractionProps {
  title: string;
  text: string;
  imageUrl?: string;
  imageTransform?: ImageTransform;
}

export function LayoutTextAndImage({
  title,
  text,
  imageUrl,
  imageTransform,
  interactive,
  selectedImage,
  onSelectImage,
  onImageClick,
  onImageTransformChange,
  onImageTransformCommit,
}: LayoutTextAndImageProps) {
  return (
    <div
      data-layout="text-and-image"
      className="relative flex h-full w-full flex-col gap-[2cqw] p-[3cqw]"
    >
      <h2 className="text-[3.5cqw] font-bold leading-tight">{title}</h2>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-[3cqw]">
        <p className="whitespace-pre-wrap text-[2.4cqw] leading-relaxed">{text}</p>
        {!imageUrl && <SlideImage url={imageUrl} alt={title} />}
      </div>
      {imageUrl && (
        <EditableImage
          src={imageUrl}
          alt={title}
          transform={imageTransform ?? getDefaultImageTransform('text-and-image')}
          interactive={interactive}
          selected={selectedImage}
          onSelect={onSelectImage}
          onImageClick={onImageClick}
          onTransformChange={onImageTransformChange}
          onTransformCommit={onImageTransformCommit}
        />
      )}
    </div>
  );
}
