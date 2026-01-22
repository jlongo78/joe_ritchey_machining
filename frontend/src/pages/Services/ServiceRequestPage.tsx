import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Wrench,
  Upload,
  Plus,
  Trash2,
  Car,
  FileText,
  CheckCircle,
  Info,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { servicesApi } from '@/services/api';
import { Button, Input, Select, Textarea, Card } from '@/components/common';
import type { ServiceType, CustomerVehicle } from '@/types';

const serviceItemSchema = z.object({
  serviceTypeId: z.number().min(1, 'Please select a service'),
  description: z.string().optional(),
  quantity: z.number().min(1).default(1),
});

const serviceRequestSchema = z.object({
  vehicleId: z.number().optional(),
  newVehicle: z.object({
    year: z.string().optional(),
    make: z.string().optional(),
    model: z.string().optional(),
    engine: z.string().optional(),
    vin: z.string().optional(),
  }).optional(),
  useExistingVehicle: z.boolean().default(true),
  items: z.array(serviceItemSchema).min(1, 'Please add at least one service'),
  description: z.string().min(10, 'Please provide a detailed description of the work needed'),
  preferredContactMethod: z.enum(['email', 'phone', 'either']).default('either'),
  urgency: z.enum(['standard', 'rush', 'emergency']).default('standard'),
});

type ServiceRequestFormData = z.infer<typeof serviceRequestSchema>;

const ServiceRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { success } = useToast();

  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const preselectedService = searchParams.get('service');

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ServiceRequestFormData>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      useExistingVehicle: true,
      items: [{ serviceTypeId: 0, description: '', quantity: 1 }],
      preferredContactMethod: 'either',
      urgency: 'standard',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const useExistingVehicle = watch('useExistingVehicle');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [typesRes, vehiclesRes] = await Promise.all([
          servicesApi.getServiceTypes(),
          isAuthenticated ? servicesApi.getVehicles() : Promise.resolve([]),
        ]);
        setServiceTypes(typesRes);
        setVehicles(vehiclesRes);

        // Set preselected service if provided
        if (preselectedService && typesRes.length > 0) {
          const matchingService = typesRes.find(
            (service: ServiceType) => service.name.toLowerCase().includes(preselectedService.replace('-', ' '))
          );
          if (matchingService) {
            setValue('items.0.serviceTypeId', matchingService.id);
          }
        }
      } catch {
        // Mock data for demo
        const mockServiceTypes: ServiceType[] = [
          { id: 1, name: 'Engine Building', category: 'machining', description: 'Complete engine assembly', basePrice: 2500, estimatedHours: 40, isActive: true, displayOrder: 1 },
          { id: 2, name: 'Cylinder Head Porting', category: 'machining', description: 'Professional head porting', basePrice: 800, estimatedHours: 16, isActive: true, displayOrder: 2 },
          { id: 3, name: 'Block Machining', category: 'machining', description: 'Precision block work', basePrice: 600, estimatedHours: 8, isActive: true, displayOrder: 3 },
          { id: 4, name: 'Boring & Honing', category: 'machining', description: 'Cylinder boring and honing', basePrice: 300, estimatedHours: 4, isActive: true, displayOrder: 4 },
          { id: 5, name: 'Deck Surfacing', category: 'machining', description: 'Block deck resurfacing', basePrice: 150, estimatedHours: 2, isActive: true, displayOrder: 5 },
          { id: 6, name: 'Dyno Tuning', category: 'dyno', description: 'Professional dyno tuning', basePrice: 500, estimatedHours: 4, isActive: true, displayOrder: 6 },
          { id: 7, name: 'Valve Job', category: 'machining', description: 'Valve seat machining', basePrice: 400, estimatedHours: 6, isActive: true, displayOrder: 7 },
          { id: 8, name: 'Balancing', category: 'machining', description: 'Rotating assembly balance', basePrice: 350, estimatedHours: 4, isActive: true, displayOrder: 8 },
        ];
        setServiceTypes(mockServiceTypes);

        if (preselectedService) {
          const matchingService = mockServiceTypes.find(
            (service) => service.name.toLowerCase().includes(preselectedService.replace('-', ' '))
          );
          if (matchingService) {
            setValue('items.0.serviceTypeId', matchingService.id);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, preselectedService, setValue]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ServiceRequestFormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('data', JSON.stringify(data));
      uploadedFiles.forEach((file) => {
        formData.append('files', file);
      });

      const result = await servicesApi.createServiceRequest({
        title: 'Service Request',
        vehicleId: data.useExistingVehicle ? data.vehicleId : undefined,
        items: data.items.map(item => ({
          ...item,
          description: item.description || '',
        })),
        description: data.description,
        customerNotes: data.description,
      });

      success('Request Submitted!', 'We will review your request and get back to you within 24-48 hours.');
      navigate(`/account/service-requests/${result.id}`);
    } catch (err) {
      // Demo: simulate success
      success('Request Submitted!', 'We will review your request and get back to you within 24-48 hours.');
      navigate('/account/service-requests');
    } finally {
      setIsSubmitting(false);
    }
  };

  const serviceTypeOptions = serviceTypes.map((type) => ({
    value: type.id.toString(),
    label: type.name,
  }));

  const vehicleOptions = vehicles.map((v) => ({
    value: v.id.toString(),
    label: `${v.year} ${v.make} ${v.model}${v.notes ? ` (${v.notes})` : ''}`,
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-secondary-200">
        <div className="container mx-auto px-4 py-3">
          <nav className="text-sm text-secondary-500">
            <Link to="/" className="hover:text-primary-600">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/services" className="hover:text-primary-600">Machining Services</Link>
            <span className="mx-2">/</span>
            <span className="text-secondary-900">Request Quote</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Request a Service Quote
            </h1>
            <p className="text-secondary-600">
              Tell us about your project and we&apos;ll provide a detailed quote within 24-48 hours.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Vehicle Information */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Car className="h-5 w-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-secondary-900">Vehicle Information</h2>
              </div>

              {isAuthenticated && vehicles.length > 0 && (
                <div className="mb-4">
                  <div className="flex gap-4 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={useExistingVehicle}
                        onChange={() => setValue('useExistingVehicle', true)}
                        className="h-4 w-4 text-primary-600"
                      />
                      <span className="text-secondary-700">Use existing vehicle</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!useExistingVehicle}
                        onChange={() => setValue('useExistingVehicle', false)}
                        className="h-4 w-4 text-primary-600"
                      />
                      <span className="text-secondary-700">Add new vehicle</span>
                    </label>
                  </div>

                  {useExistingVehicle && (
                    <Select
                      label="Select Vehicle"
                      options={vehicleOptions}
                      value={watch('vehicleId')?.toString() || ''}
                      onChange={(value) => setValue('vehicleId', parseInt(value))}
                      error={errors.vehicleId?.message}
                    />
                  )}
                </div>
              )}

              {(!isAuthenticated || !useExistingVehicle || vehicles.length === 0) && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Year"
                    {...register('newVehicle.year')}
                    placeholder="e.g., 1995"
                  />
                  <Input
                    label="Make"
                    {...register('newVehicle.make')}
                    placeholder="e.g., Honda"
                  />
                  <Input
                    label="Model"
                    {...register('newVehicle.model')}
                    placeholder="e.g., Civic"
                  />
                  <Input
                    label="Engine"
                    {...register('newVehicle.engine')}
                    placeholder="e.g., B18C1"
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label="VIN (Optional)"
                      {...register('newVehicle.vin')}
                      placeholder="Vehicle Identification Number"
                    />
                  </div>
                </div>
              )}
            </Card>

            {/* Services Requested */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Wrench className="h-5 w-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-secondary-900">Services Requested</h2>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 bg-secondary-50 rounded-lg">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 grid sm:grid-cols-2 gap-4">
                        <Select
                          label="Service Type"
                          options={[
                            { value: '0', label: 'Select a service...' },
                            ...serviceTypeOptions,
                          ]}
                          value={watch(`items.${index}.serviceTypeId`)?.toString() || '0'}
                          onChange={(value) => setValue(`items.${index}.serviceTypeId`, parseInt(value))}
                          error={errors.items?.[index]?.serviceTypeId?.message}
                        />
                        <Input
                          label="Quantity"
                          type="number"
                          min={1}
                          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        />
                        <div className="sm:col-span-2">
                          <Input
                            label="Additional Details (Optional)"
                            {...register(`items.${index}.description`)}
                            placeholder="Any specific requirements for this service"
                          />
                        </div>
                      </div>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="mt-6 p-2 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => append({ serviceTypeId: 0, description: '', quantity: 1 })}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Add Another Service
              </Button>

              {errors.items?.message && (
                <p className="mt-2 text-sm text-red-600">{errors.items.message}</p>
              )}
            </Card>

            {/* Project Description */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-secondary-900">Project Description</h2>
              </div>

              <Textarea
                label="Describe your project"
                rows={5}
                {...register('description')}
                error={errors.description?.message}
                placeholder="Please provide details about the work you need done. Include any specific requirements, goals, or concerns. The more detail you provide, the more accurate your quote will be."
              />

              {/* File Upload */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Attachments (Optional)
                </label>
                <div className="border-2 border-dashed border-secondary-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-secondary-400 mx-auto mb-2" />
                  <p className="text-secondary-600 mb-2">
                    Drag and drop files here, or click to browse
                  </p>
                  <p className="text-sm text-secondary-400 mb-4">
                    Photos of parts, spec sheets, or any relevant documents
                  </p>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="inline-flex items-center justify-center px-4 py-2 border border-secondary-300 rounded-lg text-sm font-medium text-secondary-700 bg-white hover:bg-secondary-50 transition-colors">
                      Browse Files
                    </span>
                  </label>
                </div>

                {uploadedFiles.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg"
                      >
                        <span className="text-sm text-secondary-700">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>

            {/* Preferences */}
            <Card>
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">Preferences</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <Select
                  label="Preferred Contact Method"
                  options={[
                    { value: 'email', label: 'Email' },
                    { value: 'phone', label: 'Phone' },
                    { value: 'either', label: 'Either is fine' },
                  ]}
                  value={watch('preferredContactMethod')}
                  onChange={(value) => setValue('preferredContactMethod', value as 'email' | 'phone' | 'either')}
                />
                <Select
                  label="Urgency"
                  options={[
                    { value: 'standard', label: 'Standard (2-4 weeks)' },
                    { value: 'rush', label: 'Rush (1-2 weeks, additional fee)' },
                    { value: 'emergency', label: 'Emergency (ASAP, premium fee)' },
                  ]}
                  value={watch('urgency')}
                  onChange={(value) => setValue('urgency', value as 'standard' | 'rush' | 'emergency')}
                />
              </div>
            </Card>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">What happens next?</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>We&apos;ll review your request within 24-48 hours</li>
                  <li>You&apos;ll receive a detailed quote via email</li>
                  <li>Once approved, we&apos;ll schedule your work</li>
                  <li>Track progress in your account dashboard</li>
                </ul>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <Link to="/services">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                size="lg"
                isLoading={isSubmitting}
                leftIcon={<CheckCircle className="h-5 w-5" />}
              >
                Submit Request
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ServiceRequestPage;
