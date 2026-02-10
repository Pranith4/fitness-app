// ProChallenge Hub - Main Application Logic
const API_URL = "https://script.google.com/macros/s/AKfycbzwWrCRjHYeJA0-5SHxAamG-H96m5ItJzOXtNhgu0sy43xIlkCPLTeayK6bKT1-S9-Raw/exec";

// Current active challenge
let currentChallenge = 'fitness';

// User registration status for each challenge (will be loaded from backend)
let userChallenges = {
    fitness: false,
    finance: false,
    productivity: false,
    learning: false
};

// Cache for finance data
let financeData = {
    monthlyTarget: 0,
    expenses: [],
    summary: {}
};

// ==================== AUTHENTICATION ====================

function checkAuth() {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const loginTime = localStorage.getItem('loginTime');
    const now = new Date().getTime();
    const hoursSinceLogin = loginTime ? (now - loginTime) / (1000 * 60 * 60) : 999;
    
    if (isAuthenticated !== 'true' || hoursSinceLogin >= 24) {
        localStorage.clear();
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

if (!checkAuth()) {
    throw new Error('Not authenticated');
}

const user = localStorage.getItem("user") || "Guest";
document.getElementById("userName").innerText = user;

// Load user registrations from backend
async function loadUserRegistrations() {
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "getUserRegistrations",
                username: user
            })
        });
        const data = await res.json();
        
        if (data.success && data.registrations) {
            data.registrations.forEach(reg => {
                if (reg.status === 'active') {
                    userChallenges[reg.challenge] = true;
                    localStorage.setItem(`${reg.challenge}_registered`, 'true');
                }
            });
        }
    } catch(e) {
        console.error("Failed to load registrations:", e);
        // Fallback to localStorage
        Object.keys(userChallenges).forEach(challenge => {
            if (localStorage.getItem(`${challenge}_registered`) === 'true') {
                userChallenges[challenge] = true;
            }
        });
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.clear();
        window.location.href = 'index.html';
    }
}

// ==================== CHALLENGE SWITCHING ====================

function switchChallenge(challengeName) {
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-challenge') === challengeName) {
            btn.classList.add('active');
        }
    });
    
    // Update active content
    document.querySelectorAll('.challenge-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${challengeName}-challenge`).classList.add('active');
    
    currentChallenge = challengeName;
    
    // Load challenge-specific data
    loadChallengeData(challengeName);
}

function loadChallengeData(challengeName) {
    // Check registration status and load appropriate content
    const isRegistered = localStorage.getItem(`${challengeName}_registered`) === 'true';
    
    if (isRegistered) {
        userChallenges[challengeName] = true;
        loadChallengeContent(challengeName);
    } else {
        loadRegistrationScreen(challengeName);
    }
}

// ==================== REGISTRATION SCREENS ====================

function loadRegistrationScreen(challengeName) {
    const container = document.getElementById(`${challengeName}-challenge`);
    
    const registrationScreens = {
        fitness: `
            <div class="card registration-card">
                <h2>💪 Join the Fitness Challenge!</h2>
                <p>Transform your body in 12 weeks! Compete with other athletes, track your progress, and win cash prizes.</p>
                <div style="margin: 25px 0; padding: 20px; background: rgba(0,0,0,0.3); border-radius: 12px; text-align: left;">
                    <h3 style="color: var(--accent-gold); margin-bottom: 15px;">🏆 Prize Pool: ₹6,000</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li style="margin: 10px 0;">✅ Entry Fee: ₹1,000</li>
                        <li style="margin: 10px 0;">✅ Duration: Feb 2 - Apr 25, 2026</li>
                        <li style="margin: 10px 0;">✅ Weekly weigh-ins every Monday</li>
                        <li style="margin: 10px 0;">✅ Highest % weight loss wins!</li>
                        <li style="margin: 10px 0;">⚠️ ₹500 penalty for weight gain or missed weigh-in</li>
                    </ul>
                </div>
                <button class="btn btn-purple" onclick="registerForChallenge('fitness')" style="font-size: 1.1rem; padding: 15px 40px;">
                    🚀 Register Now - ₹1,000
                </button>
            </div>
        `,
        finance: `
            <div class="card registration-card">
                <h2>💰 Join the Finance Challenge!</h2>
                <p>Master your spending! Set budgets, track expenses, and compete to stay within your monthly limits.</p>
                <div style="margin: 25px 0; padding: 20px; background: rgba(0,0,0,0.3); border-radius: 12px; text-align: left;">
                    <h3 style="color: var(--accent-gold); margin-bottom: 15px;">💎 Challenge Benefits</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li style="margin: 10px 0;">✅ Set monthly spending targets</li>
                        <li style="margin: 10px 0;">✅ Track daily expenses</li>
                        <li style="margin: 10px 0;">✅ Compete with professionals</li>
                        <li style="margin: 10px 0;">✅ Build financial discipline</li>
                        <li style="margin: 10px 0;">🎯 Best savers get recognition!</li>
                    </ul>
                </div>
                <button class="btn btn-purple" onclick="registerForChallenge('finance')" style="font-size: 1.1rem; padding: 15px 40px;">
                    🚀 Start Your Financial Journey
                </button>
            </div>
        `
    };
    
    container.innerHTML = registrationScreens[challengeName] || `
        <div class="card registration-card">
            <h2>Coming Soon!</h2>
            <p>This challenge is under development. Stay tuned for updates!</p>
        </div>
    `;
}

