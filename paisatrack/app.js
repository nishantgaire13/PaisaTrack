// ============================================================================
// PaisaTrack — Private Wealth Tracker (vanilla JS SPA)
// ============================================================================

// ---------- Constants ----------
const STORAGE = {
    TX: 'paisatrack_transactions',
    BUDGET: 'paisatrack_budgets',
    SETTINGS: 'paisatrack_settings'
};

const EXPENSE_CATEGORIES = [
    { id: 'food_dining', name: 'Food & Dining', icon: '🍛', desc: 'Grocery and Restaurants' },
    { id: 'rent', name: 'Rent', icon: '🏠', desc: 'Monthly Housing' },
    { id: 'transport', name: 'Transport', icon: '🚌', desc: 'Fuel and Cabs' },
    { id: 'mobile_internet', name: 'Mobile & Internet', icon: '📱', desc: 'Plans and Data' },
    { id: 'tiffin_service', name: 'Tiffin Service', icon: '🍿', desc: 'Daily Meals' },
    { id: 'emi_loan', name: 'EMI / Loan', icon: '💳', desc: 'Loan Repayment' },
    { id: 'utilities', name: 'Utilities', icon: '⚡', desc: 'Electricity, Water' },
    { id: 'education', name: 'Education', icon: '📚', desc: 'Courses and Fees' },
    { id: 'health', name: 'Health', icon: '🏥', desc: 'Medical and Pharmacy' },
    { id: 'clothing', name: 'Clothing', icon: '👕', desc: 'Apparel and Shoes' },
    { id: 'festival_gifts', name: 'Festival & Gifts', icon: '🎉', desc: 'Dashain, Tihar, gifts' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬', desc: 'Movies and Leisure' },
    { id: 'family_support', name: 'Family Support', icon: '👨‍👩‍👧', desc: 'Sent home' },
    { id: 'savings', name: 'Savings', icon: '💰', desc: 'Deposits and SIP' },
    { id: 'others', name: 'Others', icon: '📦', desc: 'Miscellaneous' }
];

const INCOME_CATEGORIES = [
    { id: 'salary', name: 'Salary', icon: '💼', desc: 'Monthly Salary' },
    { id: 'freelance', name: 'Freelance', icon: '💻', desc: 'Project Income' },
    { id: 'family_allowance', name: 'Family Allowance', icon: '👨‍👩‍👧', desc: 'From Family' },
    { id: 'rental', name: 'Rental Income', icon: '🏠', desc: 'Property Rent' },
    { id: 'business', name: 'Business', icon: '📈', desc: 'Business Profit' },
    { id: 'other_income', name: 'Others', icon: '📦', desc: 'Other Income' }
];

const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
const CHART_COLORS = ['#10B981', '#14B8A6', '#8B5CF6', '#FB7185', '#FBBF24', '#22D3EE', '#34D399', '#F472B6'];

const CURRENCY_SYMBOLS = {
    USD: '$',
    NPR: 'Rs.',
    EUR: '€',
    INR: '₹'
};

// ---------- Auth Constants ----------
const AUTH_STORAGE = 'paisatrack_auth';

// ---------- Auth State ----------
let loginPin = '';
let signupPin = '';
let confirmPinValue = '';
let failedAttempts = 0;
let isLocked = false;
let lockoutInterval = null;

// ---------- Auth Functions ----------
function getStoredAuth() {
    try {
        return JSON.parse(localStorage.getItem(AUTH_STORAGE));
    } catch { return null; }
}

function setStoredAuth(auth) {
    localStorage.setItem(AUTH_STORAGE, JSON.stringify(auth));
}

function isAuthenticated() {
    const auth = getStoredAuth();
    return auth && auth.isLoggedIn === true;
}

function getUserProfile() {
    const auth = getStoredAuth();
    return auth ? { name: auth.name, username: auth.username } : null;
}

function checkAuth() {
    const auth = getStoredAuth();
    if (!auth) {
        // First time user - show signup
        showSignup();
        showLanding();
    } else if (!auth.isLoggedIn) {
        // Existing user but not logged in - show login
        showLogin();
        showLanding();
    } else {
        // Logged in user - show app
        hideLanding();
    }
}

function showLanding() {
    document.body.classList.add('show-landing');
    document.getElementById('landingPage').classList.remove('hidden');
}

function hideLanding() {
    document.body.classList.remove('show-landing');
    document.getElementById('landingPage').classList.add('hidden');
}

// Scroll functions
function scrollToLogin() {
    document.getElementById('authSection').scrollIntoView({ behavior: 'smooth' });
}

function scrollToFeatures() {
    document.getElementById('featuresSection').scrollIntoView({ behavior: 'smooth' });
}

// Login functions
function showLogin() {
    document.getElementById('loginBox').style.display = 'block';
    document.getElementById('signupBox').style.display = 'none';
    document.getElementById('confirmPinBox').style.display = 'none';
    // Reset both PIN arrays to prevent cross-contamination
    clearLoginPin();
    clearSignupPin();
    clearConfirmPin();
}

function showSignup() {
    document.getElementById('signupBox').style.display = 'block';
    document.getElementById('loginBox').style.display = 'none';
    document.getElementById('confirmPinBox').style.display = 'none';
    // Reset both PIN arrays to prevent cross-contamination
    clearLoginPin();
    clearSignupPin();
    clearConfirmPin();
}

// Login PIN Keypad
function loginKeypad(digit) {
    if (isLocked || loginPin.length >= 4) return;
    loginPin += digit;
    updateLoginPinDisplay();
    if (loginPin.length === 4) {
        setTimeout(submitLogin, 300);
    }
}

function clearLoginPin() {
    loginPin = '';
    updateLoginPinDisplay();
    document.getElementById('loginErrorMsg').style.display = 'none';
}

function updateLoginPinDisplay() {
    for (let i = 0; i < 4; i++) {
        const dot = document.getElementById('loginPinDot' + i);
        if (dot) dot.classList.toggle('filled', i < loginPin.length);
    }
}

function submitLogin() {
    if (isLocked) return;

    const username = document.getElementById('loginUser').value.trim();
    const pin = loginPin;

    if (!username) {
        showLoginError('Please enter your username');
        return;
    }

    if (pin.length !== 4) {
        showLoginError('Please enter your 4-digit PIN');
        clearLoginPin();
        return;
    }

    const auth = getStoredAuth();
    if (!auth) {
        showLoginError('No vault found. Create one first.');
        clearLoginPin();
        return;
    }

    // Case-sensitive username comparison, exact PIN match
    if (auth.username !== username || auth.pin !== pin) {
        failedAttempts++;
        if (failedAttempts >= 5) {
            startLockout();
        } else {
            showLoginError(`Invalid username or PIN. Try again. (${5 - failedAttempts} attempts left)`);
            clearLoginPin();
        }
        return;
    }

    // Success!
    failedAttempts = 0;
    auth.isLoggedIn = true;
    setStoredAuth(auth);
    hideLanding();
    updateAvatar();
    toast('Welcome back, ' + (auth.name || username));
}

function showLoginError(message) {
    document.getElementById('loginErrorText').textContent = message;
    document.getElementById('loginErrorMsg').style.display = 'flex';
}

function startLockout() {
    isLocked = true;
    let seconds = 30;
    document.getElementById('loginLockout').style.display = 'flex';
    document.getElementById('lockoutTimer').textContent = seconds;

    lockoutInterval = setInterval(() => {
        seconds--;
        document.getElementById('lockoutTimer').textContent = seconds;
        if (seconds <= 0) {
            clearInterval(lockoutInterval);
            isLocked = false;
            failedAttempts = 0;
            document.getElementById('loginLockout').style.display = 'none';
            clearLoginPin();
        }
    }, 1000);
}

// Signup PIN Keypad
function signupKeypad(digit) {
    if (signupPin.length >= 4) return;
    signupPin += digit;
    updateSignupPinDisplay();
    if (signupPin.length === 4) {
        setTimeout(goToConfirmPin, 300);
    }
}

function clearSignupPin() {
    signupPin = '';
    updateSignupPinDisplay();
    document.getElementById('confirmPinError').style.display = 'none';
}

function updateSignupPinDisplay() {
    for (let i = 0; i < 4; i++) {
        const dot = document.getElementById('signupPinDot' + i);
        if (dot) dot.classList.toggle('filled', i < signupPin.length);
    }
}

function goToConfirmPin() {
    if (signupPin.length !== 4) {
        toast('PIN must be 4 digits', 'error');
        return;
    }

    document.getElementById('confirmPinBox').style.display = 'block';
    document.getElementById('signupBox').style.display = 'none';
    confirmPinValue = '';
    updateConfirmPinDisplay();
    document.getElementById('confirmPinError').style.display = 'none';
}

function backToSignupPin() {
    document.getElementById('signupBox').style.display = 'block';
    document.getElementById('confirmPinBox').style.display = 'none';
    confirmPinValue = '';
}

// Confirm PIN Keypad
function confirmKeypad(digit) {
    if (confirmPinValue.length >= 4) return;
    confirmPinValue += digit;
    updateConfirmPinDisplay();
    if (confirmPinValue.length === 4) {
        setTimeout(finishSignup, 300);
    }
}

function clearConfirmPin() {
    confirmPinValue = '';
    updateConfirmPinDisplay();
    document.getElementById('confirmPinError').style.display = 'none';
}

function updateConfirmPinDisplay() {
    for (let i = 0; i < 4; i++) {
        const dot = document.getElementById('confirmPinDot' + i);
        if (dot) dot.classList.toggle('filled', i < confirmPinValue.length);
    }
}

function finishSignup() {
    const name = document.getElementById('signupName').value.trim();
    const username = document.getElementById('signupUsername').value.trim();

    if (!name) {
        toast('Please enter your name', 'error');
        return;
    }

    if (!username) {
        toast('Please choose a username', 'error');
        return;
    }

    if (username.length < 3) {
        toast('Username must be at least 3 characters', 'error');
        return;
    }

    if (signupPin.length !== 4) {
        toast('Please enter your 4-digit PIN', 'error');
        return;
    }

    if (confirmPinValue !== signupPin) {
        document.getElementById('confirmPinError').style.display = 'flex';
        confirmPinValue = '';
        updateConfirmPinDisplay();
        return;
    }

    // Check if user already exists
    const existingAuth = getStoredAuth();
    if (existingAuth && existingAuth.username) {
        toast('Username already taken. Choose another.', 'error');
        return;
    }

    // Save user data
    setStoredAuth({
        isLoggedIn: true,
        name: name,
        username: username,
        pin: signupPin
    });

    // Update state settings
    state.settings.userName = name;
    localStorage.setItem(STORAGE.SETTINGS, JSON.stringify(state.settings));

    // Clear PINs after successful signup
    signupPin = '';
    confirmPinValue = '';

    hideLanding();
    updateAvatar();
    location.hash = '#dashboard';
    route();
    toast('Vault created! Welcome, ' + name);
}

// Logout
function logout() {
    const auth = getStoredAuth();
    if (auth) {
        auth.isLoggedIn = false;
        setStoredAuth(auth);
    }

    // Clear all PIN arrays and form fields
    clearLoginPin();
    clearSignupPin();
    clearConfirmPin();
    document.getElementById('loginUser').value = '';

    // Close profile modal
    closeProfileModal();

    // Show landing with login
    showLogin();
    showLanding();
    document.getElementById('authSection').scrollIntoView({ behavior: 'smooth' });

    toast('Vault locked');
}

// Avatar and profile
function updateAvatar() {
    const auth = getStoredAuth();
    const initial = auth?.name ? auth.name.charAt(0).toUpperCase() :
                    auth?.username ? auth.username.charAt(0).toUpperCase() : 'U';
    document.getElementById('profileAvatar').textContent = initial;
}

const state = {
    transactions: [],
    budgets: {},
    settings: { theme: 'dark', userName: 'Nishant', calendar: 'BS', currency: 'NPR' },
    filter: { search: '', category: '', type: '', month: '' },
    page: 1,
    pageSize: 10,
    budgetMonth: monthKey(new Date()),
    reportTimeframe: 6,
    charts: {}
};

// ---------- Utils ----------
function monthKey(d) {
    const dt = typeof d === 'string' ? new Date(d) : d;
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key) {
    const [y, m] = key.split('-').map(Number);
    const date = new Date(y, m - 1, 1);
    return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

function formatNPR(amount) {
    const n = Math.round(Number(amount) || 0);
    const s = Math.abs(n).toString();
    const lastThree = s.slice(-3);
    const rest = s.slice(0, -3);
    const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree : lastThree;
    const symbol = CURRENCY_SYMBOLS[state.settings.currency] || 'Rs.';
    return (n < 0 ? '-' : '') + symbol + grouped;
}

function formatNPRShort(amount) {
    const n = Math.abs(Number(amount) || 0);
    const symbol = CURRENCY_SYMBOLS[state.settings.currency] || 'Rs.';
    if (n >= 100000) return symbol + (n / 100000).toFixed(1) + 'L';
    if (n >= 1000) return symbol + (n / 1000).toFixed(1) + 'k';
    return symbol + String(Math.round(n));
}

function getCurrencySymbol() {
    return CURRENCY_SYMBOLS[state.settings.currency] || 'Rs.';
}

function getCategory(id) {
    return ALL_CATEGORIES.find(c => c.id === id) || { id, name: id, icon: '📦', desc: '' };
}

function daysInMonth(key) {
    const [y, m] = key.split('-').map(Number);
    return new Date(y, m, 0).getDate();
}

// ---------- BS Calendar (Bikram Sambat) ----------
const BS_MONTHS = ['Baishakh','Jestha','Ashadh','Shrawan','Bhadra','Ashwin','Kartik','Mangsir','Poush','Magh','Falgun','Chaitra'];
const BS_CALENDAR = {
    2080: [31,32,31,32,31,30,30,30,29,30,29,31],
    2081: [31,31,32,31,31,31,30,29,30,29,30,30],
    2082: [31,31,32,32,31,30,30,29,30,29,30,30],
    2083: [31,32,31,32,31,30,30,30,29,29,30,31],
    2084: [31,31,32,31,31,31,30,29,30,29,30,30],
    2085: [31,31,32,31,31,31,30,29,30,29,30,30],
    2086: [31,32,31,32,31,30,30,30,29,29,30,31],
    2087: [31,31,32,31,31,31,30,29,30,29,30,30],
    2088: [31,31,32,32,31,30,30,29,30,29,30,30],
    2089: [31,32,31,32,31,30,30,30,29,29,30,31],
    2090: [31,31,32,31,31,31,30,29,30,29,30,30]
};
const BS_EPOCH_AD = new Date(2023, 3, 14);
const BS_EPOCH_BS = { year: 2080, month: 1, day: 1 };

function adToBS(dateStr) {
    const ad = new Date(dateStr);
    if (isNaN(ad)) return { year: 2080, month: 1, day: 1 };
    let diff = Math.floor((ad - BS_EPOCH_AD) / 86400000);
    let bsY = BS_EPOCH_BS.year, bsM = 0, bsD = 0;
    if (diff >= 0) {
        while (bsY <= 2090) {
            const months = BS_CALENDAR[bsY];
            if (!months) break;
            let yearDays = months.reduce((a, b) => a + b, 0);
            if (diff < yearDays) {
                for (let m = 0; m < 12; m++) {
                    if (diff < months[m]) { bsM = m; bsD = diff + 1; break; }
                    diff -= months[m];
                }
                break;
            }
            diff -= yearDays;
            bsY++;
        }
    } else {
        diff = Math.abs(diff);
        bsY = BS_EPOCH_BS.year - 1;
        while (bsY >= 2080) {
            const months = BS_CALENDAR[bsY];
            if (!months) break;
            let yearDays = months.reduce((a, b) => a + b, 0);
            if (diff <= yearDays) {
                for (let m = 11; m >= 0; m--) {
                    if (diff <= months[m]) { bsM = m; bsD = months[m] - diff + 1; break; }
                    diff -= months[m];
                }
                break;
            }
            diff -= yearDays;
            bsY--;
        }
    }
    return { year: bsY, month: bsM + 1, day: Math.max(1, bsD) };
}

function formatDateDisplay(isoDate) {
    if (state.settings.calendar === 'BS') {
        const bs = adToBS(isoDate);
        return `${bs.day} ${BS_MONTHS[bs.month - 1]}, ${bs.year}`;
    }
    const d = new Date(isoDate);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateShort(isoDate) {
    if (state.settings.calendar === 'BS') {
        const bs = adToBS(isoDate);
        return `${bs.day} ${BS_MONTHS[bs.month - 1].slice(0, 3)}`;
    }
    const d = new Date(isoDate);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMonthDisplay(monthKeyStr) {
    if (state.settings.calendar === 'BS') {
        const [y, m] = monthKeyStr.split('-').map(Number);
        const midDate = `${y}-${String(m).padStart(2, '0')}-15`;
        const bs = adToBS(midDate);
        return `${BS_MONTHS[bs.month - 1]} ${bs.year}`;
    }
    return monthLabel(monthKeyStr);
}

function calendarLabel() { return state.settings.calendar === 'BS' ? 'BS' : 'AD'; }
function toggleCalendar() {
    state.settings.calendar = state.settings.calendar === 'BS' ? 'AD' : 'BS';
    localStorage.setItem(STORAGE.SETTINGS, JSON.stringify(state.settings));
    route();
}

function setCurrency(currency) {
    if (!CURRENCY_SYMBOLS[currency]) return;
    state.settings.currency = currency;
    localStorage.setItem(STORAGE.SETTINGS, JSON.stringify(state.settings));
    updateCurrencyButtons();
    route();
}

function updateCurrencyButtons() {
    document.querySelectorAll('.currency-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.currency === state.settings.currency);
    });
    document.querySelectorAll('.rs').forEach(span => {
        span.textContent = getCurrencySymbol();
    });
}

// ---------- Utils ----------
function uid() {
    return `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

function toast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 300);
    }, 3000);
}

function confirmDialog(title, message) {
    return new Promise(resolve => {
        const modal = document.getElementById('confirmModal');
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        modal.classList.remove('hidden');
        const ok = document.getElementById('confirmOkBtn');
        const cancel = document.getElementById('confirmCancelBtn');
        const cleanup = (v) => {
            modal.classList.add('hidden');
            ok.onclick = cancel.onclick = null;
            resolve(v);
        };
        ok.onclick = () => cleanup(true);
        cancel.onclick = () => cleanup(false);
    });
}

// ---------- Storage ----------
function load() {
    try {
        state.transactions = JSON.parse(localStorage.getItem(STORAGE.TX) || '[]');
        state.budgets = JSON.parse(localStorage.getItem(STORAGE.BUDGET) || '{}');
        const s = localStorage.getItem(STORAGE.SETTINGS);
        if (s) state.settings = { ...state.settings, ...JSON.parse(s) };
    } catch (e) {
        console.error('Load error', e);
    }
}

function saveTx() { localStorage.setItem(STORAGE.TX, JSON.stringify(state.transactions)); }
function saveBudgets() { localStorage.setItem(STORAGE.BUDGET, JSON.stringify(state.budgets)); }

// ---------- Routing ----------
function route() {
    const hash = (location.hash || '#dashboard').replace('#', '');
    const valid = ['dashboard', 'transactions', 'budget', 'reports', 'settings'];
    const page = valid.includes(hash) ? hash : 'dashboard';

    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(`page-${page}`).classList.remove('hidden');

    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(n => {
        n.classList.toggle('active', n.dataset.route === page);
    });

    if (page === 'dashboard') renderDashboard();
    if (page === 'transactions') renderTransactions();
    if (page === 'budget') renderBudget();
    if (page === 'reports') renderReports();
    if (page === 'settings') renderSettings();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------- Greeting & Header ----------
function greetingText() {
    const profile = getUserProfile();
    const name = profile?.name || state.settings.userName || 'User';
    const h = new Date().getHours();
    const when = h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
    return `Good ${when}, ${name}`;
}

// ---------- Aggregations ----------
function monthTransactions(key) {
    return state.transactions.filter(t => monthKey(t.date) === key);
}

function monthTotals(key) {
    const txs = monthTransactions(key);
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expenses, balance: income - expenses };
}

function expensesByCategory(key) {
    const map = {};
    monthTransactions(key).filter(t => t.type === 'expense').forEach(t => {
        map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return map;
}

function monthBudget(key) {
    return state.budgets[key] || {};
}

function budgetTotal(key) {
    return Object.values(monthBudget(key)).reduce((s, v) => s + Number(v || 0), 0);
}

// ============================================================================
// DASHBOARD
// ============================================================================
function renderDashboard() {
    document.getElementById('greeting').textContent = greetingText();
    const key = monthKey(new Date());
    document.getElementById('dashboardMonth').textContent = formatMonthDisplay(key);

    const cur = monthTotals(key);
    const [y, m] = key.split('-').map(Number);
    const prevKey = `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, '0')}`;
    const prev = monthTotals(prevKey);

    document.getElementById('totalIncome').textContent = formatNPR(cur.income);
    document.getElementById('totalExpenses').textContent = formatNPR(cur.expenses);
    document.getElementById('balance').textContent = formatNPR(cur.balance);

    const savingsRate = cur.income > 0 ? ((cur.balance / cur.income) * 100) : 0;
    document.getElementById('savingsRate').textContent = savingsRate.toFixed(1);

    // Trend badges
    setTrend('incomeTrend', cur.income, prev.income, true);
    setTrend('expenseTrend', cur.expenses, prev.expenses, false);

    const balanceBadge = document.getElementById('balanceStatus');
    if (cur.balance > 0) {
        balanceBadge.textContent = 'Stable';
        balanceBadge.className = 'badge badge-muted';
    } else if (cur.balance < 0) {
        balanceBadge.textContent = 'Deficit';
        balanceBadge.className = 'badge badge-red';
    } else {
        balanceBadge.textContent = '—';
        balanceBadge.className = 'badge badge-muted';
    }

    const savingsBadge = document.getElementById('savingsBadge');
    if (savingsRate >= 20) { savingsBadge.textContent = '✓ Target met'; savingsBadge.className = 'badge badge-green'; }
    else if (savingsRate > 0) { savingsBadge.textContent = 'Below target'; savingsBadge.className = 'badge badge-muted'; }
    else { savingsBadge.textContent = 'Negative'; savingsBadge.className = 'badge badge-red'; }

    // Budget ring
    const budgetT = budgetTotal(key);
    const utilPct = budgetT > 0 ? Math.min(100, (cur.expenses / budgetT) * 100) : 0;
    document.getElementById('budgetPercent').textContent = `${Math.round(utilPct)}%`;
    const remaining = Math.max(0, budgetT - cur.expenses);
    document.getElementById('budgetRemaining').textContent = formatNPR(remaining);
    drawRing('budgetRing', utilPct);

    // Expense breakdown donut
    renderExpenseBreakdown(key);

    // Recent transactions
    const recent = [...state.transactions].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
    const list = document.getElementById('recentTxList');
    if (recent.length === 0) {
        list.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted)">No transactions yet. Click <span class="emerald bold">+ Add Transaction</span> to begin.</div>`;
    } else {
        list.innerHTML = recent.map(t => {
            const c = getCategory(t.category);
            return `
                <div class="tx-row">
                    <div class="tx-icon">${c.icon}</div>
                    <div>
                        <div class="tx-title">${escapeHtml(t.note)}</div>
                        <div class="tx-sub">${escapeHtml(t.description || c.desc)}</div>
                    </div>
                    <div class="tx-meta">
                        <div>${formatDateLong(t.date)}</div>
                        <div class="tx-meta-cat">${c.name}</div>
                    </div>
                    <div class="tx-amount ${t.type === 'income' ? 'in' : 'out'}">${t.type === 'income' ? '+' : '−'} ${formatNPR(t.amount)}</div>
                </div>
            `;
        }).join('');
    }
}

