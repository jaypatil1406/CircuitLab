
export function showQuestion(question, elements, levelNumber) {
  elements.legend.textContent = question.text;
  elements.options.replaceChildren();
  elements.feedback.hidden = true;
  elements.submit.disabled = true;
  elements.submit.hidden = false;
  elements.next.hidden = true;
  elements.report.hidden = true;
  elements.fieldset.disabled = false;
  elements.levelLabel.textContent = `LEVEL ${levelNumber} COMPLETE`;
  elements.count.textContent = `Question ${levelNumber} of 3`;
  elements.hint.textContent =
    question.type === "multiple"
      ? "Select all the answers you think are right, then press Submit."
      : "Choose one answer, then press Submit.";

  question.options.forEach((option, index) => {
    const label = document.createElement("label");
    label.className = "answer-option";
    const input = document.createElement("input");
    input.type = question.type === "multiple" ? "checkbox" : "radio";
    input.name = "answer";
    input.value = index;
    input.addEventListener("change", () => {
      label.classList.toggle("selected", input.checked);
      elements.submit.disabled =
        !elements.options.querySelector("input:checked");
    });
    label.append(input, document.createTextNode(option));
    elements.options.append(label);
  });
}

export function scoreQuestion(question, selectedIndexes) {
  const correct = [...question.correct].sort((a, b) => a - b);
  const selected = [...selectedIndexes].sort((a, b) => a - b);
  return (
    correct.length === selected.length &&
    correct.every((value, index) => value === selected[index])
  );
}

export function showQuestionResult(
  question,
  selectedIndexes,
  elements,
  isLastLevel,
) {
  const isCorrect = scoreQuestion(question, selectedIndexes);
  const correctSet = new Set(question.correct);
  const selectedSet = new Set(selectedIndexes);

  [...elements.options.querySelectorAll(".answer-option")].forEach(
    (label, index) => {
      label.classList.remove("selected");
      if (selectedSet.has(index) && correctSet.has(index))
        label.classList.add("correct");
      else if (selectedSet.has(index) && !correctSet.has(index))
        label.classList.add("wrong");
      else if (!selectedSet.has(index) && correctSet.has(index))
        label.classList.add("missed");
    },
  );

  elements.fieldset.disabled = true;
  elements.submit.hidden = true;
  elements.feedback.hidden = false;
  elements.feedback.className = `feedback ${isCorrect ? "success" : "warning"}`;
  elements.feedback.textContent = `${isCorrect ? "Correct!" : "Not quite."} ${question.explanation}`;
  elements.next.hidden = isLastLevel;
  elements.report.hidden = !isLastLevel;
  return isCorrect;
}