function registerForChallenge(challengeName) {
    const confirmMessages = {
        fitness: 'Register for the Fitness Challenge? Entry fee: ₹1,000',
        finance: 'Start the Finance Challenge? This will help you build better spending habits!'
    };
    
    if (confirm(confirmMessages[challengeName])) {
        // Store registration in localStorage
        localStorage.setItem(`${challengeName}_registered`, 'true');
        userChallenges[challengeName] = true;
        
        // Send to backend
        registerChallengeBackend(challengeName);
        
        // Load challenge content
        loadChallengeContent(challengeName);
    }
}

async function registerChallengeBackend(challengeName) {
    try {
        await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "registerChallenge",
                username: user,
                challenge: challengeName,
                timestamp: new Date().toISOString()
            })
        });
    } catch(e) {
        console.error("Registration backend error:", e);
    }
}

// ==================== FITNESS CHALLENGE CONTENT ====================

function loadChallengeContent(challengeName) {
    if (challengeName === 'fitness') {
        loadFitnessChallenge();
    } else if (challengeName === 'finance') {
        loadFinanceChallenge();
    }
}

function loadFitnessChallenge() {
    const container = document.getElementById('fitness-challenge');
    container.innerHTML = `
        <div class="two-col-grid">
            <div class="main-panel">
                <div class="card prize-hero">
                    <h3>🏆 CHALLENGE PRIZE POOL</h3>
                    <h1>₹6,000</h1>
                    <div class="podium-container">
                        <div class="podium-step second"><div id="rank2">--</div><span>2nd</span></div>
                        <div class="podium-step first">👑<div id="rank1">--</div><span>Champ</span></div>
                        <div class="podium-step third"><div id="rank3">--</div><span>3rd</span></div>
                    </div>
                </div>

                <div class="stat-grid">
                    <div class="stat-box"><span>Your Rank</span><h2 id="userRank">--</h2></div>
                    <div class="stat-box"><span>Loss %</span><h2 id="userTotalPct">--</h2></div>
                    <div class="stat-box"><span>Days Left</span><h2 id="daysLeft">--</h2></div>
                </div>

                <div class="card">
                    <h3>⚔️ Weight Matrix</h3>
                    <div class="table-container"><table id="competitorTable" class="matrix-table"></table></div>
                </div>

                <div class="card">
                    <h3>📊 Weekly Progress (Delta %)</h3>
                    <div class="table-container"><table id="skipTable" class="matrix-table"></table></div>
                </div>
            </div>

            <div class="side-panel">
                <div class="card">
                    <h3>⚖️ Log Weight</h3>
                    <p id="logStatus" class="text-muted mb-1" style="font-size:0.85rem;">Checking permissions...</p>
                    <input type="number" step="0.1" id="weightInput" class="input-field" placeholder="Enter Weight (kg)">
                    <button onclick="addWeight()" id="submitBtn" class="btn w-100">Submit Monday Entry</button>
                </div>

                <div class="card">
                    <h3>🎯 Daily Challenges</h3>
                    <div id="challenge-list" style="margin-top:15px;">
                        <div class="stat-box mb-1" style="cursor: pointer; border: 2px solid var(--accent-primary);" onclick="completeChallenge('3L Water')">
                            <span>💧 Hydration</span>
                            <h2 style="font-size: 1.2rem; margin-top: 8px;">3L Water</h2>
                            <button class="btn mt-1" style="font-size: 0.85rem; padding: 8px 20px;">Mark Done</button>
                        </div>
                        <div class="stat-box" style="cursor: pointer; border: 2px solid var(--accent-secondary);" onclick="completeChallenge('10k Steps')">
                            <span>🏃 Movement</span>
                            <h2 style="font-size: 1.2rem; margin-top: 8px;">10k Steps</h2>
                            <button class="btn mt-1" style="font-size: 0.85rem; padding: 8px 20px;">Mark Done</button>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3>⏱️ Challenge Timer</h3>
                    <p id="countdown" style="color:var(--accent-gold); font-size:1.1rem; margin-top:10px; text-align: center;">--:--:--</p>
                </div>
            </div>
        </div>
    `;
    
    // Initialize fitness data
    checkMonday();
    initFitnessData();
    updateDaysLeft();
    setInterval(updateCountdown, 1000);
    setInterval(updateDaysLeft, 60000);
}

