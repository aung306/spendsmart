// src/app/dashboard/page.tsx

// 1. disposable income to work - create a default disposable income as a budget for each user and have it not show up in the circle
// 2. create a feature where users can move the disposable income to their budgets 
// 4. work on income allocations 
// 6. figure out how to do reoccurring salary only and not income
// 5. work on redflags and quickglance 

"use client"; // Mark this file as a Client Component

import dynamic from 'next/dynamic';
import { useEffect, useState, useRef} from 'react';

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

  // Budget
  type Budget = {
    budget_id : number;
    name: string;
    amount: number;
    allocation: number;
  }

  const [allocation, setAllocation] = useState('');

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

  // const addBudget = (e: React.FormEvent<HTMLFormElement>) => {
    // e.preventDefault();
    // if (!budgetName || !budgetAmount) return;

    // const amountNumber = parseFloat(budgetAmount);
    // if (isNaN(amountNumber)) return;

    // setBudgets([...budgets, { name: budgetName, amount: amountNumber }]);

    // setBudgetName('');
    // setBudgetAmount('');
  // };
  
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
        amount: parseInt(budgetAmount),  
        allocation: parseInt(allocation),  
      }),
    });

    const data = await response.json();
    console.log('Budget response:', data);

    if (response.ok) {
      setBudgets(prev => [
        ...prev,
        { 
          budget_id: data.budget_id,  
          name: budgetName, 
          amount: parseFloat(budgetAmount),
          allocation: parseFloat(allocation), 
        }
      ]);

      setBudgetName('');
      setBudgetAmount('');
      setIncomeAlloc(prev => [...prev, 0]);
    } else {
      console.error(data.message);
    }
  } catch (error) {
    console.error('Failed to create budget:', error);
  }
};


  // console.log("testing budgets array: ", budgets);

  // const updateSalary = (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();

  //   if (!salaryAmount || !salaryOccurrence) return;

  //   const salaryNumber = parseFloat(salaryAmount);
  //   if (isNaN(salaryNumber)) return;

  //   let salaryOccurrenceNumber: number | null = null;
  //   if (salaryOccurrence == 'custom') {
  //     const customNumber = parseInt(customSalaryOccurrence);
  //     if (isNaN(customNumber)) return;
  //     salaryOccurrenceNumber = customNumber;
  //   } else {
  //     salaryOccurrenceNumber = parseInt(salaryOccurrence);
  //     if (isNaN(salaryOccurrenceNumber)) return;
  //   }

  //   setDisIncome((prev) => (prev + salaryNumber));
  // };


  // Income - "Update Salary"
  //user input
  const [salaryAmount, setSalaryAmount] = useState('');
  const [salaryOccurrence, setSalaryOccurrence] = useState('365');
  const [customSalaryOccurrence, setCustomSalaryOccurrence] = useState('');
  const [newIncome, setNewIncome] = useState('');
  // data from query
  const [income, setIncome] = useState<Income[]>([]);
  // total, only inc, only sal
  const [displayIncome, setDisplayIncome] = useState(0);
  const [inc, setInc] = useState(0);
  const [sal, setSal] = useState(0);
  type Income = {
    name : string, 
    amount : number,
    occurrence : number
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
          let display = 0;
          for (let i = 0; i < data.length; i++){
            console.log("name: ", data[i].name);
            if (data[i].name == "Salary"){
              setSal(data[i].amount);
            }
            if (data[i].name == "Income"){
              setInc(data[i].amount);
            }
            display += data[i].amount;
          }
          setDisplayIncome(display);
          setIncome(data);
        } else {
          console.error('Failed to fetch budgets:', data.message);
        }
      } catch (error) {
        console.error('Fetch error:', error);
      }
    }

    fetchIncome();
  }, [user]);

