'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HiMenu, HiX } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import UserProfile from './auth/UserProfile';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-black/90 backdrop-blur-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <div className="text-white font-bold text-lg">N</div>
              </div>
              <span className="text-white font-bold text-xl">NexTrade</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link href="/dashboard" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </Link>
              <Link href="/markets" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Markets
              </Link>
              <Link href="/portfolio" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Portfolio
              </Link>
              <Link href="/watchlist" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Watchlist
              </Link>
              <Link href="/news" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                News
              </Link>
              <Link href="/realtime-demo" className="text-blue-400 hover:text-blue-300 px-3 py-2 rounded-md text-sm font-medium">
                Realtime Demo
              </Link>
            </div>
          </div>
          
          {/* User Section */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <UserProfile />
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <HiX className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <HiMenu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="md:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-900">
              <Link href="/dashboard" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                Dashboard
              </Link>
              <Link href="/markets" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                Markets
              </Link>
              <Link href="/portfolio" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                Portfolio
              </Link>
              <Link href="/watchlist" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                Watchlist
              </Link>
              <Link href="/news" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                News
              </Link>
              <Link href="/realtime-demo" className="text-blue-400 hover:text-blue-300 block px-3 py-2 rounded-md text-base font-medium">
                Realtime Demo
              </Link>
              <div className="pt-4 pb-2 border-t border-gray-700">
                <div className="px-3 py-2">
                  <UserProfile />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar; 