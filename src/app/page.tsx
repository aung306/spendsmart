import Link from 'next/link';

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] min-h-screen p-8 pb-20 gap-16 sm:p-20">
        <div className="absolute top-8 right-25 flex gap-4">
          <Link href="/login"><button className="bg-white text-[#7C8BFF] px-4 py-2 rounded-lg hover:bg-[#C9CFFF] underline">Login</button></Link>
          <Link href="/signup"><button className="bg-white text-[#7C8BFF] px-4 py-2 rounded-lg hover:bg-[#C9CFFF] underline">Sign Up</button></Link>
        </div>
        <div className="flex gap-4 items-start text:left flex-col sm:flex-row font-[family-name:var(--font-comfortaa)]">
          ALT-F4-LIFE
        </div>
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div className="mt-30 text-5xl font-[family-name:var(--font-coustard)]">
          Start your journey with us
        </div>
        <div className="text-xl font-[family-name:var(--font-geist-sans)]">
          Create a budget plan customized to your needs!
        </div>
        <Link href="/signup"><button className="mt-20 bg-white text-[#000C2F] px-4 py-2 rounded-lg hover:bg-[#C9CFFF] underline w-30">Get Started</button></Link>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
      </footer>
    </div>
  );
}
