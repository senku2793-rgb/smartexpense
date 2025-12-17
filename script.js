class App {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('fm_users')) || [];
        this.currentUser = JSON.parse(sessionStorage.getItem('fm_current'));
        this.transactions = JSON.parse(localStorage.getItem('fm_data')) || [];
        this.chart = null;
        this.rainTriggered = false;

        this.init();
    }

    init() {
        if (this.currentUser) {
            this.loadDashboard();
        } else {
            this.showAuth();
        }

        // Listeners
        document.getElementById('loginForm').addEventListener('submit', e => { e.preventDefault(); this.login(); });
        document.getElementById('registerForm').addEventListener('submit', e => { e.preventDefault(); this.register(); });
        document.getElementById('addForm').addEventListener('submit', e => { e.preventDefault(); this.addTx(); });
        document.getElementById('profileForm').addEventListener('submit', e => { e.preventDefault(); this.updateProfile(); });
    }

    // === AUTH ===
    toggleAuth(view) {
        if(view === 'register') {
            document.getElementById('loginCard').classList.add('hidden');
            document.getElementById('registerCard').classList.remove('hidden');
        } else {
            document.getElementById('registerCard').classList.add('hidden');
            document.getElementById('loginCard').classList.remove('hidden');
        }
    }

    register() {
        const u = document.getElementById('regUser').value;
        const p = document.getElementById('regPass').value;
        
        if (this.users.find(user => user.username === u)) {
            alert('Username already exists!');
            return;
        }

        this.users.push({ username: u, password: p });
        localStorage.setItem('fm_users', JSON.stringify(this.users));
        alert('Account Created!');
        this.toggleAuth('login');
    }

    login() {
        const u = document.getElementById('loginUser').value;
        const p = document.getElementById('loginPass').value;
        
        const user = this.users.find(user => user.username === u && user.password === p);
        if (user) {
            this.currentUser = user;
            sessionStorage.setItem('fm_current', JSON.stringify(user));
            this.loadDashboard();
        } else {
            alert('Invalid Credentials');
        }
    }

    logout() {
        sessionStorage.removeItem('fm_current');
        location.reload();
    }

    showAuth() {
        document.getElementById('authScreen').classList.remove('hidden');
        document.getElementById('dashboardScreen').classList.add('hidden');
    }

    loadDashboard() {
        document.getElementById('authScreen').classList.add('hidden');
        document.getElementById('dashboardScreen').classList.remove('hidden');
        document.getElementById('displayUser').innerText = this.currentUser.username;
        this.renderData();
    }

    // === DATA ===
    addTx() {
        const desc = document.getElementById('desc').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const type = document.getElementById('type').value;
        const cat = document.getElementById('category').value;

        const tx = {
            id: Date.now(),
            user: this.currentUser.username,
            desc, amount, type, cat,
            date: new Date().toLocaleDateString()
        };

        this.transactions.unshift(tx);
        localStorage.setItem('fm_data', JSON.stringify(this.transactions));
        
        document.getElementById('addForm').reset();
        this.renderData();
    }

    deleteTx(id) {
        if(confirm('Delete?')) {
            this.transactions = this.transactions.filter(t => t.id !== id);
            localStorage.setItem('fm_data', JSON.stringify(this.transactions));
            this.renderData();
        }
    }

    renderData() {
        const myData = this.transactions.filter(t => t.user === this.currentUser.username);
        let income = 0, expense = 0, catMap = {};
        
        const recent = document.getElementById('recentTable');
        const full = document.getElementById('fullTable');
        const rep = document.getElementById('repTable');
        recent.innerHTML = ''; full.innerHTML = ''; rep.innerHTML = '';

        myData.forEach(t => {
            if (t.type === 'income') income += t.amount;
            else { expense += t.amount; catMap[t.cat] = (catMap[t.cat] || 0) + t.amount; }

            const cls = t.type === 'income' ? 'amount-pos' : 'amount-neg';
            const sign = t.type === 'income' ? '+' : '-';

            // Recent (Limit 5)
            if(recent.children.length < 5) {
                recent.innerHTML += `<tr><td>${t.desc}</td><td>${t.cat}</td><td class="${cls}">${sign}$${t.amount}</td><td><i class="fas fa-trash" style="cursor:pointer; color:#d63031;" onclick="app.deleteTx(${t.id})"></i></td></tr>`;
            }

            // Full & Report
            full.innerHTML += `<tr><td>${t.date}</td><td>${t.cat}</td><td>${t.desc}</td><td>${t.type}</td><td class="${cls}">${sign}$${t.amount}</td><td><i class="fas fa-trash" style="cursor:pointer;" onclick="app.deleteTx(${t.id})"></i></td></tr>`;
            rep.innerHTML += `<tr><td>${t.date}</td><td>${t.cat}</td><td>${t.desc}</td><td class="${cls}">${sign}$${t.amount}</td></tr>`;
        });

        const netWorth = income - expense;
        document.getElementById('totalBalance').innerText = `$${netWorth.toLocaleString()}`;
        document.getElementById('totalInc').innerText = `$${income}`;
        document.getElementById('totalExp').innerText = `$${expense}`;
        document.getElementById('repTotal').innerText = `$${netWorth.toLocaleString()}`;

        this.updateChart(catMap);
        this.checkGoal(netWorth);
        this.prepareReport();
    }

    // === FEATURES ===
    updateChart(data) {
        const ctx = document.getElementById('expenseChart').getContext('2d');
        if (this.chart) this.chart.destroy();
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(data),
                datasets: [{ data: Object.values(data), backgroundColor: ['#ff7675', '#fdcb6e', '#00b894', '#0984e3', '#6c5ce7'] }]
            }
        });
    }

    checkGoal(netWorth) {
        const goal = 2000;
        let pct = Math.min((netWorth / goal) * 100, 100);
        if (pct < 0) pct = 0;
        document.getElementById('progressBar').style.width = pct + '%';

        if (netWorth >= goal) {
            document.getElementById('rewardMsg').classList.remove('hidden');
            document.getElementById('proBadge').classList.remove('hidden');
            if (!this.rainTriggered) { this.triggerRain(); this.rainTriggered = true; }
        } else {
            document.getElementById('rewardMsg').classList.add('hidden');
            document.getElementById('proBadge').classList.add('hidden');
        }
    }

    triggerRain() {
        for (let i = 0; i < 30; i++) {
            let m = document.createElement('div');
            m.innerHTML = ['💸','💰','💵','💎'][Math.floor(Math.random()*4)];
            m.className = 'money';
            m.style.left = Math.random() * 100 + 'vw';
            m.style.animation = `fall ${Math.random()*2+2}s linear`;
            document.body.appendChild(m);
            setTimeout(() => m.remove(), 4000);
        }
    }

    // === UTILS ===
    nav(view) {
        ['home','transactions','account'].forEach(v => document.getElementById('view-'+v).classList.add('hidden'));
        document.getElementById('view-report').classList.add('hidden');
        
        if(view === 'report') document.getElementById('view-report').classList.remove('hidden');
        else document.getElementById('view-'+view).classList.remove('hidden');

        if(view === 'account') document.getElementById('profUser').value = this.currentUser.username;
    }

    setTab(type) {
        document.getElementById('type').value = type;
        document.getElementById('tabExp').className = type === 'expense' ? 'tab active' : 'tab';
        document.getElementById('tabInc').className = type === 'income' ? 'tab active' : 'tab';
    }

    updateProfile() {
        const idx = this.users.findIndex(u => u.username === this.currentUser.username);
        const pass = document.getElementById('profPass').value;
        if(pass) {
            this.users[idx].password = pass;
            localStorage.setItem('fm_users', JSON.stringify(this.users));
            alert('Password Updated!');
        }
    }

    prepareReport() {
        document.getElementById('repUser').innerText = this.currentUser.username;
        document.getElementById('repDate').innerText = new Date().toLocaleDateString();
    }
}

const app = new App();