// add income to database
  const addIncome = async () => {
    try {
      const response = await fetch('/api/income', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_id: user?.account_id,
          name: "Income",
          amount: displayIncome + parseInt(newIncome),
          occurrence: income.length > 0 ? income[0].occurrence : 365,
        }),
      });
      const data = await response.json();
      console.log('Income response:', data);
  
      if (response.ok) {
        setDisplayIncome(displayIncome + parseInt(newIncome));
        setInc(inc + parseInt(newIncome));
        console.log("Income created!");
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('Failed to create income:', error);
    }
  };

  // update salary to database
  const updateSalary = async () => {
    try {
      const response = await fetch('/api/income', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_id: user?.account_id,
          name: "Salary",
          amount: displayIncome + parseInt(salaryAmount),
          occurrence: salaryOccurrence === "custom" ? parseInt(customSalaryOccurrence) : parseInt(salaryOccurrence),
        }),
      });
  
      const data = await response.json();
      console.log('Income response:', data);
  
      if (response.ok) {
        setDisplayIncome(displayIncome + parseInt(salaryAmount));
        setSal(sal + parseInt(salaryAmount));
        console.log("Salary updated!");
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('Failed to create income:', error);
    }
  };

  // Payment 
  type Payment = {
    budget: Budget;
    amount: number;
    occurrence: number;
  }

  // TEST DATA -- REPLACE WITH REAL DB ROUTES
  type PaymentTest = {
    budget: Budget;
    name: string;
    amount: number;
    occurrence: string;
    startDate: Date;
    endDate: Date;
  }
  const budgetsTest = [
    { budget_id: 1, name: "Groceries", amount: 500, allocation: 25 },
    { budget_id: 2, name: "Entertainment", amount: 300, allocation: 25 },
    { budget_id: 3, name: "Utilities", amount: 200, allocation: 25 },
    { budget_id: 4, name: "Savings", amount: 1000, allocation: 25 },
  ];
  
  // Sample PaymentTest events
  const paymentsTest : PaymentTest[] = [
    {
      budget: budgetsTest[0],
      name: "Weekly Grocery Shopping",
      amount: 75,
      occurrence: "weekly",
      startDate: new Date("2025-04-01"),
      endDate: new Date("2025-12-31"),
    },
    {
      budget: budgetsTest[1],
      name: "Monthly Movie Subscription",
      amount: 15,
      occurrence: "monthly",
      startDate: new Date("2025-03-15"),
      endDate: new Date("2025-09-15"),
    },
    {
      budget: budgetsTest[2],
      name: "Electricity Bill",
      amount: 100,
      occurrence: "monthly",
      startDate: new Date("2025-04-10"),
      endDate: new Date("2025-10-10"),
    },
    {
      budget: budgetsTest[3],
      name: "Paycheck Savings",
      amount: 10,
      occurrence: "biweekly",
      startDate: new Date("2025-04-01"),
      endDate: new Date("2025-04-30"),
    },
    {
      budget: budgetsTest[0],
      name: "Biweekly Bulk Grocery Shopping",
      amount: 120,
      occurrence: "biweekly",
      startDate: new Date("2025-04-05"),
      endDate: new Date("2025-10-05"),
    },
    {
      budget: budgetsTest[2],
      name: "Yearly Insurance Payment",
      amount: 1200,
      occurrence: "yearly",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
    },
    {
      budget: budgetsTest[1],
      name: "One-Time Concert Ticket",
      amount: 50,
      occurrence: "none",
      startDate: new Date("2025-04-14"),
      endDate: new Date("2025-04-14"),
    }
  ];

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

  function dashboardReturn(view : string){
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
  function formatNumber(num: number) {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Fetch nearest payments
  const today = new Date();
  const paymentDateMap = new Map();

  // Iterate through payments to create a map of occurrence dates to payments
  paymentsTest.forEach((payment) => {
    const freq = getRRuleFreq(payment.occurrence);
  
    if (!freq) { // Handle one-time events
      if (payment.startDate > today) {
        paymentDateMap.set(payment.startDate, [payment, payment.startDate]);
      }
    } else {
      const interval = payment.occurrence === "biweekly" ? 2 : 1; // Handle biweekly frequency
  
      // Create a reoccurrence rule
      const rule = new RRule({
        freq,
        interval,
        dtstart: payment.startDate,
        until: payment.endDate,
      });
  
      // Find all upcoming occurrences
      const occurrences = rule.between(today, payment.endDate, true);
  
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
        text: `$${displayIncome}`
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
              <form onSubmit={(e) => {e.preventDefault(); updateSalary();}}>
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
              <form onSubmit={(e) => {e.preventDefault(); addIncome();}}>
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
              <form onSubmit={(e) => {e.preventDefault(); createBudget();}} className="flex flex-wrap justify-center items-center">
                <div className="text-center mb-4">
                  <input type="submit" className="bg-blue-100 text-blue-400 p-2 m-2 rounded-lg cursor-pointer"
                    value="Add Budget" />
                  <input type="text" className="max-w-1/2 p-2 m-2 bg-white text-gray-600 text-center"
                    placeholder="Name" value={budgetName} onChange={(e) => setBudgetName(e.target.value)} />
                  <input type="text" className="max-w-1/4 p-2 m-2 bg-white text-gray-600 text-center"
                    placeholder="$0" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} />
                  <input type="text" className="max-w-1/4 p-2 m-2 bg-white text-gray-600 text-center"
                  placeholder="100%" value={allocation} onChange={(e) => setAllocation(e.target.value)} />
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
              const paymentsOnDate = paymentsTest.filter(payment => {
                // For each payment, calculate its occurrence
                const freq = getRRuleFreq(payment.occurrence);

                if (!freq) { // handle one-time events
                  return payment.startDate.toDateString() === date.toDateString();
                }

                const interval = payment.occurrence === "biweekly" ? 2 : 1; // handle biweekly frequency

                // Create a reoccurrence rule
                const rule = new RRule ({
                    freq,
                    interval,
                    dtstart: payment.startDate,
                    until: payment.endDate,
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
                        {payment.budget.name}
                        </div>
                    ))}
                  </div>

                  {/* Show expanded info if selected */}
                  {isSelected && paymentsOnDate.length !== 0 && (
                    <div className={`absolute z-50 w-[250%] top-full left-0 -translate-x-[30%] rounded-2xl 
                    bg-gray-100 shadow-[0_6px_6px_rgba(0,0,0,0.35)] p-4 mt-1 ${paymentsOnDate.length ? "" : "hidden"} flex flex-col items-center gap-2`}>
                      {paymentsOnDate.map((payment, index) => (
                        <div key={index} className="w-full bg-gray-200 p-3 rounded-full flex items-center font-[family-name:var(--font-coustard)]">
                          <p className="bg-white py-2 px-5 rounded-full text-lg text-[#7c8cfd] mr-5">${formatNumber(payment.amount)}</p>
                          <p className="text-md text-[#362d64] flex flex-grow justify-center text-center">{payment.name}</p>
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
                    <p className="text-xl text-[#362d64] flex flex-grow justify-center text-center">{paymentInfo.payment.name}: ${formatNumber(paymentInfo.payment.amount)}</p>
                </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
