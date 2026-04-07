// User Data Storage
let currentUser = null;
let chartInstance = null;

// Financial Data by Year
const financialData = {
    2023: {
        investment: [5000, 5200, 5500, 5800, 6000, 6500, 7000, 7500, 8000, 8500, 9000, 10000],
        output: [4500, 4800, 5200, 5600, 6100, 6800, 7500, 8200, 8900, 9600, 10500, 11500],
        transactions: 1250
    },
    2024: {
        investment: [10000, 10500, 11000, 11500, 12000, 13000, 14000, 15000, 16000, 17000, 18000, 19500],
        output: [11500, 12500, 13500, 14500, 15800, 17200, 18800, 20500, 22500, 24500, 26800, 29500],
        transactions: 2450
    },
    2025: {
        investment: [19500, 20000, 21000, 22000, 23500, 25000, 27000, 29000, 31500, 34000, 37000, 40000],
        output: [29500, 31500, 34000, 37000, 40500, 44500, 49000, 54000, 59500, 65500, 72000, 80000],
        transactions: 3800
    }
};

// Revenue Channel Data
const channelRevenue = {
    website: 12450,
    whatsapp: 8230,
    calls: 5670,
    emails: 3890
};

// Login Handler
document.getElementById('loginForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const businessType = document.getElementById('businessType').value;
    
    if(email && businessType) {
        currentUser = {
            name: email.split('@')[0],
            email: email,
            businessType: businessType,
            customerId: Math.floor(Math.random() * 900000000) + 100000000
        };
        
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('mainDashboard').style.display = 'block';
        updateDashboardUI();
        showToast('Welcome to Heparth-India!', 'success');
    }
});

// Signup Handler
document.getElementById('signupForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const businessName = document.getElementById('businessName').value;
    const ownerName = document.getElementById('ownerName').value;
    const email = document.getElementById('signupEmail').value;
    
    if(businessName && ownerName && email) {
        currentUser = {
            name: ownerName,
            businessName: businessName,
            email: email,
            customerId: Math.floor(Math.random() * 900000000) + 100000000
        };
        
        document.getElementById('signupPage').style.display = 'none';
        document.getElementById('mainDashboard').style.display = 'block';
        updateDashboardUI();
        showToast('Account created successfully! Start for free!', 'success');
    }
});

// Update Dashboard UI
function updateDashboardUI() {
    document.getElementById('welcomeUserName').innerText = currentUser?.name || 'Business Owner';
    document.getElementById('sidebarUserName').innerText = currentUser?.name || 'User';
    document.getElementById('userNameDisplay').innerText = currentUser?.name?.split(' ')[0] || 'Account';
    document.getElementById('customerNumber').innerText = currentUser?.customerId || '694548349';
    
    updateRevenueChannels();
    initializeChart('2024');
}

// Update Revenue Channels
function updateRevenueChannels() {
    document.getElementById('websiteRevenue').innerText = `$${channelRevenue.website.toLocaleString()}`;
    document.getElementById('whatsappRevenue').innerText = `$${channelRevenue.whatsapp.toLocaleString()}`;
    document.getElementById('callsRevenue').innerText = `$${channelRevenue.calls.toLocaleString()}`;
    document.getElementById('emailRevenue').innerText = `$${channelRevenue.emails.toLocaleString()}`;
}