function setTrend(id, cur, prev, positiveIsGood) {
    const el = document.getElementById(id);
    if (!prev || prev === 0) {
        el.textContent = cur > 0 ? 'New' : '—';
        el.className = 'badge badge-muted';
        return;
    }
    const change = ((cur - prev) / prev) * 100;
    const up = change >= 0;
    el.textContent = `${up ? '↑' : '↓'} ${Math.abs(change).toFixed(0)}%`;
    const good = positiveIsGood ? up : !up;
    el.className = `badge ${good ? 'badge-green' : 'badge-red'}`;
}

function formatDateLong(iso) {
    return formatDateDisplay(iso);
}

function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

// Canvas ring chart
function drawRing(canvasId, percent, color = '#10B981') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);
    const cx = size / 2, cy = size / 2, r = size / 2 - 14, lw = 14;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#1A2E27';
    ctx.lineWidth = lw;
    ctx.stroke();

    if (percent > 0) {
        ctx.beginPath();
        const start = -Math.PI / 2;
        const end = start + (percent / 100) * Math.PI * 2;
        ctx.arc(cx, cy, r, start, end);
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.lineCap = 'round';
        ctx.stroke();
    }
}

function renderExpenseBreakdown(key) {
    const map = expensesByCategory(key);
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    const topCat = entries[0] ? getCategory(entries[0][0]).name : '—';
    document.getElementById('topCategory').textContent = topCat;

    const top4 = entries.slice(0, 4);
    const legend = document.getElementById('expenseLegend');
    legend.innerHTML = top4.map((e, i) => {
        const c = getCategory(e[0]);
        return `
            <div class="legend-item">
                <span class="legend-dot" style="background:${CHART_COLORS[i]}"></span>
                <div class="legend-text">
                    <div class="legend-cat">${c.name}</div>
                    <div class="legend-val">${formatNPR(e[1])}</div>
                </div>
            </div>
        `;
    }).join('') || `<div style="color:var(--text-muted);font-size:12px">No expenses yet this month.</div>`;

    destroyChart('expenseDonut');
    const canvas = document.getElementById('expenseDonut');
    if (!canvas) return;
    const data = top4.length ? top4.map(e => e[1]) : [1];
    const colors = top4.length ? top4.map((_, i) => CHART_COLORS[i]) : ['#1A2E27'];
    state.charts.expenseDonut = new Chart(canvas, {
        type: 'doughnut',
        data: { datasets: [{ data, backgroundColor: colors, borderWidth: 0, cutout: '70%' }] },
        options: { plugins: { legend: { display: false }, tooltip: { enabled: top4.length > 0 } }, responsive: false }
    });
}

