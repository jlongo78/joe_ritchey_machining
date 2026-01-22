import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { cn } from '@/utils/cn';
import {
  Search,
  Plus,
  Package,
  AlertTriangle,
  Filter,
  Download,
  Edit,
  Eye,
} from 'lucide-react';

interface InventoryItem {
  id: number;
  sku: string;
  name: string;
  category: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderPoint: number;
  unitCost: number;
  location: string;
  lastOrdered?: string;
}

const InventoryListPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStock, setFilterStock] = useState(searchParams.get('stock') || 'all');

  useEffect(() => {
    const loadInventory = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockItems: InventoryItem[] = [
        { id: 1, sku: 'SP-1234', name: 'Forged Pistons - SBC 350', category: 'Pistons', quantityOnHand: 24, quantityReserved: 8, quantityAvailable: 16, reorderPoint: 10, unitCost: 45, location: 'A-1-1' },
        { id: 2, sku: 'SP-2345', name: 'Performance Ring Set - SBC', category: 'Rings', quantityOnHand: 15, quantityReserved: 3, quantityAvailable: 12, reorderPoint: 8, unitCost: 120, location: 'A-1-2' },
        { id: 3, sku: 'BRG-001', name: 'Main Bearing Set - SBC', category: 'Bearings', quantityOnHand: 8, quantityReserved: 2, quantityAvailable: 6, reorderPoint: 10, unitCost: 85, location: 'A-2-1' },
        { id: 4, sku: 'BRG-002', name: 'Rod Bearing Set - SBC', category: 'Bearings', quantityOnHand: 3, quantityReserved: 1, quantityAvailable: 2, reorderPoint: 10, unitCost: 75, location: 'A-2-2' },
        { id: 5, sku: 'CAM-001', name: 'Performance Camshaft - SBC', category: 'Camshafts', quantityOnHand: 5, quantityReserved: 1, quantityAvailable: 4, reorderPoint: 3, unitCost: 280, location: 'B-1-1' },
        { id: 6, sku: 'GSK-001', name: 'Head Gasket Set - SBC', category: 'Gaskets', quantityOnHand: 12, quantityReserved: 0, quantityAvailable: 12, reorderPoint: 6, unitCost: 95, location: 'C-1-1' },
        { id: 7, sku: 'VLV-001', name: 'Intake Valve - SBC', category: 'Valves', quantityOnHand: 32, quantityReserved: 8, quantityAvailable: 24, reorderPoint: 16, unitCost: 12, location: 'C-2-1' },
        { id: 8, sku: 'VLV-002', name: 'Exhaust Valve - SBC', category: 'Valves', quantityOnHand: 28, quantityReserved: 8, quantityAvailable: 20, reorderPoint: 16, unitCost: 14, location: 'C-2-2' },
        { id: 9, sku: 'OIL-001', name: 'Assembly Lube - 8oz', category: 'Supplies', quantityOnHand: 2, quantityReserved: 0, quantityAvailable: 2, reorderPoint: 5, unitCost: 8, location: 'D-1-1' },
        { id: 10, sku: 'TIM-001', name: 'Timing Chain Set - SBC', category: 'Timing', quantityOnHand: 7, quantityReserved: 2, quantityAvailable: 5, reorderPoint: 4, unitCost: 65, location: 'B-2-1' },
      ];

      let filtered = mockItems;
      if (filterStock === 'low') {
        filtered = filtered.filter((i) => i.quantityAvailable <= i.reorderPoint);
      } else if (filterStock === 'out') {
        filtered = filtered.filter((i) => i.quantityAvailable === 0);
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (i) =>
            i.sku.toLowerCase().includes(query) ||
            i.name.toLowerCase().includes(query) ||
            i.category.toLowerCase().includes(query)
        );
      }

      setItems(filtered);
      setIsLoading(false);
    };

    loadInventory();
  }, [searchQuery, filterStock]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const lowStockCount = items.filter((i) => i.quantityAvailable <= i.reorderPoint && i.quantityAvailable > 0).length;
  const outOfStockCount = items.filter((i) => i.quantityAvailable === 0).length;
  const totalValue = items.reduce((sum, i) => sum + (i.quantityOnHand * i.unitCost), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventory</h1>
          <p className="text-chrome-400 mt-1">Manage parts and supplies</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-admin-bg-card hover:bg-admin-bg-hover border border-admin-border rounded-lg text-sm text-chrome-300 hover:text-white transition-colors">
            <Download size={18} />
            Export
          </button>
          <Link
            to="/admin/inventory/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-electric-500 hover:bg-electric-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={18} />
            Add Item
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-admin-bg-card border border-admin-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-electric-500/20">
              <Package size={20} className="text-electric-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{items.length}</p>
              <p className="text-sm text-chrome-400">Total SKUs</p>
            </div>
          </div>
        </div>
        <div className="bg-admin-bg-card border border-admin-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <AlertTriangle size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{lowStockCount}</p>
              <p className="text-sm text-chrome-400">Low Stock</p>
            </div>
          </div>
        </div>
        <div className="bg-admin-bg-card border border-admin-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <Package size={20} className="text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{outOfStockCount}</p>
              <p className="text-sm text-chrome-400">Out of Stock</p>
            </div>
          </div>
        </div>
        <div className="bg-admin-bg-card border border-admin-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Package size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalValue)}</p>
              <p className="text-sm text-chrome-400">Inventory Value</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-chrome-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by SKU, name, or category..."
            className="w-full pl-10 pr-4 py-2 bg-admin-bg-card rounded-lg border border-admin-border text-sm text-white placeholder-chrome-500 focus:outline-none focus:border-electric-500"
          />
        </div>
        <select
          value={filterStock}
          onChange={(e) => setFilterStock(e.target.value)}
          className="px-4 py-2 bg-admin-bg-card rounded-lg border border-admin-border text-sm text-white focus:outline-none focus:border-electric-500"
        >
          <option value="all">All Items</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-admin-bg-card border border-admin-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-admin-border">
              <th className="px-6 py-4 text-left text-xs font-semibold text-chrome-400 uppercase">SKU</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-chrome-400 uppercase">Name</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-chrome-400 uppercase">Category</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-chrome-400 uppercase">On Hand</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-chrome-400 uppercase">Available</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-chrome-400 uppercase">Reorder</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-chrome-400 uppercase">Unit Cost</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-chrome-400 uppercase">Location</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-chrome-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-border">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center">
                  <div className="w-6 h-6 border-2 border-electric-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-chrome-400">
                  No items found
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isLow = item.quantityAvailable <= item.reorderPoint && item.quantityAvailable > 0;
                const isOut = item.quantityAvailable === 0;

                return (
                  <tr
                    key={item.id}
                    className={cn(
                      'hover:bg-admin-bg-hover transition-colors',
                      isOut && 'bg-red-500/5',
                      isLow && !isOut && 'bg-amber-500/5'
                    )}
                  >
                    <td className="px-6 py-4">
                      <span className="text-electric-400 font-medium">{item.sku}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-chrome-400">{item.category}</td>
                    <td className="px-6 py-4 text-sm text-center text-chrome-300">{item.quantityOnHand}</td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          isOut ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-white'
                        )}
                      >
                        {item.quantityAvailable}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-chrome-500">{item.reorderPoint}</td>
                    <td className="px-6 py-4 text-sm text-right text-white">{formatCurrency(item.unitCost)}</td>
                    <td className="px-6 py-4 text-sm text-chrome-400">{item.location}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-2 text-chrome-400 hover:text-white hover:bg-admin-bg rounded-lg transition-colors">
                          <Eye size={16} />
                        </button>
                        <button className="p-2 text-chrome-400 hover:text-white hover:bg-admin-bg rounded-lg transition-colors">
                          <Edit size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryListPage;
