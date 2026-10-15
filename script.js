const display = document.getElementById('display');
const themeToggle = document.getElementById('theme-toggle');

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

// --- Calculator Logic ---
function addValue(val) {
    if (display.value === '0' && val !== '.') {
        display.value = val;
    } else {
        display.value += val;
    }
}

function clearDisplay() {
    display.value = '0';
}

function calculate() {
    try {
        // Replace visual symbols if needed and safely calculate
        const expression = display.value
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-');

        // Validate expression contains only safe characters
        if (/^[0-9+\-*/. ]+$/.test(expression)) {
            const result = Function(`'use strict'; return (${expression})`)();
            display.value = Number.isFinite(result) ? result : 'Error';
        } else {
            display.value = 'Error';
        }
    } catch (e) {
        display.value = 'Error';
    }
}

document.addEventListener("keydown", function (event) {
    // If the theme toggle is focused, let Enter/Space activate the toggle
    if (document.activeElement === themeToggle && (event.key === "Enter" || event.key === " ")) {
        return;
    }

    const key = event.key;

    if ("0123456789+-*/.".includes(key)) {
        addValue(key);
    } else if (key === "Enter" || key === "=") {
        event.preventDefault();
        calculate();
    } else if (key === "Escape") {
        clearDisplay();
    } else if (key === "Backspace") {
        display.value = display.value.slice(0, -1) || "0";
    }
});