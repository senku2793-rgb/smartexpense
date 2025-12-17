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
        if (this.currentUser) this.loadDashboard();
        else this.showAuth();

        document.getElementById('loginForm').addEventListener('submit', e => { e.preventDefault(); this.login(); });
        document.getElementById('registerForm').addEventListener('submit', e => { e.preventDefault(); this.register(); });
        document.getElementById('addForm').addEventListener('submit', e => { e.preventDefault(); this.addTx(); });
        document.getElementById('profileForm').addEventListener('submit', e => { e.preventDefault(); this.updateProfile(); });
    }

    // === AUTH ===
    toggleAuth(view) {
        document.getElementById('loginCard').classList.toggle('hidden', view === 'register');
        document.getElementById('registerCard').classList.toggle('hidden', view !== 'register');
    }
    register() {
        const u = document.getElementById('regUser').value;
        const p = document.getElementById('regPass').value;
        if (this.users.find(x => x.username === u)) return alert('Username exists!');
        const newUser = { username: u, password: p, hasSeenTutorial: false };
        this.users.push(newUser);
        localStorage.setItem('fm_users', JSON.stringify(this.users));
        alert('Success! Login now.');
        this.toggleAuth('login');
    }
    login() {
        const u = document.getElementById('loginUser').value;
        const p = document.getElementById('loginPass').value;
        const user = this.users.find(x => x.username === u && x.password === p);
        if (user) {
            this.currentUser = user;
            sessionStorage.setItem('fm_current', JSON.stringify(user));
            this.loadDashboard();
        } else alert('Invalid credentials!');
    }
    logout() { sessionStorage.removeItem('fm_current'); location.reload(); }
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
        const tx = {
            id: Date.now(), user: this.currentUser.username,
            desc: document.getElementById('desc').value,
            amount: parseFloat(document.getElementById('amount').value),
            type: document.getElementById('type').value,
            category: document.getElementById('category').value,
            date: new Date().toLocaleDateString()
        };
        this.transactions.unshift(tx);
        localStorage.setItem('fm_data', JSON.stringify(this.transactions));
        document.getElementById('addForm').reset();
        alert('Transaction Added!');
        this.renderData();
    }
    renderData() {
        const myData = this.transactions.filter(t => t.user === this.currentUser.username);
        let inc = 0, exp = 0, cats = {};
        
        const rec = document.getElementById('recentTable');
        const full = document.getElementById('fullTable');
        const rep = document.getElementById('repTable');
        rec.innerHTML=''; full.innerHTML=''; rep.innerHTML='';

        myData.forEach(t => {
            if(t.type==='income') inc+=t.amount; else { exp+=t.amount; cats[t.category]=(cats[t.category]||0)+t.amount; }
            const c = t.type==='income'?'amount-pos':'amount-neg';
            const s = t.type==='income'?'+':'-';
            
            if(rec.children.length<5) rec.innerHTML+=`<tr><td>${t.desc}</td><td class="${c}">${s}$${t.amount}</td><td><i class="fas fa-trash" onclick="app.deleteTx(${t.id})"></i></td></tr>`;
            full.innerHTML+=`<tr><td>${t.date}</td><td>${t.category}</td><td>${t.desc}</td><td class="${c}">${s}$${t.amount}</td><td><i class="fas fa-trash" onclick="app.deleteTx(${t.id})"></i></td></tr>`;
            rep.innerHTML+=`<tr><td>${t.date}</td><td>${t.category}</td><td>${t.desc}</td><td class="${c}">${s}$${t.amount}</td></tr>`;
        });

        const net = inc - exp;
        document.getElementById('totalBalance').innerText = `$${net.toLocaleString()}`;
        document.getElementById('totalInc').innerText = `$${inc}`;
        document.getElementById('totalExp').innerText = `$${exp}`;
        document.getElementById('repTotal').innerText = `$${net.toLocaleString()}`;
        this.updateChart(cats);
        this.checkGoal(net);
        this.prepareReport();
    }
    deleteTx(id) {
        if(confirm('Delete?')) {
            this.transactions = this.transactions.filter(t => t.id !== id);
            localStorage.setItem('fm_data', JSON.stringify(this.transactions));
            this.renderData();
        }
    }
    updateChart(data) {
        const ctx = document.getElementById('expenseChart').getContext('2d');
        if(this.chart) this.chart.destroy();
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: Object.keys(data), datasets: [{ data: Object.values(data), backgroundColor: ['#ff7675','#fdcb6e','#00b894','#0984e3'] }] }
        });
    }
    checkGoal(net) {
        const pct = Math.min((net/2000)*100, 100);
        document.getElementById('progressBar').style.width = Math.max(0, pct)+'%';
        if(net >= 2000) {
            document.getElementById('rewardMsg').classList.remove('hidden');
            document.getElementById('proBadge').classList.remove('hidden');
            if(!this.rainTriggered) { this.triggerRain(); this.rainTriggered=true; }
        }
    }
    triggerRain() {
        for(let i=0; i<40; i++) {
            let m = document.createElement('div');
            m.innerHTML = ['💸','💰','💎'][Math.floor(Math.random()*3)];
            m.className='money'; m.style.left=Math.random()*100+'vw';
            m.style.animation=`fall ${Math.random()*2+2}s linear`;
            document.body.appendChild(m);
            setTimeout(()=>m.remove(),4000);
        }
    }
    nav(v) {
        ['home','add','history','account','report'].forEach(i=>document.getElementById('view-'+i).classList.add('hidden'));
        document.getElementById('view-'+v).classList.remove('hidden');
        if(v==='account') document.getElementById('profUser').value = this.currentUser.username;
    }
    setTab(t) {
        document.getElementById('type').value=t;
        document.getElementById('tabExp').className = t==='expense'?'tab active':'tab';
        document.getElementById('tabInc').className = t==='income'?'tab active':'tab';
    }
    prepareReport() {
        document.getElementById('repUser').innerText = this.currentUser.username;
        document.getElementById('repDate').innerText = new Date().toLocaleDateString();
    }
    updateProfile() {
        const pass = document.getElementById('profPass').value;
        if(pass) { this.currentUser.password = pass; this.updateUserRecord(); alert('Password Updated!'); }
    }
}
const app = new App();
