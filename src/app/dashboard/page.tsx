// src/app/dashboard/page.tsx

"use client"; // Mark this file as a Client Component

import dynamic from 'next/dynamic';
import { useEffect, useState, useRef} from 'react';

// Import necessary components from Chart.js
import { Chart as ChartJS, Title, Tooltip, ArcElement, CategoryScale, LinearScale, Chart } from 'chart.js';

// Import necessary components for Calendar
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './calendar.css'

interface DoughnutChart {
  ctx: CanvasRenderingContext2D;
  config: {
    options: {
      plugins: {
        centerText: {
          text: string;
        };
      };
    };
  };
  width: number;
  height: number;
}

type User = {
  account_id: number;
  email: string;
  first_name: string;
  last_name: string;
};

type ApiResponse = 
  | { authenticated: true; user: User }
  | { authenticated: false; message: string };

const centerTextPlugin = {
  id: 'centerText',
  beforeDraw: (chart: DoughnutChart) => {
    const { ctx, width, height, config } = chart;
    ctx.restore();

    const text = config.options.plugins.centerText.text;
    const fontSize = (height / 114).toFixed(2);

    ctx.font = `${fontSize}em sans-serif`;
    ctx.textBaseline = 'middle';

    const textX = Math.round((width - ctx.measureText(text).width) / 2);
    const textY = height / 2;

    ctx.fillStyle = '#666'; // Set text color
    ctx.fillText(text, textX, textY);
    ctx.save();
  }
};

// Register the necessary components
ChartJS.register(Title, Tooltip, ArcElement, CategoryScale, LinearScale, centerTextPlugin);

// Dynamically import Pie chart to disable SSR for it
const Doughnut = dynamic(() => import('react-chartjs-2').then(mod => mod.Doughnut), { ssr: false });