function destroyChart(id) {
    if (state.charts[id]) { state.charts[id].destroy(); state.charts[id] = null; }
}

// ============================================================================
// TRANSACTIONS PAGE
// ============================================================================
function renderTransactions() {
    populateFilterCategory();
    document.getElementById('txCount').textContent = state.transactions.length;

    let list = [...state.transactions];
    const f = state.filter;
    if (f.search) {
        const q = f.search.toLowerCase();
        list = list.filter(t =>
            (t.note && t.note.toLowerCase().includes(q)) ||
            (t.description && t.description.toLowerCase().includes(q)) ||
            getCategory(t.category).name.toLowerCase().includes(q)
        );
    }
    if (f.category) list = list.filter(t => t.category === f.category);
    if (f.type) list = list.filter(t => t.type === f.type);
    if (f.month) list = list.filter(t => monthKey(t.date) === f.month);

    list.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

    const total = list.length;
    const pages = Math.max(1, Math.ceil(total / state.pageSize));
    if (state.page > pages) state.page = pages;
    const start = (state.page - 1) * state.pageSize;
    const slice = list.slice(start, start + state.pageSize);

    const body = document.getElementById('txTableBody');
    if (slice.length === 0) {
        body.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--text-muted)">
            No transactions match your filters. <a href="#" onclick="resetFilters();return false;" class="emerald">Clear filters</a>
        </div>`;
    } else {
        body.innerHTML = slice.map(t => {
            const c = getCategory(t.category);
            const d = new Date(t.date);
            const day = d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
            const dateMain = formatDateDisplay(t.date);
            const photoIndicator = t.photo ? '<span class="tx-photo-indicator">📷</span>' : '';
            return `
                <div class="tx-table-row" data-id="${t.id}" onclick="openTxDrawerById('${t.id}')">
                    <div class="tx-table-icon"><span class="tx-icon">${c.icon}</span></div>
                    <div>
                        <div class="tx-date-main">${dateMain}</div>
                        <div class="tx-date-sub">${day}</div>
                    </div>
                    <div><span class="tx-cat-badge ${t.type === 'income' ? 'income' : ''}">${c.name}</span></div>
                    <div>
                        <div class="tx-title">${escapeHtml(t.note)}${photoIndicator}</div>
                        <div class="tx-sub">${escapeHtml(t.description || c.desc)}</div>
                    </div>
                    <div class="tx-table-amount">
                        <span class="${t.type === 'income' ? 'emerald' : 'red'}">${t.type === 'income' ? '+' : '−'} ${formatNPR(t.amount)}</span>
                        <div class="tx-actions">
                            <button class="tx-action-btn" onclick="event.stopPropagation(); editTransaction('${t.id}')" aria-label="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                            <button class="tx-action-btn delete" onclick="event.stopPropagation(); deleteTransaction('${t.id}')" aria-label="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg></button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    document.getElementById('paginationInfo').textContent =
        total === 0 ? 'DISPLAYING 0 OF 0 ASSETS' :
        `DISPLAYING ${start + 1}-${Math.min(start + state.pageSize, total)} OF ${total} ASSETS`;

    const controls = document.getElementById('paginationControls');
    let html = `<button class="page-btn" ${state.page === 1 ? 'disabled' : ''} onclick="setPage(${state.page - 1})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>`;
    const maxBtns = 5;
    let startPage = Math.max(1, state.page - Math.floor(maxBtns / 2));
    let endPage = Math.min(pages, startPage + maxBtns - 1);
    if (endPage - startPage < maxBtns - 1) startPage = Math.max(1, endPage - maxBtns + 1);
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-btn ${i === state.page ? 'active' : ''}" onclick="setPage(${i})">${i}</button>`;
    }
    html += `<button class="page-btn" ${state.page === pages ? 'disabled' : ''} onclick="setPage(${state.page + 1})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button>`;
    controls.innerHTML = html;
}

function populateFilterCategory() {
    const sel = document.getElementById('filterCategory');
    if (sel.options.length > 1) return;
    ALL_CATEGORIES.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        sel.appendChild(opt);
    });
}

window.setPage = (p) => { state.page = p; renderTransactions(); };
window.resetFilters = () => {
    state.filter = { search: '', category: '', type: '', month: '' };
    state.page = 1;
    document.getElementById('filterSearch').value = '';
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterMonth').value = '';
    document.querySelectorAll('#filterType button').forEach(b => b.classList.toggle('active', b.dataset.type === ''));
    renderTransactions();
};
window.editTransaction = (id) => openTxModal(state.transactions.find(t => t.id === id));
window.deleteTransaction = async (id) => {
    const ok = await confirmDialog('Delete transaction?', 'This entry will be permanently removed from your ledger.');
    if (!ok) return;
    state.transactions = state.transactions.filter(t => t.id !== id);
    saveTx();
    toast('Transaction deleted');
    renderTransactions();
};

