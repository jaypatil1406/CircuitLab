export class Level {
  constructor(levelData) {
    this.data = levelData;
  }

  get isComplete() {
    return this.data.slots.every((slot) => this.placedParts.has(slot.id));
  }

  placedParts = new Map();
}

export class Circuit {
  constructor(boardElement) {
    this.board = boardElement;
  }

  setCurrent(isOn) {
    this.board.classList.toggle("current-on", isOn);
    this.board.classList.toggle("has-parts", isOn);
  }

  showBulb(isOn) {
    const bulb = this.board.querySelector('[data-part="bulb"]');
    if (bulb) bulb.classList.toggle("is-glowing", isOn);
  }
}

export function drawPalette(level, allParts, paletteElement, onStartDrag) {
  paletteElement.replaceChildren();

  level.data.palette.forEach((partKey) => {
    const part = allParts[partKey];
    const row = document.createElement("button");
    row.type = "button";
    row.className = "palette-item";
    row.dataset.part = partKey;
    row.innerHTML = `<img src="${part.icon}" alt=""><span>${part.label}<small data-state>Available</small></span>`;
    row.addEventListener("mousedown", (event) =>
      onStartDrag(event, partKey, row),
    );
    paletteElement.append(row);
  });
}

export function drawSlots(level, slotLayer) {
  slotLayer.replaceChildren();
  level.data.slots.forEach((slot) => {
    const element = document.createElement("div");
    element.className = "slot";
    element.dataset.slot = slot.id;
    element.style.left = `${slot.x}%`;
    element.style.top = `${slot.y}%`;
    element.textContent = slot.label;
    element.setAttribute("aria-label", slot.label);
    slotLayer.append(element);
  });
}

export function drawFixedParts(level, allParts, placedLayer) {
  (level.data.fixedParts || []).forEach((fixed) => {
    addPartCard(fixed.part, fixed.x, fixed.y, allParts, placedLayer, true);
  });
}

export function addPartCard(
  partKey,
  x,
  y,
  allParts,
  placedLayer,
  isFixed = false,
  onRemove = null,
) {
  const part = allParts[partKey];
  const card = document.createElement("div");
  card.className = `part-card${isFixed ? " is-fixed" : ""}`;
  card.dataset.part = partKey;
  card.style.left = `${x}%`;
  card.style.top = `${y}%`;
  card.innerHTML = `<img src="${part.icon}" alt=""><span>${part.label}</span>`;
  if (!isFixed && onRemove) {
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-part";
    removeButton.textContent = "×";
    removeButton.setAttribute("aria-label", `Remove ${part.label}`);
    removeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      onRemove();
    });
    card.append(removeButton);
  }
  placedLayer.append(card);
  return card;
}
