document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});

function initializeApp() {
  addEventListeners();
  const pairs = getStoredPairs();
  displayPairsByCategory(pairs);
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
}

function addPair(event) {
  event.preventDefault();

  const newPair = getPairFromForm();
  const pairs = getStoredPairs();

  pairs.push(newPair);
  localStorage.setItem("tournamentData", JSON.stringify(pairs));

  displayPairsByCategory(pairs);
  resetPairInputs();
  animateAddButton();
}

function getPairFromForm() {
  return {
    player1: document.getElementById("player1").value,
    player2: document.getElementById("player2").value,
    category: document.getElementById("category").value,
    sex: document.getElementById("sex").value,
  };
}

function resetPairInputs() {
  document.getElementById("player1").value = "";
  document.getElementById("player2").value = "";
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
  }, 700); // Cambia de vuelta a "Agregar Pareja" después de 0.7 segundo
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

  Object.keys(pairsByCategoryAndSex).forEach((key) => {
    createCategoryRow(tournamentBody, key, categoryStatesInscriptions[key]);
    pairsByCategoryAndSex[key].forEach((pair) =>
      createPairRow(tournamentBody, pair, key, categoryStatesInscriptions[key]),
    );
  });

  document.querySelectorAll(".category-header").forEach((category) => {
    const key = category.textContent;
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

function createCategoryRow(tournamentBody, key, isCollapsed) {
  const categoryRow = document.createElement("tr");
  categoryRow.classList.add("category-header");

  const categoryCell = document.createElement("td");
  categoryCell.colSpan = 4;
  categoryCell.textContent = key;

  categoryRow.appendChild(categoryCell);
  tournamentBody.appendChild(categoryRow);

  if (isCollapsed) {
    categoryRow.classList.add("collapsed");
  }
}

function createPairRow(tournamentBody, pair, key, isCollapsed) {
  const row = document.createElement("tr");
  row.classList.add(`${key}-pairs`);
  if (isCollapsed) {
    row.classList.add("hidden-row");
  }
  row.innerHTML = `
        <td class="overflow-cell">${pair.player1} - ${pair.player2}</td>
        <td>${pair.category}</td>
        <td>${pair.sex}</td>
        <td><button class="delete-button" onclick="deletePair('${pair.player1}', '${pair.player2}')"><i class="fas fa-trash"></i>Eliminar</button></td>
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

function deletePair(player1, player2) {
  if (
    confirm(
      `¿Estás seguro de que deseas eliminar la pareja ${player1} - ${player2}?`,
    )
  ) {
    const pairs = getStoredPairs();

    // Encuentra la pareja exacta que se desea eliminar
    const pairIndex = pairs.findIndex(
      (pair) => pair.player1 === player1 && pair.player2 === player2,
    );

    if (pairIndex !== -1) {
      pairs.splice(pairIndex, 1); // Elimina la pareja del arreglo
      localStorage.setItem("tournamentData", JSON.stringify(pairs)); // Actualiza el almacenamiento local
      displayPairsByCategory(pairs); // Vuelve a mostrar las parejas actualizadas
    } else {
      alert(`No se encontró la pareja ${player1} - ${player2}.`);
    }
  }
}