// ============================================================================
// TRANSACTION MODAL
// ============================================================================
let modalType = 'expense';

function openTxModal(existing = null) {
    const modal = document.getElementById('txModal');
    modal.classList.remove('hidden');
    document.getElementById('txModalTitle').textContent = existing ? 'Edit Transaction' : 'Add Transaction';
    document.getElementById('txSubmitBtn').textContent = existing ? 'Save Changes' : 'Add Transaction';
    document.getElementById('txAmountError').textContent = '';

    if (existing) {
        document.getElementById('txId').value = existing.id;
        modalType = existing.type;
        document.getElementById('txAmount').value = existing.amount;
        document.getElementById('txDate').value = existing.date;
        document.getElementById('txNote').value = existing.note || '';
        document.getElementById('txDescription').value = existing.description || '';
        updatePhotoInModal(existing);
    } else {
        document.getElementById('txId').value = '';
        modalType = 'expense';
        document.getElementById('txAmount').value = '';
        document.getElementById('txDate').value = new Date().toISOString().slice(0, 10);
        document.getElementById('txNote').value = '';
        document.getElementById('txDescription').value = '';
        updatePhotoInModal(null);
    }

    updateTypeToggle();
    populateModalCategories(existing?.category);
}

function closeTxModal() {
    document.getElementById('txModal').classList.add('hidden');
    currentPhoto = null;
    updatePhotoInModal(null);
}

// ---------- Transaction Drawer ----------
let currentDrawerTx = null;

function openTxDrawer(tx) {
    currentDrawerTx = tx;
    const c = getCategory(tx.category);
    const isIncome = tx.type === 'income';

    let photoHtml = '';
    if (tx.photo) {
        photoHtml = `<div class="drawer-photo"><img src="${tx.photo}" alt="Transaction photo"></div>`;
    }

    document.getElementById('drawerContent').innerHTML = `
        <div class="drawer-category">
            <div class="drawer-category-icon">${c.icon}</div>
            <div class="drawer-category-info">
                <span class="drawer-category-name">${c.name}</span>
                <span class="drawer-type-badge ${tx.type}">${tx.type.toUpperCase()}</span>
            </div>
        </div>
        <div class="drawer-amount ${tx.type}">${isIncome ? '+' : '−'} ${formatNPR(tx.amount)}</div>
        <div class="drawer-detail-row">
            <span class="drawer-label">DATE</span>
            <span class="drawer-value">${formatDateDisplay(tx.date)}</span>
        </div>
        <div class="drawer-detail-row">
            <span class="drawer-label">MERCHANT / TITLE</span>
            <span class="drawer-value">${escapeHtml(tx.note)}</span>
        </div>
        <div class="drawer-detail-row">
            <span class="drawer-label">DESCRIPTION</span>
            <span class="drawer-value ${tx.description ? '' : 'muted'}">${escapeHtml(tx.description) || 'No description'}</span>
        </div>
        ${photoHtml}
    `;

    document.getElementById('txDrawerBackdrop').classList.remove('hidden');
    document.getElementById('txDrawer').classList.remove('hidden');
    document.getElementById('txDrawer').classList.add('active');
}

function closeTxDrawer() {
    document.getElementById('txDrawerBackdrop').classList.add('hidden');
    document.getElementById('txDrawer').classList.remove('active');
    document.getElementById('txDrawer').classList.add('hidden');
    currentDrawerTx = null;
}

function editFromDrawer() {
    if (currentDrawerTx) {
        closeTxDrawer();
        openTxModal(currentDrawerTx);
    }
}

async function deleteFromDrawer() {
    if (currentDrawerTx) {
        const ok = await confirmDialog('Delete transaction?', 'This entry will be permanently removed from your ledger.');
        if (ok) {
            state.transactions = state.transactions.filter(t => t.id !== currentDrawerTx.id);
            saveTx();
            toast('Transaction deleted');
            closeTxDrawer();
            route();
        }
    }
}

function openTxDrawerById(id) {
    const tx = state.transactions.find(t => t.id === id);
    if (tx) openTxDrawer(tx);
}

// ---------- Photo Upload ----------
let currentPhoto = null;

function setupPhotoUpload() {
    const zone = document.getElementById('photoUploadZone');
    const input = document.getElementById('txPhoto');
    const preview = document.getElementById('photoPreview');
    const previewImg = document.getElementById('photoPreviewImg');
    const removeBtn = document.getElementById('photoRemoveBtn');

    zone.addEventListener('click', () => input.click());

    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.style.borderColor = 'var(--emerald)';
    });

    zone.addEventListener('dragleave', () => {
        zone.style.borderColor = '';
    });

    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.style.borderColor = '';
        if (e.dataTransfer.files.length) {
            handlePhotoFile(e.dataTransfer.files[0]);
        }
    });

    input.addEventListener('change', () => {
        if (input.files.length) {
            handlePhotoFile(input.files[0]);
        }
    });

    removeBtn.addEventListener('click', () => {
        currentPhoto = null;
        preview.classList.add('hidden');
        previewImg.src = '';
        input.value = '';
    });
}

