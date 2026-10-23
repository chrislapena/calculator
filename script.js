const display = document.getElementById('display');
const themeToggle = document.getElementById('theme-toggle');

// History DOM Elements
const historyToggle = document.getElementById('history-toggle');
const historyBadge = document.getElementById('history-badge');
const historyPanel = document.getElementById('history-panel');
const historyBackdrop = document.getElementById('history-backdrop');
const historyList = document.getElementById('history-list');
const historyCountTag = document.getElementById('history-count-tag');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const closeHistoryBtn = document.getElementById('close-history-btn');

// --- Theme Management ---
function applyTheme(theme) {
    const isLight = theme === 'light';
    document.body.classList.toggle('light-mode', isLight);
    if (themeToggle) {
        themeToggle.setAttribute('aria-checked', String(isLight));
        themeToggle.setAttribute('title', isLight ? 'Switch to dark mode' : 'Switch to light mode');
    }
}

function initTheme() {
    try {
        const savedTheme = localStorage.getItem('calculator-theme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
            applyTheme(savedTheme);
            return;
        }
    } catch (e) {
        // Handle environments where localStorage is restricted
    }

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        applyTheme('light');
    } else {
        applyTheme('dark');
    }
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const isCurrentlyLight = document.body.classList.contains('light-mode');
        const nextTheme = isCurrentlyLight ? 'dark' : 'light';
        applyTheme(nextTheme);
        try {
            localStorage.setItem('calculator-theme', nextTheme);
        } catch (e) {
            // Ignore storage errors in restricted contexts
        }
    });
}

if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
        try {
            if (!localStorage.getItem('calculator-theme')) {
                applyTheme(e.matches ? 'light' : 'dark');
            }
        } catch (err) {
            applyTheme(e.matches ? 'light' : 'dark');
        }
    });
}

initTheme();

// --- Interactive Calculation History State & Storage ---
let calculationHistory = [];
const STORAGE_KEY_HISTORY = 'calculator-history';
const STORAGE_KEY_PANEL_OPEN = 'calculator-history-open';

function formatExpressionForHistory(expr) {
    let formatted = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-');

    // Add clean spacing around binary operators
    formatted = formatted
        .replace(/([0-9.)])\s*([*\/^])\s*/g, '$1 $2 ')
        .replace(/([0-9.)])\s*([+])\s*/g, '$1 + ')
        .replace(/([0-9.)])\s*(-)\s*(?=[0-9.(])/g, '$1 − ')
        .replace(/\*/g, '×')
        .replace(/\//g, '÷');

    return formatted.trim();
}

function hasCalculableOperation(expr) {
    if (!expr) return false;
    const trimmed = expr.trim();
    // Strip leading unary +/- to see if there is an actual binary/power operation
    const withoutLeadingSign = trimmed.replace(/^[+-]/, '');
    return /[+\-*/^]/.test(withoutLeadingSign);
}

function addHistoryRecord(expression, result) {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const entry = {
        id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        expression: expression,
        result: String(result),
        fullText: `${expression} = ${result}`,
        timestamp: timestamp
    };

    calculationHistory.unshift(entry);
    // Keep at most 50 recent entries in memory
    if (calculationHistory.length > 50) {
        calculationHistory.pop();
    }

    try {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(calculationHistory));
    } catch (e) {
        // Storage restricted
    }

    renderHistory();
}

// Re-use Previous Results: clicking an entry reloads that calculation result into display
function reloadResultToDisplay(resultValue, cardElement) {
    clearErrorState();
    display.value = String(resultValue);
    display.scrollLeft = display.scrollWidth;

    // Glowing highlight animation on the main calculator display
    display.classList.remove('display-reloaded');
    void display.offsetWidth; // Force DOM reflow
    display.classList.add('display-reloaded');
    setTimeout(() => {
        display.classList.remove('display-reloaded');
    }, 400);

    // Click micro-animation feedback on the history entry card
    if (cardElement) {
        cardElement.classList.add('item-loaded');
        setTimeout(() => {
            cardElement.classList.remove('item-loaded');
        }, 300);
    }
}

// Clear History: wipe stored past calculations from memory and storage
function clearHistory() {
    calculationHistory = [];
    try {
        localStorage.removeItem(STORAGE_KEY_HISTORY);
    } catch (e) {
        // Storage restricted
    }
    renderHistory();
}

