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
                    <h3>⏱️ Challenge Timer</h3>
                    <p id="countdown" style="color:var(--accent-gold); font-size:1.1rem; margin-top:10px; text-align: center;">--:--:--</p>
                </div>

                <div class="card">
                    <h3>📊 BMI Calculator</h3>
                    <p class="text-muted mb-1" style="font-size:0.85rem;">Calculate and track your Body Mass Index</p>
                    <button onclick="openBMICalculator()" class="btn w-100" style="background: linear-gradient(135deg, var(--accent-tertiary) 0%, #7209b7 100%); color: white;">
                        🧮 Calculate BMI
                    </button>
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

// BMI Calculator Modal Functions
function openBMICalculator() {
    // Create modal if it doesn't exist
    if (!document.getElementById('bmi-modal')) {
        createBMIModal();
    }
    
    document.getElementById('bmi-modal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeBMIModal() {
    document.getElementById('bmi-modal').classList.remove('show');
    document.body.style.overflow = 'auto';
}

function createBMIModal() {
    const modalHTML = `
        <div id="bmi-modal" class="bmi-modal">
            <div class="bmi-modal-content">
                <div class="bmi-header">
                    <h2>📊 BMI Calculator</h2>
                    <span class="close-bmi" onclick="closeBMIModal()">&times;</span>
                </div>
                
                <div class="bmi-body">
                    <div class="bmi-input-section">
                        <div class="input-group">
                            <label class="bmi-label">Height (cm)</label>
                            <input type="number" id="bmi-height" class="input-field" placeholder="e.g., 170" step="0.1">
                        </div>
                        
                        <div class="input-group">
                            <label class="bmi-label">Weight (kg)</label>
                            <input type="number" id="bmi-weight" class="input-field" placeholder="e.g., 70" step="0.1">
                        </div>
                        
                        <div class="input-group">
                            <label class="bmi-label">Age (years)</label>
                            <input type="number" id="bmi-age" class="input-field" placeholder="e.g., 30">
                        </div>
                        
                        <div class="input-group">
                            <label class="bmi-label">Gender</label>
                            <select id="bmi-gender" class="input-field">
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                        
                        <button onclick="calculateBMI()" class="btn w-100 mt-2">
                            🧮 Calculate BMI
                        </button>
                    </div>
                    
                    <div id="bmi-result-section" class="bmi-result-section" style="display: none;">
                        <div class="bmi-score-display">
                            <div class="bmi-score-circle">
                                <div class="bmi-score-value" id="bmi-value">--</div>
                                <div class="bmi-score-label">BMI</div>
                            </div>
                        </div>
                        
                        <div class="bmi-category" id="bmi-category">
                            <h3 id="bmi-category-title">Category</h3>
                            <p id="bmi-category-desc">Description</p>
                        </div>
                        
                        <div class="bmi-scale">
                            <div class="bmi-scale-bar">
                                <div class="bmi-scale-segment underweight">Underweight</div>
                                <div class="bmi-scale-segment normal">Normal</div>
                                <div class="bmi-scale-segment overweight">Overweight</div>
                                <div class="bmi-scale-segment obese">Obese</div>
                            </div>
                            <div class="bmi-marker" id="bmi-marker"></div>
                        </div>
                        
                        <div class="bmi-details" id="bmi-details">
                            <!-- Details will be populated -->
                        </div>
                        
                        <div class="bmi-actions mt-2">
                            <button onclick="exportBMIToPDF()" class="btn btn-purple w-100">
                                📄 Download PDF Report
                            </button>
                            <button onclick="resetBMICalculator()" class="btn btn-warning w-100 mt-1">
                                🔄 Calculate Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add modal styles
    addBMIModalStyles();
}

function addBMIModalStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .bmi-modal {
            display: none;
            position: fixed;
            z-index: 2000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(10px);
            animation: fadeIn 0.3s ease-out;
            overflow-y: auto;
        }
        
        .bmi-modal.show {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .bmi-modal-content {
            background: linear-gradient(145deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
            border: 2px solid var(--accent-tertiary);
            border-radius: 24px;
            padding: 30px;
            max-width: 600px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            animation: slideUp 0.4s ease-out;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7), var(--glow-purple);
        }
        
        .bmi-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid var(--accent-tertiary);
        }
        
        .bmi-header h2 {
            color: var(--accent-tertiary);
            font-size: 1.8rem;
            font-family: 'Orbitron', sans-serif;
            margin: 0;
        }
        
        .close-bmi {
            cursor: pointer;
            font-size: 2rem;
            color: var(--text-primary);
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s;
        }
        
        .close-bmi:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: rotate(90deg);
        }
        
        .input-group {
            margin-bottom: 15px;
        }
        
        .bmi-label {
            display: block;
            color: var(--text-secondary);
            font-size: 0.9rem;
            margin-bottom: 8px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .bmi-score-display {
            display: flex;
            justify-content: center;
            margin: 30px 0;
        }
        
        .bmi-score-circle {
            width: 180px;
            height: 180px;
            border-radius: 50%;
            background: linear-gradient(135deg, rgba(157, 78, 221, 0.2) 0%, rgba(0, 210, 255, 0.2) 100%);
            border: 4px solid var(--accent-tertiary);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 40px rgba(157, 78, 221, 0.4);
            animation: pulseGlow 2s infinite;
        }
        
        @keyframes pulseGlow {
            0%, 100% { box-shadow: 0 0 40px rgba(157, 78, 221, 0.4); }
            50% { box-shadow: 0 0 60px rgba(157, 78, 221, 0.6); }
        }
        
        .bmi-score-value {
            font-size: 3.5rem;
            font-weight: 900;
            font-family: 'Orbitron', sans-serif;
            color: var(--accent-tertiary);
            line-height: 1;
        }
        
        .bmi-score-label {
            font-size: 1rem;
            color: var(--text-secondary);
            margin-top: 8px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        .bmi-category {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .bmi-category h3 {
            font-family: 'Orbitron', sans-serif;
            font-size: 1.5rem;
            margin-bottom: 10px;
        }
        
        .bmi-category p {
            color: var(--text-secondary);
            line-height: 1.6;
        }
        
        .bmi-scale {
            position: relative;
            margin: 30px 0;
        }
        
        .bmi-scale-bar {
            display: flex;
            height: 40px;
            border-radius: 20px;
            overflow: hidden;
            border: 2px solid var(--border);
        }
        
        .bmi-scale-segment {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: 700;
            color: #000;
            text-transform: uppercase;
        }
        
        .bmi-scale-segment.underweight {
            background: #64b5f6;
        }
        
        .bmi-scale-segment.normal {
            background: var(--success);
        }
        
        .bmi-scale-segment.overweight {
            background: var(--warning);
        }
        
        .bmi-scale-segment.obese {
            background: var(--danger);
        }
        
        .bmi-marker {
            position: absolute;
            bottom: -30px;
            width: 0;
            height: 0;
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;
            border-bottom: 15px solid var(--accent-tertiary);
            transform: translateX(-50%);
            transition: left 0.5s ease;
        }
        
        .bmi-details {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
            padding: 20px;
            margin-top: 40px;
        }
        
        .bmi-detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid var(--border);
        }
        
        .bmi-detail-row:last-child {
            border-bottom: none;
        }
        
        .bmi-detail-label {
            color: var(--text-muted);
            font-size: 0.9rem;
        }
        
        .bmi-detail-value {
            color: var(--text-primary);
            font-weight: 700;
        }
        
        @media (max-width: 768px) {
            .bmi-modal-content {
                padding: 20px;
            }
            
            .bmi-score-circle {
                width: 150px;
                height: 150px;
            }
            
            .bmi-score-value {
                font-size: 2.5rem;
            }
        }
    `;
    document.head.appendChild(style);
}

function calculateBMI() {
    const height = parseFloat(document.getElementById('bmi-height').value);
    const weight = parseFloat(document.getElementById('bmi-weight').value);
    const age = parseInt(document.getElementById('bmi-age').value);
    const gender = document.getElementById('bmi-gender').value;
    
    // Validation
    if (!height || !weight || !age) {
        alert('Please fill in all fields');
        return;
    }
    
    if (height <= 0 || weight <= 0 || age <= 0) {
        alert('Please enter valid positive values');
        return;
    }
    
    // Calculate BMI
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    
    // Determine category and diet plan
    let category, categoryColor, categoryDesc, recommendations, dietPlan, mealPlan, foodsToEat, foodsToAvoid;
    
    if (bmi < 18.5) {
        category = 'Underweight';
        categoryColor = '#64b5f6';
        categoryDesc = 'Your BMI is below the healthy range';
        recommendations = [
            'Increase caloric intake with nutrient-rich foods',
            'Focus on strength training to build muscle mass',
            'Eat 5-6 smaller meals throughout the day',
            'Monitor your progress weekly'
        ];
        
        dietPlan = {
            calorieTarget: 'Aim for calorie surplus of 300-500 calories above maintenance',
            macros: 'Protein: 1.6-2.2g/kg | Carbs: 4-6g/kg | Fats: 0.8-1g/kg',
            focus: 'Nutrient-dense, calorie-rich foods to gain healthy weight'
        };
        
        mealPlan = {
            breakfast: [
                'Oatmeal with nuts, dried fruits, and whole milk',
                'Scrambled eggs (3-4) with avocado and whole grain toast',
                'Smoothie: banana, peanut butter, oats, protein powder, milk'
            ],
            midMorning: [
                'Greek yogurt with granola and honey',
                'Trail mix with nuts and dried fruits',
                'Protein shake with banana'
            ],
            lunch: [
                'Grilled chicken/paneer with quinoa and roasted vegetables',
                'Fish curry with brown rice and dal',
                'Pasta with lean meat sauce and vegetables'
            ],
            evening: [
                'Whole grain sandwich with chicken/cheese and veggies',
                'Hummus with whole wheat pita bread',
                'Fruit smoothie with protein powder'
            ],
            dinner: [
                'Grilled salmon/chicken with sweet potato and salad',
                'Paneer tikka with roti and mixed vegetables',
                'Egg curry with brown rice and lentils'
            ],
            bedtime: [
                'Casein protein shake or Greek yogurt',
                'Glass of milk with almonds',
                'Cottage cheese with berries'
            ]
        };
        
        foodsToEat = [
            '🥑 Avocados - healthy fats and calories',
            '🥜 Nuts & nut butters - dense calories and protein',
            '🥛 Whole milk and dairy products',
            '🍚 Brown rice, quinoa, whole grains',
            '🥩 Lean meats, fish, eggs for protein',
            '🍌 Bananas, dried fruits for quick energy',
            '🧀 Cheese and full-fat dairy',
            '🥔 Sweet potatoes and starchy vegetables'
        ];
        
        foodsToAvoid = [
            '🚫 Diet/low-calorie foods',
            '🚫 Excessive caffeine (suppresses appetite)',
            '🚫 Too much fiber before meals',
            '🚫 Carbonated drinks (fills you up)',
            '🚫 Empty calorie junk food',
            '🚫 Skipping meals'
        ];
        
    } else if (bmi >= 18.5 && bmi < 25) {
        category = 'Normal Weight';
        categoryColor = 'var(--success)';
        categoryDesc = 'Your BMI is in the healthy range';
        recommendations = [
            'Maintain your current healthy lifestyle',
            'Continue regular exercise (150 min/week)',
            'Eat a balanced diet with variety',
            'Stay hydrated and get adequate sleep'
        ];
        
        dietPlan = {
            calorieTarget: 'Maintain current calorie intake (approx. 1800-2400 cal/day)',
            macros: 'Protein: 1.2-1.6g/kg | Carbs: 3-5g/kg | Fats: 0.5-0.8g/kg',
            focus: 'Balanced nutrition to maintain healthy weight'
        };
        
        mealPlan = {
            breakfast: [
                'Poha/Upma with vegetables and peanuts',
                'Whole grain toast with eggs and avocado',
                'Idli/Dosa with sambar and chutney'
            ],
            midMorning: [
                'Fresh fruit (apple, orange, berries)',
                'Handful of almonds or walnuts',
                'Green tea with digestive biscuits'
            ],
            lunch: [
                'Roti with dal, sabzi, and yogurt',
                'Grilled chicken salad with quinoa',
                'Fish/paneer curry with brown rice and vegetables'
            ],
            evening: [
                'Sprouts chaat with lemon',
                'Vegetable sandwich on whole grain bread',
                'Fruit salad with nuts'
            ],
            dinner: [
                'Grilled fish/chicken with steamed vegetables',
                'Mixed vegetable curry with 2 rotis',
                'Khichdi with yogurt and salad'
            ],
            optional: [
                'Small dessert 2-3 times per week',
                'Herbal tea before bed',
                'Dark chocolate (1-2 pieces) if craving'
            ]
        };
        
        foodsToEat = [
            '🥗 Variety of colorful vegetables',
            '🍎 Fresh seasonal fruits',
            '🐟 Lean proteins: fish, chicken, legumes',
            '🌾 Whole grains: oats, quinoa, brown rice',
            '🥜 Nuts and seeds in moderation',
            '🥛 Low-fat dairy or alternatives',
            '🫒 Healthy fats: olive oil, avocado',
            '💧 Plenty of water throughout day'
        ];
        
        foodsToAvoid = [
            '🚫 Excessive processed foods',
            '🚫 Too much added sugar',
            '🚫 Deep fried items regularly',
            '🚫 Overly large portions',
            '🚫 Eating late at night',
            '🚫 Skipping breakfast'
        ];
        
    } else if (bmi >= 25 && bmi < 30) {
        category = 'Overweight';
        categoryColor = 'var(--warning)';
        categoryDesc = 'Your BMI is above the healthy range';
        recommendations = [
            'Create a moderate caloric deficit (300-500 cal/day)',
            'Increase physical activity to 200+ min/week',
            'Focus on whole foods and reduce processed items',
            'Practice portion control and mindful eating'
        ];
        
        dietPlan = {
            calorieTarget: 'Deficit of 300-500 calories (approx. 1400-1800 cal/day)',
            macros: 'Protein: 1.6-2g/kg | Carbs: 2-3g/kg | Fats: 0.4-0.6g/kg',
            focus: 'High protein, moderate carbs, controlled portions for fat loss'
        };
        
        mealPlan = {
            breakfast: [
                'Oats with skim milk, berries, and chia seeds',
                'Egg white omelette with vegetables and 1 whole wheat toast',
                'Moong dal chilla with mint chutney'
            ],
            midMorning: [
                'Apple or orange with 5-6 almonds',
                'Green tea with 2-3 crackers',
                'Cucumber/carrot sticks with hummus'
            ],
            lunch: [
                'Grilled chicken breast with large salad and 1 small roti',
                'Dal with lots of vegetables and 1 cup brown rice',
                'Fish tikka with quinoa and steamed broccoli'
            ],
            evening: [
                'Roasted chana (chickpeas)',
                'Vegetable soup (no cream)',
                'Buttermilk with cucumber slices'
            ],
            dinner: [
                'Grilled fish/tofu with stir-fried vegetables',
                'Chicken/mushroom soup with side salad',
                'Palak paneer (low oil) with 1 roti and salad'
            ],
            tips: [
                'Drink water before meals',
                'Use smaller plates',
                'Stop eating when 80% full'
            ]
        };
        
        foodsToEat = [
            '🥦 Non-starchy vegetables (unlimited)',
            '🍗 Lean proteins: chicken breast, fish, tofu',
            '🥚 Egg whites and whole eggs (limited)',
            '🫘 Legumes and lentils',
            '🍓 Low-sugar fruits: berries, apple, orange',
            '🌾 Small portions of whole grains',
            '🥗 Large salads with light dressing',
            '💧 Water, green tea, black coffee'
        ];
        
        foodsToAvoid = [
            '🚫 Refined carbs: white bread, pasta, rice',
            '🚫 Sugary drinks and fruit juices',
            '🚫 Fried foods and heavy curries',
            '🚫 Sweets and desserts',
            '🚫 High-fat dairy products',
            '🚫 Alcohol and beer',
            '🚫 Processed snacks and chips',
            '🚫 Large portions of any food'
        ];
        
    } else {
        category = 'Obese';
        categoryColor = 'var(--danger)';
        categoryDesc = 'Your BMI indicates obesity';
        recommendations = [
            'Consult with a healthcare professional immediately',
            'Start with low-impact exercises (walking, swimming)',
            'Work with a registered dietitian',
            'Set small, achievable weekly goals'
        ];
        
        dietPlan = {
            calorieTarget: 'Deficit of 500-750 calories (1200-1600 cal/day under supervision)',
            macros: 'Protein: 2-2.5g/kg | Carbs: 1.5-2.5g/kg | Fats: 0.3-0.5g/kg',
            focus: 'High protein, low carb, very controlled portions - medical supervision recommended'
        };
        
        mealPlan = {
            breakfast: [
                'Vegetable omelette (2 eggs) with mushrooms and spinach',
                'Greek yogurt (low-fat) with berries and flaxseeds',
                'Vegetable upma with minimal oil'
            ],
            midMorning: [
                'Cucumber and tomato salad',
                'Green tea',
                '10-12 almonds (soaked)'
            ],
            lunch: [
                'Large mixed salad with grilled chicken/fish (palm-sized portion)',
                'Clear vegetable soup with tofu',
                'Steamed vegetables with 1 small bowl dal'
            ],
            evening: [
                'Herbal tea with roasted makhana',
                'Vegetable sticks (carrot, celery, cucumber)',
                'Buttermilk (no salt/sugar)'
            ],
            dinner: [
                'Grilled fish/chicken with steamed vegetables (no rice/roti)',
                'Clear soup with lots of vegetables',
                'Egg white curry with mixed vegetable salad'
            ],
            important: [
                'Consult doctor before starting',
                'Monitor health markers regularly',
                'Consider meal replacement under supervision',
                'Join support group or weight loss program'
            ]
        };
        
        foodsToEat = [
            '🥬 Green leafy vegetables (unlimited)',
            '🥒 Cucumbers, tomatoes, bell peppers',
            '🍗 Very lean proteins: fish, chicken breast',
            '🥚 Egg whites',
            '🫘 Small portions of legumes',
            '🍋 Lemon water and herbal teas',
            '🥗 Raw salads with vinegar dressing',
            '💧 Minimum 3L water daily'
        ];
        
        foodsToAvoid = [
            '🚫 ALL refined carbohydrates',
            '🚫 ALL sugary foods and drinks',
            '🚫 ALL fried and oily foods',
            '🚫 ALL fast food and junk food',
            '🚫 Full-fat dairy products',
            '🚫 Alcohol completely',
            '🚫 Fruit juices (eat whole fruits only)',
            '🚫 Late night eating',
            '🚫 Emotional eating triggers'
        ];
    }
    
    // Calculate ideal weight range
    const idealWeightMin = (18.5 * heightInMeters * heightInMeters).toFixed(1);
    const idealWeightMax = (24.9 * heightInMeters * heightInMeters).toFixed(1);
    
    // Store BMI data for PDF export
    window.bmiData = {
        bmi: bmi.toFixed(1),
        category,
        categoryDesc,
        recommendations,
        dietPlan,
        mealPlan,
        foodsToEat,
        foodsToAvoid,
        height,
        weight,
        age,
        gender,
        idealWeightMin,
        idealWeightMax,
        date: new Date().toLocaleDateString('en-IN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })
    };
    
    // Display results
    displayBMIResults(bmi, category, categoryColor, categoryDesc, recommendations, idealWeightMin, idealWeightMax, dietPlan, mealPlan, foodsToEat, foodsToAvoid);
}

function displayBMIResults(bmi, category, categoryColor, categoryDesc, recommendations, idealWeightMin, idealWeightMax, dietPlan, mealPlan, foodsToEat, foodsToAvoid) {
    // Hide input section, show results
    document.querySelector('.bmi-input-section').style.display = 'none';
    document.getElementById('bmi-result-section').style.display = 'block';
    
    // Update BMI value
    document.getElementById('bmi-value').textContent = bmi.toFixed(1);
    document.querySelector('.bmi-score-circle').style.borderColor = categoryColor;
    document.getElementById('bmi-value').style.color = categoryColor;
    
    // Update category
    const categoryEl = document.getElementById('bmi-category-title');
    categoryEl.textContent = category;
    categoryEl.style.color = categoryColor;
    document.getElementById('bmi-category-desc').textContent = categoryDesc;
    
    // Position marker on scale
    const markerPosition = calculateMarkerPosition(bmi);
    document.getElementById('bmi-marker').style.left = markerPosition + '%';
    
    // Generate meal plan HTML
    const mealPlanKeys = Object.keys(mealPlan);
    const mealPlanHTML = mealPlanKeys.map(mealTime => {
        const mealTitle = mealTime.charAt(0).toUpperCase() + mealTime.slice(1).replace(/([A-Z])/g, ' $1');
        const meals = mealPlan[mealTime];
        
        return `
            <div style="margin-bottom: 15px;">
                <h5 style="color: var(--accent-secondary); margin-bottom: 8px; font-size: 1rem;">
                    ${mealTitle}
                </h5>
                <ul style="list-style: none; padding-left: 15px; margin: 0;">
                    ${meals.map(meal => `
                        <li style="padding: 4px 0; color: var(--text-secondary); font-size: 0.9rem;">
                            • ${meal}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }).join('');
    
    // Update details with comprehensive diet information
    const detailsHTML = `
        <div class="bmi-detail-row">
            <span class="bmi-detail-label">Your BMI</span>
            <span class="bmi-detail-value" style="color: ${categoryColor}">${bmi.toFixed(1)}</span>
        </div>
        <div class="bmi-detail-row">
            <span class="bmi-detail-label">Category</span>
            <span class="bmi-detail-value">${category}</span>
        </div>
        <div class="bmi-detail-row">
            <span class="bmi-detail-label">Ideal Weight Range</span>
            <span class="bmi-detail-value">${idealWeightMin} - ${idealWeightMax} kg</span>
        </div>
        
        <!-- Diet Plan Section -->
        <div style="margin-top: 30px; padding: 20px; background: rgba(0, 210, 255, 0.05); border-radius: 12px; border: 2px solid var(--accent-secondary);">
            <h4 style="color: var(--accent-secondary); margin-bottom: 15px; font-family: 'Orbitron', sans-serif; font-size: 1.3rem;">
                🍽️ Personalized Diet Plan
            </h4>
            
            <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <div style="margin-bottom: 10px;">
                    <strong style="color: var(--accent-primary);">Daily Calorie Target:</strong><br>
                    <span style="color: var(--text-secondary);">${dietPlan.calorieTarget}</span>
                </div>
                <div style="margin-bottom: 10px;">
                    <strong style="color: var(--accent-primary);">Macronutrient Ratio:</strong><br>
                    <span style="color: var(--text-secondary);">${dietPlan.macros}</span>
                </div>
                <div>
                    <strong style="color: var(--accent-primary);">Focus:</strong><br>
                    <span style="color: var(--text-secondary);">${dietPlan.focus}</span>
                </div>
            </div>
            
            <!-- Sample Meal Plan -->
            <div style="margin-top: 20px;">
                <h5 style="color: var(--accent-tertiary); margin-bottom: 12px; font-size: 1.1rem;">
                    📅 Sample Daily Meal Plan
                </h5>
                <div style="background: rgba(0, 0, 0, 0.2); padding: 15px; border-radius: 8px;">
                    ${mealPlanHTML}
                </div>
            </div>
            
            <!-- Foods to Eat -->
            <div style="margin-top: 20px;">
                <h5 style="color: var(--success); margin-bottom: 12px; font-size: 1.1rem;">
                    ✅ Foods to Include
                </h5>
                <div style="background: rgba(0, 255, 136, 0.05); padding: 15px; border-radius: 8px; border: 1px solid rgba(0, 255, 136, 0.2);">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">
                        ${foodsToEat.map(food => `
                            <div style="padding: 6px; color: var(--text-secondary); font-size: 0.9rem;">
                                ${food}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <!-- Foods to Avoid -->
            <div style="margin-top: 20px;">
                <h5 style="color: var(--danger); margin-bottom: 12px; font-size: 1.1rem;">
                    ⛔ Foods to Limit/Avoid
                </h5>
                <div style="background: rgba(255, 56, 100, 0.05); padding: 15px; border-radius: 8px; border: 1px solid rgba(255, 56, 100, 0.2);">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">
                        ${foodsToAvoid.map(food => `
                            <div style="padding: 6px; color: var(--text-secondary); font-size: 0.9rem;">
                                ${food}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
        
        <!-- General Recommendations -->
        <div style="margin-top: 20px;">
            <h4 style="color: var(--accent-tertiary); margin-bottom: 12px; font-family: 'Orbitron', sans-serif;">
                💡 Health Recommendations
            </h4>
            <ul style="list-style: none; padding: 0;">
                ${recommendations.map(rec => `
                    <li style="padding: 8px 0; padding-left: 20px; position: relative;">
                        <span style="position: absolute; left: 0; color: var(--success);">✓</span>
                        ${rec}
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
    
    document.getElementById('bmi-details').innerHTML = detailsHTML;
}

function calculateMarkerPosition(bmi) {
    // BMI scale: <18.5, 18.5-25, 25-30, 30+
    // Each segment is 25% wide
    if (bmi < 18.5) {
        return (bmi / 18.5) * 25;
    } else if (bmi < 25) {
        return 25 + ((bmi - 18.5) / (25 - 18.5)) * 25;
    } else if (bmi < 30) {
        return 50 + ((bmi - 25) / (30 - 25)) * 25;
    } else {
        return Math.min(75 + ((bmi - 30) / 10) * 25, 98);
    }
}

function resetBMICalculator() {
    document.querySelector('.bmi-input-section').style.display = 'block';
    document.getElementById('bmi-result-section').style.display = 'none';
    
    // Clear inputs
    document.getElementById('bmi-height').value = '';
    document.getElementById('bmi-weight').value = '';
    document.getElementById('bmi-age').value = '';
}

// Add this improved PDF export function to replace the existing one in app.js

async function exportBMIToPDF() {
    if (!window.bmiData) {
        alert('No BMI data to export');
        return;
    }
    
    const { bmi, category, categoryDesc, recommendations, dietPlan, mealPlan, foodsToEat, foodsToAvoid, height, weight, age, gender, idealWeightMin, idealWeightMax, date } = window.bmiData;
    
    // Generate meal plan HTML
    const mealPlanKeys = Object.keys(mealPlan);
    const mealPlanHTML = mealPlanKeys.map(mealTime => {
        const mealTitle = mealTime.charAt(0).toUpperCase() + mealTime.slice(1).replace(/([A-Z])/g, ' $1');
        const meals = mealPlan[mealTime];
        
        return `
            <div style="margin-bottom: 12px; page-break-inside: avoid;">
                <h4 style="color: #2e7d32; margin-bottom: 6px; font-size: 10pt; border-bottom: 1px solid #ddd; padding-bottom: 3px;">
                    ${mealTitle}
                </h4>
                <ul style="list-style: none; padding-left: 0; margin: 0;">
                    ${meals.map(meal => `
                        <li style="padding: 3px 0; padding-left: 12px; position: relative; color: #555; font-size: 9pt;">
                            <span style="position: absolute; left: 0; color: #4caf50;">•</span>
                            ${meal}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }).join('');
    
    // Create print-optimized HTML
    const printHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>BMI Report - ${date}</title>
    <style>
        @page {
            size: A4;
            margin: 15mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.4;
            color: #333;
            background: white;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 3px solid #6a1b9a;
            padding-bottom: 12px;
        }
        
        .logo {
            font-size: 24pt;
            font-weight: bold;
            color: #0066cc;
        }
        
        .subtitle {
            color: #666;
            font-size: 12pt;
            margin-top: 5px;
        }
        
        .bmi-box {
            background: #f5f5f5;
            border: 2px solid #6a1b9a;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            margin: 15px 0;
        }
        
        .bmi-score {
            font-size: 42pt;
            font-weight: bold;
            color: #6a1b9a;
            margin: 8px 0;
        }
        
        .bmi-category {
            font-size: 16pt;
            font-weight: bold;
            margin: 5px 0;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin: 15px 0;
        }
        
        .info-card {
            background: #f9f9f9;
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 10px;
        }
        
        .info-label {
            color: #666;
            font-size: 8pt;
            text-transform: uppercase;
            font-weight: bold;
        }
        
        .info-value {
            color: #2e7d32;
            font-size: 14pt;
            font-weight: bold;
            margin-top: 3px;
        }
        
        .section {
            margin: 15px 0;
            page-break-inside: avoid;
        }
        
        .section-title {
            color: #0066cc;
            font-size: 12pt;
            font-weight: bold;
            border-bottom: 2px solid #0066cc;
            padding-bottom: 5px;
            margin-bottom: 10px;
        }
        
        .diet-box {
            background: #e3f2fd;
            border: 2px solid #0066cc;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 10px;
        }
        
        .diet-item {
            margin-bottom: 8px;
            padding: 6px;
            background: white;
            border-radius: 4px;
        }
        
        .diet-item strong {
            color: #2e7d32;
            font-size: 9pt;
        }
        
        .diet-item span {
            color: #555;
            font-size: 9pt;
        }
        
        .meal-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 10px;
        }
        
        .food-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 10px;
        }
        
        .food-box {
            border-radius: 6px;
            padding: 10px;
        }
        
        .food-yes {
            background: #e8f5e9;
            border: 2px solid #4caf50;
        }
        
        .food-no {
            background: #ffebee;
            border: 2px solid #f44336;
        }
        
        .food-box h4 {
            font-size: 10pt;
            margin-bottom: 8px;
        }
        
        .food-yes h4 {
            color: #2e7d32;
        }
        
        .food-no h4 {
            color: #c62828;
        }
        
        .food-item {
            padding: 2px 0;
            font-size: 8pt;
            color: #555;
        }
        
        .recommendations {
            background: #f3e5f5;
            border-left: 4px solid #6a1b9a;
            padding: 12px;
            margin: 12px 0;
        }
        
        .recommendations h3 {
            color: #6a1b9a;
            font-size: 11pt;
            margin-bottom: 8px;
        }
        
        .recommendations ul {
            list-style: none;
            padding: 0;
        }
        
        .recommendations li {
            padding: 4px 0;
            padding-left: 15px;
            position: relative;
            font-size: 9pt;
        }
        
        .recommendations li:before {
            content: '✓';
            position: absolute;
            left: 0;
            color: #4caf50;
            font-weight: bold;
        }
        
        .disclaimer {
            background: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 6px;
            padding: 10px;
            margin: 12px 0;
            font-size: 8pt;
            color: #856404;
        }
        
        .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 12px;
            border-top: 2px solid #ddd;
            font-size: 8pt;
            color: #666;
        }
        
        @media print {
            body {
                background: white !important;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">⚡ PROCHALLENGE HUB</div>
        <div class="subtitle">BMI & Nutrition Report</div>
    </div>
    
    <div class="bmi-box">
        <div style="font-size: 10pt; color: #666;">Body Mass Index</div>
        <div class="bmi-score">${bmi}</div>
        <div class="bmi-category">${category}</div>
        <div style="color: #666; margin-top: 5px; font-size: 9pt;">${categoryDesc}</div>
    </div>
    
    <div class="info-grid">
        <div class="info-card">
            <div class="info-label">Height</div>
            <div class="info-value">${height} cm</div>
        </div>
        <div class="info-card">
            <div class="info-label">Weight</div>
            <div class="info-value">${weight} kg</div>
        </div>
        <div class="info-card">
            <div class="info-label">Age</div>
            <div class="info-value">${age} years</div>
        </div>
        <div class="info-card">
            <div class="info-label">Gender</div>
            <div class="info-value">${gender.charAt(0).toUpperCase() + gender.slice(1)}</div>
        </div>
    </div>
    
    <div class="info-card" style="margin-bottom: 12px;">
        <div class="info-label">Ideal Weight Range</div>
        <div class="info-value">${idealWeightMin} - ${idealWeightMax} kg</div>
        <div style="color: #666; margin-top: 4px; font-size: 8pt;">Healthy BMI: 18.5 - 24.9</div>
    </div>
    
    <div class="section">
        <div class="section-title">🍽️ Diet Plan</div>
        <div class="diet-box">
            <div class="diet-item">
                <strong>Daily Calories:</strong>
                <span>${dietPlan.calorieTarget}</span>
            </div>
            <div class="diet-item">
                <strong>Macros:</strong>
                <span>${dietPlan.macros}</span>
            </div>
            <div class="diet-item">
                <strong>Focus:</strong>
                <span>${dietPlan.focus}</span>
            </div>
        </div>
    </div>
    
    <div style="page-break-before: always;"></div>
    
    <div class="section">
        <div class="section-title">📅 Sample Meal Plan</div>
        <div class="meal-grid">
            ${mealPlanHTML}
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">🥗 Food Guide</div>
        <div class="food-grid">
            <div class="food-box food-yes">
                <h4>✅ Include These</h4>
                ${foodsToEat.map(food => `<div class="food-item">${food}</div>`).join('')}
            </div>
            <div class="food-box food-no">
                <h4>⛔ Avoid These</h4>
                ${foodsToAvoid.map(food => `<div class="food-item">${food}</div>`).join('')}
            </div>
        </div>
    </div>
    
    <div class="recommendations">
        <h3>💡 Health Tips</h3>
        <ul>
            ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
    
    <div class="disclaimer">
        <strong>⚠️ Disclaimer:</strong> General guidance only. Consult healthcare professionals for personalized medical advice.
    </div>
    
    <div class="footer">
        <div><strong>Generated:</strong> ${date}</div>
        <div style="margin-top: 5px; color: #6a1b9a; font-weight: bold;">ProChallenge Hub - Your Health Journey</div>
    </div>
    
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 200);
        };
    </script>
</body>
</html>
    `;
    
    // Open in new window
    const win = window.open('', '_blank');
    if (!win) {
        alert('Please allow pop-ups to generate PDF');
        return;
    }
    
    win.document.write(printHTML);
    win.document.close();
    win.focus();
}

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