function handlePhotoFile(file) {
    if (!file.type.match(/image\/(jpeg|png|webp)/)) {
        toast('Only JPG, PNG, and WEBP images are allowed', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        toast('Image must be under 5MB', 'error');
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        toast('Large image — this may use significant storage space', 'error');
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        currentPhoto = e.target.result;
        document.getElementById('photoPreviewImg').src = currentPhoto;
        document.getElementById('photoPreview').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function updatePhotoInModal(existingTx) {
    if (existingTx && existingTx.photo) {
        currentPhoto = existingTx.photo;
        document.getElementById('photoPreviewImg').src = existingTx.photo;
        document.getElementById('photoPreview').classList.remove('hidden');
    } else {
        currentPhoto = null;
        document.getElementById('photoPreviewImg').src = '';
        document.getElementById('photoPreview').classList.add('hidden');
    }
}

function updateTypeToggle() {
    document.querySelectorAll('.type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === modalType));
}

function populateModalCategories(selectedId) {
    const sel = document.getElementById('txCategory');
    sel.innerHTML = '';
    const cats = modalType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    cats.forEach(c => {
        const o = document.createElement('option');
        o.value = c.id;
        o.textContent = `${c.icon}  ${c.name}`;
        sel.appendChild(o);
    });
    if (selectedId) sel.value = selectedId;
}

function submitTxForm(e) {
    e.preventDefault();
    const id = document.getElementById('txId').value;
    const amount = parseFloat(document.getElementById('txAmount').value);
    const category = document.getElementById('txCategory').value;
    const date = document.getElementById('txDate').value;
    const note = document.getElementById('txNote').value.trim();
    const description = document.getElementById('txDescription').value.trim();

    if (!amount || amount <= 0) {
        document.getElementById('txAmountError').textContent = 'Amount must be greater than 0';
        return;
    }
    if (!category || !date || !note) {
        toast('Please fill all required fields', 'error');
        return;
    }

    const photoMsg = currentPhoto ? ' with photo' : '';

    if (id) {
        const idx = state.transactions.findIndex(t => t.id === id);
        if (idx >= 0) {
            state.transactions[idx] = { ...state.transactions[idx], type: modalType, amount, category, date, note, description, photo: currentPhoto || null };
            toast('Transaction updated' + photoMsg);
        }
    } else {
        state.transactions.push({
            id: uid(),
            type: modalType,
            amount,
            category,
            date,
            note,
            description,
            photo: currentPhoto || null,
            createdAt: new Date().toISOString()
        });
        toast('Transaction added' + photoMsg);
    }
    saveTx();
    closeTxModal();
    currentPhoto = null;
    route();
}

// ============================================================================
// BUDGET PAGE
// ============================================================================
function renderBudget() {
    document.getElementById('budgetMonthLabel').textContent = formatMonthDisplay(state.budgetMonth);
    document.getElementById('budgetMonthInput').value = state.budgetMonth;

    const budget = monthBudget(state.budgetMonth);
    const totals = monthTotals(state.budgetMonth);
    const total = budgetTotal(state.budgetMonth);
    const utilPct = total > 0 ? (totals.expenses / total) * 100 : 0;
    const remaining = Math.max(0, total - totals.expenses);

    document.getElementById('budgetTotal').textContent = formatNPR(total);
    document.getElementById('budgetSpent').textContent = formatNPR(totals.expenses);
    document.getElementById('budgetRemain').textContent = formatNPR(remaining);
    document.getElementById('budgetUtilPct').textContent = `${utilPct.toFixed(1)}%`;

    const bar = document.getElementById('budgetUtilBar');
    bar.style.width = `${Math.min(100, utilPct)}%`;
    bar.className = 'progress-fill ' + (utilPct >= 90 ? 'red' : utilPct >= 70 ? 'amber' : '');

    const days = daysInMonth(state.budgetMonth);
    const today = new Date();
    const sameMonth = monthKey(today) === state.budgetMonth;
    const dayOfMonth = sameMonth ? today.getDate() : days;
    const daysLeft = Math.max(0, days - dayOfMonth);
    const avgDaily = dayOfMonth > 0 ? totals.expenses / dayOfMonth : 0;
    const safeDays = avgDaily > 0 ? Math.floor(remaining / avgDaily) : daysLeft;
    document.getElementById('budgetSafeDays').textContent = remaining > 0
        ? `Safe to spend for next ${Math.min(safeDays, daysLeft) || daysLeft} days`
        : 'Budget fully used';

    const spentByCat = expensesByCategory(state.budgetMonth);
    const list = document.getElementById('budgetCategoryList');
    list.innerHTML = EXPENSE_CATEGORIES.map(c => {
        const alloc = Number(budget[c.id] || 0);
        const spent = Number(spentByCat[c.id] || 0);
        const pct = alloc > 0 ? (spent / alloc) * 100 : 0;
        const cls = pct >= 90 ? 'red' : pct >= 70 ? 'amber' : '';
        const over = pct >= 90;
        return `
            <div class="budget-row">
                <div class="budget-cat">
                    <div class="budget-cat-icon">${c.icon}</div>
                    <div>
                        <div class="budget-cat-name">${c.name}</div>
                        <div class="budget-cat-desc">${c.desc}</div>
                    </div>
                </div>
                <input type="number" class="budget-input" min="0" value="${alloc}" data-cat="${c.id}" />
                <div class="budget-util-col">
                    <div class="budget-util-line ${over ? 'over' : ''}">
                        <span class="spent-label">SPENT: <span class="spent-amt">RS. ${formatNPR(spent)}</span></span>
                        <span class="pct">${Math.round(pct)}%</span>
                    </div>
                    <div class="progress"><div class="progress-fill ${cls}" style="width:${Math.min(100, pct)}%"></div></div>
                </div>
            </div>
        `;
    }).join('');
}

function saveBudgetFromInputs() {
    const budget = {};
    document.querySelectorAll('.budget-input').forEach(inp => {
        const v = parseFloat(inp.value) || 0;
        budget[inp.dataset.cat] = v;
    });
    state.budgets[state.budgetMonth] = budget;
    saveBudgets();
    toast('Budget saved for ' + monthLabel(state.budgetMonth));
    renderBudget();
}

function copyLastMonthBudget() {
    const [y, m] = state.budgetMonth.split('-').map(Number);
    const prevKey = `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, '0')}`;
    const prev = state.budgets[prevKey];
    if (!prev) { toast('No budget found for last month', 'error'); return; }
    state.budgets[state.budgetMonth] = { ...prev };
    saveBudgets();
    toast('Copied budget from ' + monthLabel(prevKey));
    renderBudget();
}

// ---------- Budget Month Navigation ----------
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function updateBudgetMonthNav() {
    const currentMonthKey = monthKey(new Date());
    const nextBtn = document.getElementById('nextMonthBtn');
    const prevBtn = document.getElementById('prevMonthBtn');

    // Disable next button if on current month
    nextBtn.disabled = state.budgetMonth >= currentMonthKey;

    // Disable prev button if on oldest allowed month (e.g., 2020)
    const [year, month] = state.budgetMonth.split('-').map(Number);
    prevBtn.disabled = year <= 2020 && month <= 1;
}

function navigateBudgetMonth(direction) {
    const [year, month] = state.budgetMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month + direction;

    if (newMonth < 1) {
        newMonth = 12;
        newYear--;
    } else if (newMonth > 12) {
        newMonth = 1;
        newYear++;
    }

    state.budgetMonth = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    renderBudget();
    updateBudgetMonthNav();
}

function toggleMonthSelector() {
    const dropdown = document.getElementById('monthSelectorDropdown');
    const isActive = dropdown.classList.contains('active');

    if (!isActive) {
        const [year, month] = state.budgetMonth.split('-').map(Number);
        document.getElementById('selectorYear').textContent = year;
        renderMonthSelectorGrid(year, month);
    }

    dropdown.classList.toggle('active');
}

function renderMonthSelectorGrid(year, selectedMonth) {
    const grid = document.getElementById('monthSelectorGrid');
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const isCurrentYear = year === currentYear;
    const isPastYear = year < currentYear;

    grid.innerHTML = MONTH_NAMES.map((name, idx) => {
        const monthNum = idx + 1;
        const isSelected = monthNum === selectedMonth;
        const isFuture = isCurrentYear && monthNum > currentMonth;
        const isDisabled = !isPastYear && isFuture;

        return `<button class="month-selector-btn ${isSelected ? 'selected' : ''}"
            ${isDisabled ? 'disabled' : ''}
            data-month="${monthNum}">${name}</button>`;
    }).join('');

    // Add click handlers
    grid.querySelectorAll('.month-selector-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => {
            const month = parseInt(btn.dataset.month);
            state.budgetMonth = `${year}-${String(month).padStart(2, '0')}`;
            document.getElementById('monthSelectorDropdown').classList.remove('active');
            renderBudget();
            updateBudgetMonthNav();
        });
    });

    // Update year nav buttons
    document.getElementById('prevYearBtn').disabled = year <= 2020;
    document.getElementById('nextYearBtn').disabled = year >= currentYear;
}

function navigateSelectorYear(direction) {
    const currentYear = parseInt(document.getElementById('selectorYear').textContent);
    const newYear = currentYear + direction;
    const [year, month] = state.budgetMonth.split('-').map(Number);
    renderMonthSelectorGrid(newYear, month);
}

// ============================================================================
// REPORTS PAGE
// ============================================================================
function renderReports() {
    const months = lastNMonthKeys(state.reportTimeframe);
    const currentKey = months[months.length - 1];
    const prevKey = months[months.length - 2];

    const allTx = state.transactions.filter(t => months.includes(monthKey(t.date)));
    const expenses = allTx.filter(t => t.type === 'expense');

    // Category aggregation
    const catMap = {};
    expenses.forEach(t => catMap[t.category] = (catMap[t.category] || 0) + t.amount);
    const catEntries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const totalExp = expenses.reduce((s, t) => s + t.amount, 0);

    // Highest category
    if (catEntries[0]) {
        document.getElementById('repHighCat').textContent = getCategory(catEntries[0][0]).name;
        document.getElementById('repHighPct').textContent = ((catEntries[0][1] / totalExp) * 100).toFixed(0) + '%';
    } else {
        document.getElementById('repHighCat').textContent = '—';
        document.getElementById('repHighPct').textContent = '0%';
    }

    // Avg daily spend (over timeframe)
    const totalDays = months.reduce((s, k) => s + daysInMonth(k), 0);
    const avgDaily = totalDays > 0 ? totalExp / totalDays : 0;
    document.getElementById('repAvgDaily').textContent = formatNPR(avgDaily);

    // Biggest tx
    const biggest = [...expenses].sort((a, b) => b.amount - a.amount)[0];
    if (biggest) {
        document.getElementById('repBigTx').textContent = formatNPR(biggest.amount);
        document.getElementById('repBigTxNote').textContent = biggest.note || getCategory(biggest.category).name;
    } else {
        document.getElementById('repBigTx').textContent = '0';
        document.getElementById('repBigTxNote').textContent = '—';
    }

    // MoM trend
    const curExp = monthTotals(currentKey).expenses;
    const prevExp = prevKey ? monthTotals(prevKey).expenses : 0;
    const momEl = document.getElementById('repMomPct');
    const momLabel = document.getElementById('repMomLabel');
    if (prevExp > 0) {
        const change = ((curExp - prevExp) / prevExp) * 100;
        momEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
        momEl.className = 'big-amount ' + (change > 0 ? 'red' : 'emerald');
        momLabel.textContent = change > 5 ? 'SPENDING UPWARDS' : change < -5 ? 'SPENDING DOWNWARDS' : 'STABLE';
        momLabel.className = 'subnote muted-upper ' + (change > 5 ? 'red' : change < -5 ? 'emerald' : '');
    } else {
        momEl.textContent = '—';
        momEl.className = 'big-amount';
        momLabel.textContent = 'NEW MONTH';
    }

    // Avg trend text
    const halfPoint = Math.floor(months.length / 2);
    const firstHalf = months.slice(0, halfPoint).reduce((s, k) => s + monthTotals(k).expenses, 0);
    const secondHalf = months.slice(halfPoint).reduce((s, k) => s + monthTotals(k).expenses, 0);
    const avgTrendEl = document.getElementById('repAvgTrend');
    if (firstHalf > 0) {
        const chg = ((secondHalf - firstHalf) / firstHalf) * 100;
        avgTrendEl.innerHTML = `<span class="${chg <= 0 ? 'emerald' : 'red'}">${chg >= 0 ? '↑' : '↓'} ${Math.abs(chg).toFixed(1)}%</span> <span class="muted-upper">from earlier</span>`;
    } else {
        avgTrendEl.innerHTML = '<span class="muted-upper">—</span>';
    }

    renderReportDonut(catEntries, totalExp);
    renderMonthlyTrendChart(months);
    renderIncomeExpenseChart(currentKey);
    renderBudgetActual(currentKey);
}

function lastNMonthKeys(n) {
    const keys = [];
    const d = new Date();
    for (let i = n - 1; i >= 0; i--) {
        const dt = new Date(d.getFullYear(), d.getMonth() - i, 1);
        keys.push(monthKey(dt));
    }
    return keys;
}

function renderReportDonut(catEntries, total) {
    const top = catEntries.slice(0, 4);
    const others = catEntries.slice(4).reduce((s, e) => s + e[1], 0);
    const data = top.map(e => e[1]);
    const labels = top.map(e => getCategory(e[0]).name);
    if (others > 0) { data.push(others); labels.push('Others'); }

    destroyChart('reportDonut');
    document.getElementById('reportDonutTotal').textContent = getCurrencySymbol() + ' ' + formatNPRShort(total);

    const colors = data.map((_, i) => CHART_COLORS[i]);
    if (data.length === 0) {
        state.charts.reportDonut = new Chart(document.getElementById('reportDonut'), {
            type: 'doughnut',
            data: { datasets: [{ data: [1], backgroundColor: ['#1A2E27'], borderWidth: 0, cutout: '70%' }] },
            options: { plugins: { legend: { display: false }, tooltip: { enabled: false } }, responsive: false }
        });
    } else {
        state.charts.reportDonut = new Chart(document.getElementById('reportDonut'), {
            type: 'doughnut',
            data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, cutout: '70%' }] },
            options: { plugins: { legend: { display: false } }, responsive: false }
        });
    }

    const legend = document.getElementById('reportLegend');
    legend.innerHTML = data.length ? data.map((v, i) => {
        const pct = total > 0 ? ((v / total) * 100).toFixed(0) : 0;
        return `
            <div class="legend-item">
                <span class="legend-dot" style="background:${colors[i]}"></span>
                <div class="legend-text">
                    <div class="legend-cat">${labels[i]}</div>
                    <div class="legend-val">${pct}%</div>
                </div>
            </div>`;
    }).join('') : `<div style="color:var(--text-muted);font-size:12px">No expenses in range.</div>`;
}

function renderMonthlyTrendChart(months) {
    destroyChart('monthlyTrendChart');
    const labels = months.map(k => monthLabel(k).split(' ')[0].slice(0, 3).toUpperCase());
    const data = months.map(k => monthTotals(k).expenses);
    const currentIdx = months.length - 1;
    const bg = months.map((_, i) => i === currentIdx ? '#10B981' : 'rgba(16, 185, 129, 0.25)');

    state.charts.monthlyTrendChart = new Chart(document.getElementById('monthlyTrendChart'), {
        type: 'bar',
        data: { labels, datasets: [{ data, backgroundColor: bg, borderRadius: 6, barThickness: 28 }] },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => formatNPR(ctx.raw) } }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#64748B' } },
                y: { grid: { color: '#1A2E27' }, ticks: { color: '#64748B', callback: v => formatNPRShort(v) } }
            }
        }
    });
}

