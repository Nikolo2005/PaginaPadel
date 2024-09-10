document.addEventListener("DOMContentLoaded", initializeApp);

function initializeApp() {
  addEventListeners();
  displayPairsByCategory(getStoredPairs());
}

function getStoredPairs() {
  try {
    return JSON.parse(localStorage.getItem("tournamentData")) || [];
  } catch (e) {
    console.error("Error parsing tournament data from localStorage", e);
    return [];
  }
}

function addEventListeners() {
  const tournamentForm = document.getElementById("tournament-form");
  const deleteAllBtn = document.getElementById("delete-all-btn");
  const openPopupBtn = document.getElementById("open-popup-btn");
  const closeBtns = document.querySelectorAll(".close-btn");

  if (tournamentForm) {
    tournamentForm.addEventListener("submit", addPair);
  } else {
    console.error("Elemento con id 'tournament-form' no encontrado.");
  }

  if (deleteAllBtn) {
    deleteAllBtn.addEventListener("click", deleteAllData);
  } else {
    console.error("Elemento con id 'delete-all-btn' no encontrado.");
  }

  if (openPopupBtn) {
    openPopupBtn.addEventListener("click", openPopup);
  } else {
    console.error("Elemento con id 'open-popup-btn' no encontrado.");
  }

  closeBtns.forEach((btn) => btn.addEventListener("click", closePopup));

  window.addEventListener("click", outsideClick);
}

function addPair(event) {
  event.preventDefault();
  const newPair = getPairFromForm();

  if (
    !newPair.player1 ||
    !newPair.player2 ||
    !newPair.category ||
    !newPair.sex
  ) {
    alert("Todos los campos son obligatorios.");
    return;
  }

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
    addButton.textContent = "Guardar";
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
        <td class="overflow-cell">
            <span class="player1-text">${pair.player1}</span>
            <input class="player1-input" type="text" value="${pair.player1}" style="display:none;">
            -
            <span class="player2-text">${pair.player2}</span>
            <input class="player2-input" type="text" value="${pair.player2}" style="display:none;">
        </td>
        <td>${pair.category}</td>
        <td>${pair.sex}</td>
        <td>
          <div class="action-container">
            <button class="edit-button" onclick="editPair('${pair.id}', this)"><img class="img-edit-pair-btn" src="assets/img/edit.svg" /></button>
            <button class="save-button" onclick="savePair('${pair.id}', this)" style="display:none;"><img class="img-save-pair-btn" src="assets/img/save.png" /></button>
            <button class="delete-button" onclick="deletePair('${pair.id}')"><img class="img-del-pair-btn" src="assets/img/dustbin_120823.svg" /></button>
          </div>
        </td>
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

function editPair(pairId, editButton) {
  // Desactivar cualquier otro botón de guardar activo
  document.querySelectorAll(".save-button").forEach((button) => {
    if (button !== editButton.nextElementSibling) {
      const otherRow = button.closest("tr");
      otherRow.querySelector(".player1-text").style.display = "inline";
      otherRow.querySelector(".player2-text").style.display = "inline";
      otherRow.querySelector(".player1-input").style.display = "none";
      otherRow.querySelector(".player2-input").style.display = "none";
      otherRow.querySelector(".edit-button").style.display = "inline";
      button.style.display = "none";
    }
  });

  const row = editButton.closest("tr");
  row.querySelector(".player1-text").style.display = "none";
  row.querySelector(".player2-text").style.display = "none";
  row.querySelector(".player1-input").style.display = "inline";
  row.querySelector(".player2-input").style.display = "inline";
  row.querySelector(".player1-input").style.width = "18em";
  row.querySelector(".player1-input").style.padding = "0.3em";
  row.querySelector(".player2-input").style.width = "18em";
  row.querySelector(".player2-input").style.padding = "0.3em";
  row.querySelector(".edit-button").style.display = "none";
  row.querySelector(".save-button").style.display = "inline";

  // Añadir evento para salir del modo edición con la tecla ESC
  function handleEscKey(event) {
    if (event.key === "Escape") {
      row.querySelector(".player1-text").style.display = "inline";
      row.querySelector(".player2-text").style.display = "inline";
      row.querySelector(".player1-input").style.display = "none";
      row.querySelector(".player2-input").style.display = "none";
      row.querySelector(".edit-button").style.display = "inline";
      row.querySelector(".save-button").style.display = "none";
      document.removeEventListener("keydown", handleEscKey);
    }
  }

  function handleEnterKey(event) {
    if (event.key === "Enter") {
      savePair(pairId, row.querySelector(".save-button"));
      document.removeEventListener("keydown", handleEnterKey);
    }
  }

  document.addEventListener("keydown", handleEnterKey);
  document.addEventListener("keydown", handleEscKey);
}

function savePair(pairId, saveButton) {
  const row = saveButton.closest("tr");
  const player1Input = row.querySelector(".player1-input").value;
  const player2Input = row.querySelector(".player2-input").value;

  const pairs = getStoredPairs();
  const pairIndex = pairs.findIndex((pair) => pair.id === pairId);
  if (pairIndex !== -1) {
    pairs[pairIndex].player1 = player1Input;
    pairs[pairIndex].player2 = player2Input;
    localStorage.setItem("tournamentData", JSON.stringify(pairs));
  }

  row.querySelector(".player1-text").textContent = player1Input;
  row.querySelector(".player2-text").textContent = player2Input;
  row.querySelector(".player1-text").style.display = "inline";
  row.querySelector(".player2-text").style.display = "inline";
  row.querySelector(".player1-input").style.display = "none";
  row.querySelector(".player2-input").style.display = "none";
  row.querySelector(".edit-button").style.display = "inline";
  row.querySelector(".save-button").style.display = "none";
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
  document.getElementById("player1").value = " ";
  document.getElementById("player2").value = " ";
  document.getElementById("category").selectedIndex = 0;
  document.getElementById("sex").selectedIndex = 0;
}