// ==================== FINANCE CHALLENGE CONTENT ====================

function loadFinanceChallenge() {
    const container = document.getElementById('finance-challenge');
    container.innerHTML = `
        <div class="two-col-grid">
            <div class="main-panel">
                <div class="card">
                    <h2>💰 Monthly Budget Overview</h2>
                    <div class="stat-grid">
                        <div class="stat-box">
                            <span>Monthly Target</span>
                            <h2 id="monthlyTarget">₹0</h2>
                        </div>
                        <div class="stat-box">
                            <span>Spent So Far</span>
                            <h2 id="totalSpent" class="text-danger">₹0</h2>
                        </div>
                        <div class="stat-box">
                            <span>Remaining</span>
                            <h2 id="remaining" class="text-success">₹0</h2>
                        </div>
                        <div class="stat-box">
                            <span>Daily Average</span>
                            <h2 id="dailyAvg">₹0</h2>
                        </div>
                    </div>
                    
                    <div class="mt-2">
                        <h3 class="mb-1">Budget Progress</h3>
                        <div class="progress-bar">
                            <div class="progress-fill" id="budgetProgress" style="width: 0%">0%</div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h2>📊 Expense Breakdown</h2>
                    <div id="expenseChart" style="margin-top: 15px;">
                        <div class="expense-item">
                            <div>
                                <strong>🍔 Food & Dining</strong>
                                <p class="text-muted" style="font-size: 0.85rem; margin-top: 4px;">12 transactions</p>
                            </div>
                            <div class="expense-amount">₹8,450</div>
                        </div>
                        <div class="expense-item">
                            <div>
                                <strong>🚗 Transportation</strong>
                                <p class="text-muted" style="font-size: 0.85rem; margin-top: 4px;">8 transactions</p>
                            </div>
                            <div class="expense-amount">₹3,200</div>
                        </div>
                        <div class="expense-item">
                            <div>
                                <strong>🛍️ Shopping</strong>
                                <p class="text-muted" style="font-size: 0.85rem; margin-top: 4px;">5 transactions</p>
                            </div>
                            <div class="expense-amount">₹5,600</div>
                        </div>
                        <div class="expense-item">
                            <div>
                                <strong>💡 Bills & Utilities</strong>
                                <p class="text-muted" style="font-size: 0.85rem; margin-top: 4px;">4 transactions</p>
                            </div>
                            <div class="expense-amount">₹2,800</div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h2>📈 Leaderboard - Best Savers</h2>
                    <div class="table-container">
                        <table class="matrix-table">
                            <thead>
                                <tr>
                                    <th class="sticky-col">Rank</th>
                                    <th>Participant</th>
                                    <th>Target</th>
                                    <th>Spent</th>
                                    <th>Saved %</th>
                                </tr>
                            </thead>
                            <tbody id="financeLeaderboard">
                                <tr>
                                    <td class="sticky-col">🥇</td>
                                    <td>--</td>
                                    <td>--</td>
                                    <td>--</td>
                                    <td>--</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="side-panel">
                <div class="card">
                    <h2>💳 Log Expense</h2>
                    <input type="number" id="expenseAmount" class="input-field" placeholder="Amount (₹)">
                    <select id="expenseCategory" class="input-field">
                        <option value="">Select Category</option>
                        <option value="food">🍔 Food & Dining</option>
                        <option value="transport">🚗 Transportation</option>
                        <option value="shopping">🛍️ Shopping</option>
                        <option value="bills">💡 Bills & Utilities</option>
                        <option value="entertainment">🎬 Entertainment</option>
                        <option value="health">⚕️ Health & Fitness</option>
                        <option value="other">📦 Other</option>
                    </select>
                    <input type="text" id="expenseNote" class="input-field" placeholder="Note (optional)">
                    <button onclick="addExpense()" class="btn w-100">Add Expense</button>
                </div>

                <div class="card">
                    <h2>🎯 Set Monthly Target</h2>
                    <input type="number" id="targetAmount" class="input-field" placeholder="Target Amount (₹)">
                    <button onclick="setMonthlyTarget()" class="btn w-100 btn-purple">Set Target</button>
                </div>

                <div class="card">
                    <h2>📅 Recent Expenses</h2>
                    <div id="recentExpenses" style="max-height: 300px; overflow-y: auto;">
                        <p class="text-muted text-center" style="padding: 20px;">No expenses logged yet</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Initialize finance data
    initFinanceData();
}

// ==================== FITNESS CHALLENGE FUNCTIONS ====================

function checkMonday() {
    const today = new Date().getDay();
    const btn = document.getElementById("submitBtn");
    const status = document.getElementById("logStatus");
    
    if (today === 1) {
        btn.disabled = false;
        status.innerText = "✅ It's Monday! Please log your weight.";
        status.className = "text-success mb-1";
    } else {
        btn.disabled = true;
        status.innerText = "⚠️ Weight logging is only open on Mondays.";
        status.className = "text-danger mb-1";
    }
}

async function addWeight() {
    const weight = document.getElementById("weightInput").value;
    if(!weight) return alert("Please enter your weight");
    
    try {
        await fetch(API_URL, {
            method:"POST", 
            body:JSON.stringify({
                action:"addWeight", 
                username:user, 
                weight:weight
            })
        });
        alert("✅ Weight logged successfully!");
        document.getElementById("weightInput").value = "";
        initFitnessData();
    } catch(e) { 
        alert("❌ Failed to log weight. Please try again."); 
    }
}

async function completeChallenge(challengeName) {
    try {
        await fetch(API_URL, {
            method: "POST", 
            body: JSON.stringify({
                action:"logChallenge", 
                username: user, 
                challenge: challengeName
            })
        });
        alert(`✅ ${challengeName} completed! Great job! 💪`);
    } catch(e) { 
        alert("❌ Failed to log challenge");
    }
}

async function initFitnessData() {
    try {
        const res = await fetch(API_URL, {
            method:"POST", 
            body:JSON.stringify({action:"getAllWeights"})
        });
        const data = await res.json();
        if(data.length > 1) renderFitnessTables(data);
    } catch(e) { 
        console.log("Failed to load fitness data"); 
    }
}

function renderFitnessTables(data) {
    const rows = data.slice(1);
    let usersMap = {}, datesSet = new Set();
    
    rows.forEach(r => {
        const d = new Date(r[1]);
        const label = d.toLocaleDateString('en-GB', {day:'2-digit', month:'short'});
        datesSet.add(label);
        if(!usersMap[r[0]]) usersMap[r[0]] = {};
        usersMap[r[0]][label] = parseFloat(r[2]);
    });
    
    const dates = [...datesSet].sort((a,b) => new Date(a) - new Date(b));
    
    let h1 = `<thead><tr><th class="sticky-col">Athlete</th>`;
    let h2 = h1;
    dates.forEach(d => { 
        h1 += `<th>${d}</th>`; 
        h2 += `<th>${d}</th>`; 
    });
    h1 += `<th>Total %</th></tr></thead><tbody>`;
    h2 += `</tr></thead><tbody>`;

    let leaderboard = Object.keys(usersMap).map(u => {
        const vals = dates.map(d => usersMap[u][d]).filter(v => v);
        const total = vals.length > 1 ? (((vals[0] - vals[vals.length-1])/vals[0])*100).toFixed(2) : 0;
        return { name: u, total: parseFloat(total) };
    });

    const sorted = leaderboard.sort((a,b) => b.total - a.total);
    
    if (document.getElementById("rank1")) {
        document.getElementById("rank1").innerText = sorted[0]?.name || "--";
        document.getElementById("rank2").innerText = sorted[1]?.name || "--";
        document.getElementById("rank3").innerText = sorted[2]?.name || "--";
        
        const myIdx = sorted.findIndex(i => i.name === user);
        document.getElementById("userRank").innerText = myIdx >= 0 ? `#${myIdx + 1}` : "--";
        document.getElementById("userTotalPct").innerText = myIdx >= 0 ? `${sorted[myIdx].total}%` : "--";
    }

    sorted.forEach(item => {
        h1 += `<tr><td class="sticky-col">${item.name}</td>`;
        h2 += `<tr><td class="sticky-col">${item.name}</td>`;
        dates.forEach((d, i) => {
            const v = usersMap[item.name][d] || '-';
            h1 += `<td>${v}</td>`;
            let prev = dates[i-1] ? usersMap[item.name][dates[i-1]] : null;
            let delta = (prev && v !== '-') ? `<div style="font-size:0.75rem; color:var(--success)">${(((prev-v)/prev)*100).toFixed(1)}%</div>` : "";
            h2 += `<td>${v}${delta}</td>`;
        });
        h1 += `<td><strong>${item.total}%</strong></td></tr>`;
        h2 += `</tr>`;
    });
    
    if (document.getElementById("competitorTable")) {
        document.getElementById("competitorTable").innerHTML = h1 + "</tbody>";
        document.getElementById("skipTable").innerHTML = h2 + "</tbody>";
    }
}

