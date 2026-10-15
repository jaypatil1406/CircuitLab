
export async function loadLabData() {
  try {
    const response = await fetch("data/levels.json");
    if (!response.ok) {
      throw new Error("The lesson data could not be loaded.");
    }
    return await response.json();
  } catch (error) {
    throw new Error("Could not load data/levels.json. Run this project with Live Server.");
  }
}
