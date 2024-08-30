document.addEventListener("DOMContentLoaded", initializeApp);

function initializeApp() {
  addEventListeners();
  displayPairsByCategory(getStoredPairs());
}

function getStoredPairs() {
  return JSON.parse(localStorage.getItem("tournamentData")) || [];
}

function addEventListeners() {
  document
    .getElementById("tournament-form")
    .addEventListener("submit", addPair);
  document
    .getElementById("delete-all-btn")
    .addEventListener("click", deleteAllData);
  document
    .getElementById("open-popup-btn")
    .addEventListener("click", openPopup);
  document.querySelector(".close-btn").addEventListener("click", closePopup);
  window.addEventListener("click", outsideClick);
}

function addPair(event) {
  event.preventDefault();
  const newPair = getPairFromForm();
  const pairs = [...getStoredPairs(), newPair];
  localStorage.setItem("tournamentData", JSON.stringify(pairs));
  displayPairsByCategory(pairs);
  resetPairInputs();
  animateAddButton();
}

function getPairFromForm() {
  return {
    id: generateUniqueId(),
    player1: document.getElementById("player1").value,
    player2: document.getElementById("player2").value,
    category: document.getElementById("category").value,
    sex: document.getElementById("sex").value,
  };
}

function generateUniqueId() {
  return "_" + Math.random().toString(36).substr(2, 9);
}

function resetPairInputs() {
  ["player1", "player2"].forEach(
    (id) => (document.getElementById(id).value = ""),
  );
}

function animateAddButton() {
  const addButton = document.querySelector(
    '#tournament-form button[type="submit"]',
  );
  addButton.textContent = "Pareja añadida";
  addButton.style.backgroundColor = "#45a049";
  addButton.disabled = true;
  setTimeout(() => {
    addButton.textContent = "Agregar Pareja";
    addButton.style.backgroundColor = "#ff5100bb";
    addButton.disabled = false;
  }, 500);
}

function deleteAllData() {
  if (confirm("¿Estás seguro de que deseas borrar todas las parejas?")) {
    localStorage.removeItem("tournamentData");
    document.getElementById("tournament-body").innerHTML = "";
  }
}

function displayPairsByCategory(pairs) {
  const tournamentBody = document.getElementById("tournament-body");
  tournamentBody.innerHTML = "";
  const pairsByCategoryAndSex = groupPairsByCategoryAndSex(pairs);
  const categoryStatesInscriptions =
    JSON.parse(localStorage.getItem("categoryStatesInscriptions")) || {};

  Object.entries(pairsByCategoryAndSex).forEach(([key, categoryPairs]) => {
    createCategoryRow(
      tournamentBody,
      key,
      categoryPairs.length,
      categoryStatesInscriptions[key],
    );
    categoryPairs.forEach((pair) =>
      createPairRow(tournamentBody, pair, key, categoryStatesInscriptions[key]),
    );
  });

  document.querySelectorAll(".category-header").forEach((category) => {
    const key = category.textContent.split(" (")[0];
    category.addEventListener("click", () => toggleCategoryPairs(key));
  });
}

function groupPairsByCategoryAndSex(pairs) {
  return pairs.reduce((acc, pair) => {
    const key = `${pair.category}-${pair.sex}`;
    acc[key] = acc[key] || [];
    acc[key].push(pair);
    return acc;
  }, {});
}

function createCategoryRow(tournamentBody, key, count, isCollapsed) {
  const categoryRow = document.createElement("tr");
  categoryRow.classList.add("category-header");
  if (isCollapsed) categoryRow.classList.add("collapsed");

  const categoryCell = document.createElement("td");
  categoryCell.colSpan = 4; // Ajusta el colSpan según lo necesario
  categoryCell.textContent = `${key} (${count})`; // Incluye el contador de parejas

  categoryRow.appendChild(categoryCell);
  tournamentBody.appendChild(categoryRow);
}

function createPairRow(tournamentBody, pair, key, isCollapsed) {
  const row = document.createElement("tr");
  row.classList.add(`${key}-pairs`);
  if (isCollapsed) row.classList.add("hidden-row");

  row.innerHTML = `
        <td class="overflow-cell">${pair.player1} - ${pair.player2}</td>
        <td>${pair.category}</td>
        <td>${pair.sex}</td>
        <td><button class="delete-button" onclick="deletePair('${pair.id}')"><i class="fas fa-trash"></i>Borrar</button></td>
    `;
  tournamentBody.appendChild(row);
}

function toggleCategoryPairs(categoryKey) {
  const pairsRows = document.querySelectorAll(`.${categoryKey}-pairs`);
  const isHidden = pairsRows[0].classList.contains("hidden-row");

  pairsRows.forEach((row) => row.classList.toggle("hidden-row"));

  const categoryStatesInscriptions =
    JSON.parse(localStorage.getItem("categoryStatesInscriptions")) || {};
  categoryStatesInscriptions[categoryKey] = !isHidden;
  localStorage.setItem(
    "categoryStatesInscriptions",
    JSON.stringify(categoryStatesInscriptions),
  );
}

function deletePair(pairId) {
  if (confirm(`¿Estás seguro de que deseas eliminar esta pareja?`)) {
    const pairs = getStoredPairs().filter((pair) => pair.id !== pairId);
    localStorage.setItem("tournamentData", JSON.stringify(pairs));
    displayPairsByCategory(pairs);
  }
}

function openPopup() {
  document.getElementById("popup-form").style.display = "block";
}

function closePopup() {
  document.getElementById("popup-form").style.display = "none";
  resetPopupInputs();
}

function outsideClick(event) {
  if (event.target == document.getElementById("popup-form")) {
    closePopup();
    resetPopupInputs();
  }
}

function resetPopupInputs() {
  ["player1", "player2", "category", "sex"].forEach(
    (id) => (document.getElementById(id).value = ""),
  );
}