function updateDaysLeft() {
    const endDate = new Date('2026-04-25');
    const today = new Date();
    const timeLeft = endDate - today;
    const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
    
    const daysLeftElement = document.getElementById("daysLeft");
    if (daysLeftElement) {
        if (daysLeft > 0) {
            daysLeftElement.innerText = daysLeft;
            daysLeftElement.style.color = daysLeft <= 7 ? 'var(--danger)' : 'var(--accent-primary)';
        } else {
            daysLeftElement.innerText = "Ended";
            daysLeftElement.style.color = 'var(--text-muted)';
        }
    }
}

function updateCountdown() {
    const endDate = new Date('2026-04-25T23:59:59');
    const now = new Date();
    const diff = endDate - now;
    
    const countdownEl = document.getElementById("countdown");
    if (countdownEl) {
        if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            countdownEl.innerText = `⏱️ ${days}d ${hours}h ${minutes}m ${seconds}s`;
        } else {
            countdownEl.innerText = "Challenge Completed! 🎉";
        }
    }
}

// ==================== FINANCE CHALLENGE FUNCTIONS ====================

async function initFinanceData() {
    try {
        // Load budget from backend
        const budgetRes = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "getMonthlyBudget",
                username: user
            })
        });
        const budgetData = await budgetRes.json();
        
        if (budgetData.success) {
            financeData.monthlyTarget = budgetData.targetAmount || 0;
        }
        
        // Load expenses from backend
        const expensesRes = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "getUserExpenses",
                username: user
            })
        });
        const expensesData = await expensesRes.json();
        
        if (expensesData.success) {
            financeData.expenses = expensesData.expenses || [];
        }
        
        // Load expense summary
        const summaryRes = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "getExpenseSummary",
                username: user
            })
        });
        const summaryData = await summaryRes.json();
        
        if (summaryData.success) {
            financeData.summary = summaryData.summary || {};
        }
        
        updateFinanceDisplay();
        loadFinanceLeaderboard();
    } catch(e) {
        console.error("Failed to load finance data:", e);
        // Fallback to localStorage
        const monthlyTarget = localStorage.getItem(`${user}_monthlyTarget`) || 0;
        const expenses = JSON.parse(localStorage.getItem(`${user}_expenses`) || '[]');
        financeData.monthlyTarget = monthlyTarget;
        financeData.expenses = expenses;
        updateFinanceDisplay();
    }
}

