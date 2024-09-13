const availabilityTableTemplate = (() => {
  const hours = [
    "08:15",
    "09:15",
    "10:15",
    "11:15",
    "12:15",
    "13:15",
    "14:15",
    "15:15",
    "16:15",
    "17:15",
    "18:15",
    "19:15",
    "20:15",
    "21:15",
  ];
  const pistas = [
    "Pista 1",
    "Pista 2",
    "Pista 3",
    "Pista 4",
    "Pista 5",
    "Pista 6",
  ];
  return Object.fromEntries(hours.map((hour) => [hour, pistas]));
})();

let addedDays = [];
let draggedElement = null;

document.addEventListener("DOMContentLoaded", () => {
  loadStoredData();
  document
    .getElementById("delete-all-btn")
    .addEventListener("click", deleteAllData);
  document.getElementById("add-day-btn").addEventListener("click", addDay);
});

function deleteAllData() {
  if (
    confirm(
      "¿Estás seguro de que deseas borrar toda la disponibilidad guardada?",
    )
  ) {
    clearAvailabilityData();
    clearAvailabilityTables();
    addedDays = [];
  }
}

function clearAvailabilityData() {
  localStorage.removeItem("availabilityData");
}

function clearAvailabilityTables() {
  document.getElementById("availability-tables").innerHTML = "";
}

function addDay() {
  const daySelect = document.getElementById("day-select");
  const day = daySelect.value;

  if (!day) {
    alert("Por favor, seleccione un día válido.");
    return;
  }

  if (addedDays.includes(day)) {
    alert("El día ya está agregado.");
    return;
  }

  addDayElement(day);
  populateAvailabilityTable(day, availabilityTableTemplate);
  updateLocalStorage(day);

  addedDays.push(day);
  daySelect.value = "";
  addDragAndDropListeners(); // Añadir los listeners de arrastrar y soltar a los nuevos días
}

function updateLocalStorage(day) {
  const availabilityData =
    JSON.parse(localStorage.getItem("availabilityData")) || {};
  availabilityData[day] = availabilityData[day] || {};
  localStorage.setItem("availabilityData", JSON.stringify(availabilityData));
}

function removeDay(day) {
  if (confirm(`¿Estás seguro de que deseas eliminar el día ${day}?`)) {
    document.querySelector(`#availability-${day}`).parentElement.remove();
    const availabilityData =
      JSON.parse(localStorage.getItem("availabilityData")) || {};
    delete availabilityData[day];
    localStorage.setItem("availabilityData", JSON.stringify(availabilityData));

    addedDays = addedDays.filter((d) => d !== day);
    updateOrderInLocalStorage();
  }
}