// Initialize Chart
function initializeChart(year) {
    const data = financialData[year];
    if(!data) return;
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if(chartInstance) {
        chartInstance.destroy();
    }
    
    const ctx = document.getElementById('performanceChart').getContext('2d');
    chartInstance = new Chart(ctx, {
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
                    pointHoverRadius: 6
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
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: { size: 14, weight: 'bold' }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: $${context.raw.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
    
    // Update Stats
    const totalInvestment = data.investment.reduce((a,b) => a+b, 0);
    const totalOutput = data.output.reduce((a,b) => a+b, 0);
    const profit = totalOutput - totalInvestment;
    const loss = profit < 0 ? Math.abs(profit) : 0;
    
    document.getElementById('totalInvestment').innerText = `$${totalInvestment.toLocaleString()}`;
    document.getElementById('totalOutput').innerText = `$${totalOutput.toLocaleString()}`;
    document.getElementById('totalProfit').innerText = `$${profit.toLocaleString()}`;
    document.getElementById('totalLoss').innerText = `$${loss.toLocaleString()}`;
    document.getElementById('totalTransactions').innerText = data.transactions.toLocaleString();
}

// Year Button Handlers
document.querySelectorAll('.year-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.year-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        initializeChart(this.dataset.year);
        showToast(`Showing data for ${this.dataset.year}`, 'info');
    });
});

// Account Sidebar Toggle
document.getElementById('accountBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    const sidebar = document.getElementById('accountSidebar');
    sidebar.classList.toggle('open');
    
    // Close notification panel if open
    document.getElementById('notificationPanel').classList.remove('open');
});

// Notification Panel Toggle
document.getElementById('notificationBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    const panel = document.getElementById('notificationPanel');
    panel.classList.toggle('open');
    
    // Close account sidebar if open
    document.getElementById('accountSidebar').classList.remove('open');
});

// Help Button
document.getElementById('helpBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    showToast('Help Center: Contact support@heparth-india.com or call 1-800-HEPARTH', 'info');
});

// Start Free Button
document.getElementById('startFreeBtn')?.addEventListener('click', function() {
    showToast('Upgrade your plan! Contact sales for premium features with special pricing.', 'info');
});

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('mainDashboard').style.display = 'none';
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('accountSidebar').classList.remove('open');
    document.getElementById('notificationPanel').classList.remove('open');
    currentUser = null;
    showToast('Logged out successfully', 'success');
});

// Toggle PIN Visibility
function togglePin() {
    const pinSpan = document.getElementById('pinDisplay');
    if(pinSpan.innerText === '••••••') {
        pinSpan.innerText = '123456';
    } else {
        pinSpan.innerText = '••••••';
    }
}

// Scroll to Section
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if(element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        showToast(`Scrolling to ${sectionId.replace('Section', '')}`, 'info');
    }
}

// Show Toast Notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : (type === 'info' ? 'info-circle' : 'exclamation-circle')}"></i>
        <span>${message}</span>
    `;
    
    if(type === 'success') {
        toast.style.background = '#2d6a4f';
    } else if(type === 'info') {
        toast.style.background = '#c9a84c';
    } else {
        toast.style.background = '#e76f51';
    }
    toast.style.color = 'white';
    
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add slideOut animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(styleSheet);

// Close sidebars when clicking outside
document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('accountSidebar');
    const notificationPanel = document.getElementById('notificationPanel');
    const accountBtn = document.getElementById('accountBtn');
    const notificationBtn = document.getElementById('notificationBtn');
    
    if(sidebar && sidebar.classList.contains('open')) {
        if(!sidebar.contains(e.target) && e.target !== accountBtn && !accountBtn.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    }
    
    if(notificationPanel && notificationPanel.classList.contains('open')) {
        if(!notificationPanel.contains(e.target) && e.target !== notificationBtn && !notificationBtn.contains(e.target)) {
            notificationPanel.classList.remove('open');
        }
    }
});

// Show/Hide Login/Signup
document.getElementById('showSignup')?.addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('signupPage').style.display = 'flex';
});

document.getElementById('showLogin')?.addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('signupPage').style.display = 'none';
    document.getElementById('loginPage').style.display = 'flex';
});

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    if(!currentUser) {
        document.getElementById('loginPage').style.display = 'flex';
    }
    
    // Add animation to payment cards
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.payment-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
});

// Export for global use
window.togglePin = togglePin;
window.scrollToSection = scrollToSection;
window.showToast = showToast;