async function setMonthlyTarget() {
    const target = document.getElementById("targetAmount").value;
    if (!target || target <= 0) {
        alert("Please enter a valid target amount");
        return;
    }
    
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "setMonthlyBudget",
                username: user,
                targetAmount: parseFloat(target)
            })
        });
        const data = await res.json();
        
        if (data.success) {
            alert(`✅ Monthly target set to ₹${target}`);
            document.getElementById("targetAmount").value = "";
            initFinanceData();
        } else {
            throw new Error("Backend error");
        }
    } catch(e) {
        console.error("Failed to set budget:", e);
        // Fallback to localStorage
        localStorage.setItem(`${user}_monthlyTarget`, target);
        document.getElementById("targetAmount").value = "";
        alert(`✅ Monthly target set to ₹${target}`);
        initFinanceData();
    }
}

async function addExpense() {
    const amount = document.getElementById("expenseAmount").value;
    const category = document.getElementById("expenseCategory").value;
    const note = document.getElementById("expenseNote").value;
    
    if (!amount || !category) {
        alert("Please fill in amount and category");
        return;
    }
    
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "addExpense",
                username: user,
                amount: parseFloat(amount),
                category: category,
                note: note
            })
        });
        const data = await res.json();
        
        if (data.success) {
            // Clear form
            document.getElementById("expenseAmount").value = "";
            document.getElementById("expenseCategory").value = "";
            document.getElementById("expenseNote").value = "";
            
            alert(`✅ Expense of ₹${amount} logged!`);
            initFinanceData();
        } else {
            throw new Error("Backend error");
        }
    } catch(e) {
        console.error("Failed to add expense:", e);
        // Fallback to localStorage
        const expenses = JSON.parse(localStorage.getItem(`${user}_expenses`) || '[]');
        expenses.push({
            amount: parseFloat(amount),
            category: category,
            note: note,
            date: new Date().toISOString()
        });
        localStorage.setItem(`${user}_expenses`, JSON.stringify(expenses));
        
        document.getElementById("expenseAmount").value = "";
        document.getElementById("expenseCategory").value = "";
        document.getElementById("expenseNote").value = "";
        
        alert(`✅ Expense of ₹${amount} logged!`);
        initFinanceData();
    }
}

