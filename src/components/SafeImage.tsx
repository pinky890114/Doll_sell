import React, { useEffect, useState } from 'react';
import { Scissors } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackTitle?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  fallbackTitle,
  ...rest
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div
        role="img"
        aria-label={alt || fallbackTitle || '手作商品圖片'}
        className={`flex flex-col items-center justify-center gap-2 bg-[#EFECE6] text-[#6E6962] p-4 text-center ${className}`}
      >
        <Scissors className="h-5 w-5 opacity-60" />
        <span className="text-xs font-medium line-clamp-2">{fallbackTitle || alt || '天冷穿件衣'}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
      {...rest}
    />
  );
};
