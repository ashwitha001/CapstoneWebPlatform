import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Facebook, Instagram, Twitter } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Information */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-nature-500 flex items-center justify-center text-white font-serif font-bold text-lg">
                NH
              </div>
              <span className="text-xl font-serif font-semibold">
                Nature Hikes
              </span>
            </Link>
            <p className="text-gray-600 mb-4">
              Connecting people with nature through sustainable hiking experiences that promote conservation and community.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-nature-600 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-nature-600 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://x.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-nature-600 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li className="flex justify-center">
                <Link to="/" className="text-gray-600 hover:text-nature-600 transition-colors">
                  Home
                </Link>
              </li>
              <li className="flex justify-center">
                <Link to="/hikes" className="text-gray-600 hover:text-nature-600 transition-colors">
                  Upcoming Hikes
                </Link>
              </li>
              <li className="flex justify-center">
                <Link to="/about" className="text-gray-600 hover:text-nature-600 transition-colors">
                  About Us
                </Link>
              </li>
              <li className="flex justify-center">
                <Link to="/donate" className="text-gray-600 hover:text-nature-600 transition-colors">
                  Donate
                </Link>
              </li>
              <li className="flex justify-center">
                <Link to="/join-us" className="text-gray-600 hover:text-nature-600 transition-colors">
                  Join Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-nature-500 mr-2 mt-0.5" />
                <span className="text-gray-600">
                  123 Nature Way, Mountain View, CA 94043
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 text-nature-500 mr-2" />
                <span className="text-gray-600">(555) 123-4567</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 text-nature-500 mr-2" />
                <span className="text-gray-600">info@naturehikes.org</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-12 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Nature Hikes. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
