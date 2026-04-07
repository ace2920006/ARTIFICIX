import { useState, useEffect, useRef } from 'react';
import '../styles/heparth-dashboard.css';
import Chart from 'chart.js/auto';

interface UserData {
  name: string;
  email?: string;
  businessType?: string;
  businessName?: string;
  customerId: number;
}

interface FinancialData {
  investment: number[];
  output: number[];
  transactions: number;
}

const HeparthDashboard = () => {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [isLoginPage, setIsLoginPage] = useState(true);
  const [isSignupPage, setIsSignupPage] = useState(false);
  const [chartInstance, setChartInstance] = useState<Chart | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const financialData: Record<number, FinancialData> = {
    2023: {
      investment: [5000, 5200, 5500, 5800, 6000, 6500, 7000, 7500, 8000, 8500, 9000, 10000],
      output: [4500, 4800, 5200, 5600, 6100, 6800, 7500, 8200, 8900, 9600, 10500, 11500],
      transactions: 1250,
    },
    2024: {
      investment: [10000, 10500, 11000, 11500, 12000, 13000, 14000, 15000, 16000, 17000, 18000, 19500],
      output: [11500, 12500, 13500, 14500, 15800, 17200, 18800, 20500, 22500, 24500, 26800, 29500],
      transactions: 2450,
    },
    2025: {
      investment: [19500, 20000, 21000, 22000, 23500, 25000, 27000, 29000, 31500, 34000, 37000, 40000],
      output: [29500, 31500, 34000, 37000, 40500, 44500, 49000, 54000, 59500, 65500, 72000, 80000],
      transactions: 3800,
    },
  };

  const channelRevenue = {
    website: 12450,
    whatsapp: 8230,
    calls: 5670,
    emails: 3890,
  };

  const [accountSidebarOpen, setAccountSidebarOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState<number>(2024);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('loginEmail') as string;
    const businessType = formData.get('businessType') as string;

    if (email && businessType) {
      const user = {
        name: email.split('@')[0],
        email,
        businessType,
        customerId: Math.floor(Math.random() * 900000000) + 100000000,
      };
      setCurrentUser(user);
      setIsLoginPage(false);
      updateDashboard(user);
    }
  };

  const handleSignup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const businessName = formData.get('businessName') as string;
    const ownerName = formData.get('ownerName') as string;
    const email = formData.get('signupEmail') as string;

    if (businessName && ownerName && email) {
      const user = {
        name: ownerName,
        businessName,
        email,
        customerId: Math.floor(Math.random() * 900000000) + 100000000,
      };
      setCurrentUser(user);
      setIsSignupPage(false);
      setIsLoginPage(false);
      updateDashboard(user);
    }
  };

  const updateDashboard = (user: UserData) => {
    initializeChart(currentYear);
  };

  const initializeChart = (year: number) => {
    if (!canvasRef.current) return;

    const data = financialData[year];
    if (!data) return;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (chartInstance) {
      chartInstance.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const newChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Investment',
            data: data.investment,
            borderColor: '#e76f51',
            backgroundColor: 'rgba(231, 111, 81, 0.1)',
            tension: 0.4,
            fill: true,
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: 'Output',
            data: data.output,
            borderColor: '#2d6a4f',
            backgroundColor: 'rgba(45, 106, 79, 0.1)',
            tension: 0.4,
            fill: true,
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: { size: 14, weight: 'bold' },
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `${context.dataset.label}: $${context.raw?.toLocaleString()}`;
              },
            },
          },
        },
        scales: {
          y: {
            ticks: {
              callback: function (value) {
                return '$' + value.toLocaleString();
              },
            },
          },
        },
      },
    });

    setChartInstance(newChart);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoginPage(true);
    setAccountSidebarOpen(false);
    setNotificationPanelOpen(false);
  };

  const handleYearChange = (year: number) => {
    setCurrentYear(year);
    initializeChart(year);
  };

  // Calculate stats
  const data = financialData[currentYear];
  const totalInvestment = data.investment.reduce((a, b) => a + b, 0);
  const totalOutput = data.output.reduce((a, b) => a + b, 0);
  const profit = totalOutput - totalInvestment;
  const loss = profit < 0 ? Math.abs(profit) : 0;

  if (isLoginPage) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-logo">
            <img
              src="https://image2url.com/r2/default/images/1775541256938-f76a53f1-b02f-4073-906f-9f9d329c1d58.png"
              alt="Heparth-India Logo"
            />
            <h2>Heparth-India</h2>
            <p>Enterprise Order Management System</p>
          </div>
          {!isSignupPage ? (
            <form onSubmit={handleLogin}>
              <div className="input-group">
                <i className="fas fa-user"></i>
                <input
                  type="text"
                  name="loginEmail"
                  placeholder="Business Email / Username"
                  required
                />
              </div>
              <div className="input-group">
                <i className="fas fa-lock"></i>
                <input type="password" placeholder="Password" required />
              </div>
              <div className="input-group">
                <select name="businessType" required>
                  <option value="">Select Business Type</option>
                  <option value="individual">Individual Entrepreneur</option>
                  <option value="company">Private Limited Company</option>
                  <option value="organization">Non-Profit Organization</option>
                  <option value="startup">Startup</option>
                </select>
              </div>
              <button type="submit" className="login-btn">
                Sign In →
              </button>
              <p className="signup-text">
                New to Heparth-India?{' '}
                <a href="#" onClick={() => setIsSignupPage(true)}>
                  Start for free
                </a>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignup}>
              <div className="input-group">
                <i className="fas fa-building"></i>
                <input type="text" name="businessName" placeholder="Business Name" required />
              </div>
              <div className="input-group">
                <i className="fas fa-user-tie"></i>
                <input type="text" name="ownerName" placeholder="Owner Name" required />
              </div>
              <div className="input-group">
                <i className="fas fa-envelope"></i>
                <input type="email" name="signupEmail" placeholder="Email Address" required />
              </div>
              <div className="input-group">
                <i className="fas fa-phone"></i>
                <input type="tel" placeholder="Phone Number" required />
              </div>
              <div className="input-group">
                <i className="fas fa-lock"></i>
                <input type="password" placeholder="Password" required />
              </div>
              <button type="submit" className="login-btn">
                Start for Free →
              </button>
              <p className="signup-text">
                Already have an account?{' '}
                <a href="#" onClick={() => setIsSignupPage(false)}>
                  Sign In
                </a>
              </p>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'block' }}>
      {/* Top Navigation Bar */}
      <header className="main-header">
        <div className="header-container">
          <div className="logo-section">
            <img
              src="https://image2url.com/r2/default/images/1775541256938-f76a53f1-b02f-4073-906f-9f9d329c1d58.png"
              alt="Logo"
              className="header-logo"
            />
            <span className="brand-name">Heparth-India</span>
          </div>
          <nav className="main-nav">
            <a href="#" className="nav-link">
              Contact Us
            </a>
            <a href="#" className="nav-link" onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}>
              <i className="fas fa-bell"></i>
              <span className="badge">3</span>
            </a>
            <a href="#" className="nav-link">
              <i className="fas fa-question-circle"></i>
            </a>
            <a href="#" className="nav-link" onClick={() => setAccountSidebarOpen(!accountSidebarOpen)}>
              <i className="fas fa-user-circle"></i>
              <span>{currentUser?.name?.split(' ')[0] || 'Account'}</span>
            </a>
            <a href="#" className="nav-link">
              <i className="fas fa-shopping-cart"></i>
              <span className="badge">0</span>
            </a>
          </nav>
        </div>
      </header>

      {/* Welcome Bar */}
      <div className="welcome-bar">
        <div className="welcome-content">
          <i className="fas fa-hand-peace"></i>
          <h3>Hey, <span>{currentUser?.name || 'Business Owner'}</span>!</h3>
          <p>Welcome back to Heparth-India - Your Business Growth Partner</p>
        </div>
      </div>

      {/* Account Sidebar */}
      <div className={`account-sidebar ${accountSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          <div className="sidebar-header">
            <i className="fas fa-user-circle"></i>
            <h3>{currentUser?.name || 'User Name'}</h3>
          </div>
          <div className="customer-info">
            <p>Customer #: <span>{currentUser?.customerId || '694548349'}</span></p>
            <p>PIN: <span>••••••</span> <button className="pin-btn">View</button></p>
          </div>
          <hr />
          <div className="sidebar-menu">
            <a href="#"><i className="fas fa-box"></i> My Products</a>
            <a href="#"><i className="fas fa-sync-alt"></i> Renewals & Billing</a>
            <a href="#"><i className="fas fa-cog"></i> Account Settings</a>
            <h4 className="inbox-title">INBOX LINKS</h4>
            <a href="#"><i className="fas fa-envelope"></i> Sign in to Office 365 Email</a>
            <a href="#"><i className="fas fa-globe"></i> Sign in to GoDaddy Webmail</a>
            <a href="#" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> Sign Out
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Live Graph Section */}
        <div className="graph-section">
          <h2><i className="fas fa-chart-line"></i> Financial Performance Dashboard</h2>
          <div className="graph-controls">
            <button
              className={`year-btn ${currentYear === 2023 ? 'active' : ''}`}
              onClick={() => handleYearChange(2023)}
            >
              2023
            </button>
            <button
              className={`year-btn ${currentYear === 2024 ? 'active' : ''}`}
              onClick={() => handleYearChange(2024)}
            >
              2024
            </button>
            <button
              className={`year-btn ${currentYear === 2025 ? 'active' : ''}`}
              onClick={() => handleYearChange(2025)}
            >
              2025
            </button>
          </div>
          <canvas ref={canvasRef} width="800" height="400"></canvas>
          <div className="stats-summary">
            <div className="stat-item">
              <span>Total Investment</span>
              <strong>${totalInvestment.toLocaleString()}</strong>
            </div>
            <div className="stat-item">
              <span>Total Output</span>
              <strong>${totalOutput.toLocaleString()}</strong>
            </div>
            <div className="stat-item">
              <span>Profit</span>
              <strong className="profit">${profit.toLocaleString()}</strong>
            </div>
            <div className="stat-item">
              <span>Loss</span>
              <strong className="loss">${loss.toLocaleString()}</strong>
            </div>
            <div className="stat-item">
              <span>Transactions</span>
              <strong>{data.transactions.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Revenue Generation Channels */}
        <div className="revenue-section">
          <h2><i className="fas fa-chart-pie"></i> Revenue Generation Channels</h2>
          <div className="channels-grid">
            <div className="channel-card">
              <i className="fas fa-globe"></i>
              <h3>Official Website</h3>
              <p className="revenue-amount">${channelRevenue.website.toLocaleString()}</p>
              <div className="progress-bar">
                <div className="progress" style={{ width: '75%' }}></div>
              </div>
              <span>75% growth</span>
            </div>
            <div className="channel-card">
              <i className="fab fa-whatsapp"></i>
              <h3>WhatsApp Messages</h3>
              <p className="revenue-amount">${channelRevenue.whatsapp.toLocaleString()}</p>
              <div className="progress-bar">
                <div className="progress" style={{ width: '52%' }}></div>
              </div>
              <span>52% growth</span>
            </div>
            <div className="channel-card">
              <i className="fas fa-phone-alt"></i>
              <h3>Calls</h3>
              <p className="revenue-amount">${channelRevenue.calls.toLocaleString()}</p>
              <div className="progress-bar">
                <div className="progress" style={{ width: '34%' }}></div>
              </div>
              <span>34% growth</span>
            </div>
            <div className="channel-card">
              <i className="fas fa-envelope"></i>
              <h3>Emails</h3>
              <p className="revenue-amount">${channelRevenue.emails.toLocaleString()}</p>
              <div className="progress-bar">
                <div className="progress" style={{ width: '28%' }}></div>
              </div>
              <span>28% growth</span>
            </div>
          </div>
        </div>

        {/* Card Based Payment Section */}
        <div className="payment-section">
          <h2><i className="fas fa-credit-card"></i> Card Based Payments</h2>
          <div className="payment-grid">
            <div className="payment-card">
              <img
                src="https://image2url.com/r2/default/images/1775537842507-da2d5769-4221-488c-930b-987a9d56a09c.png"
                alt="Credit Cards"
              />
              <h3>Credit Cards</h3>
              <p>Allows consumers to borrow funds from a pre-approved limit (e.g., Visa, Mastercard, American Express).</p>
              <div className="card-icons">
                <i className="fab fa-cc-visa"></i>
                <i className="fab fa-cc-mastercard"></i>
                <i className="fab fa-cc-amex"></i>
              </div>
            </div>
            <div className="payment-card">
              <img
                src="https://image2url.com/r2/default/images/1775537842507-da2d5769-4221-488c-930b-987a9d56a09c.png"
                alt="Debit Cards"
              />
              <h3>Debit Cards</h3>
              <p>Deducts money directly from the user's bank account instantly.</p>
              <div className="card-icons">
                <i className="fas fa-bank"></i>
                <i className="fas fa-exchange-alt"></i>
              </div>
            </div>
            <div className="payment-card">
              <img
                src="https://image2url.com/r2/default/images/1775537842507-da2d5769-4221-488c-930b-987a9d56a09c.png"
                alt="Prepaid Cards"
              />
              <h3>Prepaid/Gift Cards</h3>
              <p>Pre-loaded cards with a specific amount of money, often used for limited, secure spending.</p>
              <div className="card-icons">
                <i className="fas fa-gift"></i>
                <i className="fas fa-tag"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeparthDashboard;
