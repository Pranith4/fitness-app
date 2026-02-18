// ProChallenge Hub - Fitness Dashboard App Logic
const API_URL = "https://script.google.com/macros/s/AKfycbzwWrCRjHYeJA0-5SHxAamG-H96m5ItJzOXtNhgu0sy43xIlkCPLTeayK6bKT1-S9-Raw/exec";

// ==================== AUTH CHECK ====================

(function checkAuth() {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const loginTime = localStorage.getItem('loginTime');
    const hoursSince = loginTime ? (Date.now() - loginTime) / 3600000 : 999;
    if (isAuthenticated !== 'true' || hoursSince >= 24) {
        localStorage.clear();
        window.location.href = 'index.html';
    }
})();

const user = localStorage.getItem('user') || 'Guest';

// Set username in header
document.getElementById('userName').innerText = user;

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.clear();
        window.location.href = 'index.html';
    }
}

// ==================== PAGE INIT ====================

window.addEventListener('DOMContentLoaded', async function () {
    const isRegistered = await checkFitnessRegistration();
    if (isRegistered) {
        renderFitnessChallenge();
    } else {
        renderRegistrationScreen();
    }
});

async function checkFitnessRegistration() {
    // Check localStorage cache first for speed
    if (localStorage.getItem('fitness_registered') === 'true') return true;

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({ action: "checkRegistration", username: user, challenge: "fitness" })
        });
        const data = await res.json();
        if (data.success && data.isRegistered) {
            localStorage.setItem('fitness_registered', 'true');
            return true;
        }
    } catch (e) {
        console.error("Registration check failed:", e);
    }
    return false;
}

// ==================== REGISTRATION SCREEN ====================

function renderRegistrationScreen() {
    document.getElementById('fitness-content').innerHTML = `
        <div class="card registration-card">
            <h2>💪 Join the Fitness Challenge!</h2>
            <p>Transform your body in 12 weeks! Compete with other athletes, track your progress, and win cash prizes.</p>
            <div class="reg-details">
                <h3>🏆 Prize Pool: ₹6,000</h3>
                <ul>
                    <li>✅ Entry Fee: ₹1,000</li>
                    <li>✅ Duration: Feb 2 – Apr 25, 2026</li>
                    <li>✅ Weekly weigh-ins every Monday</li>
                    <li>✅ Highest % weight loss wins!</li>
                    <li>⚠️ ₹500 penalty for weight gain or missed weigh-in</li>
                    <li>🥇 1st Place: ₹3,500 &nbsp; 🥈 2nd: ₹1,500 &nbsp; 🥉 3rd: ₹1,000</li>
                </ul>
            </div>
            <button class="btn btn-purple" onclick="registerForFitness()" style="font-size:1.1rem; padding:15px 45px;">
                🚀 Register Now – ₹1,000
            </button>
        </div>
    `;
}

async function registerForFitness() {
    if (!confirm('Register for the Fitness Challenge?\n\nEntry fee: ₹1,000\nDuration: Feb 2 – Apr 25, 2026')) return;

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({ action: "registerChallenge", username: user, challenge: "fitness" })
        });
        const data = await res.json();

        if (data.success) {
            localStorage.setItem('fitness_registered', 'true');
            alert('✅ Successfully registered! Welcome to the Fitness Challenge!');
            renderFitnessChallenge();
        } else if (data.message && data.message.includes('Already registered')) {
            // Already in DB, update localStorage and load
            localStorage.setItem('fitness_registered', 'true');
            renderFitnessChallenge();
        } else {
            alert('❌ Registration failed: ' + (data.message || 'Unknown error'));
        }
    } catch (e) {
        alert('❌ Connection error. Please try again.');
        console.error(e);
    }
}

// ==================== FITNESS CHALLENGE UI ====================

