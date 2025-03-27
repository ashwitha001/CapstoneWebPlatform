import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ChevronDown, Menu, X, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isJoinUsOpen, setIsJoinUsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsAboutOpen(false);
      setIsJoinUsOpen(false);
      setIsUserMenuOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleAboutDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAboutOpen(!isAboutOpen);
    setIsJoinUsOpen(false);
    setIsUserMenuOpen(false);
  };

  const toggleJoinUsDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsJoinUsOpen(!isJoinUsOpen);
    setIsAboutOpen(false);
    setIsUserMenuOpen(false);
  };

  const toggleUserMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUserMenuOpen(!isUserMenuOpen);
    setIsAboutOpen(false);
    setIsJoinUsOpen(false);
  };

  // Get dashboard link based on user role
  const getDashboardLink = () => {
    if (!user) return '/dashboard';
    
    switch (user.role) {
      case 'admin':
        return '/admin-dashboard';
      case 'guide':
        return '/guide-dashboard';
      default:
        return '/dashboard';
    }
  };

  // Safely get the first name from user's name or displayName
  const getFirstName = () => {
    if (!user) return 'User';
    if (user.name) return user.name;
    if (user.displayName) return user.displayName;
    return user.email?.split('@')[0] || 'User';
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || isMobileMenuOpen
          ? 'bg-white shadow-sm py-2'
          : 'bg-white/90 backdrop-blur-md shadow-sm py-4'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-3"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-10 h-10 rounded-full bg-nature-500 flex items-center justify-center text-white font-serif font-bold text-lg">
              NH
            </div>
            <span className="text-xl font-serif font-semibold">
              Nature Hikes
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? 'nav-link active font-medium text-nature-800 px-3 py-2 rounded-md hover:bg-gray-100' : 'nav-link font-medium text-nature-700 px-3 py-2 rounded-md hover:bg-gray-100'
              }
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Home
            </NavLink>
            <NavLink
              to="/hikes"
              className={({ isActive }) =>
                isActive ? 'nav-link active font-medium text-nature-800 px-3 py-2 rounded-md hover:bg-gray-100' : 'nav-link font-medium text-nature-700 px-3 py-2 rounded-md hover:bg-gray-100'
              }
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Hikes
            </NavLink>
            <div className="relative">
              <button
                onClick={toggleAboutDropdown}
                className="nav-link flex items-center font-medium text-nature-700 px-3 py-2 rounded-md hover:bg-gray-100"
              >
                About <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {isAboutOpen && (
                <div className="dropdown-menu absolute top-full right-0 mt-1 bg-white shadow-lg rounded-md py-2 z-50">
                  <Link
                    to="/about#foundation"
                    className="block px-4 py-2 text-sm rounded-md hover:bg-nature-50 transition-colors"
                  >
                    Foundation
                  </Link>
                  <Link
                    to="/about#guides"
                    className="block px-4 py-2 text-sm rounded-md hover:bg-nature-50 transition-colors"
                  >
                    Guides
                  </Link>
                  <Link
                    to="/about#faq"
                    className="block px-4 py-2 text-sm rounded-md hover:bg-nature-50 transition-colors"
                  >
                    FAQ
                  </Link>
                </div>
              )}
            </div>
            <NavLink
              to="/donate"
              className={({ isActive }) =>
                isActive ? 'nav-link active font-medium text-nature-800 px-3 py-2 rounded-md hover:bg-gray-100' : 'nav-link font-medium text-nature-700 px-3 py-2 rounded-md hover:bg-gray-100'
              }
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Donate
            </NavLink>
            <div className="relative">
              <button
                onClick={toggleJoinUsDropdown}
                className="nav-link flex items-center font-medium text-nature-700 px-3 py-2 rounded-md hover:bg-gray-100"
              >
                Join Us <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {isJoinUsOpen && (
                <div className="dropdown-menu absolute top-full right-0 mt-1 bg-white shadow-lg rounded-md py-2 z-50">
                  <Link
                    to="/join-us#careers"
                    className="block px-4 py-2 text-sm rounded-md hover:bg-nature-50 transition-colors"
                  >
                    Careers
                  </Link>
                  <Link
                    to="/join-us#volunteer"
                    className="block px-4 py-2 text-sm rounded-md hover:bg-nature-50 transition-colors"
                  >
                    Volunteer
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* User Authentication */}
          <div className="hidden md:flex items-center gap-4">
            {user && user.role === 'guide' && (
              <NotificationBell />
            )}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-2 text-nature-800 font-medium transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span>{getFirstName()}</span>
                </button>
                
                {isUserMenuOpen && (
                  <div className="dropdown-menu absolute top-full right-0 mt-1 bg-white shadow-lg rounded-md py-2 z-50 min-w-40">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-medium">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <Link
                      to={getDashboardLink()}
                      className="block px-4 py-2 text-sm rounded-md hover:bg-nature-50 transition-colors"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm rounded-md hover:bg-nature-50 transition-colors text-red-600"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link 
                  to="/login"
                  className="text-nature-700 hover:text-nature-800 font-medium transition-colors px-3 py-2 rounded-md hover:bg-gray-100"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-nature-500 hover:bg-nature-600 text-white px-4 py-2 rounded-full transition-colors shadow-sm hover:shadow"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-nature-700 hover:text-nature-800"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 animate-fade-in bg-white rounded-md shadow-md mt-2">
            <nav className="flex flex-col space-y-2">
              <NavLink
                to="/"
                className="px-4 py-2 hover:bg-nature-50 rounded-md transition-colors font-medium"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Home
              </NavLink>
              <NavLink
                to="/hikes"
                className="px-4 py-2 hover:bg-nature-50 rounded-md transition-colors font-medium"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Hikes
              </NavLink>

              {/* About dropdown */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAboutOpen(!isAboutOpen);
                  }}
                  className="flex items-center justify-between w-full px-4 py-2 hover:bg-nature-50 rounded-md transition-colors font-medium"
                >
                  <span>About</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {isAboutOpen && (
                  <div className="pl-4 py-2 space-y-2 bg-nature-50/50 rounded-md mt-1">
                    <Link
                      to="/about#foundation"
                      className="block px-4 py-1 text-sm hover:text-nature-700"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Foundation
                    </Link>
                    <Link
                      to="/about#guides"
                      className="block px-4 py-1 text-sm hover:text-nature-700"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Guides
                    </Link>
                    <Link
                      to="/about#faq"
                      className="block px-4 py-1 text-sm hover:text-nature-700"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      FAQ
                    </Link>
                  </div>
                )}
              </div>

              <NavLink
                to="/donate"
                className="px-4 py-2 hover:bg-nature-50 rounded-md transition-colors font-medium"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Donate
              </NavLink>

              {/* Join Us dropdown */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsJoinUsOpen(!isJoinUsOpen);
                  }}
                  className="flex items-center justify-between w-full px-4 py-2 hover:bg-nature-50 rounded-md transition-colors font-medium"
                >
                  <span>Join Us</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {isJoinUsOpen && (
                  <div className="pl-4 py-2 space-y-2 bg-nature-50/50 rounded-md mt-1">
                    <Link
                      to="/join-us#careers"
                      className="block px-4 py-1 text-sm hover:text-nature-700"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Careers
                    </Link>
                    <Link
                      to="/join-us#volunteer"
                      className="block px-4 py-1 text-sm hover:text-nature-700"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Volunteer
                    </Link>
                  </div>
                )}
              </div>

              <div className="border-t border-nature-100 my-2 pt-2 flex flex-col space-y-2">
                {isAuthenticated ? (
                  <>
                    <div className="px-4 py-2 bg-gray-50 rounded-md">
                      <p className="font-medium">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <Link
                      to={getDashboardLink()}
                      className="px-4 py-2 hover:bg-nature-50 rounded-md transition-colors font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="px-4 py-2 text-left hover:bg-red-50 rounded-md transition-colors font-medium text-red-600"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/login"
                      className="px-4 py-2 hover:bg-nature-50 rounded-md transition-colors font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="bg-nature-500 hover:bg-nature-600 text-white px-4 py-2 rounded-md transition-colors mx-4"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
