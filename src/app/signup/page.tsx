'use client';

import Link from 'next/link';
import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function Signup() {
    const router = useRouter();
    const [formData, setFormData] = useState({email: '', password: '', confirmPassword: '', first_name: '', last_name: ''});    
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

        if (!formData.email || !formData.password || !formData.confirmPassword || !formData.first_name || !formData.last_name) {
            setError('Please fill in all fields.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        try{
            setLoading(true);
            console.log(loading);

            const response = await fetch('/api/account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (!response.ok) { throw new Error(data.message || 'Failed to create account'); }

            alert('Account created successfully! Please log in.');
            router.push('/login');
        }
        catch (err) {
            if (err instanceof Error) { setError(err.message); } 
            else { setError('An unexpected error occurred'); }
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
                    Sign-Up
                </div>

                <form onSubmit = {handleSubmit}>
                    <div className="max-w-5xl mx-auto max-h-md bg-white rounded-2xl px-14 py-16 mb-8">
                        {error && (
                            <div className="text-red-500 text-center mb-4">{error}</div>
                        )}

                        <div className="grid grid-cols-2 items-center gap-2 mb-4">
                            <label className="block text-xl font-medium text-[#7C8BFF] mb-1 font-[family-name:var(--font-coustard)]">First Name:</label>
                            <input
                                type="first_name"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-[#000000]"
                                placeholder=""
                            />
                        </div>

                        <div className="grid grid-cols-2 items-center gap-2 mb-4">
                            <label className="block text-xl font-medium text-[#7C8BFF] mb-1 font-[family-name:var(--font-coustard)]">Last Name:</label>
                            <input
                                type="last_name"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-[#000000]"
                                placeholder=""
                            />
                        </div>

                        <div className="grid grid-cols-2 items-center gap-2 mb-4">
                            <label className="block text-xl font-medium text-[#7C8BFF] mb-1 font-[family-name:var(--font-coustard)]">Email:</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-[#000000]"
                                placeholder=""
                            />
                        </div>

                        <div className="grid grid-cols-2  items-center gap-2 mb-4">
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

                        <div className="grid grid-cols-2 items-center gap-2">
                            <label className="block text-xl font-medium text-[#7C8BFF] mb-1 font-[family-name:var(--font-coustard)]">Confirm Password:</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-[#000000]"
                                placeholder=""
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-center">
                        <button className="bg-white text-lg text-[#000C2F] text-center px-16 py-3 rounded-4xl hover:bg-[#C9CFFF] underline">
                            SIGN UP!
                        </button>
                    </div>
                </form>
            </div>
            <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
            </footer>
        </div>
    );
}