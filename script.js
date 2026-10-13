const display = document.getElementById('display');

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
