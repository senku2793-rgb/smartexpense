// --- OOP: Transaction Class ---
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

// --- App Logic ---
class MoneyTracker {
    constructor() {
        this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        this.chart = null;
        this.user = sessionStorage.getItem('user') || 'Guest';
        
        // Define colors for categories
        this.catColors = {
            'Food': '#ffeaa7',
            'Transport': '#81ecec',
            'Shopping': '#fab1a0',
            'Bills': '#74b9ff',
            'Entertainment': '#a29bfe'
        };

        if(document.getElementById('transactionList')) {
            this.initDashboard();
        } else if (document.getElementById('loginForm')) {
            this.initLogin();
        }
    }

    initLogin() {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('username').value;
            if(user) {
                sessionStorage.setItem('user', user);
                window.location.href = 'dashboard.html';
            }
        });
    }

    initDashboard() {
        document.getElementById('userDisplay').innerText = this.user;
        this.render();

        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTransaction();
        });
    }

    addTransaction() {
        const desc = document.getElementById('desc').value;
        const amount = document.getElementById('amount').value;
        const type = document.getElementById('type').value;
        const category = document.getElementById('category').value;

        const newT = new Transaction(Date.now(), desc, amount, type, category, new Date().toLocaleDateString());
        this.transactions.unshift(newT); // Add to top
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
        
        this.render();
        toggleModal(false);
        document.getElementById('transactionForm').reset();
    }

    deleteTransaction(id) {
        if(confirm('Delete this item?')) {
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
                    <i class="fas fa-tag" style="color:#2d3436; opacity:0.7;"></i>
                </div>
                <div class="info">
                    <h4>${t.desc}</h4>
                    <small>${t.date} • ${t.category}</small>
                </div>
                <div class="amount" style="color: ${t.type === 'income' ? '#00b894' : '#ff7675'}">
                    ${t.type === 'income' ? '+' : '-'}${t.amount}
                </div>
                <i class="fas fa-trash" style="margin-left:15px; color:#b2bec3; cursor:pointer;" onclick="app.deleteTransaction(${t.id})"></i>
            `;
            list.appendChild(item);
        });

        document.getElementById('totalIncome').innerText = `$${income}`;
        document.getElementById('totalExpense').innerText = `$${expense}`;
        document.getElementById('netBalance').innerText = `$${income - expense}`;

        this.updateChart(chartData);
    }

    updateChart(data) {
        const ctx = document.getElementById('expenseChart').getContext('2d');
        if(this.chart) this.chart.destroy();
        
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    data: Object.values(data),
                    backgroundColor: Object.keys(data).map(k => this.catColors[k] || '#ccc'),
                    borderWidth: 0
                }]
            },
            options: {
                cutout: '70%',
                plugins: { legend: { position: 'right', labels: { boxWidth: 10 } } }
            }
        });
    }

    exportCSV() {
        let csv = "Date,Desc,Amount,Type\n" + this.transactions.map(t => `${t.date},${t.desc},${t.amount},${t.type}`).join("\n");
        const link = document.createElement('a');
        link.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
        link.download = 'expenses.csv';
        link.click();
    }
}

const app = new MoneyTracker();

// Global functions for HTML interaction
function toggleModal(show) {
    const modal = document.getElementById('modal');
    show ? modal.classList.add('active') : modal.classList.remove('active');
}

function setTransType(type, el) {
    document.getElementById('type').value = type;
    document.querySelectorAll('.pill-selector div').forEach(d => d.classList.remove('active'));
    el.classList.add('active');
}
