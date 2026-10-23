# My Calculator

A simple calculator built using HTML, CSS and JavaScript.

## Features

- Basic Arithmetic: Addition, Subtraction, Multiplication, Division
- Scientific Operations:
  - Percentage (%): Converts display value into a decimal percentage
  - Sign Toggle (± / +/-): Inverts current input between positive & negative
  - Square Root (√): Computes square root of current display value
  - Exponentiation (x² and xʸ / ^): Allows quick square or custom power calculations
- Decimal point support and input validation (prevents duplicate operators and invalid decimals)
- Comprehensive Error Handling:
  - Prevents mathematical crashes such as division by zero (e.g. `10 / 0` displays `"Cannot divide by 0"`)
  - Displays user-friendly messages instead of `Infinity` or `NaN`
  - Automatically clears error messages upon the next key press
  - Handles invalid square roots (e.g. negative numbers) and malformed expressions gracefully
- Clear (AC) and Backspace (⌫) display controls
- Light / Dark Mode theme switcher (persisted with localStorage and system preference detection)
- Interactive Calculation History Log Panel:
  - Dedicated Sidebar / Collapsible Section: Records completed operations (e.g. `15 × 4 = 60`) with timestamps and count badge
  - Re-use Previous Results: Clicking any calculation entry immediately reloads its result back into the main calculator display with visual glow feedback
  - Clear History Option: Dedicated button to wipe stored past calculations from memory and storage
  - Keyboard & Responsive Support: Toggle history with `H` key or header button, full keyboard navigation, and drawer overlay on mobile devices

## Technologies Used

- HTML
- CSS
- JavaScript

## How to Run

Open the index.html file in a web browser.