function renderFitnessChallenge() {
    document.getElementById('fitness-content').innerHTML = `
        <div class="two-col-grid">
            <!-- LEFT: Main Panel -->
            <div>
                <!-- Prize & Podium -->
                <div class="card prize-hero">
                    <h3>🏆 CHALLENGE PRIZE POOL</h3>
                    <div class="prize-amount">₹6,000</div>
                    <div class="podium-container">
                        <div class="podium-step second">
                            <div>🥈</div>
                            <div class="podium-name" id="rank2">--</div>
                            <div class="podium-pct" id="rank2pct"></div>
                        </div>
                        <div class="podium-step first">
                            <div>👑</div>
                            <div class="podium-name" id="rank1">--</div>
                            <div class="podium-pct" id="rank1pct"></div>
                        </div>
                        <div class="podium-step third">
                            <div>🥉</div>
                            <div class="podium-name" id="rank3">--</div>
                            <div class="podium-pct" id="rank3pct"></div>
                        </div>
                    </div>
                </div>

                <!-- Your Stats -->
                <div class="stat-grid">
                    <div class="stat-box"><span>Your Rank</span><h2 id="userRank">--</h2></div>
                    <div class="stat-box"><span>Loss %</span><h2 id="userTotalPct">--</h2></div>
                    <div class="stat-box"><span>Days Left</span><h2 id="daysLeft">--</h2></div>
                </div>

                <!-- Weight Matrix Table -->
                <div class="card">
                    <h3>⚔️ Weight Matrix (All Weigh-ins)</h3>
                    <p class="text-muted mb-1" style="font-size:0.85rem;">Weekly weights for all participants (kg)</p>
                    <div class="table-container">
                        <table id="competitorTable" class="matrix-table">
                            <thead><tr><th class="sticky-col">Athlete</th><th>Loading...</th></tr></thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>

                <!-- Weekly Delta Table -->
                <div class="card">
                    <h3>📊 Weekly Progress (% Change)</h3>
                    <p class="text-muted mb-1" style="font-size:0.85rem;">Weekly loss percentage compared to previous week</p>
                    <div class="table-container">
                        <table id="deltaTable" class="matrix-table">
                            <thead><tr><th class="sticky-col">Athlete</th><th>Loading...</th></tr></thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- RIGHT: Side Panel -->
            <div>
                <!-- Log Weight -->
                <div class="card">
                    <h3>⚖️ Log Weight</h3>
                    <div id="logStatus" class="status-msg status-warn mb-1">Checking...</div>
                    <input type="number" step="0.1" min="30" max="300" id="weightInput" class="input-field" placeholder="Enter weight (kg)">
                    <button onclick="addWeight()" id="submitWeightBtn" class="btn w-100" disabled>Submit Monday Weigh-in</button>
                </div>

                <!-- Goal Setter -->
                <div class="card">
                    <h3>🎯 Set Your Goal</h3>
                    <input type="number" step="0.1" id="startWeightInput" class="input-field" placeholder="Start Weight (kg)">
                    <input type="number" step="0.1" id="targetWeightInput" class="input-field" placeholder="Target Weight (kg)">
                    <button onclick="saveGoal()" class="btn btn-purple w-100">Save Goal</button>
                </div>

                <!-- Countdown Timer -->
                <div class="card text-center">
                    <h3 style="justify-content:center;">⏱️ Challenge Ends In</h3>
                    <div class="countdown-display" id="countdown">Calculating...</div>
                </div>

                <!-- BMI Calculator -->
                <div class="card text-center">
                    <h3 style="justify-content:center;">📊 BMI Calculator</h3>
                    <p class="text-muted mb-1" style="font-size:0.9rem;">Get your BMI, diet plan & recommendations</p>
                    <button onclick="openBMIModal()" class="btn btn-purple w-100 mt-1">🧮 Calculate BMI</button>
                </div>
            </div>
        </div>
    `;

    // Initialize
    checkMondayStatus();
    loadAllWeights();
    updateDaysLeft();
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// ==================== MONDAY CHECK ====================

function checkMondayStatus() {
    const today = new Date().getDay(); // 0=Sun, 1=Mon
    const btn = document.getElementById('submitWeightBtn');
    const status = document.getElementById('logStatus');

    if (today === 1) {
        btn.disabled = false;
        status.textContent = '✅ It\'s Monday! Please log your weight.';
        status.className = 'status-msg status-ok mb-1';
    } else {
        btn.disabled = true;
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        status.textContent = `⚠️ Weigh-ins are Mondays only. Today is ${days[today]}.`;
        status.className = 'status-msg status-warn mb-1';
    }
}

// ==================== ADD WEIGHT ====================

async function addWeight() {
    const weight = parseFloat(document.getElementById('weightInput').value);
    if (!weight || weight < 30 || weight > 300) {
        alert('Please enter a valid weight between 30 and 300 kg');
        return;
    }

    const btn = document.getElementById('submitWeightBtn');
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({ action: "addWeight", username: user, weight: weight })
        });
        const data = await res.json();

        if (data.success) {
            alert(`✅ Weight of ${weight} kg logged successfully!`);
            document.getElementById('weightInput').value = '';
            loadAllWeights(); // Refresh tables
        } else {
            alert('❌ Failed to log weight: ' + (data.message || 'Unknown error'));
        }
    } catch (e) {
        alert('❌ Connection error. Please check your internet and try again.');
        console.error(e);
    } finally {
        btn.textContent = 'Submit Monday Weigh-in';
        checkMondayStatus(); // Re-apply disabled state correctly
    }
}

