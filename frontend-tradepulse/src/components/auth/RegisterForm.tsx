'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const RegisterForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const { register, loading, error, clearError } = useAuth();

  const validatePassword = () => {
    setPasswordError('');
    
    // Check if passwords match exactly (case sensitive)
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) return;
    await register(name, email, password);
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-gray-900 rounded-xl shadow-lg">
      <div className="mb-6 text-center">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <div className="text-white font-bold text-2xl">N</div>
          </div>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-white">Create an Account</h1>
        <p className="mt-2 text-gray-400">Join NexTrade and start trading today</p>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-300">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            placeholder="John Doe"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearError();
            }}
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-300">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError();
            }}
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-300">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-10"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError();
                if (confirmPassword) validatePassword();
              }}
              required
              minLength={8}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Must be at least 8 characters
          </p>
        </div>
        <div className="mb-6">
          <label htmlFor="confirm-password" className="block mb-2 text-sm font-medium text-gray-300">
            Confirm Password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            id="confirm-password"
            className={`bg-gray-800 border ${
              passwordError ? 'border-red-500' : 'border-gray-700'
            } text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              clearError();
              // Only validate if both fields have values
              if (password && e.target.value) {
                // Use the current value rather than state for immediate validation
                if (password !== e.target.value) {
                  setPasswordError('Passwords do not match');
                } else {
                  setPasswordError('');
                }
              }
            }}
            required
          />
          {passwordError && (
            <p className="mt-1 text-xs text-red-500">{passwordError}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg text-sm px-5 py-3 transition-colors ${
            loading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-400">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          By creating an account, you agree to NexTrade's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default RegisterForm; 
