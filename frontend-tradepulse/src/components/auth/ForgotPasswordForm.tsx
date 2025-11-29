'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthContext';

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const { forgotPassword, loading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await forgotPassword(email);
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-gray-900 rounded-xl shadow-lg">
      <div className="mb-6 text-center">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <div className="text-white font-bold text-2xl">N</div>
          </div>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-white">Forgot Password</h1>
        <p className="mt-2 text-gray-400">
          Enter your email address and we&apos;ll send you a link to reset your password
        </p>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
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
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg text-sm px-5 py-3 transition-colors ${
            loading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-400">
          Remembered your password?{' '}
          <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-medium">
            Back to Login
          </Link>
        </p>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          If you don&apos;t receive an email within a few minutes, please check your spam folder.
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordForm; 