function renderIncomeExpenseChart(key) {
    destroyChart('incomeExpenseChart');
    const txs = monthTransactions(key);
    const weeks = [0, 0, 0, 0].map(() => ({ in: 0, out: 0 }));
    txs.forEach(t => {
        const day = new Date(t.date).getDate();
        const w = Math.min(3, Math.floor((day - 1) / 7));
        if (t.type === 'income') weeks[w].in += t.amount;
        else weeks[w].out += t.amount;
    });
    state.charts.incomeExpenseChart = new Chart(document.getElementById('incomeExpenseChart'), {
        type: 'bar',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [
                { label: 'Income', data: weeks.map(w => w.in), backgroundColor: '#10B981', borderRadius: 4, barThickness: 16 },
                { label: 'Expense', data: weeks.map(w => w.out), backgroundColor: '#F87171', borderRadius: 4, barThickness: 16 }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => ctx.dataset.label + ': ' + formatNPR(ctx.raw) } }
            },
            scales: {
                x: { grid: { color: '#1A2E27' }, ticks: { color: '#64748B', callback: v => formatNPRShort(v) } },
                y: { grid: { display: false }, ticks: { color: '#64748B' } }
            }
        }
    });
}

function renderBudgetActual(key) {
    const budget = monthBudget(key);
    const spent = expensesByCategory(key);
    const entries = Object.keys(budget).filter(c => Number(budget[c]) > 0);
    const list = document.getElementById('budgetActualList');
    if (entries.length === 0) {
        list.innerHTML = `<div style="color:var(--text-muted);font-size:12px;text-align:center;padding:20px">No budgets set for this month.</div>`;
        return;
    }
    const top = entries.map(c => ({ c, alloc: Number(budget[c]), spent: Number(spent[c] || 0) }))
        .sort((a, b) => b.alloc - a.alloc).slice(0, 4);
    list.innerHTML = top.map(r => {
        const pct = r.alloc > 0 ? (r.spent / r.alloc) * 100 : 0;
        const over = pct > 100;
        const cls = over ? 'red' : '';
        return `
            <div class="budget-actual-row">
                <div class="budget-actual-head">
                    <span class="budget-actual-name">${getCategory(r.c).name}</span>
                    <span class="budget-actual-amt ${over ? 'over' : ''}"><span class="spent">${formatNPR(r.spent)}</span> / ${formatNPR(r.alloc)}</span>
                </div>
                <div class="progress"><div class="progress-fill ${cls}" style="width:${Math.min(100, pct)}%"></div></div>
            </div>
        `;
    }).join('');
}

// ============================================================================
// SETTINGS PAGE
// ============================================================================
function renderSettings() {
    const bytes = new Blob([JSON.stringify(state.transactions) + JSON.stringify(state.budgets)]).size;
    const mb = (bytes / (1024 * 1024)).toFixed(2);
    document.getElementById('storageUsage').textContent = `${mb} MB / 50 MB`;
    document.getElementById('storageBar').style.width = Math.min(100, (bytes / (50 * 1024 * 1024)) * 100) + '%';
}

