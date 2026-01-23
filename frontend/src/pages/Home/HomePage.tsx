import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Wrench,
  ArrowRight,
  CheckCircle,
  Star,
  Truck,
  Shield,
  Phone,
  Award,
  Gauge,
  Cog,
  Zap,
} from 'lucide-react';
import Button from '@/components/common/Button';
import { Card } from '@/components/common/Card';

const HomePage: React.FC = () => {
  return (
    <div className="bg-black">
      {/* Hero Section */}
      <section className="relative bg-black overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-electric-600 to-transparent" />
        </div>

        <div className="container mx-auto px-4 py-16 lg:py-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Performance Parts
                <span className="text-electric-400"> & </span>
                Professional Machining
              </h1>
              <p className="text-lg text-chrome-300 mb-8 max-w-xl">
                Your one-stop destination for premium performance car parts and
                expert auto machining services. From engine builds to dyno tuning,
                we deliver precision and power.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/shop">
                  <Button size="lg" leftIcon={<ShoppingBag className="h-5 w-5" />}>
                    Shop Parts
                  </Button>
                </Link>
                <Link to="/services/request">
                  <Button
                    variant="outline"
                    size="lg"
                    leftIcon={<Wrench className="h-5 w-5" />}
                    className="border-white text-white hover:bg-chrome-900/10"
                  >
                    Request Service Quote
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Stats/Features */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { number: '10,000+', label: 'Parts in Stock', icon: ShoppingBag },
                { number: '25+', label: 'Years Experience', icon: Award },
                { number: '500+', label: 'HP Engines Built', icon: Gauge },
                { number: '98%', label: 'Customer Satisfaction', icon: Star },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="bg-chrome-900/5 backdrop-blur border border-chrome-800 rounded-xl p-6 text-center"
                >
                  <stat.icon className="h-8 w-8 text-electric-400 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-white mb-1">
                    {stat.number}
                  </div>
                  <div className="text-chrome-400 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Two Main Sections - Parts Shop & Machining Services */}
      <section className="py-16 lg:py-24 bg-chrome-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-4">
              Two Ways We Serve You
            </h2>
            <p className="text-chrome-400 max-w-2xl mx-auto">
              Whether you&apos;re looking for quality performance parts or professional
              machining services, we&apos;ve got you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Parts Shop Card */}
            <div className="bg-chrome-900 rounded-xl overflow-hidden border border-chrome-800">
              <div className="h-48 bg-gradient-to-br from-electric-600 to-electric-800 flex items-center justify-center">
                <ShoppingBag className="h-24 w-24 text-white/20" />
              </div>
              <div className="p-6 lg:p-8">
                <h3 className="font-display text-2xl font-bold text-white mb-4">
                  Performance Parts Shop
                </h3>
                <p className="text-chrome-400 mb-6">
                  Browse our extensive catalog of high-quality performance parts
                  from top brands. Engine components, turbo kits, exhaust systems,
                  suspension upgrades, and more.
                </p>
                <ul className="space-y-3 mb-6">
                  {[
                    'Thousands of parts in stock',
                    'Competitive pricing',
                    'Fast shipping nationwide',
                    'Vehicle fitment search',
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-chrome-300">
                      <CheckCircle className="h-5 w-5 text-electric-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link to="/shop">
                  <Button className="w-full" rightIcon={<ArrowRight className="h-5 w-5" />}>
                    Browse Parts Shop
                  </Button>
                </Link>
              </div>
            </div>

            {/* Machining Services Card */}
            <div className="bg-chrome-900 rounded-xl overflow-hidden border border-chrome-800">
              <div className="h-48 bg-gradient-to-br from-chrome-700 to-chrome-900 flex items-center justify-center">
                <Wrench className="h-24 w-24 text-white/20" />
              </div>
              <div className="p-6 lg:p-8">
                <h3 className="font-display text-2xl font-bold text-white mb-4">
                  Machining Services
                </h3>
                <p className="text-chrome-400 mb-6">
                  Professional engine machining, cylinder head work, block
                  machining, dyno tuning, and complete engine building services
                  from our expert technicians.
                </p>
                <ul className="space-y-3 mb-6">
                  {[
                    'Expert technicians',
                    'State-of-the-art equipment',
                    'Dyno testing available',
                    'Online job tracking',
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-chrome-300">
                      <CheckCircle className="h-5 w-5 text-electric-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link to="/services">
                  <Button
                    variant="secondary"
                    className="w-full"
                    rightIcon={<ArrowRight className="h-5 w-5" />}
                  >
                    View Services
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 lg:py-24 bg-black">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="font-display text-3xl font-bold text-white mb-2">
                Shop by Category
              </h2>
              <p className="text-chrome-400">
                Find the parts you need for your build
              </p>
            </div>
            <Link
              to="/shop"
              className="hidden md:flex items-center gap-2 text-electric-400 font-medium hover:text-electric-300"
            >
              View All
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: 'Engine Parts', icon: Cog, color: 'bg-red-900/50 text-red-400 border-red-800' },
              { name: 'Turbo & Superchargers', icon: Zap, color: 'bg-electric-900/50 text-electric-400 border-electric-800' },
              { name: 'Exhaust Systems', icon: Gauge, color: 'bg-orange-900/50 text-orange-400 border-orange-800' },
              { name: 'Fuel Systems', icon: Gauge, color: 'bg-green-900/50 text-green-400 border-green-800' },
              { name: 'Suspension', icon: Cog, color: 'bg-purple-900/50 text-purple-400 border-purple-800' },
              { name: 'Brakes', icon: Shield, color: 'bg-yellow-900/50 text-yellow-400 border-yellow-800' },
            ].map((category, index) => (
              <Link
                key={index}
                to={`/shop/categories/${category.name.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                className="group"
              >
                <div className="bg-chrome-900 border border-chrome-800 rounded-xl p-4 text-center hover:border-electric-600 transition-all h-full">
                  <div
                    className={`w-14 h-14 rounded-xl ${category.color} border flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}
                  >
                    <category.icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-medium text-chrome-200 text-sm">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link to="/shop">
              <Button variant="outline">View All Categories</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Our Services Grid */}
      <section className="py-16 lg:py-24 bg-chrome-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-4">
              Our Machining Services
            </h2>
            <p className="text-chrome-400 max-w-2xl mx-auto">
              From basic machining to complete engine builds, our experienced
              team delivers precision work you can count on.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Cylinder Head Work',
                description:
                  'Porting, polishing, valve jobs, surfacing, and complete cylinder head rebuilds.',
                icon: Cog,
              },
              {
                title: 'Block Machining',
                description:
                  'Boring, honing, decking, align boring, and main cap machining services.',
                icon: Wrench,
              },
              {
                title: 'Crankshaft Services',
                description:
                  'Grinding, polishing, balancing, and straightening for all crankshafts.',
                icon: Gauge,
              },
              {
                title: 'Dyno Tuning',
                description:
                  'Baseline testing, custom tuning, and power verification on our in-house dyno.',
                icon: Zap,
              },
              {
                title: 'Engine Building',
                description:
                  'Complete short block and long block assembly with precision blueprinting.',
                icon: Award,
              },
              {
                title: 'Performance Upgrades',
                description:
                  'Cam installations, intake manifolds, headers, and complete performance packages.',
                icon: Star,
              },
            ].map((service, index) => (
              <div key={index} className="bg-chrome-900 border border-chrome-800 rounded-xl p-6 hover:border-electric-600/50 transition-all">
                <div className="w-12 h-12 rounded-lg bg-electric-900/50 text-electric-400 border border-electric-800 flex items-center justify-center mb-4">
                  <service.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg text-white mb-2">
                  {service.title}
                </h3>
                <p className="text-chrome-400 text-sm">{service.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/services/request">
              <Button size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
                Request a Service Quote
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 lg:py-24 bg-black text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl lg:text-4xl font-bold mb-4">
              Why Choose Precision Engine & Dyno?
            </h2>
            <p className="text-chrome-400 max-w-2xl mx-auto">
              We combine decades of experience with cutting-edge technology to
              deliver exceptional results.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Award,
                title: '25+ Years Experience',
                description:
                  'Our team brings decades of hands-on expertise in performance automotive work.',
              },
              {
                icon: Truck,
                title: 'Fast Shipping',
                description:
                  'Most orders ship within 24 hours. Free shipping on orders over $99.',
              },
              {
                icon: Shield,
                title: 'Quality Guaranteed',
                description:
                  'All parts and services backed by our comprehensive warranty program.',
              },
              {
                icon: Phone,
                title: 'Expert Support',
                description:
                  'Real enthusiasts ready to help you find the right parts and solutions.',
              },
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-full bg-electric-600 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-chrome-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-chrome-950">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-electric-600 to-electric-700 rounded-2xl p-8 lg:p-12 text-center text-white">
            <h2 className="font-display text-3xl lg:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-electric-100 mb-8 max-w-2xl mx-auto">
              Whether you&apos;re shopping for parts or need machining services,
              we&apos;re here to help you achieve your performance goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/shop">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-chrome-900 text-electric-700 hover:bg-chrome-100"
                >
                  Shop Parts Now
                </Button>
              </Link>
              <Link to="/services/request">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-chrome-900/10"
                >
                  Request Service Quote
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
