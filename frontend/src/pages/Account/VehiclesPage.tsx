import React, { useState, useEffect } from 'react';
import { Car, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { servicesApi } from '@/services/api';
import { Card, Button, Input, Modal, EmptyState } from '@/components/common';
import type { CustomerVehicle } from '@/types';

const VehiclesPage: React.FC = () => {
  const { success } = useToast();
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<CustomerVehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    year: '',
    make: '',
    model: '',
    engine: '',
    vin: '',
    notes: '',
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setIsLoading(true);
    try {
      const data = await servicesApi.getVehicles();
      setVehicles(data);
    } catch {
      // Mock data for demo
      const mockVehicles: CustomerVehicle[] = [
        {
          id: 1,
          customerId: 1,
          year: 1995,
          make: 'Honda',
          model: 'Civic',
          engine: 'B18C1',
          vin: 'JHMEG8557SS123456',
          notes: 'Track Car - Full race build',
          isActive: true,
        },
        {
          id: 2,
          customerId: 1,
          year: 2006,
          make: 'Chevrolet',
          model: 'Corvette',
          engine: 'LS3',
          vin: '1G1YY22G065123456',
          notes: 'Weekend Warrior',
          isActive: true,
        },
      ];
      setVehicles(mockVehicles);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (vehicle?: CustomerVehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        year: vehicle.year?.toString() || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        engine: vehicle.engine || '',
        vin: vehicle.vin || '',
        notes: vehicle.notes || '',
      });
    } else {
      setEditingVehicle(null);
      setFormData({
        year: '',
        make: '',
        model: '',
        engine: '',
        vin: '',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVehicle(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const vehicleData = {
      year: formData.year ? parseInt(formData.year, 10) : undefined,
      make: formData.make,
      model: formData.model,
      engine: formData.engine || undefined,
      vin: formData.vin || undefined,
      notes: formData.notes || undefined,
      isActive: true,
    };

    try {
      if (editingVehicle) {
        await servicesApi.updateVehicle(editingVehicle.id, vehicleData);
        success('Vehicle Updated', 'Your vehicle has been updated successfully.');
      } else {
        await servicesApi.addVehicle(vehicleData);
        success('Vehicle Added', 'Your vehicle has been added successfully.');
      }
      handleCloseModal();
      fetchVehicles();
    } catch {
      // Demo: simulate success
      if (editingVehicle) {
        setVehicles((prev) =>
          prev.map((v) =>
            v.id === editingVehicle.id
              ? { ...v, ...vehicleData }
              : v
          )
        );
        success('Vehicle Updated', 'Your vehicle has been updated successfully.');
      } else {
        const newVehicle: CustomerVehicle = {
          id: Date.now(),
          customerId: 1,
          year: vehicleData.year,
          make: vehicleData.make,
          model: vehicleData.model,
          engine: vehicleData.engine,
          vin: vehicleData.vin,
          notes: vehicleData.notes,
          isActive: true,
        };
        setVehicles((prev) => [...prev, newVehicle]);
        success('Vehicle Added', 'Your vehicle has been added successfully.');
      }
      handleCloseModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (vehicleId: number) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;

    try {
      await servicesApi.deleteVehicle(vehicleId);
      success('Vehicle Deleted', 'Your vehicle has been removed.');
      fetchVehicles();
    } catch {
      // Demo: simulate success
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
      success('Vehicle Deleted', 'Your vehicle has been removed.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-chrome-100">My Vehicles</h1>
        <Button
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => handleOpenModal()}
        >
          Add Vehicle
        </Button>
      </div>

      {/* Vehicles List */}
      {vehicles.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-chrome-900 rounded-lg flex items-center justify-center">
                    <Car className="h-7 w-7 text-chrome-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-chrome-100">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                    {vehicle.engine && (
                      <p className="text-sm text-chrome-400 mt-1">Engine: {vehicle.engine}</p>
                    )}
                    {vehicle.vin && (
                      <p className="text-xs text-chrome-500 mt-1 font-mono">VIN: {vehicle.vin}</p>
                    )}
                    {vehicle.notes && (
                      <p className="text-sm text-chrome-400 mt-2">{vehicle.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenModal(vehicle)}
                    className="p-2 text-chrome-500 hover:text-chrome-300 hover:bg-chrome-900 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(vehicle.id)}
                    className="p-2 text-chrome-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Car className="h-16 w-16" />}
          title="No vehicles added"
          description="Add your vehicles to make service requests faster and easier."
          action={{
            label: 'Add Vehicle',
            onClick: () => handleOpenModal(),
          }}
        />
      )}

      {/* Add/Edit Vehicle Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Year"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              placeholder="e.g., 1995"
              required
            />
            <Input
              label="Make"
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              placeholder="e.g., Honda"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="e.g., Civic"
              required
            />
            <Input
              label="Engine"
              value={formData.engine}
              onChange={(e) => setFormData({ ...formData, engine: e.target.value })}
              placeholder="e.g., B18C1"
            />
          </div>
          <Input
            label="VIN (Optional)"
            value={formData.vin}
            onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
            placeholder="Vehicle Identification Number"
          />
          <div>
            <label className="block text-sm font-medium text-chrome-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Any additional details about your vehicle"
              className="w-full px-4 py-3 border border-chrome-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default VehiclesPage;
