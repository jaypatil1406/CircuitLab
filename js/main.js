import { loadLabData } from "./dataLoader.js";
import {
  Level,
  Circuit,
  drawPalette,
  drawSlots,
  drawFixedParts,
  addPartCard,
} from "./board.js";
import { checkCircuit, classifyMaterial } from "./simulation.js";
import { showQuestion, showQuestionResult } from "./quiz.js";
import { renderReport } from "./report.js";

const get = (id) => document.getElementById(id);

const ui = {
  error: get("error-box"),
  main: get("app-main"),
  lab: get("lab-view"),
  quizView: get("quiz-view"),
  reportView: get("report-view"),
  levelNav: get("level-nav"),
  title: get("level-title"),
  kicker: get("level-kicker"),
  taskTitle: get("task-title"),
  goal: get("task-goal"),
  palette: get("palette-list"),
  board: get("board"),
  slots: get("slot-layer"),
  placed: get("placed-layer"),
  feedback: get("feedback"),
  buildStatus: get("build-status"),
  progress: get("level-progress"),
  test: get("test-button"),
  switch: get("switch-button"),
  quiz: get("quiz-button"),
  reset: get("reset-level-button"),
  tries: get("header-tries"),
  materialWrap: get("material-progress-wrap"),
  materialProgress: get("material-progress"),
  materialLabel: get("material-progress-label"),
  conductors: get("conductors-list"),
  insulators: get("insulators-list"),
  dialog: get("intro-dialog"),
  start: get("start-button"),
  help: get("help-button"),
  quizForm: get("quiz-form"),
  question: get("question-text"),
  options: get("question-options"),
  quizSubmit: get("quiz-submit"),
  quizFeedback: get("quiz-feedback"),
  quizHint: get("quiz-hint"),
  quizLevel: get("quiz-level-label"),
  quizCount: get("quiz-count"),
  fieldset: get("quiz-fieldset"),
  next: get("next-level-button"),
  reportButton: get("report-button"),
  restart: get("restart-button"),
};

let labData;
let currentLevel;
let levelIndex = 0;
let circuit;
let tries = 0;
let switchHasBeenOn = false;
let switchIsOn = false;
let testedMaterials = new Set();
let conductorsFound = [];
let insulatorsFound = [];
let results = [];
let dragState = null;
let activeQuestion = null;

const reportElements = {
  body: get("report-body"),
  score: get("total-score"),
  pass: get("pass-label"),
  conductors: get("report-conductors"),
  insulators: get("report-insulators"),
};

startApp();

async function startApp() {
  try {
    labData = await loadLabData();
    document.querySelector("[data-app-title]").textContent = labData.app.title;
    circuit = new Circuit(ui.board);
    buildLevelNavigation();
    openLevel(0);
    ui.dialog.showModal();
    ui.start.addEventListener("click", () => ui.dialog.close());
    ui.help.addEventListener("click", () => ui.dialog.showModal());
    ui.test.addEventListener("click", testCurrentCircuit);
    ui.switch.addEventListener("click", toggleSwitch);
    ui.quiz.addEventListener("click", openKnowledgeCheck);
    ui.reset.addEventListener("click", () => openLevel(levelIndex));
    ui.quizForm.addEventListener("submit", submitKnowledgeCheck);
    ui.next.addEventListener("click", () => openLevel(levelIndex + 1));
    ui.reportButton.addEventListener("click", showLabReport);
    ui.restart.addEventListener("click", restartLab);
    document.addEventListener("mouseup", finishDrag);
    document.addEventListener("mousemove", moveDraggedPart);
    document.addEventListener("mouseleave", cancelDrag);
  } catch (error) {
    ui.error.hidden = false;
    ui.error.textContent = error.message;
  }
}

function buildLevelNavigation() {
  ui.levelNav.replaceChildren();
  labData.levels.forEach((level, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `Level ${level.id}`;
    button.disabled = index > 0;
    button.addEventListener("click", () => {
      if (index <= levelIndex) openLevel(index);
    });
    item.append(button);
    ui.levelNav.append(item);
  });
}

function updateLevelNavigation() {
  [...ui.levelNav.querySelectorAll("button")].forEach((button, index) => {
    button.classList.toggle("active", index === levelIndex);
    button.disabled = index > levelIndex;
  });
}

