import React from 'react';
import { cn } from '@/utils/cn';
import { Star } from 'lucide-react';

export interface RatingProps {
  value: number;
  maxValue?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  reviewCount?: number;
  className?: string;
}

const Rating: React.FC<RatingProps> = ({
  value,
  maxValue = 5,
  size = 'md',
  showValue = false,
  reviewCount,
  className,
}) => {
  const sizes = {
    sm: { star: 'h-3.5 w-3.5', text: 'text-xs' },
    md: { star: 'h-4 w-4', text: 'text-sm' },
    lg: { star: 'h-5 w-5', text: 'text-base' },
  };

  const sizeConfig = sizes[size];

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(value);
    const hasHalfStar = value % 1 >= 0.5;

    for (let i = 0; i < maxValue; i++) {
      const isFilled = i < fullStars;
      const isHalf = i === fullStars && hasHalfStar;

      stars.push(
        <span key={i} className="relative">
          {/* Background star (empty) */}
          <Star
            className={cn(sizeConfig.star, 'text-chrome-600')}
            fill="currentColor"
          />
          {/* Foreground star (filled) */}
          {(isFilled || isHalf) && (
            <span
              className={cn(
                'absolute inset-0 overflow-hidden',
                isHalf && 'w-1/2'
              )}
            >
              <Star
                className={cn(sizeConfig.star, 'text-amber-400')}
                fill="currentColor"
              />
            </span>
          )}
        </span>
      );
    }

    return stars;
  };

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex items-center gap-0.5">{renderStars()}</div>
      {showValue && (
        <span className={cn('font-medium text-chrome-300', sizeConfig.text)}>
          {value.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className={cn('text-chrome-400', sizeConfig.text)}>
          ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
};

export interface RatingInputProps {
  value: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

const RatingInput: React.FC<RatingInputProps> = ({
  value,
  onChange,
  size = 'md',
  disabled = false,
  className,
}) => {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);

  const sizes = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const displayValue = hoverValue ?? value;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => !disabled && onChange(rating)}
          onMouseEnter={() => !disabled && setHoverValue(rating)}
          onMouseLeave={() => setHoverValue(null)}
          disabled={disabled}
          className={cn(
            'transition-colors',
            disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'
          )}
          aria-label={`Rate ${rating} out of 5`}
        >
          <Star
            className={cn(
              sizes[size],
              rating <= displayValue ? 'text-amber-400' : 'text-chrome-600'
            )}
            fill="currentColor"
          />
        </button>
      ))}
    </div>
  );
};

export { Rating, RatingInput };