// ==================== SAVE GOAL ====================

async function saveGoal() {
    const startWeight = document.getElementById('startWeightInput').value;
    const targetWeight = document.getElementById('targetWeightInput').value;

    if (!startWeight || !targetWeight) {
        alert('Please enter both start and target weights');
        return;
    }

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "saveGoal",
                username: user,
                startWeight: parseFloat(startWeight),
                targetWeight: parseFloat(targetWeight),
                startDate: '2026-02-02',
                endDate: '2026-04-25'
            })
        });
        const data = await res.json();

        if (data.success) {
            alert('✅ Goal saved! Keep pushing!');
            document.getElementById('startWeightInput').value = '';
            document.getElementById('targetWeightInput').value = '';
        } else {
            alert('❌ Failed to save goal: ' + (data.message || 'Unknown error'));
        }
    } catch (e) {
        alert('❌ Connection error.');
        console.error(e);
    }
}

// ==================== LOAD & RENDER TABLES ====================

async function loadAllWeights() {
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({ action: "getAllWeights" })
        });
        const data = await res.json();

        if (Array.isArray(data) && data.length > 1) {
            renderTables(data);
        } else {
            showEmptyTables();
        }
    } catch (e) {
        console.error("Failed to load weight data:", e);
        showEmptyTables();
    }
}

function showEmptyTables() {
    const emptyMsg = '<thead><tr><th>No data yet</th></tr></thead><tbody></tbody>';
    const ct = document.getElementById('competitorTable');
    const dt = document.getElementById('deltaTable');
    if (ct) ct.innerHTML = emptyMsg;
    if (dt) dt.innerHTML = emptyMsg;
}