function openLevel(index) {
  levelIndex = index;
  currentLevel = new Level(labData.levels[index]);
  tries = 0;
  switchHasBeenOn = false;
  switchIsOn = false;
  testedMaterials = new Set();
  conductorsFound = [];
  insulatorsFound = [];
  activeQuestion = null;

  ui.lab.hidden = false;
  ui.quizView.hidden = true;
  ui.reportView.hidden = true;
  ui.title.textContent = currentLevel.data.title;
  ui.kicker.textContent = `LEVEL ${currentLevel.data.id}`;
  ui.taskTitle.textContent = `Level ${currentLevel.data.id} · ${currentLevel.data.title}`;
  ui.goal.textContent = currentLevel.data.goal;
  ui.feedback.className = "feedback";
  ui.feedback.textContent =
    currentLevel.data.mode === "materials"
      ? "Drop a material into the test gap to see if it conducts electricity."
      : "Drag the parts into the dotted slots, then press Test Circuit.";
  ui.buildStatus.textContent = "Place every required part to begin.";
  ui.test.hidden = currentLevel.data.mode === "materials";
  ui.switch.hidden = true;
  ui.switch.setAttribute("aria-pressed", "false");
  ui.switch.textContent = "Switch: OFF";
  ui.quiz.disabled = true;
  ui.quiz.hidden = false;
  ui.materialWrap.hidden = currentLevel.data.mode !== "materials";
  ui.materialProgress.value = 0;
  ui.materialLabel.textContent = "0 of 5 tested";
  ui.conductors.replaceChildren();
  ui.insulators.replaceChildren();
  ui.tries.textContent = "Attempts: 0";
  ui.progress.textContent =
    currentLevel.data.mode === "materials" ? "0 of 5 tested" : "";
  ui.board.classList.remove("current-on", "has-parts");
  ui.placed.replaceChildren();
  drawSlots(currentLevel, ui.slots);
  drawPalette(currentLevel, labData.parts, ui.palette, startDrag);
  if (currentLevel.data.mode === "materials") {
    drawFixedParts(currentLevel, labData.parts, ui.placed);
    ui.test.hidden = true;
    ui.quiz.disabled = true;
  }
  updateLevelNavigation();
  updateTestButton();
}

function startDrag(event, partKey, paletteRow) {
  if (event.button !== 0 || paletteRow.classList.contains("is-used")) return;
  event.preventDefault();

  const part = labData.parts[partKey];
  // Show a temporary preview under the pointer, not a real part on the board.
  const preview = document.createElement("div");
  preview.className = "drag-preview";
  preview.innerHTML = `<img src="${part.icon}" alt=""><span>${part.label}</span>`;
  document.body.append(preview);

  dragState = { partKey, paletteRow, preview, target: null };
  paletteRow.classList.add("is-dragging");
  moveDraggedPart(event);
}

function moveDraggedPart(event) {
  if (!dragState) return;

  dragState.preview.style.left = `${event.clientX + 12}px`;
  dragState.preview.style.top = `${event.clientY + 12}px`;

  const target = findSlotAt(event.clientX, event.clientY);
  ui.slots.querySelectorAll(".slot").forEach((slot) => {
    slot.classList.toggle("is-active", slot === target);
  });
  dragState.target = target;
}

function finishDrag(event) {
  if (!dragState) return;

  const state = dragState;
  const target = findSlotAt(event.clientX, event.clientY);
  state.preview.remove();
  state.paletteRow.classList.remove("is-dragging");
  ui.slots
    .querySelectorAll(".slot")
    .forEach((slot) => slot.classList.remove("is-active"));
  dragState = null;

  if (!target) return;

  const slotId = target.dataset.slot;

  if (currentLevel.data.mode === "materials") {
    const previewCard = addPartCard(
      state.partKey,
      50,
      50,
      labData.parts,
      ui.placed,
      true,
    );
    placeMaterial(state.partKey, previewCard, target);
    return;
  }

  const slotData = currentLevel.data.slots.find((slot) => slot.id === slotId);
  if (!slotData) return;

  // Return any part already in this slot to the palette.
  const oldPart = currentLevel.placedParts.get(slotId);
  if (oldPart) {
    currentLevel.placedParts.delete(slotId);
    ui.placed.querySelector(`.part-card[data-slot="${slotId}"]`)?.remove();
    setPaletteState(oldPart, "Available", false);
  }

  for (const [otherSlotId, otherPart] of currentLevel.placedParts.entries()) {
    if (otherPart === state.partKey) {
      currentLevel.placedParts.delete(otherSlotId);
      ui.placed
        .querySelector(`.part-card[data-slot="${otherSlotId}"]`)
        ?.remove();
      const oldSlot = ui.slots.querySelector(`[data-slot="${otherSlotId}"]`);
      const oldSlotData = currentLevel.data.slots.find(
        (slot) => slot.id === otherSlotId,
      );
      if (oldSlot) oldSlot.textContent = oldSlotData?.label || "Slot";
    }
  }

  currentLevel.placedParts.set(slotId, state.partKey);
  const card = addPartCard(
    state.partKey,
    slotData.x,
    slotData.y,
    labData.parts,
    ui.placed,
    false,
    () => removePlacedPart(slotId),
  );
  card.dataset.slot = slotId;
  card.classList.add("landing");
  target.textContent = "";
  setPaletteState(state.partKey, "On board", true);
  updateTestButton();
  ui.feedback.className = "feedback";
  ui.feedback.textContent =
    "Part placed. Keep going until every slot is filled.";
}

