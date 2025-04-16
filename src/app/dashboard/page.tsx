// src/app/dashboard/page.tsx

// 1. disposable income to work - create a default disposable income as a budget for each user and have it not show up in the circle
// 2. create a feature where users can move the disposable income to their budgets 
// 4. work on income allocations 
// 5. work on redflags and quickglance 

"use client"; // Mark this file as a Client Component

import dynamic from 'next/dynamic';
import { useEffect, useState, useRef } from 'react';

// Import necessary components from Chart.js
import { Chart as ChartJS, Title, Tooltip, ArcElement, CategoryScale, LinearScale, Chart } from 'chart.js';

// Import necessary components for Calendar
import Calendar from 'react-calendar';
import { RRule } from 'rrule';
import 'react-calendar/dist/Calendar.css';
import './calendar.css'
// import { userAgent } from 'next/server'

// DOUGHNUT 
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

  const [selectedDate, setSelectedDate] = useState<DateType | null>(null)
  const [activeStartDate, setActiveStartDate] = useState<DateType>(new Date());

  const [incomeAlloc, setIncomeAlloc] = useState<number[]>([0]);
  const totalAlloc = incomeAlloc.reduce((sum, val) => sum + val, 0);
  const allocCheck = Math.abs(totalAlloc - 1) < 0.001;

  const [activeView, setActiveView] = useState('dashboard');
  const chartRef = useRef<Chart<'doughnut'> | null>(null);

  // USER INFO 
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
  const quickGlance: string[] = []; // "You spent less than 50% of your Groceries budget this month! Update your income allocation in the 'Income' tab.";
  const redFlags: string[] = []; // "Subscriptions Budget has an upcoming payment that will put the budget under $1";
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

  function getQuickGlance() {
    if (budgets.length == 0) {
      quickGlance.push("You have no budgets. Please add budgets in the dashboard!");
    }
    else {
    }
  }
  getQuickGlance();

  // Budget
  type Budget = {
    budget_id: number;
    name: string;
    allocation: number;
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
  }, [budgets, incomeAlloc]);

  const [budgetName, setBudgetName] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');

  async function deleteBudget(id: number) {
    try {
      const response = await fetch(`/api/budget?budget_id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        console.log(data.message);
        setBudgets(prev => prev.filter(budget => budget.budget_id !== id));
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('An error occurred while deleting the budget:', error);
    }
  }

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
          allocation: 0,
          amount: parseFloat(budgetAmount)
        }),
      });

      const data = await response.json();
      console.log('Budget response:', data);

      if (response.ok) {
        setBudgets(prev => [...prev, { budget_id: data.account.budget_id, name: budgetName, allocation: 0, amount: parseFloat(budgetAmount) }]);
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

  // Income - "Add Income"
  const [disIncome, setDisIncome] = useState(0);
  const [newIncome, setNewIncome] = useState('');
  const [income, setIncome] = useState<Income[]>([]);
  type Income = {
    name: string,
    amount: number,
    occurrence: number
  }

  // Get income
  useEffect(() => {
    async function fetchIncome() {
      if (!user) return;

      try {
        const res = await fetch(`/api/income?account_id=${user.account_id}`, {
          method: 'GET',
        });

        const data = await res.json();
        if (res.ok) {
          console.log('Income:', data[0].amount);
          setIncome(data);
          setDisIncome(data[0].amount);
        } else {
          console.error('Failed to fetch budgets:', data.message);
        }
      } catch (error) {
        console.error('Fetch error:', error);
      }
    }

    fetchIncome();
  }, [user]);

  const addIncome = async () => {
    try {
      const response = await fetch('/api/income', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_id: user?.account_id,
          name: "Salary",
          amount: disIncome + parseInt(newIncome),
          occurrence: income.length > 0 ? income[0].occurrence : 365,
        }),
      });
      const data = await response.json();
      console.log('Income response:', data);

      if (response.ok) {
        setDisIncome(data.income.amount);
        console.log("Income created!");
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('Failed to create income:', error);
    }
  };


  // add income to database
  const createIncome = async () => {
    try {
      const response = await fetch('/api/income', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_id: user?.account_id,
          name: "Salary",
          amount: disIncome + parseInt(salaryAmount),
          occurrence: "yearly"
        }),
      });

      const data = await response.json();
      console.log('Income response:', data);

      if (response.ok) {
        setDisIncome(data.income.amount);
        console.log("Income created!");
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('Failed to create income:', error);
    }
  };

  // Payment 
  type Payment = {
    event_id: number;
    budget_id: number;
    event_name: string;
    payment: number;
    occurrence: string;
    start_date: Date;
    end_date: Date;
  }

  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentBudgetID, setPaymentBudgetID] = useState<number | undefined>(undefined);
  const [paymentName, setPaymentName] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentOccurrence, setPaymentOccurrence] = useState('');
  const [paymentStartDate, setPaymentStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [paymentEndDate, setPaymentEndDate] = useState(() => {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    return nextYear.toISOString().split('T')[0];
  });

  useEffect(() => {
    async function fetchPayments() {
      if (!user) return;

      try {
        const res = await fetch(`/api/events?account_id=${user.account_id}`, {
          method: 'GET',
        });

        const data = await res.json();
        if (res.ok) {
          const paymentsWithDates: Payment[] = data.events.map((event: Omit<Payment, 'start_date' | 'end_date'> & {
            start_date: string;
            end_date: string;
          }) => ({
            ...event,
            start_date: new Date(event.start_date),
            end_date: new Date(event.end_date),
          }));

          console.log('Parsed payments:', paymentsWithDates);
          setPayments(paymentsWithDates);
        } else {
          console.error('Failed to fetch payments:', data.message);
        }
      } catch (error) {
        console.error('Payments fetch error:', error);
      }
    }

    fetchPayments();
  }, [user]);


  const createPayment = async () => {
    console.log('Creating payment...');

    if (
      paymentBudgetID == null ||
      !paymentAmount ||
      !paymentOccurrence ||
      !paymentName ||
      !paymentStartDate ||
      !paymentEndDate
    ) {
      console.warn('Missing required fields:');
      return;
    }

    const paymentAmountNumber = parseInt(paymentAmount);
    if (isNaN(paymentAmountNumber)) {
      console.error('Invalid payment amount:', paymentAmount);
      return;
    }

    const startDate = new Date(paymentStartDate);
    const endDate = new Date(paymentEndDate);

    const payload = {
      account_id: user?.account_id,
      budget_id: paymentBudgetID !== undefined ? paymentBudgetID + 1 : undefined,
      event_name: paymentName.trim(),
      payment: paymentAmountNumber,
      occurrence: paymentOccurrence,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    };

    console.log('Sending payload to /api/events:', payload);

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Response from server:', data);

      if (response.ok) {
        console.log('Payment creation successful. Updating local state...');
        const startDate2 = new Date(`${paymentStartDate}T00:00:00`);
        const endDate2 = new Date(`${paymentEndDate}T00:00:00`);

        setPayments(prev => [
          ...prev,
          {
            event_id: data.event?.event_id ?? Math.random(),
            budget_id: paymentBudgetID,
            event_name: paymentName.trim(),
            payment: paymentAmountNumber,
            occurrence: paymentOccurrence,
            start_date: startDate2,
            end_date: endDate2,

          },
        ]);


        console.log(payments);

        // Clear form fields
        setPaymentName('');
        setPaymentAmount('');
        setPaymentOccurrence('');
        setPaymentBudgetID(undefined);

        console.log('Form cleared.');
      } else {
        console.error('Server error:', data.message);
      }
    } catch (error) {
      console.error('Failed to create payment:', error);
    }
  };
  
  async function deletePayment(id: number) {
    try {
      const response = await fetch(`/api/events?event_id=${id}`, {
        method: 'DELETE',
      });
  
      const data = await response.json();
  
      if (response.ok) {
        console.log(data.message);
        setPayments(prev => prev.filter(event => event.event_id !== id)); 
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('An error occurred while deleting the payment:', error);
    }
  }
  

  function dashboardReturn(view: string) {
    if ((activeView == 'income' && view == "income") || (activeView == 'budget' && view == "budget") || (activeView == 'payment' && view == "payment")) {
      setActiveView('dashboard');
    }
    else {
      if (view == "income") {
        setActiveView('income');
      }
      if (view == "budget") {
        setActiveView('budget');
      }
      if (view == "payment") {
        setActiveView('payment');
      }
    }
  }

  // Turn occurrence keyword into a RRule object
  const getRRuleFreq = (occurrence: string) => {
    switch (occurrence) {
      case 'daily': return RRule.DAILY;
      case 'weekly': return RRule.WEEKLY;
      case 'biweekly': return RRule.WEEKLY; // handled specially later
      case 'monthly': return RRule.MONTHLY;
      case 'yearly': return RRule.YEARLY;
      default: return null; // non-repeating returns null
    }
  };

  // Turns 2025-04-15 into APR 15, for use in Calendar blurbs
  function getAbbreviatedDate(date: Date) {
    const monthAbbreviation = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const day = date.getDate();
    return `${monthAbbreviation} ${day}`;
  }

  // Turns 1234 into 1,234.00, for use in formatting currency amounts
  function formatNumber(num: number | undefined | null) {
    if (typeof num !== 'number' || isNaN(num)) return '0.00';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  

  // Fetch nearest payments
  const today = new Date();
  const paymentDateMap = new Map();

  // Iterate through payments to create a map of occurrence dates to payments
  payments.forEach((payment) => {
    const freq = getRRuleFreq(payment.occurrence);

    if (!freq) { // Handle one-time events
      if (payment.start_date > today) {
        paymentDateMap.set(payment.start_date, [payment, payment.start_date]);
      }
    } else {
      const interval = payment.occurrence === "biweekly" ? 2 : 1; // Handle biweekly frequency

      // Create a reoccurrence rule
      const rule = new RRule({
        freq,
        interval,
        dtstart: new Date(payment.start_date),
        until: new Date(payment.end_date),
      });

      // Find all upcoming occurrences
      const occurrences = rule.between(today, payment.end_date, true);

      // Add the first upcoming occurrence to the map
      if (occurrences.length > 0) {
        paymentDateMap.set(occurrences[0], [payment, occurrences[0]]); // Store payment with its occurrence date
      }
    }
  });

  // Sort the map by the occurrence date (keys)
  const nearestPayments = Array.from(paymentDateMap.entries())
    .sort((a, b) => a[0] - b[0]) // sort by nearest
    .slice(0, 2) // select first two
    .map(([, [payment, date]]) => ({ payment, date })); // remap for clarity

  const getOccurrenceAbbreviation = (occurrence: string): string => {
    switch (occurrence) {
      case 'none':
        return 'Once';
      case 'daily':
        return '/D'
      case 'weekly':
        return '/W';
      case 'biweekly':
        return '/BW';
      case 'monthly':
        return '/M';
      case 'yearly':
        return '/Y';
      default:
        return "";
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
      <div className="w-[45%]">
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
              <form onSubmit={(e) => { e.preventDefault(); createIncome(); }}>
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
              <form onSubmit={(e) => { e.preventDefault(); addIncome(); }}>
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
                className={`mt-4 px-4 py-2 rounded ${allocCheck
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
              <form onSubmit={(e) => { e.preventDefault(); createBudget(); }} className="flex flex-wrap justify-center items-center">
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
                      onClick={() => deleteBudget(budget.budget_id)}
                      className="text-red-500 px-2 py-1 rounded hover:bg-red-100 cursor-pointer"
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
              <form onSubmit={(e) => { e.preventDefault(); createPayment(); }}>
                <div className="text-center mb-4">
                  <div className="flex flex-wrap justify-between my-2">
                    <div className="w-full sm:w-1/2 px-2">
                      <label className="block text-sm text-gray-600 mb-1">Budget</label>
                      <select
                        id="budgetDropdown"
                        className="w-full bg-white p-2 border rounded-lg text-blue-400 text-center"
                        value={paymentBudgetID !== undefined ? budgets[paymentBudgetID]?.name : ''} 
                        onChange={(e) => {
                          const selectedIndex = e.target.selectedIndex - 1; 
                          setPaymentBudgetID(selectedIndex >= 0 ? selectedIndex : undefined);  
                        }}
                      >
                        <option value="" disabled hidden>Select Budget</option>
                        {budgets.map((budget, index) => (
                          <option key={index} value={budget.name}>
                            {budget.name}
                          </option>
                        ))}
                      </select>




                    </div>

                    <div className="w-full sm:w-1/2 px-2">
                      <label className="block text-sm text-gray-600 mb-1">Occurrence</label>
                      <select
                        className="w-full bg-white p-2 border rounded-lg text-blue-400 text-center"
                        value={paymentOccurrence || ''}
                        onChange={(e) => setPaymentOccurrence(e.target.value)}
                      >
                        <option value="" disabled hidden>Select Occurrence</option>
                        <option value="none">Just Once</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-between my-2">
                    <div className="w-full sm:w-1/2 px-2">
                      <label className="block text-sm text-gray-600 mb-1">Name</label>
                      <input
                        type="text"
                        className="w-full bg-white p-2 text-black rounded text-center"
                        placeholder="ex. Grocery Shopping"
                        value={paymentName}
                        onChange={(e) => setPaymentName(e.target.value)}
                      />
                    </div>
                    <div className="w-full sm:w-1/2 px-2">
                      <label className="block text-sm text-gray-600 mb-1">Amount</label>
                      <input
                        type="text"
                        className="w-full bg-white p-2 text-black rounded text-center"
                        placeholder="$0"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-between my-2">
                    <div className="w-full sm:w-1/2 px-2">
                      <label htmlFor="startDate" className="block text-sm text-gray-600 mb-1">Start Date</label>
                      <input
                        id="startDate"
                        type="date"
                        className="bg-white p-2 text-black rounded text-center"
                        value={paymentStartDate}
                        onChange={(e) => setPaymentStartDate(e.target.value)}
                      />
                    </div>
                    <div className="w-full sm:w-1/2 px-2">
                      <label htmlFor="endDate" className="block text-sm text-gray-600 mb-1">End Date</label>
                      <input
                        id="endDate"
                        type="date"
                        className=" bg-white p-2 text-black rounded text-center"
                        value={paymentEndDate}
                        onChange={(e) => setPaymentEndDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="my-3">
                    <input
                      type="submit"
                      className="bg-blue-200 px-6 py-2 text-blue-400 rounded-xl cursor-pointer"
                      value="Add Payment"
                    />
                  </div>
                </div>
              </form>
              <div>
                {payments.map((payment, index) => (
                  <div key={index} className="flex bg-white p-2 shadow-lg rounded-xl w-full mb-4 items-center">
                    <div className="flex-grow">
                      <p className="text-gray-600 p-2 m-2 rounded-xl font-semibold">
                        {payment.event_name}
                      </p>
                      <p className="bg-blue-100 p-2 m-2 text-gray-600 rounded-xl inline-block">
                        {budgets[payment.budget_id].name}
                      </p>
                      <p className="bg-blue-100 p-2 m-2 text-gray-600 rounded-xl inline-block">
                        ${payment.payment}
                      </p>
                      <p className="bg-blue-100 p-2 m-2 text-gray-600 rounded-xl inline-block">
                        {getOccurrenceAbbreviation(payment.occurrence)}
                      </p>
                      <p className="bg-blue-100 p-2 m-2 text-gray-600 rounded-xl inline-block">
                        {new Date(payment.start_date).toLocaleDateString()} to {new Date(payment.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => deletePayment(payment.event_id)}
                      className="text-red-500 px-2 py-1 rounded hover:bg-red-100 cursor-pointer self-start"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Right Column (Rounded Box) */}
      <div className="w-[55%]">
        <div className="bg-white p-6 rounded-4xl shadow-lg flex flex-col justify-center items-center">
          <Calendar className="mb-5"

            // Create update functions for Calendar functionality
            value={selectedDate}
            onChange={(value) => {
              const date = Array.isArray(value) ? value[0] : value;
              if (
                date instanceof Date &&
                selectedDate instanceof Date &&
                date.toDateString() === selectedDate.toDateString()
              ) {
                setSelectedDate(null);
                if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
              }
              else {
                setSelectedDate(date);
              }
            }}
            onActiveStartDateChange={({ activeStartDate }) => {
              setActiveStartDate(activeStartDate);
              setSelectedDate(null);
            }}
            activeStartDate={activeStartDate || undefined}

            // Begin building tile content
            tileContent={({ date }) => {
              // Set variables based on tile information
              const day = date.getDate();
              // Check if tile is validly selected
              const isSelected =
                selectedDate instanceof Date &&
                selectedDate.toDateString() === date.toDateString() &&
                selectedDate instanceof Date && activeStartDate instanceof Date &&
                selectedDate.getMonth() === activeStartDate.getMonth() && selectedDate.getFullYear() === activeStartDate.getFullYear() &&
                selectedDate.toDateString() === date.toDateString();

              // Check which payments occur on this tile's date
              const paymentsOnDate = payments.filter(payment => {
                // For each payment, calculate its occurrence
                const freq = getRRuleFreq(payment.occurrence);

                if (!freq) { // handle one-time events
                  return payment.start_date.toDateString() === date.toDateString();
                }

                const interval = payment.occurrence === "biweekly" ? 2 : 1; // handle biweekly frequency

                // Create a reoccurrence rule
                const rule = new RRule({
                  freq,
                  interval,
                  dtstart: payment.start_date,
                  until: payment.end_date,
                })

                // Match selected tile's date to occurrences
                const occurrences = rule.between(
                  new Date(date.setHours(0, 0, 0, 0)),
                  new Date(date.setHours(23, 59, 59, 999)),
                  true // inclusive
                );

                // Filter out results in paymentsOnDate that don't occur today
                return occurrences.length > 0;
              })

              // Return tile with content
              return (
                <div className="tile relative overflow-visible flex flex-col flex-grow justify-center">
                  <div className="tile-date-number rounded-full">{day}</div>

                  {/* Display budget names for any payment event on the tile */}
                  <div className={`tile-content pt-2.5 pb-1.5 ${paymentsOnDate.length ? "" : "hidden"} font-[family-name:var(--font-coustard)]`}>
                    {paymentsOnDate.map((payment, index) => (
                      <div key={index} className="rounded-2xl bg-[#ebebeb] p-1 mb-1 overflow-hidden whitespace-nowrap text-ellipsis">
                        {budgets[payment.budget_id].name}
                      </div>
                    ))}
                  </div>

                  {/* Show expanded info if selected */}
                  {isSelected && paymentsOnDate.length !== 0 && (
                    <div className={`absolute z-50 w-[250%] top-full left-0 -translate-x-[30%] rounded-2xl 
                    bg-gray-100 shadow-[0_6px_6px_rgba(0,0,0,0.35)] p-4 mt-1 ${paymentsOnDate.length ? "" : "hidden"} flex flex-col items-center gap-2`}>
                      {paymentsOnDate.map((payment, index) => (
                        <div key={index} className="w-full bg-gray-200 p-3 rounded-full flex items-center font-[family-name:var(--font-coustard)]">
                          <p className="bg-white py-2 px-5 rounded-full text-lg text-[#7c8cfd] mr-5">${formatNumber(payment.payment)}</p>
                          <p className="text-md text-[#362d64] flex flex-grow justify-center text-center">{payment.event_name}</p>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              );
            }}
          />

          {/* Create list of upcoming payments below Calendar */}

          <div className="flex flex-col w-full items-center">
            {nearestPayments.map((paymentInfo, index) => (
              <div key={index} className="w-3/4 bg-gray-200 m-1.5 p-3 rounded-full flex items-center font-[family-name:var(--font-coustard)]">
                <p className="bg-white py-2 px-5 rounded-full text-l text-[#7c8cfd] mr-5">{getAbbreviatedDate(paymentInfo.date)}</p>
                <p className="text-xl text-[#362d64] flex flex-grow justify-center text-center">{paymentInfo.payment.event_name}: ${formatNumber(paymentInfo.payment.payment)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