function updateFinanceDisplay() {
    const target = parseFloat(financeData.monthlyTarget) || 0;
    const totalSpent = financeData.expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const remaining = target - totalSpent;
    const percentage = target > 0 ? Math.min((totalSpent / target) * 100, 100) : 0;
    
    // Update stats
    if (document.getElementById("monthlyTarget")) {
        document.getElementById("monthlyTarget").innerText = `₹${parseInt(target).toLocaleString('en-IN')}`;
        document.getElementById("totalSpent").innerText = `₹${parseInt(totalSpent).toLocaleString('en-IN')}`;
        document.getElementById("remaining").innerText = `₹${parseInt(remaining).toLocaleString('en-IN')}`;
        
        const today = new Date().getDate();
        const dailyAvg = today > 0 ? totalSpent / today : 0;
        document.getElementById("dailyAvg").innerText = `₹${parseInt(dailyAvg).toLocaleString('en-IN')}`;
        
        // Update progress bar
        const progressBar = document.getElementById("budgetProgress");
        progressBar.style.width = `${percentage}%`;
        progressBar.innerText = `${percentage.toFixed(1)}%`;
        
        if (percentage >= 90) {
            progressBar.className = "progress-fill danger";
        } else if (percentage >= 70) {
            progressBar.className = "progress-fill warning";
        } else {
            progressBar.className = "progress-fill";
        }
        
        // Update color classes
        if (remaining < 0) {
            document.getElementById("remaining").className = "text-danger";
            document.getElementById("totalSpent").className = "text-danger";
        } else {
            document.getElementById("remaining").className = "text-success";
            document.getElementById("totalSpent").className = "text-warning";
        }
    }
    
    // Update expense breakdown
    updateExpenseBreakdown();
    
    // Update recent expenses
    updateRecentExpenses();
}

