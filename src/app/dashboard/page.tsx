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

  const data = {
    labels: ['Red', 'Blue', 'Yellow'],
    datasets: [
      {
        label: 'Pie Chart',
        data: [300, 50, 100],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCD56'],
        hoverOffset: 4,
      },
    ],
  };

  if (!isClient) {
    return null; // Don't render anything on the server side
  }

  return (
    <div className="flex space-x-8 p-8">
      {/* Left Column (Pie Chart) */}
      <div className="w-1/2">
        <h2 className="text-xl font-semibold mb-4">Pie Chart</h2>
        <div className="bg-white p-4 shadow-lg rounded-lg">
          <PieChart data={data} />
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
