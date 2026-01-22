import React from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench,
  Gauge,
  Settings,
  Cog,
  ArrowRight,
  Phone,
  Clock,
  CheckCircle,
  Award,
} from 'lucide-react';
import { Button, Card } from '@/components/common';

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  slug: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  icon,
  title,
  description,
  features,
  slug,
}) => (
  <Card className="h-full hover:shadow-lg transition-shadow">
    <div className="flex flex-col h-full">
      <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-secondary-900 mb-2">{title}</h3>
      <p className="text-secondary-600 mb-4">{description}</p>
      <ul className="space-y-2 mb-6 flex-1">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-secondary-600">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Link to={`/services/request?service=${slug}`}>
        <Button variant="outline" className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
          Request Quote
        </Button>
      </Link>
    </div>
  </Card>
);

const ServicesPage: React.FC = () => {
  const services = [
    {
      icon: <Wrench className="h-7 w-7" />,
      title: 'Engine Building',
      description: 'Custom engine builds from mild street to full race applications.',
      features: [
        'Complete engine assembly',
        'Short block builds',
        'Long block builds',
        'Stroker kits installation',
        'Balanced rotating assemblies',
      ],
      slug: 'engine-building',
    },
    {
      icon: <Settings className="h-7 w-7" />,
      title: 'Cylinder Head Porting',
      description: 'Professional cylinder head porting for maximum airflow.',
      features: [
        'CNC porting',
        'Hand porting',
        'Valve jobs',
        'Flow bench testing',
        'Combustion chamber work',
      ],
      slug: 'cylinder-head-porting',
    },
    {
      icon: <Cog className="h-7 w-7" />,
      title: 'Block Machining',
      description: 'Precision engine block machining services.',
      features: [
        'Boring & honing',
        'Deck surfacing',
        'Line boring',
        'Cylinder sleeving',
        'Align honing',
      ],
      slug: 'block-machining',
    },
    {
      icon: <Gauge className="h-7 w-7" />,
      title: 'Dyno Tuning',
      description: 'Professional dyno tuning for optimal performance.',
      features: [
        'Baseline pulls',
        'Custom tuning',
        'Air/fuel optimization',
        'Power verification',
        'Data logging & analysis',
      ],
      slug: 'dyno-tuning',
    },
  ];

  const whyChooseUs = [
    {
      icon: <Award className="h-6 w-6" />,
      title: '30+ Years Experience',
      description: 'Decades of expertise in precision engine machining.',
    },
    {
      icon: <Settings className="h-6 w-6" />,
      title: 'State-of-the-Art Equipment',
      description: 'Latest CNC machines and measuring equipment.',
    },
    {
      icon: <CheckCircle className="h-6 w-6" />,
      title: 'Quality Guaranteed',
      description: 'Every job meets our strict quality standards.',
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: 'Quick Turnaround',
      description: 'Efficient service without sacrificing quality.',
    },
  ];

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-secondary-200">
        <div className="container mx-auto px-4 py-3">
          <nav className="text-sm text-secondary-500">
            <Link to="/" className="hover:text-primary-600">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-secondary-900">Machining Services</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-secondary-900 to-secondary-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Professional Engine Machining Services
            </h1>
            <p className="text-xl text-secondary-300 mb-8">
              From street performance to full race applications, our experienced machinists
              deliver precision work you can trust. Over 30 years of experience building
              winning engines.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/services/request">
                <Button size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
                  Request a Quote
                </Button>
              </Link>
              <a href="tel:+15551234567">
                <Button variant="outline" size="lg" leftIcon={<Phone className="h-5 w-5" />}>
                  Call (555) 123-4567
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-secondary-900 mb-4">Our Services</h2>
          <p className="text-secondary-600 max-w-2xl mx-auto">
            We offer a complete range of engine machining services, from basic machine work
            to complete engine builds. Every job receives the same attention to detail.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <ServiceCard key={service.slug} {...service} />
          ))}
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-secondary-900 mb-4">Why Choose Us</h2>
            <p className="text-secondary-600 max-w-2xl mx-auto">
              When you trust us with your engine, you&apos;re getting more than just machine work.
              You&apos;re getting decades of experience and a commitment to excellence.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChooseUs.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-secondary-900 mb-2">{item.title}</h3>
                <p className="text-sm text-secondary-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Process Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-secondary-900 mb-4">How It Works</h2>
          <p className="text-secondary-600 max-w-2xl mx-auto">
            Getting your engine work done with us is easy. Follow these simple steps to get started.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {[
            { step: 1, title: 'Submit Request', description: 'Fill out our service request form with your engine details and requirements.' },
            { step: 2, title: 'Get Quote', description: 'We&apos;ll review your request and provide a detailed quote within 24-48 hours.' },
            { step: 3, title: 'Drop Off Parts', description: 'Bring your engine or parts to our shop, or arrange for shipping.' },
            { step: 4, title: 'Track Progress', description: 'Monitor your job status online and receive updates along the way.' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="font-semibold text-secondary-900 mb-2">{item.title}</h3>
              <p className="text-sm text-secondary-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
            Whether you&apos;re building a weekend warrior or a competition engine,
            we have the expertise and equipment to make it happen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/services/request">
              <Button
                variant="secondary"
                size="lg"
                rightIcon={<ArrowRight className="h-5 w-5" />}
              >
                Request a Quote
              </Button>
            </Link>
            <a href="tel:+15551234567">
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-primary-600"
                leftIcon={<Phone className="h-5 w-5" />}
              >
                (555) 123-4567
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;