function updateExpenseBreakdown() {
    const chartContainer = document.getElementById("expenseChart");
    if (!chartContainer) return;
    
    const categoryIcons = {
        food: '🍔',
        transport: '🚗',
        shopping: '🛍️',
        bills: '💡',
        entertainment: '🎬',
        health: '⚕️',
        other: '📦'
    };
    
    const categoryNames = {
        food: 'Food & Dining',
        transport: 'Transportation',
        shopping: 'Shopping',
        bills: 'Bills & Utilities',
        entertainment: 'Entertainment',
        health: 'Health & Fitness',
        other: 'Other'
    };
    
    // Calculate category totals
    const categoryTotals = {};
    const categoryCounts = {};
    
    financeData.expenses.forEach(exp => {
        const cat = exp.category;
        if (!categoryTotals[cat]) {
            categoryTotals[cat] = 0;
            categoryCounts[cat] = 0;
        }
        categoryTotals[cat] += parseFloat(exp.amount);
        categoryCounts[cat]++;
    });
    
    // Sort by total (descending)
    const sortedCategories = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 6); // Top 6 categories
    
    if (sortedCategories.length === 0) {
        chartContainer.innerHTML = '<p class="text-muted text-center" style="padding: 20px;">No expenses yet. Start tracking!</p>';
        return;
    }
    
    chartContainer.innerHTML = sortedCategories.map(([cat, total]) => {
        const icon = categoryIcons[cat] || '📦';
        const name = categoryNames[cat] || cat;
        const count = categoryCounts[cat];
        
        return `
            <div class="expense-item">
                <div>
                    <strong>${icon} ${name}</strong>
                    <p class="text-muted" style="font-size: 0.85rem; margin-top: 4px;">${count} transaction${count > 1 ? 's' : ''}</p>
                </div>
                <div class="expense-amount">₹${parseInt(total).toLocaleString('en-IN')}</div>
            </div>
        `;
    }).join('');
}

function updateRecentExpenses() {
    const container = document.getElementById("recentExpenses");
    if (!container) return;
    
    if (financeData.expenses.length === 0) {
        container.innerHTML = '<p class="text-muted text-center" style="padding: 20px;">No expenses logged yet</p>';
        return;
    }
    
    const categoryIcons = {
        food: '🍔',
        transport: '🚗',
        shopping: '🛍️',
        bills: '💡',
        entertainment: '🎬',
        health: '⚕️',
        other: '📦'
    };
    
    // Sort by date (most recent first) and take top 10
    const recent = [...financeData.expenses]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);
    
    container.innerHTML = recent.map(exp => {
        const date = new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        const icon = categoryIcons[exp.category] || '📦';
        return `
            <div class="expense-item" style="margin-bottom: 10px; padding: 12px;">
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    <div><strong>${icon} ${exp.category}</strong></div>
                    <div class="text-muted" style="font-size: 0.8rem;">${date}${exp.note ? ' • ' + exp.note : ''}</div>
                </div>
                <div class="expense-amount" style="font-size: 1rem;">₹${parseFloat(exp.amount).toLocaleString('en-IN')}</div>
            </div>
        `;
    }).join('');
}

async function loadFinanceLeaderboard() {
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "getFinanceLeaderboard",
                username: user
            })
        });
        const data = await res.json();
        
        if (data.success && data.leaderboard) {
            updateFinanceLeaderboard(data.leaderboard);
        }
    } catch(e) {
        console.error("Failed to load leaderboard:", e);
    }
}