function exportCsv() {
    if (state.transactions.length === 0) { toast('No transactions to export', 'error'); return; }
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Title', 'Description'];
    const rows = state.transactions.map(t => [
        t.date, t.type, getCategory(t.category).name, t.amount,
        `"${(t.note || '').replace(/"/g, '""')}"`,
        `"${(t.description || '').replace(/"/g, '""')}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paisatrack_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Vault exported to CSV');
}

function importCsv(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const lines = e.target.result.split(/\r?\n/).filter(l => l.trim());
            if (lines.length < 2) { toast('CSV is empty', 'error'); return; }
            const header = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());
            const imported = [];
            const isNative = header.includes('id') && header.includes('category') && header.includes('note');
            const colIdx = {};
            header.forEach((h, i) => colIdx[h] = i);

            for (let i = 1; i < lines.length; i++) {
                const parts = parseCsvLine(lines[i]);
                if (parts.length < 4) continue;

                let type, amount, category, date, note, description;

                if (isNative) {
                    type = parts[colIdx['type']] || 'expense';
                    amount = parseFloat(parts[colIdx['amount']]);
                    const catRaw = parts[colIdx['category']] || '';
                    const cat = ALL_CATEGORIES.find(c => c.id === catRaw || c.name.toLowerCase() === catRaw.toLowerCase()) || ALL_CATEGORIES.find(c => c.id === 'others');
                    category = cat.id;
                    date = parts[colIdx['date']] || '';
                    note = parts[colIdx['note']] || cat.name;
                    description = parts[colIdx['description']] || '';
                } else {
                    date = parts[colIdx['date']] || parts[0] || '';
                    type = parts[colIdx['type']] || parts[1] || 'expense';
                    const catName = parts[colIdx['category']] || parts[2] || '';
                    amount = parseFloat(parts[colIdx['amount']] || parts[3]);
                    note = parts[colIdx['title']] || parts[colIdx['note']] || parts[4] || '';
                    description = parts[colIdx['description']] || parts[5] || '';
                    const cat = ALL_CATEGORIES.find(c => c.name.toLowerCase() === catName.toLowerCase() || c.id === catName) || ALL_CATEGORIES.find(c => c.id === 'others');
                    category = cat.id;
                }

                if (!amount || !date) continue;
                imported.push({
                    id: uid(),
                    type: type === 'income' ? 'income' : 'expense',
                    amount,
                    category,
                    date: date.slice(0, 10),
                    note: note || getCategory(category).name,
                    description: description || '',
                    createdAt: new Date().toISOString()
                });
            }
            state.transactions.push(...imported);
            saveTx();
            toast(`Imported ${imported.length} transactions`);
            route();
        } catch (err) {
            toast('Import failed — invalid CSV', 'error');
        }
    };
    reader.readAsText(file);
}

function parseCsvLine(line) {
    const result = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
        else if (c === ',' && !inQ) { result.push(cur); cur = ''; }
        else cur += c;
    }
    result.push(cur);
    return result;
}

async function wipeAllData() {
    const ok = await confirmDialog('Wipe all records?', 'Every transaction, budget, and insight will be permanently deleted. This cannot be undone.');
    if (!ok) return;
    localStorage.removeItem(STORAGE.TX);
    localStorage.removeItem(STORAGE.BUDGET);
    state.transactions = [];
    state.budgets = {};
    toast('All records cleared');
    route();
}

// Modified submitPin to support first-time setup
function submitPin() {
    const auth = getStoredAuth();

    if (!auth || !auth.isLoggedIn) {
        // First time setup - save the PIN
        setStoredAuth({ isLoggedIn: true, pin: currentPin });
        hideLogin();
        hideLanding();
        toast('Vault created successfully');
        return;
    }

    // Normal login
    if (auth.pin === currentPin) {
        setStoredAuth({ isLoggedIn: true, pin: currentPin });
        hideLogin();
        hideLanding();
        toast('Welcome back');
    } else {
        document.getElementById('loginError').classList.add('show');
        clearPin();
    }
}

// Modified submitPassword to support first-time setup
function submitPassword(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    const auth = getStoredAuth();

    if (!auth || !auth.isLoggedIn) {
        // First time setup - save credentials
        if (!username || !password) {
            document.getElementById('loginError').textContent = 'Please fill all fields';
            document.getElementById('loginError').classList.add('show');
            return;
        }
        setStoredAuth({ isLoggedIn: true, username, password });
        hideLogin();
        hideLanding();
        toast('Vault created successfully');
        return;
    }

    // Normal login
    if (auth.username === username && auth.password === password) {
        setStoredAuth({ isLoggedIn: true, username, password });
        hideLogin();
        hideLanding();
        toast('Welcome back');
    } else {
        document.getElementById('loginError').classList.add('show');
    }
}

// ---------- Onboarding Functions ----------
let onboardingData = { name: '', location: '', username: '', calendar: 'BS', pin: '' };
let onboardingStep = 1;
let onboardingPin = '';
let confirmPin = '';
let firstPin = '';

function showOnboarding() {
    document.getElementById('onboardingModal').classList.add('active');
    onboardingStep = 1;
    onboardingData = { name: '', location: '', username: '', calendar: 'BS', pin: '' };
    onboardingPin = '';
    confirmPin = '';
    firstPin = '';
    updateOnboardingStep();
    updateOnboardingPinDisplay();
    updateConfirmPinDisplay();
}

function hideOnboarding() {
    document.getElementById('onboardingModal').classList.remove('active');
}

function updateOnboardingStep() {
    for (let i = 1; i <= 6; i++) {
        const stepEl = document.getElementById('step' + i + 'Indicator');
        const contentEl = document.getElementById('step' + i);
        if (!stepEl || !contentEl) continue;
        if (i === onboardingStep) {
            stepEl.classList.add('active');
            stepEl.classList.remove('completed');
            contentEl.classList.remove('hidden');
        } else if (i < onboardingStep) {
            stepEl.classList.add('completed');
            stepEl.classList.remove('active');
            contentEl.classList.add('hidden');
        } else {
            stepEl.classList.remove('active', 'completed');
            contentEl.classList.add('hidden');
        }
    }
}

function nextOnboardingStep(currentStep) {
    if (currentStep === 1) {
        const name = document.getElementById('onboardingName').value.trim();
        if (!name) {
            toast('Please enter your name', 'error');
            return;
        }
        onboardingData.name = name;
        onboardingStep = 2;
    } else if (currentStep === 2) {
        const location = document.getElementById('onboardingLocation').value;
        if (!location) {
            toast('Please select your location', 'error');
            return;
        }
        onboardingData.location = location;
        onboardingStep = 3;
    } else if (currentStep === 3) {
        const username = document.getElementById('onboardingUsername').value.trim();
        if (!username) {
            toast('Please choose a username', 'error');
            return;
        }
        if (username.length < 3) {
            toast('Username must be at least 3 characters', 'error');
            return;
        }
        onboardingData.username = username;
        onboardingStep = 4;
    } else if (currentStep === 4) {
        // Calendar is already set via radio buttons
        const calBS = document.getElementById('calBS').checked;
        onboardingData.calendar = calBS ? 'BS' : 'AD';
        onboardingStep = 5;
    }
    updateOnboardingStep();
}

function goToConfirmPinOnboarding() {
    if (onboardingPin.length !== 4) {
        toast('Please enter a 4-digit PIN', 'error');
        return;
    }
    firstPin = onboardingPin;
    confirmPin = '';
    onboardingStep = 6;
    updateOnboardingStep();
    updateConfirmPinDisplay();
    document.getElementById('confirmPinError').style.display = 'none';
}

function addOnboardingPinDigit(digit) {
    if (onboardingPin.length >= 4) return;
    onboardingPin += digit;
    updateOnboardingPinDisplay();
    if (onboardingPin.length === 4) {
        setTimeout(goToConfirmPinOnboarding, 300);
    }
}

function clearOnboardingPin() {
    onboardingPin = '';
    updateOnboardingPinDisplay();
}

function updateOnboardingPinDisplay() {
    const display = document.getElementById('onboardingPinDisplay');
    if (display) display.textContent = onboardingPin.padEnd(4, '_').split('').join(' ');
    for (let i = 1; i <= 4; i++) {
        const dot = document.getElementById('onboardingPinDot' + i);
        if (dot) dot.classList.toggle('filled', i <= onboardingPin.length);
    }
}

let confirmPinDigit = '';

function addConfirmPinDigit(digit) {
    if (confirmPin.length >= 4) return;
    confirmPin += digit;
    updateConfirmPinDisplay();
    if (confirmPin.length === 4) {
        setTimeout(verifyConfirmPin, 300);
    }
}

function clearConfirmPin() {
    confirmPin = '';
    updateConfirmPinDisplay();
    document.getElementById('confirmPinError').style.display = 'none';
}

function updateConfirmPinDisplay() {
    const display = document.getElementById('confirmPinDisplay');
    if (display) display.textContent = confirmPin.padEnd(4, '_').split('').join(' ');
    for (let i = 1; i <= 4; i++) {
        const dot = document.getElementById('confirmPinDot' + i);
        if (dot) dot.classList.toggle('filled', i <= confirmPin.length);
    }
}

function verifyConfirmPin() {
    if (confirmPin !== firstPin) {
        document.getElementById('confirmPinError').style.display = 'block';
        confirmPin = '';
        updateConfirmPinDisplay();
        return;
    }
    finishOnboarding();
}

function finishOnboarding() {
    onboardingData.pin = confirmPin || firstPin;

    // Save user data
    setStoredAuth({
        isLoggedIn: true,
        name: onboardingData.name,
        username: onboardingData.username,
        location: onboardingData.location,
        calendar: onboardingData.calendar,
        pin: onboardingData.pin
    });

    // Update state settings
    state.settings.userName = onboardingData.name;
    state.settings.calendar = onboardingData.calendar;
    localStorage.setItem(STORAGE.SETTINGS, JSON.stringify(state.settings));

    hideOnboarding();
    hideLanding();
    updateAvatar();
    location.hash = '#dashboard';
    route();
    toast('Vault created! Welcome, ' + onboardingData.name);
}

// ---------- Profile Modal Functions ----------
function showProfileModal() {
    const auth = getStoredAuth();
    if (!auth) return;

    document.getElementById('profileName').textContent = auth.name || '—';
    document.getElementById('profileUsername').textContent = '@' + (auth.username || '—');
    document.getElementById('profileLocation').textContent = auth.location || '—';
    document.getElementById('profileCalendar').textContent = (auth.calendar === 'BS' ? 'Bikram Samwat (BS)' : 'English (AD)') || '—';
    document.getElementById('profileAvatarLarge').textContent = (auth.name || 'U').charAt(0).toUpperCase();

    // Clear edit fields
    document.getElementById('editUsername').value = '';
    document.getElementById('editNewPin').value = '';
    document.getElementById('editConfirmPin').value = '';

    document.getElementById('profileModal').classList.remove('hidden');
}

function closeProfileModal() {
    document.getElementById('profileModal').classList.add('hidden');
}

function updateAvatar() {
    const profile = getUserProfile();
    const initial = profile?.name ? profile.name.charAt(0).toUpperCase() :
                    profile?.username ? profile.username.charAt(0).toUpperCase() : 'U';
    document.getElementById('profileAvatar').textContent = initial;
}

// ---------- Demo Auto-Play ----------
let currentDemoStep = 1;
let demoInterval = null;
const demoCaptions = {
    1: 'Set up your private vault in seconds. Just a username and PIN — no email, no data shared.',
    2: 'Allocate your monthly budget across categories. PaisaTrack tracks how much you\'ve used in real time.',
    3: 'Add income or expenses in seconds. Every paisa recorded, every category tracked.',
    4: 'See exactly where your money goes. Visual breakdowns by category, month-by-month trends.',
    5: 'Your full financial picture at a glance. Know your balance, your savings rate, and what you spent last.'
};

function showDemoStep(step) {
    currentDemoStep = step;

    // Update tabs
    document.querySelectorAll('.watch-tab').forEach(tab => {
        tab.classList.toggle('active', parseInt(tab.dataset.step) === step);
    });

    // Update previews
    document.querySelectorAll('.preview-content').forEach(content => {
        content.classList.remove('active');
    });
    const activePreview = document.getElementById('preview' + step);
    if (activePreview) {
        activePreview.classList.add('active');
    }

    // Update caption
    const caption = document.getElementById('previewCaption');
    if (caption) {
        caption.textContent = demoCaptions[step];
    }

    // Reset auto-play timer
    resetDemoAutoPlay();
}

function startDemoAutoPlay() {
    if (demoInterval) clearInterval(demoInterval);
    demoInterval = setInterval(() => {
        // Only auto-play if on landing page and not interacting
        const landingPage = document.getElementById('landingPage');
        if (landingPage && !landingPage.classList.contains('hidden')) {
            currentDemoStep = currentDemoStep >= 5 ? 1 : currentDemoStep + 1;
            showDemoStep(currentDemoStep);
        }
    }, 4000);
}

function resetDemoAutoPlay() {
    if (demoInterval) clearInterval(demoInterval);
    startDemoAutoPlay();
}

function saveProfile() {
    const newUsername = document.getElementById('editUsername').value.trim();
    const newPin = document.getElementById('editNewPin').value.trim();
    const confirmPin = document.getElementById('editConfirmPin').value.trim();

    const auth = getStoredAuth();
    if (!auth) return;

    // Update username if provided
    if (newUsername && newUsername !== auth.username) {
        if (newUsername.length < 3) {
            toast('Username must be at least 3 characters', 'error');
            return;
        }
        auth.username = newUsername;
    }

    // Update PIN if provided (both fields must match)
    if (newPin || confirmPin) {
        if (newPin.length !== 4 || confirmPin.length !== 4) {
            toast('PIN must be 4 digits', 'error');
            return;
        }
        if (newPin !== confirmPin) {
            toast('PINs do not match', 'error');
            return;
        }
        auth.pin = newPin;
    }

    // Save changes
    setStoredAuth(auth);

    // Clear input fields
    document.getElementById('editUsername').value = '';
    document.getElementById('editNewPin').value = '';
    document.getElementById('editConfirmPin').value = '';

    // Update profile display
    showProfileModal();

    toast('Profile updated successfully');
}

// ============================================================================
// SAMPLE DATA
// ============================================================================
function loadSampleData() {
    const merchants = {
        food_dining: ['Bhatbhateni Supermarket', 'Saleways Store', 'Big Mart', 'Local vegetables', 'Bhat-Bhateni Pulchowk', 'Saleways Sanepa'],
        rent: ['Koteshwor room rent', 'Landlord — monthly rent', 'Apartment rent'],
        transport: ['Pathao ride to Thamel', 'Nepal Oil Corp fuel', 'Microbus fare', 'Tootle ride', 'Pathao to office', 'Cab to airport'],
        mobile_internet: ['Ncell recharge', 'NTC topup', 'Vianet Wi-Fi', 'WorldLink internet'],
        tiffin_service: ['Didi tiffin service', 'Office lunch box', 'Home cooked tiffin'],
        emi_loan: ['Apple Store — MacBook EMI', 'Bike EMI', 'Student loan EMI'],
        utilities: ['NEA Electricity Bill', 'KUKL water bill', 'LPG cylinder refill'],
        education: ['ACCA exam fee', 'Udemy course', 'Kindle book'],
        health: ['Norvic pharmacy', 'Dental checkup', 'CIWEC clinic visit'],
        clothing: ['Durbarmarg shopping', 'Daraz order — shirt', 'New shoes'],
        festival_gifts: ['Dashain gift for family', 'Tihar sweets', 'Birthday gift'],
        entertainment: ['Himalayan Java coffee', 'Everest Momo Center', 'Movie at QFX', 'Spotify premium'],
        family_support: ['Sent home to Nawalparasi', 'Family emergency support', 'Monthly transfer to parents'],
        savings: ['Fixed deposit', 'Prabhu SIP deposit', 'Savings transfer'],
        others: ['Random expense', 'Nikhil repayment', 'Miscellaneous']
    };
    const incomeMerchants = {
        salary: ['Salary — TechCorp Nepal', 'Monthly Salary Credit', 'Corporate Remittance'],
        freelance: ['Freelance UI project', 'Upwork withdrawal', 'Client payment — logo'],
        family_allowance: ['Family allowance'],
        rental: ['Tenant rent received'],
        business: ['Side business income'],
        other_income: ['Gift money', 'Tax refund', 'Cashback']
    };

    const today = new Date();
    const txs = [];
    for (let monthBack = 2; monthBack >= 0; monthBack--) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() - monthBack, 1);
        const y = monthDate.getFullYear();
        const m = monthDate.getMonth();
        const dim = new Date(y, m + 1, 0).getDate();
        const cap = monthBack === 0 ? today.getDate() : dim;

        // Salary on 1st
        txs.push(makeTx('income', 45000, 'salary', `${y}-${String(m + 1).padStart(2, '0')}-01`, incomeMerchants.salary[0], 'Monthly wage credit'));
        // Freelance some months
        if (monthBack !== 1) {
            txs.push(makeTx('income', 15000, 'freelance', `${y}-${String(m + 1).padStart(2, '0')}-${String(Math.min(cap, 12)).padStart(2, '0')}`, pick(incomeMerchants.freelance), 'Project Completion - UI Design'));
        }
        // Rent on 1st
        txs.push(makeTx('expense', 15000, 'rent', `${y}-${String(m + 1).padStart(2, '0')}-01`, merchants.rent[0], 'Apartment Maintenance & Rent'));
        // EMI on 5th
        txs.push(makeTx('expense', 5000, 'emi_loan', `${y}-${String(m + 1).padStart(2, '0')}-05`, pick(merchants.emi_loan), 'Monthly installment'));
        // Utilities around 10th
        txs.push(makeTx('expense', 1800 + Math.floor(Math.random() * 700), 'utilities', `${y}-${String(m + 1).padStart(2, '0')}-${String(Math.min(cap, 10)).padStart(2, '0')}`, pick(merchants.utilities), 'Monthly bill'));
        // Mobile
        txs.push(makeTx('expense', 500 + Math.floor(Math.random() * 300), 'mobile_internet', `${y}-${String(m + 1).padStart(2, '0')}-${String(Math.min(cap, 8)).padStart(2, '0')}`, pick(merchants.mobile_internet), 'Recharge'));
        // Tiffin
        txs.push(makeTx('expense', 4000, 'tiffin_service', `${y}-${String(m + 1).padStart(2, '0')}-03`, merchants.tiffin_service[0], 'Monthly tiffin'));
        // Family support
        if (monthBack !== 0) {
            txs.push(makeTx('expense', 5000 + Math.floor(Math.random() * 3000), 'family_support', `${y}-${String(m + 1).padStart(2, '0')}-15`, pick(merchants.family_support), 'Monthly home transfer'));
        }

        // Daily food (random days)
        const foodDays = Math.min(cap, 10 + Math.floor(Math.random() * 5));
        for (let i = 0; i < foodDays; i++) {
            const day = 1 + Math.floor(Math.random() * cap);
            txs.push(makeTx('expense', 200 + Math.floor(Math.random() * 600), 'food_dining', `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`, pick(merchants.food_dining), 'Household supplies'));
        }
        // Transport (8-12 rides)
        const rides = 8 + Math.floor(Math.random() * 5);
        for (let i = 0; i < rides; i++) {
            const day = 1 + Math.floor(Math.random() * cap);
            txs.push(makeTx('expense', 50 + Math.floor(Math.random() * 250), 'transport', `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`, pick(merchants.transport), 'Daily commute'));
        }
        // Occasional splurges
        if (Math.random() > 0.3) {
            const day = 1 + Math.floor(Math.random() * cap);
            txs.push(makeTx('expense', 400 + Math.floor(Math.random() * 1500), 'entertainment', `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`, pick(merchants.entertainment), 'Weekend leisure'));
        }
        if (Math.random() > 0.5) {
            const day = 1 + Math.floor(Math.random() * cap);
            txs.push(makeTx('expense', 500 + Math.floor(Math.random() * 2000), 'clothing', `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`, pick(merchants.clothing), ''));
        }
        if (monthBack === 0 && Math.random() > 0.5) {
            txs.push(makeTx('expense', 15500, 'emi_loan', `${y}-${String(m + 1).padStart(2, '0')}-${String(Math.min(cap, 18)).padStart(2, '0')}`, 'Apple Store - MacBook EMI', 'Large purchase'));
        }

        // Budget
        state.budgets[monthKey(monthDate)] = {
            food_dining: 8000, rent: 15000, transport: 4000, mobile_internet: 2000, tiffin_service: 4500,
            emi_loan: 5000, utilities: 2500, education: 3000, health: 2000, clothing: 2000,
            festival_gifts: 5000, entertainment: 1500, family_support: 3000, savings: 5000, others: 2000
        };
    }

    state.transactions.push(...txs);
    saveTx();
    saveBudgets();
    toast(`Loaded ${txs.length} sample transactions`);
    route();
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function makeTx(type, amount, category, date, note, description) {
    return {
        id: uid(),
        type, amount, category, date,
        note: note || '',
        description: description || '',
        createdAt: new Date(date).toISOString()
    };
}

// ============================================================================
// INIT / EVENT WIRING
// ============================================================================
function init() {
    load();

    // Auth check - show landing/login if not logged in
    checkAuth();

    // Update avatar if user is logged in
    const auth = getStoredAuth();
    if (auth && auth.isLoggedIn) {
        updateAvatar();
    }

    // Start demo auto-play
    startDemoAutoPlay();

    // Routing
    window.addEventListener('hashchange', () => {
        const authCheck = getStoredAuth();
        if (!authCheck || !authCheck.isLoggedIn) {
            // Don't route to app pages if not logged in
            if (['dashboard', 'transactions', 'budget', 'reports', 'settings'].includes(location.hash.replace('#', ''))) {
                showLanding();
                return;
            }
        }
        route();
    });

    // Initial route check
    if (!location.hash) {
        const authCheck = getStoredAuth();
        if (authCheck && authCheck.isLoggedIn) {
            location.hash = '#dashboard';
        }
    }
    route();

    // Add transaction buttons
    ['sidebarAddBtn', 'dashAddBtn', 'txAddBtn', 'mobileFab'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', () => openTxModal());
    });

    // Modal close
    document.getElementById('txModalClose').addEventListener('click', closeTxModal);
    document.getElementById('txCancelBtn').addEventListener('click', closeTxModal);
    document.getElementById('txModal').addEventListener('click', (e) => {
        if (e.target.id === 'txModal') closeTxModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeTxModal();
            closeTxDrawer();
            document.getElementById('confirmModal').classList.add('hidden');
        }
    });

    // Transaction drawer
    document.getElementById('txDrawerBackdrop').addEventListener('click', closeTxDrawer);
    document.getElementById('drawerCloseBtn').addEventListener('click', closeTxDrawer);
    document.getElementById('drawerEditBtn').addEventListener('click', editFromDrawer);
    document.getElementById('drawerDeleteBtn').addEventListener('click', deleteFromDrawer);

    // Photo upload
    setupPhotoUpload();

    // Type toggle
    document.querySelectorAll('.type-btn').forEach(b => {
        b.addEventListener('click', () => {
            modalType = b.dataset.type;
            updateTypeToggle();
            populateModalCategories();
        });
    });

    // Form submit
    document.getElementById('txForm').addEventListener('submit', submitTxForm);

    // Filter inputs
    document.getElementById('filterSearch').addEventListener('input', (e) => {
        state.filter.search = e.target.value;
        state.page = 1;
        renderTransactions();
    });
    document.getElementById('filterCategory').addEventListener('change', (e) => {
        state.filter.category = e.target.value;
        state.page = 1;
        renderTransactions();
    });
    document.getElementById('filterMonth').addEventListener('change', (e) => {
        state.filter.month = e.target.value;
        state.page = 1;
        renderTransactions();
    });
    document.querySelectorAll('#filterType button').forEach(b => {
        b.addEventListener('click', () => {
            state.filter.type = b.dataset.type;
            state.page = 1;
            document.querySelectorAll('#filterType button').forEach(x => x.classList.toggle('active', x === b));
            renderTransactions();
        });
    });
    document.getElementById('filterReset').addEventListener('click', resetFilters);

    // Global search
    document.getElementById('globalSearch').addEventListener('input', (e) => {
        if (location.hash !== '#transactions') location.hash = '#transactions';
        state.filter.search = e.target.value;
        state.page = 1;
        document.getElementById('filterSearch').value = e.target.value;
        renderTransactions();
    });

    // Budget
    document.getElementById('budgetMonthInput').addEventListener('change', (e) => {
        if (e.target.value) {
            state.budgetMonth = e.target.value;
            renderBudget();
            updateBudgetMonthNav();
        }
    });
    document.getElementById('saveBudgetBtn').addEventListener('click', saveBudgetFromInputs);
    document.getElementById('copyLastMonthBtn').addEventListener('click', copyLastMonthBudget);
    document.getElementById('addCategoryBtn').addEventListener('click', () => {
        toast('All default Nepal categories are already listed. Set a value to activate.', 'error');
    });

    // Budget month navigation
    document.getElementById('prevMonthBtn').addEventListener('click', () => navigateBudgetMonth(-1));
    document.getElementById('nextMonthBtn').addEventListener('click', () => navigateBudgetMonth(1));
    document.getElementById('budgetMonthBtn').addEventListener('click', toggleMonthSelector);
    document.getElementById('prevYearBtn').addEventListener('click', () => navigateSelectorYear(-1));
    document.getElementById('nextYearBtn').addEventListener('click', () => navigateSelectorYear(1));

    // Close month selector when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('monthSelectorDropdown');
        const wrapper = document.querySelector('.month-pill-wrapper');
        if (!wrapper.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });

    // Keyboard navigation for budget page
    document.addEventListener('keydown', (e) => {
        if (location.hash === '#budget' && !e.target.matches('input, textarea')) {
            if (e.key === 'ArrowLeft') {
                navigateBudgetMonth(-1);
            } else if (e.key === 'ArrowRight') {
                navigateBudgetMonth(1);
            }
        }
    });

    // Initial state
    updateBudgetMonthNav();

    // Calendar toggle
    document.getElementById('calToggleBtn').addEventListener('click', () => {
        toggleCalendar();
        document.getElementById('calLabel').textContent = calendarLabel();
    });
    document.getElementById('calLabel').textContent = calendarLabel();

    // Currency buttons
    document.querySelectorAll('.currency-btn').forEach(btn => {
        btn.addEventListener('click', () => setCurrency(btn.dataset.currency));
    });
    updateCurrencyButtons();

    // Reports timeframe
    document.querySelectorAll('#reportTimeframe button').forEach(b => {
        b.addEventListener('click', () => {
            state.reportTimeframe = parseInt(b.dataset.tf);
            document.querySelectorAll('#reportTimeframe button').forEach(x => x.classList.toggle('active', x === b));
            renderReports();
        });
    });

    // Settings
    document.getElementById('exportCsvBtn').addEventListener('click', exportCsv);
    document.getElementById('importCsvBtn').addEventListener('click', () => document.getElementById('importCsvFile').click());
    document.getElementById('importCsvFile').addEventListener('change', (e) => {
        if (e.target.files[0]) importCsv(e.target.files[0]);
        e.target.value = '';
    });
    document.getElementById('wipeDataBtn').addEventListener('click', wipeAllData);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('loadSampleBtn').addEventListener('click', async () => {
        if (state.transactions.length > 0) {
            const ok = await confirmDialog('Load sample data?', 'This will add sample transactions alongside your existing ones.');
            if (!ok) return;
        }
        loadSampleData();
    });
}

document.addEventListener('DOMContentLoaded', init);
