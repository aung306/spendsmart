// src/app/dashboard/page.tsx

"use client"; // Mark this file as a Client Component

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Import necessary components from Chart.js
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register the necessary components
ChartJS.register(ArcElement, Tooltip, Legend);

// Dynamically import Pie chart to disable SSR for it
const PieChart = dynamic(() => import('react-chartjs-2').then(mod => mod.Pie), { ssr: false });

export default function Dashboard() {
  const [isClient, setIsClient] = useState(false);

  // Ensure the component is rendered only on the client-side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const quickGlance = "You spent less than 50% of your Groceries budget this month! Update your income allocation in the 'Income' tab.";
  const redFlags = "Subscriptions Budget has an upcoming payment that will put the budget under $1";
  const redPrice = "$50";
  const data = {
    labels: ['Disposable Income', 'Budget 1', 'Budget 2'],
    datasets: [
      {
        label: 'Income Allocation',
        data: [1000, 1500, 500],
        backgroundColor: ['#A0D8F1', '#36A2EB', '#0D9488'],
        hoverOffset: 4,
      },
    ],
  };

  if (!isClient) {
    return null; // Don't render anything on the server side
  }

  return (
    <div className="font-[family-name:var(--font-coustard)] bg-violet-200 flex space-x-8 p-8">
      {/* Left Column (Pie Chart) */}
      <div className="w-1/2">
        <div className="flex justify-center pt-3 pb-3">
            <div className="w-[50%] object-contain">
            <PieChart data={data} />
        </div>
        </div>
        <div className="bg-white p-4 shadow-lg rounded-lg">
            <div className="bg-gray-100 p-4 m-4 shadow-lg rounded-lg">
            <p className="text-violet-400 flex justify-center">Dashboard</p>
                <div className="shadow-lg rounded-lg flex">
                <p className="bg-blue-100 text-blue-400 flex justify-center w-full p-2 m-2 rounded-lg">Income</p>
                <p className="bg-blue-100 text-blue-400 flex justify-center w-full p-2 m-2 rounded-lg">Budget</p>
                <p className="bg-blue-100 text-blue-400 flex justify-center w-full p-2 m-2 rounded-lg">Payment</p>                
                </div>
            </div>
            <div className="bg-gray-100 p-4 m-4 shadow-lg rounded-lg">
            <p className="text-violet-400 flex justify-center">Quick Glance</p>
            <p className="text-gray-600 text-sm">{quickGlance}</p>
            </div>
            <div className="bg-gray-100 p-4 m-4 shadow-lg rounded-lg">
            <p className="text-violet-400 flex justify-center">Red Flags</p>
            <div className="shadow-lg rounded-lg flex">
                <p className="bg-blue-100 text-blue-400 flex justify-center w-1/4 p-4 m-2 rounded-lg">{redPrice}</p>
                <p className="text-gray-600 text-sm flex justify-center w-full p-2 m-2 rounded-lg">{redFlags}</p>                
                </div>
            </div>
        </div>
      </div>

      {/* Right Column (Rounded Box) */}
      <div className="w-1/2">
        <h2 className="text-xl font-semibold mb-4">Rounded Box</h2>
        <div className="bg-gray-100 p-6 rounded-2xl shadow-lg">
          <p className="text-lg">This is a rounded box with some content.</p>
        </div>
      </div>
    </div>
  );
}