function updateFinanceLeaderboard(leaderboard) {
    const tbody = document.getElementById("financeLeaderboard");
    if (!tbody) return;
    
    if (leaderboard.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td class="sticky-col">--</td>
                <td>No data yet</td>
                <td>--</td>
                <td>--</td>
                <td>--</td>
            </tr>
        `;
        return;
    }
    
    const medals = ['🥇', '🥈', '🥉'];
    
    tbody.innerHTML = leaderboard.slice(0, 10).map((entry, index) => {
        const medal = medals[index] || `#${index + 1}`;
        const savedPercent = parseFloat(entry.savedPercent);
        const percentClass = savedPercent >= 0 ? 'text-success' : 'text-danger';
        
        return `
            <tr style="${entry.username === user ? 'background: rgba(0, 210, 255, 0.1);' : ''}">
                <td class="sticky-col">${medal}</td>
                <td>${entry.username}</td>
                <td>₹${parseInt(entry.target).toLocaleString('en-IN')}</td>
                <td>₹${parseInt(entry.spent).toLocaleString('en-IN')}</td>
                <td class="${percentClass}"><strong>${savedPercent}%</strong></td>
            </tr>
        `;
    }).join('');
}

// ==================== AI COACH CHAT ====================

function toggleChat() {
    document.getElementById("chat-window").classList.toggle("chat-hidden");
}

async function coachResponse() {
    const input = document.getElementById("userQuery");
    const body = document.getElementById("chat-body");
    const query = input.value.trim();
    if(!query) return;

    // Add user message
    const userMsgWrapper = document.createElement('div');
    userMsgWrapper.className = 'message-wrapper';
    userMsgWrapper.style.justifyContent = 'flex-end';
    userMsgWrapper.innerHTML = `<div class="user-msg">${query}</div>`;
    body.appendChild(userMsgWrapper);
    
    input.value = "";
    
    // Add typing indicator
    const typingWrapper = document.createElement('div');
    typingWrapper.className = 'message-wrapper';
    typingWrapper.id = 'typing-indicator';
    typingWrapper.innerHTML = `
        <div class="bot-avatar">🤖</div>
        <div class="bot-msg">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    body.appendChild(typingWrapper);
    body.scrollTop = body.scrollHeight;

    try {
        // Get context based on current challenge
        let context = `User: ${user}, Challenge: ${currentChallenge}`;
        
        if (currentChallenge === 'fitness' && document.getElementById("userRank")) {
            const rank = document.getElementById("userRank").innerText;
            const loss = document.getElementById("userTotalPct").innerText;
            context += `, Rank: ${rank}, Weight Loss: ${loss}`;
        } else if (currentChallenge === 'finance' && document.getElementById("totalSpent")) {
            const spent = document.getElementById("totalSpent").innerText;
            const target = document.getElementById("monthlyTarget").innerText;
            context += `, Spent: ${spent}, Target: ${target}`;
        }
        
        const response = await puter.ai.chat(
            `System: You are an AI Coach for ProChallenge Hub. ${context}. Be brief (2-3 sentences), motivational, and use relevant emojis. User query: ${query}`
        );
        
        // Remove typing indicator
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        
        // Add bot response
        const botMsgWrapper = document.createElement('div');
        botMsgWrapper.className = 'message-wrapper';
        botMsgWrapper.innerHTML = `
            <div class="bot-avatar">🤖</div>
            <div class="bot-msg">${response.message.content}</div>
        `;
        body.appendChild(botMsgWrapper);
    } catch (e) { 
        // Remove typing indicator on error
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        
        const errorMsgWrapper = document.createElement('div');
        errorMsgWrapper.className = 'message-wrapper';
        errorMsgWrapper.innerHTML = `
            <div class="bot-avatar">🤖</div>
            <div class="bot-msg">I'm having trouble connecting right now. Try again in a moment! 💪</div>
        `;
        body.appendChild(errorMsgWrapper);
    }
    body.scrollTop = body.scrollHeight;
}

// Handle enter key in chat
document.addEventListener('DOMContentLoaded', function() {
    const queryInput = document.getElementById("userQuery");
    if (queryInput) {
        queryInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                coachResponse();
            }
        });
    }
});

// ==================== INITIALIZATION ====================

// Load initial challenge content
window.addEventListener('DOMContentLoaded', async function() {
    // Load user registrations from backend
    await loadUserRegistrations();
    
    // Load the initial challenge
    loadChallengeData('fitness');
});
