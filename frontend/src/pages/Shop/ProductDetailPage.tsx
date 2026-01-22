import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShoppingCart,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Truck,
  Shield,
  RotateCcw,
  Check,
  Minus,
  Plus,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/utils/formatters';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { productsApi } from '@/services/api';
import { Button, Badge, PageLoading, QuantitySelector } from '@/components/common';
import { Rating } from '@/components/common/Rating';
import type { Product } from '@/types';

const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCart();
  const { success, error } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      setIsLoading(true);
      try {
        const data = await productsApi.getProductBySlug(slug);
        setProduct(data);
      } catch (err) {
        console.error('Failed to fetch product:', err);
        // Mock data
        setProduct({
          id: 1,
          sku: 'TRB-001',
          name: 'Garrett GTX3582R Gen II Turbocharger',
          slug: 'garrett-gtx3582r-gen-ii',
          shortDescription: 'High-performance ball bearing turbocharger for serious power builds.',
          description: `<p>The Garrett GTX3582R Gen II turbocharger represents the pinnacle of turbocharger technology. Featuring advanced aerodynamics and precision ball bearings, this unit delivers exceptional performance and reliability.</p>
          <p>Key Features:</p>
          <ul>
            <li>Dual ball bearing CHRA for improved response and durability</li>
            <li>GTX compressor wheel with next-gen aerodynamics</li>
            <li>82mm inducer compressor wheel</li>
            <li>Power range: 550-750+ HP</li>
            <li>Includes T3 stainless divided inlet turbine housing</li>
          </ul>`,
          retailPrice: 1899.99,
          salePrice: 1699.99,
          baseCost: 1200,
          isNew: true,
          isFeatured: true,
          isActive: true,
          yearStart: 1990,
          yearEnd: 2024,
          make: 'Universal',
          images: [
            { id: 1, productId: 1, imageUrl: 'https://placehold.co/600x600/1e293b/ef4444?text=Turbo+Front', isPrimary: true, displayOrder: 0, altText: 'Front view' },
            { id: 2, productId: 1, imageUrl: 'https://placehold.co/600x600/1e293b/ef4444?text=Turbo+Side', isPrimary: false, displayOrder: 1, altText: 'Side view' },
            { id: 3, productId: 1, imageUrl: 'https://placehold.co/600x600/1e293b/ef4444?text=Turbo+Back', isPrimary: false, displayOrder: 2, altText: 'Back view' },
          ],
          categories: [{ id: 1, name: 'Turbo & Superchargers', slug: 'turbo-supercharger', displayOrder: 1, isActive: true }],
          attributes: [
            { id: 1, productId: 1, attributeName: 'Compressor Inducer', attributeValue: '82mm', displayOrder: 1 },
            { id: 2, productId: 1, attributeName: 'Compressor Exducer', attributeValue: '110mm', displayOrder: 2 },
            { id: 3, productId: 1, attributeName: 'Turbine Wheel', attributeValue: '67mm', displayOrder: 3 },
            { id: 4, productId: 1, attributeName: 'Bearing Type', attributeValue: 'Dual Ball Bearing', displayOrder: 4 },
            { id: 5, productId: 1, attributeName: 'HP Range', attributeValue: '550-750+ HP', displayOrder: 5 },
            { id: 6, productId: 1, attributeName: 'Inlet', attributeValue: 'T3 Divided', displayOrder: 6 },
          ],
          brand: { id: 1, name: 'Garrett', slug: 'garrett', isActive: true },
          inventory: { id: 1, productId: 1, quantityOnHand: 5, quantityReserved: 0, quantityAvailable: 5, reorderPoint: 2 },
          averageRating: 4.8,
          reviewCount: 24,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await addItem(product, quantity);
      success('Added to Cart', `${quantity} x ${product.name} added to your cart.`);
    } catch (err) {
      error('Error', 'Failed to add item to cart.');
    }
  };

  if (isLoading) {
    return <PageLoading message="Loading product..." />;
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-secondary-900 mb-4">Product Not Found</h1>
        <p className="text-secondary-500 mb-6">The product you&apos;re looking for doesn&apos;t exist.</p>
        <Link to="/shop">
          <Button>Back to Shop</Button>
        </Link>
      </div>
    );
  }

  const isOnSale = product.salePrice && product.salePrice < product.retailPrice;
  const currentPrice = product.salePrice || product.retailPrice;
  const isInStock = (product.inventory?.quantityAvailable || 0) > 0;
  const images = product.images.length > 0 ? product.images : [{ id: 0, productId: product.id, imageUrl: 'https://placehold.co/600x600/e2e8f0/64748b?text=No+Image', isPrimary: true, displayOrder: 0 }];

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-secondary-50 border-b border-secondary-200">
        <div className="container mx-auto px-4 py-3">
          <nav className="text-sm text-secondary-500">
            <Link to="/" className="hover:text-primary-600">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/shop" className="hover:text-primary-600">Parts Shop</Link>
            {product.categories[0] && (
              <>
                <span className="mx-2">/</span>
                <Link to={`/shop/categories/${product.categories[0].slug}`} className="hover:text-primary-600">
                  {product.categories[0].name}
                </Link>
              </>
            )}
            <span className="mx-2">/</span>
            <span className="text-secondary-900">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div>
            {/* Main Image */}
            <div className="relative aspect-square bg-secondary-100 rounded-xl overflow-hidden mb-4">
              <img
                src={images[selectedImageIndex].imageUrl}
                alt={images[selectedImageIndex].altText || product.name}
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md hover:bg-white"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md hover:bg-white"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {isOnSale && <Badge variant="danger">Sale</Badge>}
                {product.isNew && <Badge variant="info">New</Badge>}
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={cn(
                      'flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors',
                      selectedImageIndex === index
                        ? 'border-primary-500'
                        : 'border-transparent hover:border-secondary-300'
                    )}
                  >
                    <img
                      src={image.imageUrl}
                      alt={image.altText || `${product.name} thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {/* Brand & Title */}
            {product.brand && (
              <Link
                to={`/shop/brands/${product.brand.slug}`}
                className="text-sm font-medium text-primary-600 hover:text-primary-700 uppercase tracking-wider"
              >
                {product.brand.name}
              </Link>
            )}
            <h1 className="text-3xl font-bold text-secondary-900 mt-2 mb-4">
              {product.name}
            </h1>

            {/* Rating */}
            {product.averageRating !== undefined && (
              <div className="mb-4">
                <Rating
                  value={product.averageRating}
                  showValue
                  reviewCount={product.reviewCount}
                />
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-primary-600">
                {formatPrice(currentPrice)}
              </span>
              {isOnSale && (
                <>
                  <span className="text-xl text-secondary-400 line-through">
                    {formatPrice(product.retailPrice)}
                  </span>
                  <Badge variant="danger">
                    Save {Math.round(((product.retailPrice - (product.salePrice || 0)) / product.retailPrice) * 100)}%
                  </Badge>
                </>
              )}
            </div>

            {/* Short Description */}
            {product.shortDescription && (
              <p className="text-secondary-600 mb-6">{product.shortDescription}</p>
            )}

            {/* Stock Status */}
            <div className="flex items-center gap-2 mb-6">
              {isInStock ? (
                <>
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-green-600 font-medium">In Stock</span>
                  <span className="text-secondary-400">
                    ({product.inventory?.quantityAvailable} available)
                  </span>
                </>
              ) : (
                <span className="text-red-600 font-medium">Out of Stock</span>
              )}
            </div>

            {/* Quantity & Add to Cart */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-secondary-600">Qty:</span>
                <QuantitySelector
                  value={quantity}
                  onChange={setQuantity}
                  min={1}
                  max={product.inventory?.quantityAvailable || 10}
                />
              </div>
              <Button
                size="lg"
                className="flex-1"
                onClick={handleAddToCart}
                disabled={!isInStock}
                leftIcon={<ShoppingCart className="h-5 w-5" />}
              >
                {isInStock ? 'Add to Cart' : 'Out of Stock'}
              </Button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 mb-8">
              <button className="flex items-center gap-2 text-secondary-600 hover:text-primary-600">
                <Heart className="h-5 w-5" />
                Add to Wishlist
              </button>
              <button className="flex items-center gap-2 text-secondary-600 hover:text-primary-600">
                <Share2 className="h-5 w-5" />
                Share
              </button>
            </div>

            {/* Benefits */}
            <div className="border-t border-secondary-200 pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-primary-600" />
                <span className="text-secondary-700">Free shipping on orders over $99</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary-600" />
                <span className="text-secondary-700">Manufacturer warranty included</span>
              </div>
              <div className="flex items-center gap-3">
                <RotateCcw className="h-5 w-5 text-primary-600" />
                <span className="text-secondary-700">30-day hassle-free returns</span>
              </div>
            </div>

            {/* SKU */}
            <div className="mt-6 text-sm text-secondary-500">
              SKU: {product.sku}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <div className="border-b border-secondary-200">
            <nav className="flex gap-8">
              {[
                { key: 'description', label: 'Description' },
                { key: 'specs', label: 'Specifications' },
                { key: 'reviews', label: `Reviews (${product.reviewCount || 0})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={cn(
                    'py-4 font-medium border-b-2 transition-colors',
                    activeTab === tab.key
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="py-8">
            {activeTab === 'description' && product.description && (
              <div
                className="prose max-w-none text-secondary-700"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            )}

            {activeTab === 'specs' && product.attributes.length > 0 && (
              <div className="max-w-2xl">
                <table className="w-full">
                  <tbody>
                    {product.attributes.map((attr, index) => (
                      <tr
                        key={attr.id}
                        className={cn(index % 2 === 0 ? 'bg-secondary-50' : '')}
                      >
                        <td className="py-3 px-4 font-medium text-secondary-900">
                          {attr.attributeName}
                        </td>
                        <td className="py-3 px-4 text-secondary-600">
                          {attr.attributeValue}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="text-center py-8 text-secondary-500">
                Reviews coming soon...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
