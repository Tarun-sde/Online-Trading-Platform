'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from './AuthContext';
import { UserIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const UserProfile = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!user) {
    return (
      <div className="flex gap-3">
        <Link 
          href="/auth/login" 
          className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Log In
        </Link>
        <Link 
          href="/auth/register" 
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:from-blue-600 hover:to-purple-700 transition-colors"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
      >
        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-800">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white font-medium">
              {user.name.charAt(0)}
            </div>
          )}
        </div>
        <span className="hidden sm:block text-sm font-medium">{user.name}</span>
        <ChevronDownIcon className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-700">
          <div className="px-4 py-3 border-b border-gray-700">
            <p className="text-sm leading-5 font-medium text-white truncate">{user.name}</p>
            <p className="text-xs leading-4 text-gray-400 truncate">{user.email}</p>
          </div>
          <Link 
            href="/profile" 
            className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2"
          >
            <UserIcon className="h-4 w-4" />
            Your Profile
          </Link>
          <Link 
            href="/settings" 
            className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2"
          >
            <Cog6ToothIcon className="h-4 w-4" />
            Settings
          </Link>
          <button
            onClick={logout}
            className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile; 