function renderTables(rawData) {
    // rawData[0] = header row, [1+] = data rows
    const rows = rawData.slice(1);

    // Build map: { username -> { dateLabel -> weight } }
    const usersMap = {};
    const datesSet = new Set();

    rows.forEach(r => {
        const username = r[0];
        const date = new Date(r[1]);
        if (isNaN(date)) return;
        const label = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        datesSet.add(label);
        if (!usersMap[username]) usersMap[username] = {};
        // Keep latest entry per day
        usersMap[username][label] = parseFloat(r[2]);
    });

    // Sort dates chronologically
    const dates = [...datesSet].sort((a, b) => {
        return new Date(a.split(' ').reverse().join(' ')) - new Date(b.split(' ').reverse().join(' '));
    });

    // Build leaderboard (total % loss from first to last weigh-in)
    const leaderboard = Object.keys(usersMap).map(uName => {
        const vals = dates.map(d => usersMap[uName][d]).filter(v => v !== undefined && !isNaN(v));
        let totalPct = 0;
        if (vals.length >= 2) {
            totalPct = ((vals[0] - vals[vals.length - 1]) / vals[0] * 100);
        }
        return { name: uName, weights: usersMap[uName], total: parseFloat(totalPct.toFixed(2)) };
    }).sort((a, b) => b.total - a.total);

    // Update podium
    const r1 = leaderboard[0], r2 = leaderboard[1], r3 = leaderboard[2];
    if (document.getElementById('rank1')) {
        document.getElementById('rank1').textContent = r1?.name || '--';
        document.getElementById('rank1pct').textContent = r1 ? r1.total + '%' : '';
        document.getElementById('rank2').textContent = r2?.name || '--';
        document.getElementById('rank2pct').textContent = r2 ? r2.total + '%' : '';
        document.getElementById('rank3').textContent = r3?.name || '--';
        document.getElementById('rank3pct').textContent = r3 ? r3.total + '%' : '';
    }

    // Update user stats
    const myIdx = leaderboard.findIndex(i => i.name === user);
    if (document.getElementById('userRank')) {
        document.getElementById('userRank').textContent = myIdx >= 0 ? `#${myIdx + 1}` : '--';
        document.getElementById('userTotalPct').textContent = myIdx >= 0 ? `${leaderboard[myIdx].total}%` : '--';
    }

    // ---- WEIGHT MATRIX TABLE ----
    let matrixHTML = `<thead><tr><th class="sticky-col">Athlete</th>`;
    dates.forEach(d => matrixHTML += `<th>${d}</th>`);
    matrixHTML += `<th>Total %</th></tr></thead><tbody>`;

    leaderboard.forEach((entry, idx) => {
        const isMe = entry.name === user;
        matrixHTML += `<tr style="${isMe ? 'background:rgba(0,210,255,0.08);' : ''}">`;
        matrixHTML += `<td class="sticky-col">${idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ''}${entry.name}</td>`;
        dates.forEach(d => {
            const v = entry.weights[d];
            matrixHTML += `<td>${v !== undefined ? v : '–'}</td>`;
        });
        const totalColor = entry.total > 0 ? 'var(--success)' : entry.total < 0 ? 'var(--danger)' : '';
        matrixHTML += `<td><strong style="color:${totalColor}">${entry.total > 0 ? '+' : ''}${entry.total}%</strong></td>`;
        matrixHTML += `</tr>`;
    });
    matrixHTML += `</tbody>`;

    // ---- DELTA (WEEKLY CHANGE) TABLE ----
    let deltaHTML = `<thead><tr><th class="sticky-col">Athlete</th>`;
    dates.forEach(d => deltaHTML += `<th>${d}</th>`);
    deltaHTML += `</tr></thead><tbody>`;

    leaderboard.forEach((entry, idx) => {
        const isMe = entry.name === user;
        deltaHTML += `<tr style="${isMe ? 'background:rgba(0,210,255,0.08);' : ''}">`;
        deltaHTML += `<td class="sticky-col">${idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ''}${entry.name}</td>`;

        dates.forEach((d, i) => {
            const curr = entry.weights[d];
            const prev = i > 0 ? entry.weights[dates[i - 1]] : null;

            let cellContent = curr !== undefined ? curr : '–';
            if (curr !== undefined && prev !== undefined) {
                const delta = ((prev - curr) / prev * 100);
                const color = delta > 0 ? 'var(--success)' : delta < 0 ? 'var(--danger)' : 'var(--text-muted)';
                const sign = delta > 0 ? '▼' : delta < 0 ? '▲' : '';
                cellContent = `${curr}<br><span style="font-size:0.75rem;color:${color}">${sign}${Math.abs(delta).toFixed(1)}%</span>`;
            }
            deltaHTML += `<td>${cellContent}</td>`;
        });

        deltaHTML += `</tr>`;
    });
    deltaHTML += `</tbody>`;

    const ct = document.getElementById('competitorTable');
    const dt = document.getElementById('deltaTable');
    if (ct) ct.innerHTML = matrixHTML;
    if (dt) dt.innerHTML = deltaHTML;
}