function cancelDrag(event) {
  if (!dragState) return;
  if (event.relatedTarget === null) {
    dragState.preview.remove();
    dragState.paletteRow.classList.remove("is-dragging");
    dragState = null;
    ui.slots
      .querySelectorAll(".slot")
      .forEach((slot) => slot.classList.remove("is-active"));
  }
}

function findSlotAt(clientX, clientY) {
  return (
    [...ui.slots.querySelectorAll(".slot")].find((slot) => {
      const rect = slot.getBoundingClientRect();
      return (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      );
    }) || null
  );
}

function returnPartToPalette(partKey, slotId) {
  currentLevel.placedParts.delete(slotId);
  ui.placed.querySelector(`.part-card[data-slot="${slotId}"]`)?.remove();
  const slot = ui.slots.querySelector(`[data-slot="${slotId}"]`);
  if (slot) {
    slot.classList.remove("is-wrong", "is-correct");
    slot.textContent =
      currentLevel.data.slots.find((item) => item.id === slotId)?.label ||
      "Slot";
  }
  setPaletteState(partKey, "Available", false);
  const oldCard = [...ui.placed.querySelectorAll(".part-card")].find(
    (card) =>
      card.dataset.part === partKey && !card.classList.contains("is-fixed"),
  );
  oldCard?.remove();
}

function removePlacedPart(slotId) {
  const partKey = currentLevel.placedParts.get(slotId);
  if (!partKey) return;
  currentLevel.placedParts.delete(slotId);
  const card = ui.placed.querySelector(`.part-card[data-slot="${slotId}"]`);
  card?.remove();
  const slot = ui.slots.querySelector(`[data-slot="${slotId}"]`);
  if (slot)
    slot.textContent =
      currentLevel.data.slots.find((item) => item.id === slotId)?.label ||
      "Slot";
  setPaletteState(partKey, "Available", false);
  updateTestButton();
}

function setPaletteState(partKey, stateText, isUsed) {
  const row = ui.palette.querySelector(`[data-part="${partKey}"]`);
  if (!row) return;
  row.classList.toggle("is-used", isUsed);
  row.querySelector("[data-state]").textContent = stateText;
}

function updateTestButton() {
  if (currentLevel.data.mode === "build") {
    ui.test.disabled = !currentLevel.isComplete;
    ui.progress.textContent = `${currentLevel.placedParts.size} of ${currentLevel.data.slots.length} placed`;
  }
}

function testCurrentCircuit() {
  tries += 1;
  ui.tries.textContent = `Attempts: ${results.reduce((sum, result) => sum + result.tries, 0) + tries}`;
  ui.slots
    .querySelectorAll(".slot")
    .forEach((slot) => slot.classList.remove("is-wrong", "is-correct"));
  const result = checkCircuit(currentLevel);
  if (!result.correct) {
    const slotElement = ui.slots.querySelector(
      `[data-slot="${result.slot.id}"]`,
    );
    slotElement?.classList.add("is-wrong");
    ui.feedback.className = "feedback error";
    ui.feedback.textContent = result.message;
    ui.buildStatus.textContent =
      "There is a mistake. Check the highlighted slot.";
    circuit.setCurrent(false);
    circuit.showBulb(false);
    return;
  }

  ui.slots
    .querySelectorAll(".slot")
    .forEach((slot) => slot.classList.add("is-correct"));
  ui.feedback.className = "feedback success";
  ui.feedback.textContent = result.message;
  ui.buildStatus.textContent = "Circuit parts are correct.";
  if (currentLevel.data.id === 1) {
    circuit.setCurrent(true);
    circuit.showBulb(true);
    ui.quiz.disabled = false;
  } else {
    ui.switch.hidden = false;
    ui.switch.focus();
    ui.feedback.textContent =
      "The parts are correct. Turn the switch on to start the current.";
    circuit.setCurrent(false);
    circuit.showBulb(false);
    ui.quiz.disabled = !switchHasBeenOn;
  }
}

