import React from 'react';
import { cn } from '@/utils/cn';
import { Minus, Plus } from 'lucide-react';

export interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  value,
  onChange,
  min = 1,
  max = 99,
  size = 'md',
  disabled = false,
  className,
}) => {
  const sizes = {
    sm: {
      button: 'h-7 w-7',
      input: 'h-7 w-10 text-sm',
      icon: 'h-3 w-3',
    },
    md: {
      button: 'h-9 w-9',
      input: 'h-9 w-12 text-base',
      icon: 'h-4 w-4',
    },
    lg: {
      button: 'h-11 w-11',
      input: 'h-11 w-14 text-lg',
      icon: 'h-5 w-5',
    },
  };

  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue)) {
      onChange(Math.max(min, Math.min(max, newValue)));
    }
  };

  const sizeConfig = sizes[size];

  return (
    <div className={cn('flex items-center', className)}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className={cn(
          'flex items-center justify-center rounded-l-lg border border-r-0 border-chrome-600',
          'bg-chrome-900 text-chrome-300 hover:bg-chrome-800',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-chrome-900',
          'transition-colors',
          sizeConfig.button
        )}
        aria-label="Decrease quantity"
      >
        <Minus className={sizeConfig.icon} />
      </button>
      <input
        type="number"
        value={value}
        onChange={handleInputChange}
        disabled={disabled}
        min={min}
        max={max}
        className={cn(
          'border-y border-chrome-600 text-center font-medium text-chrome-100',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          'disabled:bg-chrome-900 disabled:text-chrome-400',
          '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
          sizeConfig.input
        )}
        aria-label="Quantity"
      />
      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        className={cn(
          'flex items-center justify-center rounded-r-lg border border-l-0 border-chrome-600',
          'bg-chrome-900 text-chrome-300 hover:bg-chrome-800',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-chrome-900',
          'transition-colors',
          sizeConfig.button
        )}
        aria-label="Increase quantity"
      >
        <Plus className={sizeConfig.icon} />
      </button>
    </div>
  );
};

export default QuantitySelector;