// ==================== COUNTDOWN & DAYS LEFT ====================

function updateDaysLeft() {
    const endDate = new Date('2026-04-25T23:59:59');
    const now = new Date();
    const daysLeft = Math.ceil((endDate - now) / 86400000);
    const el = document.getElementById('daysLeft');
    if (!el) return;

    if (daysLeft > 0) {
        el.textContent = daysLeft;
        el.style.color = daysLeft <= 7 ? 'var(--danger)' : 'var(--accent-primary)';
    } else {
        el.textContent = 'Done';
        el.style.color = 'var(--text-muted)';
    }
}

function updateCountdown() {
    const endDate = new Date('2026-04-25T23:59:59');
    const diff = endDate - new Date();
    const el = document.getElementById('countdown');
    if (!el) return;

    if (diff > 0) {
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        el.textContent = `${days}d ${hours}h ${mins}m ${secs}s`;
    } else {
        el.textContent = '🎉 Challenge Complete!';
    }
    updateDaysLeft();
}

// ==================== BMI CALCULATOR ====================

function openBMIModal() {
    if (!document.getElementById('bmi-modal')) {
        createBMIModal();
    }
    document.getElementById('bmi-modal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeBMIModal() {
    const modal = document.getElementById('bmi-modal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function createBMIModal() {
    const div = document.createElement('div');
    div.id = 'bmi-modal';
    div.className = 'bmi-modal';
    div.innerHTML = `
        <div class="bmi-modal-content">
            <div class="bmi-header">
                <h2>📊 BMI Calculator</h2>
                <span class="close-bmi" onclick="closeBMIModal()">&times;</span>
            </div>
            <div id="bmi-input-section">
                <div style="margin-bottom:12px">
                    <label class="bmi-label">Height (cm)</label>
                    <input type="number" id="bmi-height" class="input-field" placeholder="e.g. 170" step="0.1">
                </div>
                <div style="margin-bottom:12px">
                    <label class="bmi-label">Weight (kg)</label>
                    <input type="number" id="bmi-weight" class="input-field" placeholder="e.g. 75" step="0.1">
                </div>
                <div style="margin-bottom:12px">
                    <label class="bmi-label">Age</label>
                    <input type="number" id="bmi-age" class="input-field" placeholder="e.g. 30">
                </div>
                <div style="margin-bottom:12px">
                    <label class="bmi-label">Gender</label>
                    <select id="bmi-gender" class="input-field" style="margin-bottom:0">
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                    </select>
                </div>
                <button onclick="calculateBMI()" class="btn w-100 mt-1">🧮 Calculate BMI</button>
            </div>
            <div id="bmi-result-section" style="display:none"></div>
        </div>
    `;
    document.body.appendChild(div);

    // Close on backdrop click
    div.addEventListener('click', function (e) {
        if (e.target === div) closeBMIModal();
    });
}

function calculateBMI() {
    const height = parseFloat(document.getElementById('bmi-height').value);
    const weight = parseFloat(document.getElementById('bmi-weight').value);
    const age = parseInt(document.getElementById('bmi-age').value);
    const gender = document.getElementById('bmi-gender').value;

    if (!height || !weight || !age || height <= 0 || weight <= 0 || age <= 0) {
        alert('Please fill in all fields with valid values');
        return;
    }

    const hm = height / 100;
    const bmi = weight / (hm * hm);
    const idealMin = (18.5 * hm * hm).toFixed(1);
    const idealMax = (24.9 * hm * hm).toFixed(1);

    let category, color, desc, calTarget, macros, tips;

    if (bmi < 18.5) {
        category = 'Underweight'; color = '#64b5f6';
        desc = 'Your BMI is below the healthy range. Focus on gaining healthy weight.';
        calTarget = 'Calorie surplus of 300–500 kcal/day above maintenance';
        macros = 'Protein: 1.6–2.2g/kg | Carbs: 4–6g/kg | Fats: 0.8–1g/kg';
        tips = ['Eat 5–6 smaller meals throughout the day', 'Include calorie-dense foods: nuts, avocado, dairy', 'Strength training to build muscle mass', 'Track your intake to ensure adequate calories'];
    } else if (bmi < 25) {
        category = 'Normal Weight'; color = 'var(--success)';
        desc = 'Great work! Your BMI is in the healthy range.';
        calTarget = 'Maintain current calorie intake (~1800–2400 kcal/day)';
        macros = 'Protein: 1.2–1.6g/kg | Carbs: 3–5g/kg | Fats: 0.5–0.8g/kg';
        tips = ['Maintain regular exercise: 150 min/week', 'Eat a balanced, varied diet', 'Stay well hydrated throughout the day', 'Prioritise sleep and recovery'];
    } else if (bmi < 30) {
        category = 'Overweight'; color = 'var(--warning)';
        desc = 'Your BMI is above the healthy range. A moderate deficit can help.';
        calTarget = 'Calorie deficit of 300–500 kcal/day (~1400–1800 kcal/day)';
        macros = 'Protein: 1.6–2g/kg | Carbs: 2–3g/kg | Fats: 0.4–0.6g/kg';
        tips = ['Create a moderate caloric deficit', 'Increase activity to 200+ min/week', 'Focus on whole foods, reduce processed items', 'Practice portion control'];
    } else {
        category = 'Obese'; color = 'var(--danger)';
        desc = 'Consult a healthcare professional for a personalised plan.';
        calTarget = 'Calorie deficit of 500–750 kcal/day (medical supervision recommended)';
        macros = 'Protein: 2–2.5g/kg | Carbs: 1.5–2.5g/kg | Fats: 0.3–0.5g/kg';
        tips = ['Consult a doctor or dietitian', 'Start with low-impact exercises (walking, swimming)', 'Set small, achievable weekly goals', 'Monitor health markers regularly'];
    }

    // Marker position on scale
    const markerPos = bmi < 18.5 ? (bmi / 18.5 * 25)
        : bmi < 25 ? (25 + (bmi - 18.5) / 6.5 * 25)
        : bmi < 30 ? (50 + (bmi - 25) / 5 * 25)
        : Math.min(75 + (bmi - 30) / 10 * 25, 96);

    // Store for PDF
    window.bmiData = { bmi: bmi.toFixed(1), category, color, desc, calTarget, macros, tips, height, weight, age, gender, idealMin, idealMax };

    document.getElementById('bmi-input-section').style.display = 'none';
    document.getElementById('bmi-result-section').style.display = 'block';
    document.getElementById('bmi-result-section').innerHTML = `
        <div class="bmi-score-display">
            <div class="bmi-score-circle" style="border-color:${color}">
                <div class="bmi-score-value" style="color:${color}">${bmi.toFixed(1)}</div>
                <div class="bmi-score-label">BMI</div>
            </div>
        </div>

        <div class="bmi-category">
            <h3 style="color:${color}">${category}</h3>
            <p>${desc}</p>
        </div>

        <div class="bmi-scale">
            <div class="bmi-scale-bar">
                <div class="bmi-scale-segment underweight">Under</div>
                <div class="bmi-scale-segment normal">Normal</div>
                <div class="bmi-scale-segment overweight">Over</div>
                <div class="bmi-scale-segment obese">Obese</div>
            </div>
            <div class="bmi-marker" style="left:${markerPos}%"></div>
        </div>

        <div class="bmi-details">
            <div class="bmi-detail-row"><span class="bmi-detail-label">Your BMI</span><span class="bmi-detail-value" style="color:${color}">${bmi.toFixed(1)}</span></div>
            <div class="bmi-detail-row"><span class="bmi-detail-label">Category</span><span class="bmi-detail-value">${category}</span></div>
            <div class="bmi-detail-row"><span class="bmi-detail-label">Ideal Weight Range</span><span class="bmi-detail-value">${idealMin} – ${idealMax} kg</span></div>
            <div class="bmi-detail-row"><span class="bmi-detail-label">Daily Calorie Target</span><span class="bmi-detail-value" style="font-size:0.85rem">${calTarget}</span></div>
            <div class="bmi-detail-row"><span class="bmi-detail-label">Macronutrient Guide</span><span class="bmi-detail-value" style="font-size:0.85rem">${macros}</span></div>
        </div>

        <div class="bmi-details mt-1">
            <strong style="color:var(--accent-secondary); display:block; margin-bottom:10px;">💡 Recommendations</strong>
            ${tips.map(t => `<div style="padding:7px 0; border-bottom:1px solid var(--border); color:var(--text-secondary); font-size:0.9rem;">✅ ${t}</div>`).join('')}
        </div>

        <div style="display:flex; gap:10px; margin-top:15px; flex-wrap:wrap;">
            <button onclick="exportBMIPDF()" class="btn btn-purple" style="flex:1">📄 Download PDF</button>
            <button onclick="resetBMI()" class="btn btn-warning" style="flex:1">🔄 Recalculate</button>
        </div>
    `;
}

function resetBMI() {
    document.getElementById('bmi-input-section').style.display = 'block';
    document.getElementById('bmi-result-section').style.display = 'none';
    document.getElementById('bmi-result-section').innerHTML = '';
    ['bmi-height', 'bmi-weight', 'bmi-age'].forEach(id => document.getElementById(id).value = '');
}

function exportBMIPDF() {
    if (!window.bmiData) return;
    const d = window.bmiData;
    const date = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>BMI Report</title>
<style>
  body{font-family:Arial,sans-serif;color:#333;max-width:700px;margin:0 auto;padding:30px;font-size:10pt}
  h1{color:#0066cc;text-align:center;font-size:18pt;margin-bottom:5px}
  .subtitle{text-align:center;color:#666;margin-bottom:25px}
  .bmi-box{background:#f0f4ff;border:2px solid ${d.color === 'var(--success)' ? '#00b359' : d.color === 'var(--warning)' ? '#ff9500' : d.color === 'var(--danger)' ? '#ff3864' : d.color};border-radius:10px;padding:20px;text-align:center;margin:20px 0}
  .bmi-num{font-size:40pt;font-weight:bold;color:${d.color === 'var(--success)' ? '#00b359' : d.color === 'var(--warning)' ? '#ff9500' : d.color === 'var(--danger)' ? '#ff3864' : d.color}}
  .section{margin:20px 0;page-break-inside:avoid}
  .section h2{border-bottom:2px solid #0066cc;padding-bottom:5px;color:#0066cc;font-size:12pt;margin-bottom:12px}
  .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;font-size:9.5pt}
  .label{color:#666}
  .value{font-weight:bold}
  .tip{padding:5px 0;padding-left:15px;position:relative;color:#555;font-size:9pt}
  .tip:before{content:"✓";position:absolute;left:0;color:#00b359;font-weight:bold}
  .disclaimer{background:#fff3cd;border:1px solid #ffc107;border-radius:6px;padding:10px;font-size:8pt;color:#856404;margin-top:20px}
  .footer{text-align:center;margin-top:25px;padding-top:15px;border-top:2px solid #ddd;font-size:8pt;color:#888}
  @media print{body{padding:15px}}
</style></head><body>
<h1>⚡ ProChallenge Hub</h1>
<div class="subtitle">BMI & Nutrition Report — ${date}</div>

<div class="bmi-box">
  <div>Body Mass Index</div>
  <div class="bmi-num">${d.bmi}</div>
  <div style="font-size:14pt;font-weight:bold">${d.category}</div>
  <div style="color:#666;margin-top:5px">${d.desc}</div>
</div>

<div class="section">
  <h2>📋 Personal Info</h2>
  <div class="row"><span class="label">Height</span><span class="value">${d.height} cm</span></div>
  <div class="row"><span class="label">Weight</span><span class="value">${d.weight} kg</span></div>
  <div class="row"><span class="label">Age</span><span class="value">${d.age} years</span></div>
  <div class="row"><span class="label">Gender</span><span class="value">${d.gender.charAt(0).toUpperCase() + d.gender.slice(1)}</span></div>
  <div class="row"><span class="label">Ideal Weight Range</span><span class="value">${d.idealMin} – ${d.idealMax} kg</span></div>
</div>

<div class="section">
  <h2>🍽️ Nutrition Plan</h2>
  <div class="row"><span class="label">Calorie Target</span><span class="value" style="font-size:9pt;max-width:55%">${d.calTarget}</span></div>
  <div class="row"><span class="label">Macros</span><span class="value" style="font-size:9pt;max-width:55%">${d.macros}</span></div>
</div>

<div class="section">
  <h2>💡 Recommendations</h2>
  ${d.tips.map(t => `<div class="tip">${t}</div>`).join('')}
</div>

<div class="disclaimer">⚠️ <strong>Disclaimer:</strong> This is general guidance only. Please consult a qualified healthcare professional or registered dietitian for personalised medical advice.</div>

<div class="footer">Generated by ProChallenge Hub • ${date}</div>

<script>window.onload=()=>setTimeout(()=>window.print(),300)</script>
</body></html>`;

    const win = window.open('', '_blank');
    if (!win) { alert('Please allow pop-ups to generate the PDF'); return; }
    win.document.write(html);
    win.document.close();
}

// ==================== AI COACH CHAT ====================

function toggleChat() {
    document.getElementById('chat-window').classList.toggle('chat-hidden');
}

async function coachResponse() {
    const input = document.getElementById('userQuery');
    const body = document.getElementById('chat-body');
    const query = input.value.trim();
    if (!query) return;

    // User message
    body.insertAdjacentHTML('beforeend', `
        <div class="message-wrapper" style="justify-content:flex-end">
            <div class="user-msg">${escapeHtml(query)}</div>
        </div>
    `);
    input.value = '';

    // Typing indicator
    const typingId = 'typing-' + Date.now();
    body.insertAdjacentHTML('beforeend', `
        <div class="message-wrapper" id="${typingId}">
            <div class="bot-avatar">🤖</div>
            <div class="bot-msg"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>
        </div>
    `);
    body.scrollTop = body.scrollHeight;

    // Gather context
    const rank = document.getElementById('userRank')?.textContent || '--';
    const loss = document.getElementById('userTotalPct')?.textContent || '--';
    const daysLeft = document.getElementById('daysLeft')?.textContent || '--';

    const systemPrompt = `You are a fitness coach for ProChallenge Hub, a 12-week weight loss challenge.
User: ${user} | Rank: ${rank} | Total Loss: ${loss} | Days Remaining: ${daysLeft}

RULES:
- Only answer questions about fitness, workouts, nutrition, weight loss, BMI, recovery, or motivation.
- Keep responses brief (2-4 sentences), motivating, and use emojis.
- If asked anything unrelated to fitness, reply: "I'm your fitness coach — ask me about workouts, nutrition, weight loss, or motivation! 💪"

User says: ${query}`;

    try {
        const response = await puter.ai.chat(systemPrompt, { model: 'gpt-4o-mini' });
        document.getElementById(typingId)?.remove();

        const reply = response?.message?.content || response?.toString() || 'Keep pushing! 💪';
        body.insertAdjacentHTML('beforeend', `
            <div class="message-wrapper">
                <div class="bot-avatar">🤖</div>
                <div class="bot-msg">${reply}</div>
            </div>
        `);
    } catch (e) {
        document.getElementById(typingId)?.remove();
        body.insertAdjacentHTML('beforeend', `
            <div class="message-wrapper">
                <div class="bot-avatar">🤖</div>
                <div class="bot-msg">I'm having a connection issue right now. Keep grinding! 💪</div>
            </div>
        `);
    }

    body.scrollTop = body.scrollHeight;
}

// Escape HTML to prevent XSS in chat
function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Enter key in chat
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('userQuery')?.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') coachResponse();
    });
});