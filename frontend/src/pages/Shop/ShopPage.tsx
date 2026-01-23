import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Grid, List, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { productsApi } from '@/services/api';
import { ProductCard, ProductFilters } from '@/components/product';
import { Button, Select, Pagination, PageLoading, EmptyState } from '@/components/common';
import type { Product, Category, Brand, ProductFilters as FiltersType, PaginatedResponse } from '@/types';

const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addItem } = useCart();
  const { success, error } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Parse filters from URL
  const filters: FiltersType = {
    categoryId: searchParams.get('category')
      ? parseInt(searchParams.get('category')!)
      : undefined,
    brandId: searchParams.get('brand')
      ? parseInt(searchParams.get('brand')!)
      : undefined,
    minPrice: searchParams.get('minPrice')
      ? parseFloat(searchParams.get('minPrice')!)
      : undefined,
    maxPrice: searchParams.get('maxPrice')
      ? parseFloat(searchParams.get('maxPrice')!)
      : undefined,
    inStock: searchParams.get('inStock') === 'true' || undefined,
    search: searchParams.get('q') || undefined,
    sortBy: (searchParams.get('sort') as FiltersType['sortBy']) || 'newest',
    page: parseInt(searchParams.get('page') || '1'),
    pageSize: 12,
  };

  // Update URL with filters
  const updateFilters = (newFilters: FiltersType) => {
    const params = new URLSearchParams();
    if (newFilters.categoryId) params.set('category', newFilters.categoryId.toString());
    if (newFilters.brandId) params.set('brand', newFilters.brandId.toString());
    if (newFilters.minPrice) params.set('minPrice', newFilters.minPrice.toString());
    if (newFilters.maxPrice) params.set('maxPrice', newFilters.maxPrice.toString());
    if (newFilters.inStock) params.set('inStock', 'true');
    if (newFilters.search) params.set('q', newFilters.search);
    if (newFilters.sortBy && newFilters.sortBy !== 'newest') params.set('sort', newFilters.sortBy);
    if (newFilters.page && newFilters.page > 1) params.set('page', newFilters.page.toString());
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  // Fetch products and filter options
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [productsRes, categoriesRes, brandsRes] = await Promise.all([
          productsApi.getProducts(filters),
          productsApi.getCategories(),
          productsApi.getBrands(),
        ]);

        setProducts(productsRes.items);
        setTotalPages(productsRes.totalPages);
        setTotalProducts(productsRes.total);
        setCategories(categoriesRes);
        setBrands(brandsRes);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        // Mock data for demo
        setProducts([
          {
            id: 1,
            sku: 'TRB-001',
            name: 'Garrett GTX3582R Gen II Turbocharger',
            slug: 'garrett-gtx3582r-gen-ii',
            shortDescription: 'High-performance ball bearing turbocharger for serious power builds.',
            baseCost: 1200,
            retailPrice: 1899.99,
            salePrice: 1699.99,
            isNew: true,
            isFeatured: true,
            isActive: true,
            images: [{ id: 1, productId: 1, imageUrl: '/images/turbo-1.jpg', isPrimary: true, displayOrder: 0 }],
            categories: [],
            attributes: [],
            brand: { id: 1, name: 'Garrett', slug: 'garrett', isActive: true },
            inventory: { id: 1, productId: 1, quantityOnHand: 5, quantityReserved: 0, quantityAvailable: 5, reorderPoint: 2 },
            averageRating: 4.8,
            reviewCount: 24,
          },
          {
            id: 2,
            sku: 'INT-002',
            name: 'Skunk2 Ultra Race Intake Manifold',
            slug: 'skunk2-ultra-race-intake',
            shortDescription: 'Race-proven intake manifold for Honda B-series engines.',
            baseCost: 600,
            retailPrice: 899.99,
            isNew: false,
            isFeatured: true,
            isActive: true,
            images: [{ id: 2, productId: 2, imageUrl: '/images/intake-1.jpg', isPrimary: true, displayOrder: 0 }],
            categories: [],
            attributes: [],
            brand: { id: 2, name: 'Skunk2', slug: 'skunk2', isActive: true },
            inventory: { id: 2, productId: 2, quantityOnHand: 12, quantityReserved: 0, quantityAvailable: 12, reorderPoint: 3 },
            averageRating: 4.9,
            reviewCount: 47,
          },
          {
            id: 3,
            sku: 'EXH-003',
            name: 'Borla S-Type Cat-Back Exhaust System',
            slug: 'borla-s-type-catback',
            shortDescription: 'Premium stainless steel cat-back exhaust with aggressive sound.',
            baseCost: 850,
            retailPrice: 1299.99,
            isNew: false,
            isFeatured: false,
            isActive: true,
            images: [{ id: 3, productId: 3, imageUrl: '/images/exhaust-1.jpg', isPrimary: true, displayOrder: 0 }],
            categories: [],
            attributes: [],
            brand: { id: 3, name: 'Borla', slug: 'borla', isActive: true },
            inventory: { id: 3, productId: 3, quantityOnHand: 8, quantityReserved: 0, quantityAvailable: 8, reorderPoint: 2 },
            averageRating: 4.7,
            reviewCount: 31,
          },
        ]);
        setCategories([
          { id: 1, name: 'Engine Parts', slug: 'engine-parts', displayOrder: 1, isActive: true },
          { id: 2, name: 'Turbo & Superchargers', slug: 'turbo-supercharger', displayOrder: 2, isActive: true },
          { id: 3, name: 'Exhaust Systems', slug: 'exhaust', displayOrder: 3, isActive: true },
          { id: 4, name: 'Suspension', slug: 'suspension', displayOrder: 4, isActive: true },
        ]);
        setBrands([
          { id: 1, name: 'Garrett', slug: 'garrett', isActive: true },
          { id: 2, name: 'Skunk2', slug: 'skunk2', isActive: true },
          { id: 3, name: 'Borla', slug: 'borla', isActive: true },
          { id: 4, name: 'KW Suspension', slug: 'kw-suspension', isActive: true },
        ]);
        setTotalPages(1);
        setTotalProducts(3);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  const handleAddToCart = async (product: Product) => {
    try {
      await addItem(product, 1);
      success('Added to Cart', `${product.name} has been added to your cart.`);
    } catch (err) {
      error('Error', 'Failed to add item to cart. Please try again.');
    }
  };

  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'name', label: 'Name A-Z' },
    { value: 'rating', label: 'Highest Rated' },
  ];

  if (isLoading) {
    return <PageLoading message="Loading products..." />;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Breadcrumb */}
      <div className="bg-chrome-900 border-b border-chrome-700">
        <div className="container mx-auto px-4 py-3">
          <nav className="text-sm text-chrome-400">
            <Link to="/" className="hover:text-primary-600">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-chrome-100">Parts Shop</span>
            {filters.search && (
              <>
                <span className="mx-2">/</span>
                <span className="text-chrome-100">Search: &quot;{filters.search}&quot;</span>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <ProductFilters
              categories={categories}
              brands={brands}
              filters={filters}
              onFilterChange={updateFilters}
              onClearFilters={clearFilters}
            />
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-chrome-100">
                  {filters.search ? `Search Results for "${filters.search}"` : 'Performance Parts'}
                </h1>
                <p className="text-chrome-400 mt-1">
                  {totalProducts} {totalProducts === 1 ? 'product' : 'products'} found
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Mobile Filter Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden"
                  leftIcon={<SlidersHorizontal className="h-4 w-4" />}
                  onClick={() => setShowMobileFilters(true)}
                >
                  Filters
                </Button>

                {/* Sort */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-chrome-400 hidden sm:inline">Sort by:</span>
                  <Select
                    options={sortOptions}
                    value={filters.sortBy || 'newest'}
                    onChange={(value) => updateFilters({ ...filters, sortBy: value as FiltersType['sortBy'], page: 1 })}
                    className="w-40"
                  />
                </div>

                {/* View Mode */}
                <div className="hidden sm:flex items-center border border-chrome-600 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'p-1.5 rounded',
                      viewMode === 'grid'
                        ? 'bg-chrome-900 text-chrome-100'
                        : 'text-chrome-500 hover:text-chrome-300'
                    )}
                    aria-label="Grid view"
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'p-1.5 rounded',
                      viewMode === 'list'
                        ? 'bg-chrome-900 text-chrome-100'
                        : 'text-chrome-500 hover:text-chrome-300'
                    )}
                    aria-label="List view"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {products.length > 0 ? (
              <>
                <div
                  className={cn(
                    'grid gap-6',
                    viewMode === 'grid'
                      ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                      : 'grid-cols-1'
                  )}
                >
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <Pagination
                      currentPage={filters.page || 1}
                      totalPages={totalPages}
                      onPageChange={(page) => updateFilters({ ...filters, page })}
                    />
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                title="No products found"
                description="Try adjusting your filters or search criteria."
                action={{
                  label: 'Clear Filters',
                  onClick: clearFilters,
                }}
              />
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-chrome-900">
            <div className="flex items-center justify-between p-4 border-b border-chrome-700">
              <h2 className="font-semibold text-lg">Filters</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 text-chrome-400 hover:text-chrome-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto h-[calc(100%-60px)]">
              <ProductFilters
                categories={categories}
                brands={brands}
                filters={filters}
                onFilterChange={(newFilters) => {
                  updateFilters(newFilters);
                  setShowMobileFilters(false);
                }}
                onClearFilters={() => {
                  clearFilters();
                  setShowMobileFilters(false);
                }}
                className="border-0 rounded-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopPage;
