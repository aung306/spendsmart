// src/app/dashboard/page.tsx

"use client"; // Mark this file as a Client Component

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Import necessary components from Chart.js
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Import necessary components for Calendar
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './calendar.css'

// Register the necessary components
ChartJS.register(ArcElement, Tooltip, Legend);

// Dynamically import Pie chart to disable SSR for it
const PieChart = dynamic(() => import('react-chartjs-2').then(mod => mod.Pie), { ssr: false });

export default function Dashboard() {
    type DateType = Date|null;
    const [isClient, setIsClient] = useState(false);
    const [selectedDate, setSelectedDate] = useState<DateType|[DateType, DateType]>(new Date());

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
                <h2 className="text-4xl text-center font-semibold font-[family-name:var(--font-coustard)] m-3">Calendar</h2>
                <div className="bg-white p-6 rounded-4xl shadow-lg flex flex-col justify-center items-center">
                    <Calendar className="mb-5"
                    onChange={setSelectedDate}
                    value={selectedDate}
                    tileContent={({ date }) => {
                        // Add custom conditions for different days or dates
                        const day = date.getDate();
                        let content;

                        // Example condition: Show "stuff" on the 15th and 20th of the month
                        if (day === 15 || day === 20) {
                            content = "stuff";
                        } else {
                            content = ""; // Or you can show something else or nothing
                        }

                        return (
                        <div className="tile flex flex-col justify-center">
                        <div className="tile-date-number rounded-full">{day}</div>
                        <div className={`tile-content rounded-2xl bg-[#ebebeb] p-1 ${content ? "" : "hidden"}`}>
                            {content}
                        </div>
                        </div>
                        );
                    }}
                    />
                    <div className="w-3/4 bg-gray-200 m-3 p-3 rounded-full flex items-center font-[family-name:var(--font-coustard)]">
                        <p className="bg-white py-2 px-5 rounded-full text-l text-[#7c8cfd] mr-5">APR 3</p>
                        <p className="text-xl text-[#362d64] flex flex-grow justify-center text-center">Rent: $1,149.49</p>
                    </div>
                    <div className="w-3/4 bg-gray-200 p-3 rounded-full flex items-center font-[family-name:var(--font-coustard)]">
                        <p className="bg-white py-2 px-5 rounded-full text-l text-[#7c8cfd] mr-5">APR 10</p>
                        <p className="text-xl text-[#362d64] flex flex-grow justify-center text-center">Subscriptions: $80.00</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
