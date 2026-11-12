import type { ImageTransform } from '../../models/Slide';
import { getDefaultImageTransform } from '../../utils/imageTransform';
import { EditableImage, type SlideImageInteractionProps } from './EditableImage';
import { SlideImage } from './SlideImage';

interface LayoutImageOnlyProps extends SlideImageInteractionProps {
  title: string;
  imageUrl?: string;
  imageTransform?: ImageTransform;
}

export function LayoutImageOnly({
  title,
  imageUrl,
  imageTransform,
  interactive,
  selectedImage,
  onSelectImage,
  onImageClick,
  onImageTransformChange,
  onImageTransformCommit,
}: LayoutImageOnlyProps) {
  return (
    <div data-layout="image-only" className="relative flex h-full w-full flex-col gap-[2cqw] p-[3cqw]">
      <h2 className="text-[3.5cqw] font-bold leading-tight">{title}</h2>
      {!imageUrl && (
        <div className="min-h-0 flex-1">
          <SlideImage url={imageUrl} alt={title} />
        </div>
      )}
      {imageUrl && (
        <EditableImage
          src={imageUrl}
          alt={title}
          transform={imageTransform ?? getDefaultImageTransform('image-only')}
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