export default function Dashboard() {
  type DateType = Date | null;
  const [isClient, setIsClient] = useState(false);
  const [selectedDate, setSelectedDate] = useState<DateType | [DateType, DateType]>(new Date());

  const [incomeAlloc, setIncomeAlloc] = useState<number[]>([0]);
  const totalAlloc = incomeAlloc.reduce((sum, val) => sum + val, 0);
  const allocCheck = Math.abs(totalAlloc - 1) < 0.001;

  const [activeView, setActiveView] = useState('dashboard');
  const chartRef = useRef<Chart<'doughnut'> | null>(null);

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/me', {
          method: 'GET',
          credentials: 'include'
        });
    
        const data: ApiResponse = await res.json();
        console.log('API /api/me response:', data);
    
        if (res.ok && data.authenticated) {
          setUser(data.user);
        } 
      } catch (error) {
        console.error('Error fetching user:', error);
      } 
    }

    fetchUser();
  }, []);

  // Ensure the component is rendered only on the client-side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Quick Glance
  const quickGlance : string[]= []; // "You spent less than 50% of your Groceries budget this month! Update your income allocation in the 'Income' tab.";
  const redFlags : string[]= []; // "Subscriptions Budget has an upcoming payment that will put the budget under $1";
  const [budgets, setBudgets] = useState<Budget[]>([]);
  
  useEffect(() => {
    async function fetchBudgets() {
      if (!user) return;
  
      try {
        const res = await fetch(`/api/budget?account_id=${user.account_id}`, {
          method: 'GET',
        });
  
        const data = await res.json();
        if (res.ok) {
          console.log('Budgets:', data.budgets);
          setBudgets(data.budgets);
        } else {
          console.error('Failed to fetch budgets:', data.message);
        }
      } catch (error) {
        console.error('Fetch error:', error);
      }
    }
  
    fetchBudgets();
  }, [user]);

  function getQuickGlance(){
    if (budgets.length == 0){
      quickGlance.push("You have no budgets. Please add budgets in the dashboard!");
    }
    else{
    }
  }
  getQuickGlance();

  function getRedFlags(){
    
  }

  // Budget
  type Budget = {
    name: string;
    amount: number;
  }

    useEffect(() => {
      // Always keep one extra for Disposable Income
      const expectedLength = budgets.length + 1;
    
      if (incomeAlloc.length < expectedLength) {
        setIncomeAlloc([...incomeAlloc, ...Array(expectedLength - incomeAlloc.length).fill(0)]);
      } else if (incomeAlloc.length > expectedLength) {
        setIncomeAlloc(incomeAlloc.slice(0, expectedLength));
      }
    }, [budgets]);

  const [budgetName, setBudgetName] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');

  const addBudget = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!budgetName || !budgetAmount) return;

    const amountNumber = parseFloat(budgetAmount);
    if (isNaN(amountNumber)) return;

    setBudgets([...budgets, { name: budgetName, amount: amountNumber }]);

    setBudgetName('');
    setBudgetAmount('');
  };
  
  const removeBudget = (index: number) => {
    setBudgets(budgets.filter((_, i) => i !== index));
  };

  // add budget to database
  const createBudget = async () => {
    try {
      const response = await fetch('/api/budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_id: user?.account_id,
          name: budgetName,
          amount: parseFloat(budgetAmount),
        }),
      });
  
      const data = await response.json();
      console.log('Budget response:', data);
  
      if (response.ok) {
        setBudgets(prev => [...prev, { name: budgetName, amount: parseFloat(budgetAmount) }]);
        setBudgetName('');
        setBudgetAmount('');
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('Failed to create budget:', error);
    }
  };

  // Income - "Update Salary"
  const [salaryAmount, setSalaryAmount] = useState('');
  const [salaryOccurrence, setSalaryOccurrence] = useState('365');
  const [customSalaryOccurrence, setCustomSalaryOccurrence] = useState('');

  const updateSalary = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!salaryAmount || !salaryOccurrence) return;

    const salaryNumber = parseFloat(salaryAmount);
    if (isNaN(salaryNumber)) return;

    let salaryOccurrenceNumber: number | null = null;
    if (salaryOccurrence == 'custom') {
      const customNumber = parseInt(customSalaryOccurrence);
      if (isNaN(customNumber)) return;
      salaryOccurrenceNumber = customNumber;
    } else {
      salaryOccurrenceNumber = parseInt(salaryOccurrence);
      if (isNaN(salaryOccurrenceNumber)) return;
    }

    setDisIncome((prev) => (prev + salaryNumber));
  };


  // Income - "Add Income"
  const [disIncome, setDisIncome] = useState(0);
  const [newIncome, setNewIncome] = useState('');

  const addIncome = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newIncome) return;

    const incomeNumber = parseFloat(newIncome);
    if (isNaN(incomeNumber)) return;

    setDisIncome((prev) => (prev + incomeNumber));

    setNewIncome('');
  };

  // Payment 
  type Payment = {
    budget: Budget;
    amount: number;
    occurrence: number;
  }

  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentBudget, setPaymentBudget] = useState<Budget>();
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentOccurrence, setPaymentOccurrence] = useState('');
  const [customOccurrence, setCustomOccurrence] = useState('');

  const addPayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!paymentBudget || !paymentAmount || !paymentOccurrence) return;

    const paymentAmountNumber = parseFloat(paymentAmount);
    if (isNaN(paymentAmountNumber)) return;

    let paymentOccurrenceNumber: number | null = null;
    if (paymentOccurrence === 'custom') {
      const customNumber = parseInt(customOccurrence);
      if (isNaN(customNumber)) return;
      paymentOccurrenceNumber = customNumber;
    } else {
      paymentOccurrenceNumber = parseInt(paymentOccurrence);
      if (isNaN(paymentOccurrenceNumber)) return;
    }

    setPayments([...payments, { budget: paymentBudget, amount: paymentAmountNumber, occurrence: paymentOccurrenceNumber }]);
    setPaymentAmount('');
    setPaymentOccurrence('');
    setCustomOccurrence('');
    setPaymentBudget(undefined);
  };

  function dashboardReturn(view : String){
    if((activeView == 'income' && view == "income")||  (activeView == 'budget' && view == "budget") || (activeView == 'payment' && view == "payment")){
      setActiveView('dashboard');
    }
    else{
      if(view == "income"){
        setActiveView('income');
      }
      if(view == "budget"){
        setActiveView('budget');
      }
      if(view == "payment"){
        setActiveView('payment');
      }
    }
  }

  const getOccurrenceAbbreviation = (occurrence: number): string => {
    switch (occurrence) {
      case 7:
        return '/W';
      case 14:
        return '/BW';
      case 30:
        return '/M';
      case 365:
        return '/Y';
      default:
        return `/${occurrence}D`;
    }
  };

  const data = {
    labels: budgets.map((budget) => budget.name),
    datasets: [
      {
        label: '',
        data: budgets.map((budget) => budget.amount),
        backgroundColor: ['#E2B7F8', '#D1E8F9', '#D7A8F5', '#A0D8F1', '#7c8cfd'],
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
      },
      centerText: {
        text: `$${disIncome}`
      }
    },
    cutout: '70%',
  };


  if (!isClient) {
    return null; // Don't render anything on the server side
  }

  return (
    <div className="font-[family-name:var(--font-coustard)] bg-violet-200 flex space-x-8 p-8">
      {/* Left Column */}
      <div className="w-1/2">
      <h2 className="text-4xl text-center font-semibold font-[family-name:var(--font-coustard)] m-3">Welcome, {user?.first_name}</h2>
        <div className="flex justify-center pt-3 pb-3">
          <div className="object-contain w-[50%]">
            <Doughnut ref={chartRef} data={data} options={options} />

          </div>
        </div>
        <div className="bg-white p-4 shadow-lg rounded-xl">
          <div className="justify-center bg-gray-100 p-4 m-2 shadow-lg rounded-lg">
            <div className="flex justify-center">
              <button className="text-[#7c8cfd]" onClick={() => setActiveView('dashboard')}>Dashboard</button>
            </div>
            <div className="shadow-lg rounded-lg flex">
              <button className="bg-blue-100 text-blue-400 flex justify-center w-full p-2 m-2 rounded-lg cursor-pointer"
                onClick={() => dashboardReturn("income")}>Income</button>
              <button className="bg-blue-100 text-blue-400 flex justify-center w-full p-2 m-2 rounded-lg cursor-pointer"
                onClick={() => dashboardReturn("budget")}>Budget</button>
              <button className="bg-blue-100 text-blue-400 flex justify-center w-full p-2 m-2 rounded-lg cursor-pointer" 
                onClick={() => dashboardReturn("payment")}>Payment</button>
            </div>
          </div>
          {/* Quick Glance and Red Flags Section */}
          {activeView === 'dashboard' && (
            <div className="bg-gray-100 p-4 m-4 shadow-lg rounded-lg">
              <p className="text-[#7c8cfd] flex justify-center">Quick Glance</p>
              <div> {quickGlance.map((msg, index) => (
                <p key={index} className="text-gray-600 text-sm flex justify-center">{msg}</p>
              ))}
              </div>
            </div>
          )}

          {activeView === 'dashboard' && (
            <div className="bg-gray-100 p-4 m-4 shadow-lg rounded-lg">
              <p className="text-[#7c8cfd] flex justify-center">Red Flags</p>
              <div className="shadow-lg rounded-lg flex">
                {/* <p className="bg-blue-100 text-blue-400 flex justify-center w-1/4 p-4 m-2 rounded-lg">{redPrice}</p> */}
                <p className="text-gray-600 text-sm flex justify-center w-full p-2 m-2 rounded-lg">{redFlags}</p>
              </div>
            </div>
          )}

          {/* Income Section */}
          {activeView === 'income' && (
            <div className="text-center bg-gray-100 p-4 m-2 shadow-lg rounded-lg ">
              <form onSubmit={updateSalary}>
                <input type="submit" className="bg-blue-100 text-blue-400 p-2 m-2 rounded-lg cursor-pointer"
                  value="Update Salary" />
                <input type="text" className="w-1/3 p-2 m-2 bg-white text-gray-600 text-center"
                  placeholder="$70,000" value={salaryAmount} onChange={(e) => setSalaryAmount(e.target.value)} />
                {/* Salary Occurrence Select */}
                <select
                  className="bg-white p-2 m-1 border rounded-lg text-blue-400"
                  value={salaryOccurrence || ''}
                  onChange={(e) => setSalaryOccurrence(e.target.value)}
                >
                  <option value="" disabled hidden>Select Occurrence</option>
                  <option value="7">Weekly</option>
                  <option value="14">Bi-weekly</option>
                  <option value="30">Monthly</option>
                  <option value="365">Yearly</option>
                  <option value="custom">Custom</option>
                </select>

                {salaryOccurrence === 'custom' && (
                  <input
                    type="number"
                    min="1"
                    className="w-1/10 bg-white p-2 m-2 text-black"
                    placeholder="1"
                    value={customSalaryOccurrence}
                    onChange={(e) => setCustomSalaryOccurrence(e.target.value)}
                  />
                )}
              </form>
              <form onSubmit={addIncome}>
                <input type="submit" className="bg-blue-100 text-blue-400 p-2 m-2 rounded-lg cursor-pointer"
                  value="Add Income" />
                <input type="text" className="w-1/3 p-2 m-2 bg-white text-gray-600 text-center"
                  placeholder="$0" value={newIncome} onChange={(e) => setNewIncome(e.target.value)} />
              </form>
              <button className="bg-blue-100 text-blue-400 text-center items-center p-2 m-2 rounded-lg cursor-pointer" onClick={() => setActiveView('allocation')}>Allocation</button>
          </div>
        )}

          {/* Allocation Section */}
          {activeView === 'allocation' && (
            <div className="bg-gray-100 p-4 m-2 shadow-lg rounded-lg">
              {incomeAlloc.map((alloc, index) => (
                <div key={index} className="flex items-center bg-white p-2 shadow-lg rounded-xl w-full mb-4">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={(alloc * 100).toFixed(0)}
                    onChange={(e) => {
                      const newAlloc = [...incomeAlloc];
                      newAlloc[index] = parseFloat(e.target.value) / 100 || 0;
                      setIncomeAlloc(newAlloc);
                    }}
                    className="w-24 bg-blue-100 text-blue-400 p-2 mr-6 rounded-lg"
                  />
                  <p className="text-blue-400 text-md p-2 w-1/2 rounded-lg">
                    {index === 0 ? 'Disposable Income' : budgets[index - 1]?.name || ''}
                  </p>
                </div>
              ))}

              <p className={`mt-2 text-sm font-medium ${allocCheck ? 'text-green-600' : 'text-red-500'}`}>
                Total: {(totalAlloc * 100).toFixed(2)}% {!allocCheck && '(must equal 100%)'}
              </p>

              <button
                disabled={!allocCheck}
                onClick={() => setActiveView('income')}
                className={`mt-4 px-4 py-2 rounded ${
                  allocCheck
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Save Allocation
              </button>
            </div>
          )}


          {/* Budget Section */}
          {activeView === 'budget' && (
            <div className="bg-gray-100 p-4 m-2 shadow-lg rounded-lg">
              <form onSubmit={(e) => {e.preventDefault(); addBudget; createBudget();}} className="flex flex-wrap justify-center items-center">
                <div className="text-center mb-4">
                  <input type="submit" className="bg-blue-100 text-blue-400 p-2 m-2 rounded-lg cursor-pointer"
                    value="Add Budget" />
                  <input type="text" className="max-w-1/2 p-2 m-2 bg-white text-gray-600 text-center"
                    placeholder="Name" value={budgetName} onChange={(e) => setBudgetName(e.target.value)} />
                  <input type="text" className="max-w-1/4 p-2 m-2 bg-white text-gray-600 text-center"
                    placeholder="$0" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} />
                </div>
              </form>
              <div>
                {budgets.map((budget, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-2 shadow-lg rounded-xl w-full mb-4">
                    <div className="flex items-center">
                      <p className="bg-blue-100 text-blue-400 p-2 mr-6 rounded-lg">${budget.amount}</p>
                      <p className="text-blue-400 text-md p-2 w-1/2 rounded-lg">{budget.name}</p>
                    </div>
                    <button
                      onClick={() => removeBudget(index)}
                      className="text-red-500 px-2 py-1 rounded hover:bg-red-100"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Payment Section */}
          {activeView === 'payment' && (
            <div className="bg-gray-100 p-4 m-2 shadow-lg rounded-lg ">
              <form onSubmit={addPayment}>
                <div className="text-center mb-4">
                  {/* Budget Select */}
                  <select
                    id="budgetDropdown"
                    className="bg-white p-2 m-1 border rounded-lg text-blue-400"
                    value={paymentBudget?.name || ''}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      const selectedBudget = budgets.find((b) => b.name === selectedName);
                      if (selectedBudget) {
                        setPaymentBudget(selectedBudget);
                      }
                    }}
                  >
                    <option value="" disabled hidden>Select Budget</option>
                    {budgets.map((budget, index) => (
                      <option key={index} value={budget.name}>
                        {budget.name}
                      </option>
                    ))}
                  </select>

                  {/* Occurrence Select */}
                  <select
                    className="bg-white p-2 m-1 border rounded-lg text-blue-400"
                    value={paymentOccurrence || ''}
                    onChange={(e) => setPaymentOccurrence(e.target.value)}
                  >
                    <option value="" disabled hidden>Select Occurrence</option>
                    <option value="7">Weekly</option>
                    <option value="14">Bi-weekly</option>
                    <option value="30">Monthly</option>
                    <option value="365">Yearly</option>
                    <option value="custom">Custom</option>
                  </select>

                  {paymentOccurrence === 'custom' && (
                    <input
                      type="number"
                      min="1"
                      className="w-1/10 bg-white p-2 m-2 text-black"
                      placeholder="1"
                      value={customOccurrence}
                      onChange={(e) => setCustomOccurrence(e.target.value)}
                    />
                  )}

                  <input type="text" className="w-1/8 bg-white p-2 m-1 text-black" placeholder="$0" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                  <input type="submit" className="bg-blue-200 p-2 m-2 text-blue-400 rounded-xl cursor-pointer" value="Submit" />

                </div>
              </form>
              <div>
                {payments.map((payment, index) => (
                  <div key={index} className="flex bg-white p-2 shadow-lg rounded-xl w-full mb-4">
                    <p className="text-gray-600 p-2 m-2 rounded-xl w-1/2">{payment.budget.name}</p>
                    <p className="bg-blue-100 p-2 m-2 text-gray-600 rounded-xl">${payment.amount}</p>
                    <p className="bg-blue-100 p-2 m-2 text-gray-600 rounded-xl">{getOccurrenceAbbreviation(payment.occurrence)}</p>
                  </div>
                ))}
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
              <div className="flex w-full p-6">
                {payments.map((payment, index) => (
                  <div key={index} className="flex bg-gray-100 p-2 shadow-lg rounded-xl w-full mb-4">
                    <p className="w-full text-gray-600 p-2 m-2 text-lg rounded-xl w-1/2">{payment.budget.name}</p>
                    <p className="bg-blue-100 p-2 m-2 text-gray-600 rounded-xl">${payment.amount}</p>
                    <p className="bg-blue-100 p-2 m-2 text-gray-600 rounded-xl">{getOccurrenceAbbreviation(payment.occurrence)}</p>

                  </div>
                ))}
              </div>
        </div>
      </div>
    </div>
  );
}
