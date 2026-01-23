import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import {
  Menu,
  X,
  ShoppingCart,
  User,
  Search,
  ChevronDown,
  Wrench,
  ShoppingBag,
  Phone,
  LogOut,
  Settings,
  FileText,
  Package,
} from 'lucide-react';
import Button from '@/components/common/Button';
import logo from '@/assets/logo.png';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const mainNavLinks = [
    { href: '/shop', label: 'Parts Shop', icon: ShoppingBag },
    { href: '/services', label: 'Machining Services', icon: Wrench },
  ];

  return (
    <header className="bg-secondary-950 shadow-sm sticky top-0 z-40">
      {/* Top Bar */}
      <div className="bg-black text-white py-2">
        <div className="container mx-auto px-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <a
              href="tel:+15551234567"
              className="flex items-center gap-1 hover:text-primary-400 transition-colors"
            >
              <Phone className="h-4 w-4" />
              (555) 123-4567
            </a>
            <span className="hidden sm:inline text-chrome-500">|</span>
            <span className="hidden sm:inline text-chrome-500">
              Mon-Fri: 8AM-6PM | Sat: 9AM-2PM
            </span>
          </div>
          {!isAuthenticated && (
            <div className="flex items-center gap-4">
              <Link to="/login" className="hover:text-primary-400 transition-colors">
                Sign In
              </Link>
              <Link
                to="/register"
                className="hover:text-primary-400 transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-24 lg:h-36">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img
              src={logo}
              alt="Precision Engine & Dyno"
              className="h-20 lg:h-32 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {mainNavLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                  isActive(link.href)
                    ? 'bg-primary-600/20 text-primary-400'
                    : 'text-chrome-300 hover:bg-chrome-800 hover:text-white'
                )}
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search Bar (Desktop) */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search parts..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-chrome-900 border border-chrome-700 text-white placeholder-chrome-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-chrome-500" />
            </div>
          </form>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 lg:gap-4">
            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 rounded-lg text-chrome-300 hover:bg-chrome-800 hover:text-white transition-colors"
              aria-label={`Shopping cart with ${itemCount} items`}
            >
              <ShoppingCart className="h-6 w-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-primary-500 text-white text-xs font-bold rounded-full">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg text-chrome-300 hover:bg-chrome-800 hover:text-white transition-colors"
                >
                  <User className="h-6 w-6" />
                  <span className="hidden lg:inline font-medium">
                    {user?.firstName}
                  </span>
                  <ChevronDown className="hidden lg:inline h-4 w-4" />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-chrome-900 rounded-lg shadow-lg border border-chrome-700 py-2 z-20">
                      <div className="px-4 py-2 border-b border-chrome-700">
                        <p className="font-medium text-white">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-sm text-chrome-400">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          to="/account"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-chrome-300 hover:bg-chrome-800 hover:text-white"
                        >
                          <Settings className="h-4 w-4" />
                          Account Settings
                        </Link>
                        <Link
                          to="/account/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-chrome-300 hover:bg-chrome-800 hover:text-white"
                        >
                          <Package className="h-4 w-4" />
                          My Orders
                        </Link>
                        <Link
                          to="/account/jobs"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-chrome-300 hover:bg-chrome-800 hover:text-white"
                        >
                          <Wrench className="h-4 w-4" />
                          My Service Jobs
                        </Link>
                        <Link
                          to="/account/invoices"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-chrome-300 hover:bg-chrome-800 hover:text-white"
                        >
                          <FileText className="h-4 w-4" />
                          My Invoices
                        </Link>
                      </div>
                      <div className="border-t border-chrome-700 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2 text-red-400 hover:bg-red-900/30 hover:text-red-300"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/login" className="hidden lg:block">
                <Button variant="primary" size="sm">
                  Sign In
                </Button>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-chrome-300 hover:bg-chrome-800 hover:text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-chrome-800">
          <div className="container mx-auto px-4 py-4">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search parts..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-chrome-900 border border-chrome-700 text-white placeholder-chrome-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-chrome-500" />
              </div>
            </form>

            {/* Mobile Nav Links */}
            <nav className="space-y-1">
              {mainNavLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors',
                    isActive(link.href)
                      ? 'bg-primary-600/20 text-primary-400'
                      : 'text-chrome-300 hover:bg-chrome-800 hover:text-white'
                  )}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </Link>
              ))}

              {isAuthenticated && (
                <>
                  <hr className="my-2 border-chrome-800" />
                  <Link
                    to="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-chrome-300 hover:bg-chrome-800 hover:text-white"
                  >
                    <Settings className="h-5 w-5" />
                    Account Settings
                  </Link>
                  <Link
                    to="/account/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-chrome-300 hover:bg-chrome-800 hover:text-white"
                  >
                    <Package className="h-5 w-5" />
                    My Orders
                  </Link>
                  <Link
                    to="/account/jobs"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-chrome-300 hover:bg-chrome-800 hover:text-white"
                  >
                    <Wrench className="h-5 w-5" />
                    My Service Jobs
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/30 hover:text-red-300"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
