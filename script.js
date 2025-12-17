// --- Transaction Class ---
class Transaction {
    constructor(id, desc, amount, type, category, date) {
        this.id = id;
        this.desc = desc;
        this.amount = parseFloat(amount);
        this.type = type;
        this.category = category;
        this.date = date;
    }
}

// --- Main App Logic ---
class DashboardApp {
    constructor() {
        this.currentUser = sessionStorage.getItem('currentUser');
        this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        this.chart = null;

        // Set today's date in form
        if(document.getElementById('date')) {
            document.getElementById('date').valueAsDate = new Date();
        }

        this.init();
    }

    init() {
        // Router Logic
        if (this.currentUser) {
            this.switchView('dashboard');
        } else {
            this.switchView('auth');
        }

        // Event Listeners
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        if(document.getElementById('addForm')) {
            document.getElementById('addForm').addEventListener('submit', (e) => this.handleAddTransaction(e));
        }
    }

    handleLogin(e) {
        e.preventDefault();
        const user = document.getElementById('loginUser').value;
        if(user.length > 0) {
            sessionStorage.setItem('currentUser', user);
            this.currentUser = user;
            this.switchView('dashboard');
        }
    }

    logout() {
        sessionStorage.removeItem('currentUser');
        this.currentUser = null;
        this.switchView('auth');
    }

    switchView(viewName) {
        const auth = document.getElementById('authView');
        const dash = document.getElementById('dashboardView');
        
        if(viewName === 'dashboard') {
            auth.classList.add('hidden');
            dash.classList.remove('hidden');
            this.renderDashboard();
        } else {
            dash.classList.add('hidden');
            auth.classList.remove('hidden');
        }
    }

    handleAddTransaction(e) {
        e.preventDefault();
        const desc = document.getElementById('desc').value;
        const amount = document.getElementById('amount').value;
        const category = document.getElementById('category').value;
        const date = document.getElementById('date').value;
        const type = document.getElementById('transType').value;

        const newT = new Transaction(Date.now(), desc, amount, type, category, date);
        this.transactions.unshift(newT); // Add to top
        localStorage.setItem('transactions', JSON.stringify(this.transactions));

        this.renderDashboard();
        e.target.reset();
        document.getElementById('date').valueAsDate = new Date(); // Reset date
    }

    deleteTransaction(id) {
        if(confirm('Are you sure you want to delete this?')) {
            this.transactions = this.transactions.filter(t => t.id !== id);
            localStorage.setItem('transactions', JSON.stringify(this.transactions));
            this.renderDashboard();
        }
    }

    // --- Tab Switching Logic (Expense vs Income) ---
    setTab(type, btn) {
        document.getElementById('transType').value = type;
        
        // Update UI Tabs
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Change button color based on type
        const submitBtn = document.querySelector('.btn-action');
        if(type === 'income') {
            submitBtn.style.background = '#00a65a'; // Green
            submitBtn.innerText = 'Add Income';
        } else {
            submitBtn.style.background = '#3c8dbc'; // Blue
            submitBtn.innerText = 'Add Expense';
        }
    }

    renderDashboard() {
        document.getElementById('displayUsername').innerText = this.currentUser;

        // 1. Calculate Finances
        let income = 0;
        let expense = 0;
        let catData = {};

        const tbody = document.getElementById('transactionTableBody');
        tbody.innerHTML = '';

        this.transactions.forEach(t => {
            if(t.type === 'income') income += t.amount;
            else {
                expense += t.amount;
                catData[t.category] = (catData[t.category] || 0) + t.amount;
            }

            // Add Table Row
            const row = `
                <tr>
                    <td>${t.date}</td>
                    <td>
                        <span style="font-weight:500">${t.desc}</span><br>
                        <small style="color:#777">${t.category}</small>
                    </td>
                    <td class="${t.type === 'income' ? 'success' : 'danger'}">
                        ${t.type === 'income' ? '+' : '-'} $${t.amount.toFixed(2)}
                    </td>
                    <td>
                        <button class="btn-delete" onclick="app.deleteTransaction(${t.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

        // 2. Update Net Worth Card
        const netWorth = income - expense;
        document.getElementById('netWorthDisplay').innerText = `$${netWorth.toLocaleString()}`;
        document.getElementById('netWorthDisplay').className = netWorth >= 0 ? 'amount-large success' : 'amount-large danger';
        
        // Simulating "Bank" vs "Cash" (Split 70/30)
        document.getElementById('bankDisplay').innerText = `$${(netWorth * 0.7).toLocaleString()}`;
        document.getElementById('cashDisplay').innerText = `$${(netWorth * 0.3).toLocaleString()}`;
        document.getElementById('totalAssetsDisplay').innerText = `$${netWorth.toLocaleString()}`;

        // 3. Render Chart & Check Challenge
        this.renderChart(catData);
        this.updateChallenge(netWorth);
        
        // Re-apply gold status if they already won previously
        if(localStorage.getItem('rewardClaimed')) {
            this.applyGoldStatus();
        }
    }

    // --- NEW: Bonus Challenge Logic ---
    updateChallenge(netWorth) {
        const goal = 2000;
        let percent = Math.floor((netWorth / goal) * 100);
        if (percent < 0) percent = 0;
        if (percent > 100) percent = 100;

        // Update CSS Width
        const bar = document.getElementById('progressBar');
        bar.style.width = percent + '%';
        bar.innerText = percent + '%';

        // Check if Goal Met
        const rewardBox = document.getElementById('rewardSection');
        
        // If met AND not already claimed
        if (netWorth >= goal) {
            if(!localStorage.getItem('rewardClaimed')) {
                rewardBox.classList.remove('hidden');
            }
        } else {
            rewardBox.classList.add('hidden');
        }
    }

    claimReward() {
        localStorage.setItem('rewardClaimed', 'true');
        document.getElementById('rewardSection').classList.add('hidden');
        alert("🎉 Congratulations! You are now a Gold Pro User!");
        this.applyGoldStatus();
    }

    applyGoldStatus() {
        // Change the User Icon to Gold Crown
        const profileIcon = document.querySelector('.user-profile i');
        profileIcon.classList.remove('fa-user-circle');
        profileIcon.classList.add('fa-crown', 'gold-badge');
        
        // Add PRO text label if not there
        const userSpan = document.getElementById('displayUsername');
        if(!userSpan.innerText.includes('PRO')) {
            userSpan.innerHTML += ' <span style="background:gold; color:black; font-size:10px; padding:2px 5px; border-radius:3px;">PRO</span>';
        }
    }

    renderChart(data) {
        const ctx = document.getElementById('expenseChart').getContext('2d');
        if(this.chart) this.chart.destroy();

        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    data: Object.values(data),
                    backgroundColor: ['#f56954', '#00a65a', '#f39c12', '#00c0ef', '#3c8dbc'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'right' } }
            }
        });
    }
}

// Initialize
const app = new DashboardApp();
