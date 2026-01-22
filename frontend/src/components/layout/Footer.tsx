import React from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
} from 'lucide-react';
import logo from '@/assets/logo.png';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const shopLinks = [
    { href: '/shop', label: 'All Products' },
    { href: '/shop/categories/engine-parts', label: 'Engine Parts' },
    { href: '/shop/categories/turbo-supercharger', label: 'Turbo & Superchargers' },
    { href: '/shop/categories/exhaust', label: 'Exhaust Systems' },
    { href: '/shop/categories/suspension', label: 'Suspension' },
    { href: '/shop/brands', label: 'Shop by Brand' },
  ];

  const serviceLinks = [
    { href: '/services', label: 'All Services' },
    { href: '/services/machining', label: 'Engine Machining' },
    { href: '/services/dyno', label: 'Dyno Tuning' },
    { href: '/services/engine-building', label: 'Engine Building' },
    { href: '/services/request', label: 'Request a Quote' },
  ];

  const accountLinks = [
    { href: '/account', label: 'My Account' },
    { href: '/account/orders', label: 'Order History' },
    { href: '/account/jobs', label: 'Service Jobs' },
    { href: '/account/invoices', label: 'Invoices' },
    { href: '/account/vehicles', label: 'My Vehicles' },
  ];

  const infoLinks = [
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact Us' },
    { href: '/shipping', label: 'Shipping Info' },
    { href: '/returns', label: 'Returns Policy' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
  ];

  return (
    <footer className="bg-black text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block mb-6">
              <img
                src={logo}
                alt="Precision Engine & Dyno"
                className="h-28 w-auto"
              />
            </Link>
            <p className="text-chrome-400 mb-6 max-w-sm">
              Your one-stop destination for premium performance car parts and
              professional auto machining services. Quality you can trust,
              performance you can feel.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <a
                href="tel:+15551234567"
                className="flex items-center gap-3 text-chrome-300 hover:text-white transition-colors"
              >
                <Phone className="h-5 w-5 text-electric-500" />
                (555) 123-4567
              </a>
              <a
                href="mailto:info@precisionengine.com"
                className="flex items-center gap-3 text-chrome-300 hover:text-white transition-colors"
              >
                <Mail className="h-5 w-5 text-electric-500" />
                info@precisionengine.com
              </a>
              <div className="flex items-start gap-3 text-chrome-300">
                <MapPin className="h-5 w-5 text-electric-500 flex-shrink-0 mt-0.5" />
                <span>
                  1234 Performance Drive
                  <br />
                  Houston, TX 77001
                </span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4 mt-6">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-chrome-900 text-chrome-400 hover:bg-electric-600 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-chrome-900 text-chrome-400 hover:bg-electric-600 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-chrome-900 text-chrome-400 hover:bg-electric-600 hover:text-white transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Parts Shop Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-chrome-100">Parts Shop</h3>
            <ul className="space-y-2">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-chrome-400 hover:text-electric-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-chrome-100">Services</h3>
            <ul className="space-y-2">
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-chrome-400 hover:text-electric-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="font-semibold text-lg mt-6 mb-4 text-chrome-100">My Account</h3>
            <ul className="space-y-2">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-chrome-400 hover:text-electric-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-chrome-100">Information</h3>
            <ul className="space-y-2">
              {infoLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-chrome-400 hover:text-electric-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Business Hours */}
            <h3 className="font-semibold text-lg mt-6 mb-4 text-chrome-100">Business Hours</h3>
            <div className="text-chrome-400 text-sm space-y-1">
              <p>Monday - Friday: 8:00 AM - 6:00 PM</p>
              <p>Saturday: 9:00 AM - 2:00 PM</p>
              <p>Sunday: Closed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-chrome-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-chrome-500 text-sm text-center md:text-left">
              &copy; {currentYear} Precision Engine and Dyno, LLC. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link
                to="/privacy"
                className="text-chrome-500 hover:text-electric-400 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="text-chrome-500 hover:text-electric-400 transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
