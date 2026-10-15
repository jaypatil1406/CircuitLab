
export function renderReport(results, parts, elements, passPercent) {
  elements.body.replaceChildren();
  const rows = results.map((result) => ({
    level: result.title,
    tries: result.tries,
    quiz: result.quizCorrect ? "Correct" : "Not correct"
  }));

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    [row.level, row.tries, row.quiz].forEach((value) => {
      const td = document.createElement("td");
      td.textContent = value;
      tr.append(td);
    });
    elements.body.append(tr);
  });

  const correctCount = results.filter((result) => result.quizCorrect).length;
  const percentage = Math.round((correctCount / results.length) * 100);
  elements.score.textContent = `${percentage}%`;
  elements.pass.textContent = percentage >= passPercent ? "Passed" : "Not passed";

  const namesFor = (keys) => keys.map((key) => parts[key]?.label || key);
  elements.conductors.replaceChildren();
  elements.insulators.replaceChildren();
  namesFor(results.flatMap((result) => result.conductors)).forEach((name) => addListItem(elements.conductors, name));
  namesFor(results.flatMap((result) => result.insulators)).forEach((name) => addListItem(elements.insulators, name));
}

function addListItem(list, text) {
  const item = document.createElement("li");
  item.textContent = text;
  list.append(item);
}
