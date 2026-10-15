
export function checkCircuit(level) {
  for (const slot of level.data.slots) {
    const placedPart = level.placedParts.get(slot.id);
    if (placedPart !== slot.accepts) {
      return { correct: false, slot, message: slot.errorMsg };
    }
  }
  return { correct: true, message: level.data.successMsg };
}

export function classifyMaterial(partKey, parts) {
  return parts[partKey]?.conductor === true;
}
