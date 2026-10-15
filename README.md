# CircuitLab — Simple Circuit Simulation

A vanilla HTML, CSS and JavaScript learning project based on the supplied GET Assessment B requirements.

## Run the project
1. Open this folder in Visual Studio Code.
2. Install or enable the Live Server extension.
3. Right-click `index.html` and choose **Open with Live Server**.
4. Do not double-click `index.html`; the app loads `data/levels.json` using `fetch()`.

## Project structure
- `index.html` — semantic page structure, intro dialog, lab, quiz and report.
- `css/base.css` — theme, layout, buttons, forms and responsive styling.
- `css/board.css` — circuit board, slots, parts and animations.
- `js/main.js` — app state and user interactions.
- `js/dataLoader.js` — loads JSON and handles load errors.
- `js/board.js` — `Level`, `Circuit` and board rendering helpers.
- `js/simulation.js` — circuit checking and conductor classification.
- `js/quiz.js` — single- and multiple-answer questions.
- `js/report.js` — results table and score.
- `data/levels.json` — app copy, parts, slots, levels and quiz questions.
- `assets/` — simple SVG component illustrations.

## Important interactions
- Drag parts from the palette with the mouse and drop them into slots.
- Use the × button to remove placed parts.
- Test Circuit checks the parts against the expected JSON slot values.
- Level 2 adds a switch that turns current and the bulb on and off.
- Level 3 lets learners test five materials and records conductors and insulators.
- Each level ends with a knowledge check; the final screen shows the lab report.

## Testing checklist
- Start dialog opens and Help reopens it.
- Test Circuit is disabled until all required build slots are filled.
- Wrong slot gives an error message; correct placement lights the bulb.
- Level 2 switch toggles current and bulb state.
- Level 3 material progress reaches 5 of 5.
- Quiz controls remain disabled until an answer is chosen.
- Report shows attempts, quiz results and material classifications.
- Check at 1366 px and 1024 px widths.

## Notes
This is a front-end learning simulation. Results are held in memory and are reset when Restart lab is clicked. The board uses simple SVG paths and component SVG icons.