function populateAvailabilityTable(day, availabilityTemplate) {
  const tbody = document.querySelector(`#availability-${day} tbody`);
  tbody.innerHTML = "";

  for (const [time, pistas] of Object.entries(availabilityTemplate)) {
    const row = document.createElement("tr");
    row.innerHTML = `<td class="hour-cell">${time}</td>`;
    pistas.forEach((pista) => {
      const cell = document.createElement("td");
      cell.dataset.day = day;
      cell.dataset.time = time;
      cell.dataset.pista = pista;
      cell.classList.add("availability-cell");
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  }

  addHoverAndClickListeners(day);
}

function addHoverAndClickListeners(day) {
  const hourCells = document.querySelectorAll(
    `#availability-${day} .hour-cell`,
  );
  const pistaCells = document.querySelectorAll(
    `#availability-${day} thead th:not(:first-child)`,
  );

  hourCells.forEach((cell) => {
    const time = cell.textContent;
    addHoverListener(cell, `#availability-${day} [data-time="${time}"]`);
    addClickListener(cell, day, time, "time");
  });

  pistaCells.forEach((cell, index) => {
    const pista = `Pista ${index + 1}`;
    addHoverListener(cell, `#availability-${day} [data-pista="${pista}"]`);
    addClickListener(cell, day, pista, "pista");
  });

  // Add click listeners to availability cells
  const availabilityCells = document.querySelectorAll(
    `#availability-${day} .availability-cell`,
  );
  availabilityCells.forEach((cell) => {
    cell.addEventListener("click", () => {
      const isSelected = cell.classList.toggle("selected");
      updateAvailabilityData(
        day,
        cell.dataset.time,
        cell.dataset.pista,
        isSelected,
      );
    });
    cell.addEventListener("mouseover", () => {
      cell.classList.add("preview");
    });
    cell.addEventListener("mouseout", () => {
      cell.classList.remove("preview");
    });
  });
}

function addHoverListener(cell, selector) {
  cell.addEventListener("mouseover", () => {
    document
      .querySelectorAll(selector)
      .forEach((c) => c.classList.add("preview"));
  });
  cell.addEventListener("mouseout", () => {
    document
      .querySelectorAll(selector)
      .forEach((c) => c.classList.remove("preview"));
  });
}

function addClickListener(cell, day, value, type) {
  cell.addEventListener("click", () => {
    const cells = document.querySelectorAll(
      `#availability-${day} [data-${type}="${value}"]`,
    );
    const isSelected = Array.from(cells).some((c) =>
      c.classList.contains("selected"),
    );
    cells.forEach((c) => {
      c.classList.toggle("selected", !isSelected);
      updateAvailabilityData(day, c.dataset.time, c.dataset.pista, !isSelected);
    });
  });
}

function loadStoredData() {
  const availabilityData =
    JSON.parse(localStorage.getItem("availabilityData")) || {};
  Object.keys(availabilityData).forEach((day) => {
    addDayElement(day);
    populateAvailabilityTable(day, availabilityTableTemplate);
    restoreAvailability(day, availabilityData[day]);
    addedDays.push(day);
  });
  addDragAndDropListeners(); // Mover aquí para asegurar que se añaden los listeners después de cargar los datos
}

function addDayElement(day) {
  const availabilityTables = document.getElementById("availability-tables");
  const tableContainer = document.createElement("div");
  tableContainer.classList.add("table-container");
  tableContainer.setAttribute("draggable", "true");
  tableContainer.innerHTML = `
    <table id="availability-${day}">
      <thead>
        <tr>
          <th colspan="7">${day}</th>
        </tr>
        <tr>
          <th>Hora</th>
          ${Array.from({ length: 6 }, (_, i) => `<th class="pista-cell">Pista ${i + 1}</th>`).join("")}
        </tr>
      </thead>
      <tbody></tbody>
    </table>
    <button class="delete-day-btn" onclick="removeDay('${day}')">
      <img class="rm-day-btn" src="assets/img/dustbin_120823.svg"/>
    </button>
  `;
  availabilityTables.appendChild(tableContainer);
}

function updateAvailabilityData(day, time, pista, isChecked) {
  const availabilityData =
    JSON.parse(localStorage.getItem("availabilityData")) || {};
  availabilityData[day] = availabilityData[day] || {};
  availabilityData[day][time] = availabilityData[day][time] || [];

  if (isChecked) {
    if (!availabilityData[day][time].includes(pista)) {
      availabilityData[day][time].push(pista);
    }
  } else {
    availabilityData[day][time] = availabilityData[day][time].filter(
      (item) => item !== pista,
    );
  }

  localStorage.setItem("availabilityData", JSON.stringify(availabilityData));
}

function restoreAvailability(day, dayData) {
  const cells = document.querySelectorAll(
    `#availability-${day} .availability-cell`,
  );
  cells.forEach((cell) => {
    const time = cell.dataset.time;
    const pista = cell.dataset.pista;
    if (dayData[time]?.includes(pista)) {
      cell.classList.add("selected");
    }
  });
}

function addDragAndDropListeners() {
  const containers = document.querySelectorAll(".table-container");

  containers.forEach((container) => {
    container.addEventListener("dragstart", handleDragStart);
    container.addEventListener("dragover", handleDragOver);
    container.addEventListener("dragleave", handleDragLeave);
    container.addEventListener("drop", handleDrop);
    container.addEventListener("dragend", handleDragEnd);
  });
}

function handleDragStart(e) {
  if (e.target.classList.contains("table-container")) {
    draggedElement = e.target;
    e.target.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
  } else {
    e.preventDefault();
  }
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  const target = getClosestTableContainer(e.target);
  if (target && target !== draggedElement) {
    const rect = target.getBoundingClientRect();
    const offset = e.clientX - rect.left;
    if (offset < rect.width / 2) {
      target.classList.add("over-before");
      target.classList.remove("over-after");
    } else {
      target.classList.add("over-after");
      target.classList.remove("over-before");
    }
  }
}

function handleDragLeave(e) {
  const target = getClosestTableContainer(e.target);
  if (target) {
    target.classList.remove("over-before", "over-after");
  }
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();

  const target = getClosestTableContainer(e.target);
  if (draggedElement !== target) {
    const parent = document.getElementById("availability-tables");
    const children = Array.from(parent.children);
    const draggedIndex = children.indexOf(draggedElement);
    const targetIndex = children.indexOf(target);

    if (target.classList.contains("over-before")) {
      parent.insertBefore(draggedElement, target);
    } else {
      parent.insertBefore(draggedElement, target.nextSibling);
    }
    updateOrderInLocalStorage();
  }
  if (target) {
    target.classList.remove("over-before", "over-after");
  }
  clearAllPreviews(); // Limpiar todas las previsualizaciones después de soltar
}

function handleDragEnd(e) {
  e.target.classList.remove("dragging");
  document.querySelectorAll(".table-container").forEach((container) => {
    container.classList.remove("over-before", "over-after");
  });
  clearAllPreviews(); // Limpiar todas las previsualizaciones después de terminar el arrastre
}

function getClosestTableContainer(element) {
  while (element && !element.classList.contains("table-container")) {
    element = element.parentElement;
  }
  return element;
}

function updateOrderInLocalStorage() {
  const parent = document.getElementById("availability-tables");
  const children = Array.from(parent.children);
  const newOrder = children.map((child) =>
    child.querySelector("table").id.replace("availability-", ""),
  );
  const availabilityData =
    JSON.parse(localStorage.getItem("availabilityData")) || {};
  const newAvailabilityData = {};
  newOrder.forEach((day) => {
    newAvailabilityData[day] = availabilityData[day];
  });
  localStorage.setItem("availabilityData", JSON.stringify(newAvailabilityData));
}

function clearAllPreviews() {
  document.querySelectorAll(".preview").forEach((cell) => {
    cell.classList.remove("preview");
  });
}
