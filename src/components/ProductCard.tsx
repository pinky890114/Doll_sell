import React from 'react';
import { Heart } from 'lucide-react';
import { STATUS_LABELS, type Product } from '../types/store';
import { formatTWD, getStartingPrice } from '../utils/pricing';
import { SafeImage } from './SafeImage';

interface ProductCardProps {
  product: Product;
  isFavorite: boolean;
  onToggleFavorite: (productId: string) => void;
  onSelect: (productId: string) => void;
}

const STATUS_STYLE: Record<Product['status'], string> = {
  new: 'bg-[#2B2825]/85 text-[#F7F5F0]',
  in_stock: 'bg-[#F7F5F0]/92 text-[#2B2825]',
  made_to_order: 'bg-[#F7F5F0]/92 text-[#5F6F61]',
  sold_out: 'bg-[#6E6962]/90 text-white',
};

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isFavorite,
  onToggleFavorite,
  onSelect,
}) => {
  const { price } = getStartingPrice(product);
  const coverImage = product.images[0] || '';

  return (
    <article className="group flex flex-col">
      <div className="relative overflow-hidden rounded-xl bg-[#EFECE6] border border-[#E5E0D8]/80 aspect-[4/5]">
        <button
          type="button"
          onClick={() => onSelect(product.id)}
          aria-label={`查看 ${product.name}`}
          className="block h-full w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2B2825]"
        >
          <SafeImage
            src={coverImage}
            alt={product.name}
            fallbackTitle={product.name}
            className={`h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02] ${
              product.status === 'sold_out' ? 'opacity-70 grayscale-[20%]' : ''
            }`}
          />
        </button>

        {/* Quiet status tag — clean crisp rectangle, never garish pill clusters */}
        <span
          className={`pointer-events-none absolute top-2.5 left-2.5 rounded px-2 py-0.5 text-[11px] font-medium tracking-wide ${STATUS_STYLE[product.status]}`}
        >
          {STATUS_LABELS[product.status]}
        </span>

        {/* Favorite Heart Button with >= 44px touch target */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(product.id);
          }}
          aria-label={isFavorite ? `從收藏移除 ${product.name}` : `收藏 ${product.name}`}
          aria-pressed={isFavorite}
          className="absolute top-1 right-1 flex h-11 w-11 items-center justify-center rounded-full text-[#2B2825] transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-[#2B2825]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F7F5F0]/88 backdrop-blur-xs">
            <Heart
              className={`h-4 w-4 transition-colors ${
                isFavorite
                  ? 'fill-[#A6726A] text-[#A6726A]'
                  : 'text-[#2B2825]/75 hover:text-[#2B2825]'
              }`}
            />
          </span>
        </button>
      </div>

      <div className="mt-2.5 flex flex-1 flex-col justify-between gap-1 px-0.5">
        <div>
          <p className="text-[11px] text-[#6E6962] tracking-wide">
            {product.dollSizes.join(' / ')}
          </p>
          <button
            type="button"
            onClick={() => onSelect(product.id)}
            className="mt-0.5 text-left text-sm sm:text-[15px] font-medium leading-snug text-[#2B2825] line-clamp-2 hover:text-[#5F6F61] transition-colors"
          >
            {product.name}
          </button>
        </div>

        <p className="mt-1 text-sm font-medium text-[#2B2825] tabular-price">
          <span className="mr-1 text-[11px] font-normal text-[#6E6962]">底價</span>
          {formatTWD(price)}
        </p>
      </div>
    </article>
  );
};
