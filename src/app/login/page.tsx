'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import React, { ChangeEvent, FormEvent } from 'react';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) { setError(data.message || 'Login failed. Please try again.');} 
      else { router.push('/dashboard'); }
    } 
    catch (err) { 
      console.error('Login error:', err);
      setError('An error occurred. Please try again later.'); 
    } 
    finally { setLoading(false); }
  };


  return (
    <div className="grid grid-rows-[20px_1fr_20px] min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <div className="absolute top-8 right-25 flex gap-4">
        <Link href="/login"><button className="bg-white text-[#7C8BFF] px-4 py-2 rounded-lg hover:bg-[#C9CFFF] underline">Login</button></Link>
        <Link href="/signup"><button className="bg-[white] text-[#7C8BFF] px-4 py-2 rounded-lg hover:bg-[#C9CFFF] underline">Sign Up</button></Link>
      </div>
      <div className="flex gap-4 items-start text:left flex-col sm:flex-row font-[family-name:var(--font-comfortaa)]">
        ALT-F4-LIFE
      </div>
      <div className="flex flex-col items-center justify-center">
        <div className="mb-8 text-5xl font-[family-name:var(--font-coustard)] text-center">
          Login
        </div>

        <form onSubmit={handleSubmit}>
          <div className="max-w-2xl mx-auto max-h-md bg-white rounded-2xl px-[100px] py-16 mb-8">
            {error && (
              <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="flex flex-col items-center gap-2 mb-4">
              <label className="block text-xl font-medium text-[#7C8BFF] mb-1 font-[family-name:var(--font-coustard)]">Username/Email:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-[#000000]"
                placeholder=""
              />
            </div>

            <div className="flex flex-col items-center gap-2 mb-4">
              <label className="block text-xl font-medium text-[#7C8BFF] mb-1 font-[family-name:var(--font-coustard)]">Password:</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-[#000000]"
                placeholder=""
              />
            </div>

            <div className="flex items-center justify-center">
              <a href="#" className="text-lg text-[#7C8BFF] hover:text-indigo-500">Forgot password?</a>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <button className="bg-white text-lg text-[#000C2F] text-center px-16 py-3 rounded-4xl hover:bg-[#C9CFFF] underline">
              {loading? 'Logging in...' : 'LOGIN!'}
            </button>
          </div>
        </form>
      </div>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
      </footer>
    </div>
  );
}