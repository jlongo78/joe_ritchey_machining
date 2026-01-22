import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/utils/formatters';
import { ShoppingCart, Eye, Heart } from 'lucide-react';
import { Rating } from '@/components/common/Rating';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import type { Product } from '@/types';

export interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onQuickView,
  className,
}) => {
  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];
  const isOnSale = product.salePrice && product.salePrice < product.retailPrice;
  const currentPrice = product.salePrice || product.retailPrice;
  const isInStock = (product.inventory?.quantityAvailable || 0) > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart?.(product);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(product);
  };

  return (
    <Link
      to={`/shop/products/${product.slug}`}
      className={cn(
        'group block bg-white rounded-xl border border-secondary-200 overflow-hidden',
        'hover:shadow-lg transition-shadow duration-300',
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-secondary-100 overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage.imageUrl}
            alt={primaryImage.altText || product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-secondary-400">
            No Image
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isOnSale && (
            <Badge variant="danger" size="sm">
              Sale
            </Badge>
          )}
          {product.isNew && (
            <Badge variant="info" size="sm">
              New
            </Badge>
          )}
          {product.isFeatured && (
            <Badge variant="warning" size="sm">
              Featured
            </Badge>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleQuickView}
            className="p-2 rounded-lg bg-white shadow-md text-secondary-600 hover:text-primary-600 hover:bg-primary-50 transition-colors"
            aria-label="Quick view"
          >
            <Eye className="h-5 w-5" />
          </button>
          <button
            className="p-2 rounded-lg bg-white shadow-md text-secondary-600 hover:text-red-600 hover:bg-red-50 transition-colors"
            aria-label="Add to wishlist"
          >
            <Heart className="h-5 w-5" />
          </button>
        </div>

        {/* Out of Stock Overlay */}
        {!isInStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="default" size="lg" className="bg-white text-secondary-900">
              Out of Stock
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Brand */}
        {product.brand && (
          <p className="text-xs text-secondary-500 uppercase tracking-wider mb-1">
            {product.brand.name}
          </p>
        )}

        {/* Title */}
        <h3 className="font-medium text-secondary-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        {product.averageRating !== undefined && (
          <div className="mb-2">
            <Rating
              value={product.averageRating}
              size="sm"
              reviewCount={product.reviewCount}
            />
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-lg font-bold text-primary-600">
            {formatPrice(currentPrice)}
          </span>
          {isOnSale && (
            <span className="text-sm text-secondary-400 line-through">
              {formatPrice(product.retailPrice)}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <Button
          variant="primary"
          size="sm"
          className="w-full"
          onClick={handleAddToCart}
          disabled={!isInStock}
          leftIcon={<ShoppingCart className="h-4 w-4" />}
        >
          {isInStock ? 'Add to Cart' : 'Out of Stock'}
        </Button>
      </div>
    </Link>
  );
};

export default ProductCard;
