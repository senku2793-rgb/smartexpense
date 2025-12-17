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
class MoneyApp {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        
        // Check which page we are on
        if (document.getElementById('loginForm')) this.initAuth();
        if (document.getElementById('transactionList')) this.initDashboard();
        
        this.catColors = { 'Food':'#ffeaa7', 'Transport':'#81ecec', 'Shopping':'#fab1a0', 'Bills':'#74b9ff', 'Entertainment':'#a29bfe' };
    }

    // --- AUTHENTICATION LOGIC ---
    initAuth() {
        // Handle Login
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('loginUser').value;
            const pass = document.getElementById('loginPass').value;
            
            const foundUser = this.users.find(u => u.username === user && u.password === pass);
            
            if (foundUser) {
                sessionStorage.setItem('currentUser', JSON.stringify(foundUser));
                window.location.href = 'dashboard.html';
            } else {
                document.getElementById('authMsg').innerText = "Invalid Username or Password";
            }
        });

        // Handle Register
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('regUser').value;
            const pass = document.getElementById('regPass').value;
            const role = document.querySelector('input[name="role"]:checked').value;

            if(this.users.find(u => u.username === user)) {
                document.getElementById('authMsg').innerText = "Username already taken";
                return;
            }

            this.users.push({ username: user, password: pass, role: role });
            localStorage.setItem('users', JSON.stringify(this.users));
            alert("Registration successful! Please login.");
            this.toggleAuth('login');
        });
    }

    toggleAuth(view) {
        document.getElementById('authMsg').innerText = "";
        if(view === 'register') {
            document.getElementById('loginForm').classList.add('hidden');
            document.getElementById('registerForm').classList.remove('hidden');
            document.getElementById('formTitle').innerText = "Create Account";
        } else {
            document.getElementById('registerForm').classList.add('hidden');
            document.getElementById('loginForm').classList.remove('hidden');
            document.getElementById('formTitle').innerText = "Welcome Back";
        }
    }

    logout() {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }

    // --- DASHBOARD LOGIC ---
    initDashboard() {
        if (!this.currentUser) {
            window.location.href = 'index.html';
            return;
        }

        // Display User Info & Admin Badge
        document.getElementById('displayUsername').innerText = this.currentUser.username;
        if(this.currentUser.role === 'Admin') {
            document.getElementById('adminBadge').classList.remove('hidden');
        }

        this.render();

        // Add Transaction
        document.getElementById('addForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const desc = document.getElementById('desc').value;
            const amount = document.getElementById('amount').value;
            const type = document.getElementById('type').value;
            const category = document.getElementById('category').value;

            const newT = new Transaction(Date.now(), desc, amount, type, category, new Date().toLocaleDateString());
            this.transactions.unshift(newT);
            localStorage.setItem('transactions', JSON.stringify(this.transactions));
            
            this.render();
            toggleModal(false);
            e.target.reset();
        });
    }

    deleteTransaction(id) {
        // Admin Rule: Admins can delete anything, Users can only delete their own (Simulated here as 'all' for simplicity)
        if(confirm("Delete this transaction?")) {
            this.transactions = this.transactions.filter(t => t.id !== id);
            localStorage.setItem('transactions', JSON.stringify(this.transactions));
            this.render();
        }
    }

    render() {
        const list = document.getElementById('transactionList');
        list.innerHTML = '';
        let income = 0, expense = 0;
        let chartData = {};

        this.transactions.forEach(t => {
            if(t.type === 'income') income += t.amount;
            else {
                expense += t.amount;
                chartData[t.category] = (chartData[t.category] || 0) + t.amount;
            }

            const item = document.createElement('li');
            item.className = 't-item';
            const color = this.catColors[t.category] || '#dfe6e9';
            
            item.innerHTML = `
                <div class="icon-box" style="background:${color}">
                    <i class="fas fa-tag" style="opacity:0.6;"></i>
                </div>
                <div class="t-info">
                    <h4>${t.desc}</h4>
                    <small>${t.category} • ${t.date}</small>
                </div>
                <div style="font-weight:600; color:${t.type==='income'?'#00b894':'#ff7675'}">
                    ${t.type==='income' ? '+' : '-'}${t.amount}
                </div>
                <i class="fas fa-trash" style="margin-left:15px; color:#b2bec3; cursor:pointer;" onclick="app.deleteTransaction(${t.id})"></i>
            `;
            list.appendChild(item);
        });

        document.getElementById('totalIncome').innerText = `$${income}`;
        document.getElementById('totalExpense').innerText = `$${expense}`;
        document.getElementById('netBalance').innerText = `$${income - expense}`;
        this.renderChart(chartData);
    }

    renderChart(data) {
        const ctx = document.getElementById('expenseChart').getContext('2d');
        if(window.myChart) window.myChart.destroy();
        
        window.myChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    data: Object.values(data),
                    backgroundColor: Object.keys(data).map(k => this.catColors[k]),
                    borderWidth: 0
                }]
            },
            options: { cutout: '75%', plugins: { legend: { position: 'right', labels: { boxWidth: 10 } } } }
        });
    }

    exportCSV() {
        let csv = "Date,Description,Category,Type,Amount\n";
        this.transactions.forEach(t => {
            csv += `${t.date},${t.desc},${t.category},${t.type},${t.amount}\n`;
        });
        const link = document.createElement('a');
        link.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
        link.download = 'data.csv';
        link.click();
    }
}

// Global Helpers
const app = new MoneyApp();
function toggleModal(show) {
    const modal = document.getElementById('modal');
    show ? modal.classList.add('active') : modal.classList.remove('active');
}