function toggleSwitch() {
  switchIsOn = !switchIsOn;
  if (switchIsOn) switchHasBeenOn = true;
  ui.switch.setAttribute("aria-pressed", String(switchIsOn));
  ui.switch.textContent = `Switch: ${switchIsOn ? "ON" : "OFF"}`;
  circuit.setCurrent(switchIsOn);
  circuit.showBulb(switchIsOn);
  ui.quiz.disabled = !switchHasBeenOn;
  ui.feedback.className = `feedback ${switchIsOn ? "success" : ""}`;
  ui.feedback.textContent = switchIsOn
    ? "The switch is closed. Current is flowing and the bulb is glowing."
    : "The switch is open. Current stops and the bulb turns off.";
}

function placeMaterial(partKey, card, target) {
  const slotId = target.dataset.slot;
  const oldPart = currentLevel.placedParts.get(slotId);
  if (oldPart) {
    ui.placed.querySelector(`.part-card[data-part="${oldPart}"]`)?.remove();
    setPaletteState(oldPart, "Tested", true);
  }
  currentLevel.placedParts.set(slotId, partKey);
  card.remove();
  const slot = currentLevel.data.slots[0];
  const placedCard = addPartCard(
    partKey,
    slot.x,
    slot.y,
    labData.parts,
    ui.placed,
    true,
  );
  placedCard.dataset.slot = slotId;
  testedMaterials.add(partKey);
  setPaletteState(partKey, "In gap", true);
  const conducts = classifyMaterial(partKey, labData.parts);
  circuit.setCurrent(conducts);
  circuit.showBulb(conducts);
  if (conducts) {
    if (!conductorsFound.includes(partKey)) conductorsFound.push(partKey);
    ui.feedback.className = "feedback success";
    ui.feedback.textContent = `${labData.parts[partKey].label} conducts electricity, so the bulb lights.`;
  } else {
    if (!insulatorsFound.includes(partKey)) insulatorsFound.push(partKey);
    ui.feedback.className = "feedback warning";
    ui.feedback.textContent = `${labData.parts[partKey].label} is an insulator, so the bulb stays dark.`;
  }
  updateMaterialLists();
  if (testedMaterials.size === currentLevel.data.palette.length) {
    ui.quiz.disabled = false;
    ui.feedback.textContent +=
      " You tested all five materials. You can take the knowledge check.";
  }
}

function updateMaterialLists() {
  ui.conductors.replaceChildren();
  ui.insulators.replaceChildren();
  conductorsFound.forEach((key) =>
    addTextItem(ui.conductors, labData.parts[key].label),
  );
  insulatorsFound.forEach((key) =>
    addTextItem(ui.insulators, labData.parts[key].label),
  );
  ui.materialProgress.value = testedMaterials.size;
  ui.materialLabel.textContent = `${testedMaterials.size} of ${currentLevel.data.palette.length} tested`;
  ui.progress.textContent = `${testedMaterials.size} of ${currentLevel.data.palette.length} tested`;
}

function addTextItem(list, text) {
  const item = document.createElement("li");
  item.textContent = text;
  list.append(item);
}

function openKnowledgeCheck() {
  if (ui.quiz.disabled) return;
  activeQuestion = currentLevel.data.question;
  ui.lab.hidden = true;
  ui.quizView.hidden = false;
  const elements = {
    legend: ui.question,
    options: ui.options,
    feedback: ui.quizFeedback,
    submit: ui.quizSubmit,
    next: ui.next,
    report: ui.reportButton,
    fieldset: ui.fieldset,
    levelLabel: ui.quizLevel,
    count: ui.quizCount,
    hint: ui.quizHint,
  };
  showQuestion(activeQuestion, elements, currentLevel.data.id);
}

function submitKnowledgeCheck(event) {
  event.preventDefault();
  if (!activeQuestion) return;
  const selectedIndexes = [...ui.options.querySelectorAll("input:checked")].map(
    (input) => Number(input.value),
  );
  const correct = showQuestionResult(
    activeQuestion,
    selectedIndexes,
    {
      options: ui.options,
      fieldset: ui.fieldset,
      submit: ui.quizSubmit,
      feedback: ui.quizFeedback,
      next: ui.next,
      report: ui.reportButton,
    },
    levelIndex === labData.levels.length - 1,
  );

  results = results.filter((result) => result.levelId !== currentLevel.data.id);
  results.push({
    levelId: currentLevel.data.id,
    title: currentLevel.data.title,
    tries,
    quizCorrect: correct,
    conductors: [...conductorsFound],
    insulators: [...insulatorsFound],
  });
  window.dispatchEvent(
    new CustomEvent("levelComplete", {
      detail: { levelId: currentLevel.data.id, correct },
    }),
  );
}

function showLabReport() {
  ui.quizView.hidden = true;
  ui.reportView.hidden = false;
  renderReport(results, labData.parts, reportElements, labData.app.passPercent);
}

function restartLab() {
  results = [];
  levelIndex = 0;
  openLevel(0);
  ui.dialog.showModal();
}
