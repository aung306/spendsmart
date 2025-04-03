import Link from 'next/link';

export default function Signup() {
    return (
        <div className="grid grid-rows-[20px_1fr_20px] min-h-screen p-8 pb-20 gap-16 sm:p-20">
            <div className="absolute top-8 right-25 flex gap-4">
                <Link href="/login"><button className="bg-white text-[#7C8BFF] px-4 py-2 rounded-lg hover:bg-[#C9CFFF] underline">Login</button></Link>
                <Link href="/signup"><button className="bg-[white] text-[#7C8BFF] px-4 py-2 rounded-lg hover:bg-[#C9CFFF] underline">Sign Up</button></Link>
            </div>
            <Link href="/"><div className="flex gap-4 items-start text:left flex-col sm:flex-row font-[family-name:var(--font-comfortaa)]">
                ALT-F4-LIFE
            </div></Link>
            <div className="flex flex-col items-center justify-center">
                <div className="mb-8 text-5xl font-[family-name:var(--font-coustard)] text-center">
                    Sign-Up
                </div>

                <form>
                    <div className="max-w-5xl mx-auto max-h-md bg-white rounded-2xl px-14 py-16 mb-8">
                        
                        <div className="grid grid-cols-2 items-center gap-2 mb-4">
                            <label className="block text-xl font-medium text-[#7C8BFF] mb-1 font-[family-name:var(--font-coustard)]">Username:</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-[#000000]"
                                placeholder=""
                            />
                        </div>

                        <div className="grid grid-cols-2 items-center gap-2 mb-4">
                            <label className="block text-xl font-medium text-[#7C8BFF] mb-1 font-[family-name:var(--font-coustard)]">Email:</label>
                            <input
                                type="email"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-[#000000]"
                                placeholder=""
                            />
                        </div>

                        <div className="grid grid-cols-2  items-center gap-2 mb-4">
                            <label className="block text-xl font-medium text-[#7C8BFF] mb-1 font-[family-name:var(--font-coustard)]">Password:</label>
                            <input
                                type="password"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-[#000000]"
                                placeholder=""
                            />
                        </div>

                        <div className="grid grid-cols-2 items-center gap-2">
                            <label className="block text-xl font-medium text-[#7C8BFF] mb-1 font-[family-name:var(--font-coustard)]">Confirm Password:</label>
                            <input
                                type="password"
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