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

    const [activeView, setActiveView] = useState('dashboard');
    // Ensure the component is rendered only on the client-side
    useEffect(() => {
        setIsClient(true);
    }, []);

  const quickGlance = "You spent less than 50% of your Groceries budget this month! Update your income allocation in the 'Income' tab.";
  const redFlags = "Subscriptions Budget has an upcoming payment that will put the budget under $1";
  const redPrice = "$50";

  const budgets = [1000, 1500, 500, 300, 500];
  const budgetNames = ['Disposable Income', 'Rent', 'Groceries', 'Dining', 'Vacation'];

  const payments = [1149.49, 80];
  const paymentNames = ['Rent', 'Subscriptions'];

    const data = {
        labels: budgetNames,
        datasets: [
            {
                label: 'Income Allocation',
                data: budgets,
                backgroundColor: ['#E2B7F8', '#D1E8F9', '#D7A8F5', '#A0D8F1', '#7c8cfd'],
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
            <div className="justify-center bg-gray-100 p-4 m-4 shadow-lg rounded-lg">
              <div className="flex justify-center">
                <button className="text-[#7c8cfd]" onClick={() => setActiveView('dashboard')}>Dashboard</button>
              </div>
                <div className="shadow-lg rounded-lg flex">
                  <button className="bg-blue-100 text-blue-400 flex justify-center w-full p-2 m-2 rounded-lg"
                  onClick={() => setActiveView('income')}>Income</button>
                  <button className="bg-blue-100 text-blue-400 flex justify-center w-full p-2 m-2 rounded-lg"
                  onClick={() => setActiveView('budget')}>Budget</button>
                  <button className="bg-blue-100 text-blue-400 flex justify-center w-full p-2 m-2 rounded-lg"
                  onClick={() => setActiveView('payment')}>Payment</button>                
                </div>
            </div>
        {/* Quick Glance and Red Flags Section */}
        {activeView === 'dashboard' && (
          <div className="bg-gray-100 p-4 m-4 shadow-lg rounded-lg">
            <p className="text-[#7c8cfd] flex justify-center">Quick Glance</p>
            <p className="text-gray-600 text-sm">{quickGlance}</p>
          </div>
        )}

        {activeView === 'dashboard' && (
          <div className="bg-gray-100 p-4 m-4 shadow-lg rounded-lg">
            <p className="text-[#7c8cfd] flex justify-center">Red Flags</p>
            <div className="shadow-lg rounded-lg flex">
              <p className="bg-blue-100 text-blue-400 flex justify-center w-1/4 p-4 m-2 rounded-lg">{redPrice}</p>
              <p className="text-gray-600 text-sm flex justify-center w-full p-2 m-2 rounded-lg">{redFlags}</p>
            </div>
          </div>
        )}

        {/* Income Section */}
        {activeView === 'income' && (
          <div className="text-center bg-gray-100 p-4 m-4 shadow-lg rounded-lg">
            <form>
              <input type="submit" className="bg-blue-100 text-blue-400 p-2 m-2 rounded-lg"
              value="Update Salary"/>
              <input type="text" className="w-1/2 p-2 m-2 bg-white text-gray-600 text-center"
              placeholder="$70,000/YR"/>
            </form>
            <form>
              <input type="submit" className="bg-blue-100 text-blue-400 p-2 m-2 rounded-lg"
              placeholder="Add Income"/>
              <input type="text" className="w-1/2 p-2 m-2 bg-white text-gray-600 text-center"
              value="$0"/>
            </form>
            <button className="bg-blue-100 text-blue-400 text-center items-center p-2 m-2 rounded-lg">Allocation</button>
          </div>
        )}

        {/* Budget Section */}
        {activeView === 'budget' && (
          <div className="bg-gray-100 p-4 m-2 shadow-lg rounded-lg">
            {budgets.map((budget, index) => (
              <div key={index} className="flex bg-white p-2 shadow-lg rounded-xl w-full mb-4">
                <p className="bg-blue-100 text-blue-400 p-2 mr-6 rounded-lg">${budget}</p>
                <p className="text-blue-400 text-md p-2 w-1/2 rounded-lg">{budgetNames[index]}</p>
              </div>
            ))}
          </div>
        )}

        {/* Payment Section */}
        {activeView === 'payment' && (
          <div className="bg-gray-100 p-4 m-2 shadow-lg rounded-lg">
          <form>
          <div className="text-center">
            <select
              id="budgetDropdown"
              className="bg-white p-2 border rounded-lg text-blue-400"
              onChange={(e) => {
                const selectedBudget = e.target.value;
                console.log("Selected Budget:", selectedBudget);
              }}
            >
              {budgetNames.map((budgetName, index) => (
                <option key={index} value={budgetName}>
                  {budgetName}
                </option>
              ))}
            </select>
            <input type="text" className="bg-white p-2 m-2 text-black" placeholder="$0"/>
            <input type="submit" className="bg-blue-200 p-2 m-2 text-blue-400 rounded-xl" value="Submit"/>
          </div>
          </form>
          <div className="bg-white mb-2 mt-4 flex rounded-xl">
            <p className="text-gray-600 p-2 m-2 rounded-xl w-1/2">{paymentNames[0]}</p>
            <p className="bg-blue-100 p-2 m-2 text-gray-600 rounded-xl">${payments[0]}</p>
            <p className="bg-blue-100 p-2 m-2 text-gray-600 rounded-xl">/M</p>
          </div>
          <div className="bg-white mt-2 flex rounded-xl">
            <p className="text-gray-600 p-2 m-2 rounded-xl w-1/2">{paymentNames[1]}</p>
            <p className="bg-blue-100 p-2 m-2 text-gray-600 rounded-xl">${payments[1]}</p>
            <p className="bg-blue-100 p-2 m-2 text-gray-600 rounded-xl">/2W</p>
          </div>
        </div>
        )}
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
                        if (day === 3 || day === 10) {
                            content = "Payment Due";
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
                        <p className="text-xl text-[#362d64] flex flex-grow justify-center text-center">{paymentNames[0]}: ${payments[0]}</p>
                    </div>
                    <div className="w-3/4 bg-gray-200 p-3 rounded-full flex items-center font-[family-name:var(--font-coustard)]">
                        <p className="bg-white py-2 px-5 rounded-full text-l text-[#7c8cfd] mr-5">APR 10</p>
                        <p className="text-xl text-[#362d64] flex flex-grow justify-center text-center">{paymentNames[0]}: ${payments[1]}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
