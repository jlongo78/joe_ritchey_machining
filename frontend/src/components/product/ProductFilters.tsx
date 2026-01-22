import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { ChevronDown, X, Filter } from 'lucide-react';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import type { Category, Brand, ProductFilters as ProductFiltersType } from '@/types';

export interface ProductFiltersProps {
  categories: Category[];
  brands: Brand[];
  filters: ProductFiltersType;
  onFilterChange: (filters: ProductFiltersType) => void;
  onClearFilters: () => void;
  className?: string;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  brands,
  filters,
  onFilterChange,
  onClearFilters,
  className,
}) => {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'categories',
    'brands',
    'price',
  ]);
  const [minPrice, setMinPrice] = useState(filters.minPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice?.toString() || '');

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const handleCategoryChange = (categoryId: number) => {
    onFilterChange({
      ...filters,
      categoryId: filters.categoryId === categoryId ? undefined : categoryId,
      page: 1,
    });
  };

  const handleBrandChange = (brandId: number) => {
    onFilterChange({
      ...filters,
      brandId: filters.brandId === brandId ? undefined : brandId,
      page: 1,
    });
  };

  const handlePriceApply = () => {
    onFilterChange({
      ...filters,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      page: 1,
    });
  };

  const handleInStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      inStock: e.target.checked || undefined,
      page: 1,
    });
  };

  const activeFiltersCount =
    (filters.categoryId ? 1 : 0) +
    (filters.brandId ? 1 : 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.inStock ? 1 : 0);

  useEffect(() => {
    setMinPrice(filters.minPrice?.toString() || '');
    setMaxPrice(filters.maxPrice?.toString() || '');
  }, [filters.minPrice, filters.maxPrice]);

  return (
    <div className={cn('bg-white rounded-xl border border-secondary-200', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-secondary-200">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-secondary-600" />
          <h3 className="font-semibold text-secondary-900">Filters</h3>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <button
            onClick={onClearFilters}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="border-b border-secondary-200">
        <button
          onClick={() => toggleSection('categories')}
          className="flex items-center justify-between w-full p-4 text-left"
        >
          <span className="font-medium text-secondary-900">Categories</span>
          <ChevronDown
            className={cn(
              'h-5 w-5 text-secondary-400 transition-transform',
              expandedSections.includes('categories') && 'rotate-180'
            )}
          />
        </button>
        {expandedSections.includes('categories') && (
          <div className="px-4 pb-4 space-y-2">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={filters.categoryId === category.id}
                  onChange={() => handleCategoryChange(category.id)}
                  className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-secondary-700 group-hover:text-secondary-900">
                  {category.name}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Brands */}
      <div className="border-b border-secondary-200">
        <button
          onClick={() => toggleSection('brands')}
          className="flex items-center justify-between w-full p-4 text-left"
        >
          <span className="font-medium text-secondary-900">Brands</span>
          <ChevronDown
            className={cn(
              'h-5 w-5 text-secondary-400 transition-transform',
              expandedSections.includes('brands') && 'rotate-180'
            )}
          />
        </button>
        {expandedSections.includes('brands') && (
          <div className="px-4 pb-4 space-y-2 max-h-60 overflow-y-auto">
            {brands.map((brand) => (
              <label
                key={brand.id}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={filters.brandId === brand.id}
                  onChange={() => handleBrandChange(brand.id)}
                  className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-secondary-700 group-hover:text-secondary-900">
                  {brand.name}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="border-b border-secondary-200">
        <button
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between w-full p-4 text-left"
        >
          <span className="font-medium text-secondary-900">Price Range</span>
          <ChevronDown
            className={cn(
              'h-5 w-5 text-secondary-400 transition-transform',
              expandedSections.includes('price') && 'rotate-180'
            )}
          />
        </button>
        {expandedSections.includes('price') && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="text-sm"
              />
              <span className="text-secondary-400">-</span>
              <Input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="text-sm"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handlePriceApply} className="w-full">
              Apply
            </Button>
          </div>
        )}
      </div>

      {/* In Stock */}
      <div className="p-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.inStock || false}
            onChange={handleInStockChange}
            className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-secondary-700">In Stock Only</span>
        </label>
      </div>
    </div>
  );
};

export default ProductFilters;