function deleteHistoryItem(id, event) {
    if (event) {
        event.stopPropagation();
    }
    calculationHistory = calculationHistory.filter(item => item.id !== id);
    try {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(calculationHistory));
    } catch (e) {
        // Storage restricted
    }
    renderHistory();
}

function renderHistory() {
    if (!historyList) return;

    const count = calculationHistory.length;
    if (historyCountTag) {
        historyCountTag.textContent = count;
        historyCountTag.setAttribute('aria-label', `${count} saved calculations`);
    }

    if (historyBadge && historyBadge.style) {
        if (count > 0) {
            historyBadge.textContent = count > 99 ? '99+' : count;
            historyBadge.style.display = 'inline-block';
        } else {
            historyBadge.style.display = 'none';
        }
    }

    if (clearHistoryBtn) {
        clearHistoryBtn.disabled = count === 0;
    }

    if (count === 0) {
        historyList.innerHTML = `
            <div class="history-empty" id="history-empty">
                <div class="empty-icon" aria-hidden="true">📜</div>
                <div class="empty-title">No History Yet</div>
                <div class="empty-desc">Completed calculations (e.g. 15 × 4 = 60) will appear here. Click any result to reload it!</div>
            </div>
        `;
        return;
    }

    historyList.innerHTML = '';
    calculationHistory.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'history-item';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Calculation: ${item.expression} equals ${item.result}. Click to reload result into display.`);
        card.dataset.result = item.result;

        card.innerHTML = `
            <div class="history-item-top">
                <span class="history-item-expression" title="${item.expression} =">${item.expression} =</span>
                <div class="history-item-meta">
                    <span class="history-item-time">${item.timestamp}</span>
                    <button type="button" class="history-item-delete" title="Delete this entry" aria-label="Delete calculation ${item.expression}">✕</button>
                </div>
            </div>
            <div class="history-item-bottom">
                <span class="history-item-result">${item.result}</span>
                <span class="history-item-action-badge">
                    <span class="action-icon" aria-hidden="true">↩</span> Reload
                </span>
            </div>
        `;

        // Click to reload result into calculator display
        card.addEventListener('click', () => {
            reloadResultToDisplay(item.result, card);
        });

        // Keyboard support: Enter or Space
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                reloadResultToDisplay(item.result, card);
            }
        });

        // Delete button inside card
        const deleteBtn = card.querySelector('.history-item-delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                deleteHistoryItem(item.id, e);
            });
        }

        historyList.appendChild(card);
    });
}

function setHistoryPanelState(isOpen, savePreference = true) {
    if (!historyPanel) return;

    historyPanel.classList.toggle('collapsed', !isOpen);
    if (historyBackdrop) {
        historyBackdrop.classList.toggle('active', isOpen && window.innerWidth <= 720);
    }
    if (historyToggle) {
        historyToggle.setAttribute('aria-expanded', String(isOpen));
        historyToggle.classList.toggle('active', isOpen);
    }

    if (savePreference) {
        try {
            localStorage.setItem(STORAGE_KEY_PANEL_OPEN, String(isOpen));
        } catch (e) {
            // Storage restricted
        }
    }
}

function toggleHistoryPanel() {
    if (!historyPanel) return;
    const isCurrentlyOpen = !historyPanel.classList.contains('collapsed');
    setHistoryPanelState(!isCurrentlyOpen, true);
}

function initHistory() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                calculationHistory = parsed;
            }
        }
    } catch (e) {
        calculationHistory = [];
    }
    renderHistory();

    // Determine initial open/collapse state
    let isOpen = true;
    try {
        const savedState = localStorage.getItem(STORAGE_KEY_PANEL_OPEN);
        if (savedState !== null) {
            isOpen = savedState === 'true';
        } else {
            isOpen = window.innerWidth >= 721;
        }
    } catch (e) {
        isOpen = window.innerWidth >= 721;
    }
    setHistoryPanelState(isOpen, false);
}

// Bind History Event Listeners
if (historyToggle) {
    historyToggle.addEventListener('click', toggleHistoryPanel);
}

if (closeHistoryBtn) {
    closeHistoryBtn.addEventListener('click', () => {
        setHistoryPanelState(false, true);
    });
}

if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', clearHistory);
}

if (historyBackdrop) {
    historyBackdrop.addEventListener('click', () => {
        setHistoryPanelState(false, true);
    });
}

window.addEventListener('resize', () => {
    if (historyPanel && !historyPanel.classList.contains('collapsed') && historyBackdrop) {
        historyBackdrop.classList.toggle('active', window.innerWidth <= 720);
    }
});

initHistory();

// --- Calculator Logic & Error Handling ---
let isErrorState = false;

function showError(message) {
    display.value = message;
    isErrorState = true;
    display.classList.add('has-error');
}

function clearErrorState() {
    if (isErrorState) {
        isErrorState = false;
        display.classList.remove('has-error');
        display.value = '0';
    }
}

function hasDivisionByZero(expr) {
    // Extract each divisor number segment following /
    const matches = expr.match(/\/\s*([0-9.]+)/g);
    if (!matches) return false;
    for (const m of matches) {
        const numPart = m.replace(/[\/\s]/g, '');
        if (numPart.length > 0 && Number(numPart) === 0) {
            return true;
        }
    }
    return false;
}

function formatResult(val) {
    if (!Number.isFinite(val)) return 'Error';
    // Round to avoid floating point precision artifacts (e.g. 0.1 + 0.2 = 0.3)
    const rounded = parseFloat(val.toPrecision(12));
    return String(rounded);
}

function addValue(val) {
    // Automatically clear error message on next key press
    if (isErrorState) {
        isErrorState = false;
        display.classList.remove('has-error');
        if (val === '.') {
            display.value = '0.';
        } else if ('+-*/^'.includes(val)) {
            display.value = '0' + val;
        } else {
            display.value = val;
        }
        display.scrollLeft = display.scrollWidth;
        return;
    }

    if (display.value === '0') {
        if (val === '.') {
            display.value = '0.';
        } else if ('+-*/^'.includes(val)) {
            display.value = '0' + val;
        } else {
            display.value = val;
        }
    } else {
        // Prevent duplicate decimal points in the current active number segment
        if (val === '.') {
            const parts = display.value.split(/[+\-*/^]/);
            const currentPart = parts[parts.length - 1];
            if (currentPart.includes('.')) {
                return;
            }
        }
        // If an operator is pressed immediately after another operator, update it
        if ('+*/^'.includes(val) && /[+\-*/^]$/.test(display.value)) {
            display.value = display.value.slice(0, -1) + val;
            return;
        }
        display.value += val;
    }

    display.scrollLeft = display.scrollWidth;
}

function clearDisplay() {
    isErrorState = false;
    display.classList.remove('has-error');
    display.value = '0';
}

function backspace() {
    // Automatically clear error state on backspace
    if (isErrorState) {
        clearDisplay();
        return;
    }

    if (display.value.length <= 1) {
        display.value = '0';
    } else {
        display.value = display.value.slice(0, -1);
    }
}

function calculate(recordHistory = true) {
    if (isErrorState) return;

    const rawExpression = display.value;

    // Check if an actual computation is pending
    if (!hasCalculableOperation(rawExpression)) {
        return;
    }

    try {
        let expression = rawExpression
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-');

        // Validate expression contains only safe characters
        if (!/^[0-9+\-*/.^() ]+$/.test(expression)) {
            showError('Invalid format');
            return;
        }

        // Check for division by zero before evaluation
        if (hasDivisionByZero(expression)) {
            showError('Cannot divide by 0');
            return;
        }

        // Process exponentiation ^ into JS **
        // Safely wrap exponent operands that have signs: ^(-3)
        expression = expression.replace(/\^([+-]?\d*\.?\d+)/g, '**($1)');

        // Disambiguate leading unary negative base for JS **: e.g. -2**(3) -> (-2)**(3)
        if (/^-\d*\.?\d+\*\*/.test(expression)) {
            expression = expression.replace(/^(-?\d*\.?\d+)(\*\*.*)/, '($1)$2');
        }

        // Replace any remaining ^ with **
        expression = expression.replace(/\^/g, '**');

        const result = Function(`'use strict'; return (${expression})`)();

        // Check for division by zero or mathematical limits that resulted in Infinity or NaN
        if (!Number.isFinite(result) || Number.isNaN(result)) {
            if (rawExpression.includes('/') || rawExpression.includes('÷')) {
                showError('Cannot divide by 0');
            } else {
                showError('Calculation error');
            }
            return;
        }

        const formattedResult = formatResult(result);
        display.value = formattedResult;

        if (recordHistory) {
            const formattedExpr = formatExpressionForHistory(rawExpression);
            addHistoryRecord(formattedExpr, formattedResult);
        }
    } catch (e) {
        showError('Invalid format');
    }
}

// Scientific Operation: Percentage (%)
function percentage() {
    if (isErrorState) {
        clearDisplay();
        return;
    }

    try {
        calculate(false);
        if (isErrorState) return;

        const current = parseFloat(display.value);
        if (Number.isFinite(current)) {
            const result = formatResult(current / 100);
            display.value = result;
            addHistoryRecord(`${current}%`, result);
        } else {
            showError('Invalid format');
        }
    } catch (e) {
        showError('Invalid format');
    }
}

// Scientific Operation: Sign Toggle (+/-)
function toggleSign() {
    if (isErrorState) {
        clearDisplay();
        return;
    }
    if (display.value === '0') return;

    // Single number currently in display
    if (/^-?\d*\.?\d+$/.test(display.value)) {
        display.value = display.value.startsWith('-')
            ? display.value.slice(1)
            : '-' + display.value;
        return;
    }

    // Trailing operator present (e.g. "5 + ") - do not toggle
    if (/[+\-*/^]\s*$/.test(display.value)) {
        return;
    }

    // Expression with trailing operand: invert the last operand
    const match = display.value.match(/([+\-*/^])\s*(-?\d*\.?\d+)$/);
    if (match) {
        const fullMatch = match[0];
        const op = match[1];
        const numStr = match[2];
        const prefix = display.value.slice(0, display.value.length - fullMatch.length);

        const inverted = numStr.startsWith('-') ? numStr.slice(1) : '-' + numStr;
        display.value = prefix + op + inverted;
        return;
    }

    // Fallback: evaluate and toggle
    calculate(false);
    if (!isErrorState && display.value !== '0') {
        display.value = display.value.startsWith('-')
            ? display.value.slice(1)
            : '-' + display.value;
    }
}

// Scientific Operation: Square Root (√)
function squareRoot() {
    if (isErrorState) {
        clearDisplay();
        return;
    }

    try {
        calculate(false);
        if (isErrorState) return;

        const current = parseFloat(display.value);
        if (current < 0) {
            showError('Cannot root negative');
            return;
        }
        if (!Number.isFinite(current)) {
            showError('Invalid format');
            return;
        }
        const result = formatResult(Math.sqrt(current));
        display.value = result;
        addHistoryRecord(`√${current}`, result);
    } catch (e) {
        showError('Invalid format');
    }
}

// Scientific Operation: Square (x²)
function square() {
    if (isErrorState) {
        clearDisplay();
        return;
    }

    try {
        calculate(false);
        if (isErrorState) return;

        const current = parseFloat(display.value);
        if (!Number.isFinite(current)) {
            showError('Invalid format');
            return;
        }
        const resultVal = current ** 2;
        if (!Number.isFinite(resultVal)) {
            showError('Number too large');
            return;
        }
        const result = formatResult(resultVal);
        display.value = result;
        addHistoryRecord(`${current}²`, result);
    } catch (e) {
        showError('Invalid format');
    }
}

// --- Keyboard Support ---
document.addEventListener("keydown", function (event) {
    // If an interactive button has focus, allow Space/Enter for normal button triggering
    if (document.activeElement && ['BUTTON', 'A'].includes(document.activeElement.tagName)) {
        if (event.key === "Enter" || event.key === " ") {
            return;
        }
    }

    // Escape closes history drawer if open on mobile or clears display
    if (event.key === "Escape") {
        if (historyPanel && !historyPanel.classList.contains('collapsed') && window.innerWidth <= 720) {
            setHistoryPanelState(false, true);
            return;
        }
        clearDisplay();
        return;
    }

    // Shortcut: 'h' toggles calculation history
    if (event.key.toLowerCase() === "h" && !event.ctrlKey && !event.metaKey && !event.altKey) {
        toggleHistoryPanel();
        return;
    }

    const key = event.key;

    if ("0123456789+-*/.^".includes(key)) {
        addValue(key);
    } else if (key === "%") {
        event.preventDefault();
        percentage();
    } else if (key === "Enter" || key === "=") {
        event.preventDefault();
        calculate();
    } else if (key === "Backspace") {
        backspace();
    } else if (isErrorState && key.length === 1) {
        // Any character typed while in error state clears the error
        clearDisplay();
    }
});