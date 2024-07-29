const availabilityTableTemplate = {
  "08:15": ["Pista 1", "Pista 2", "Pista 3", "Pista 4", "Pista 5", "Pista 6"],
  "09:15": ["Pista 1", "Pista 2", "Pista 3", "Pista 4", "Pista 5", "Pista 6"],
  "10:15": ["Pista 1", "Pista 2", "Pista 3", "Pista 4", "Pista 5", "Pista 6"],
  "11:15": ["Pista 1", "Pista 2", "Pista 3", "Pista 4", "Pista 5", "Pista 6"],
  "12:15": ["Pista 1", "Pista 2", "Pista 3", "Pista 4", "Pista 5", "Pista 6"],
  "13:15": ["Pista 1", "Pista 2", "Pista 3", "Pista 4", "Pista 5", "Pista 6"],
  "14:15": ["Pista 1", "Pista 2", "Pista 3", "Pista 4", "Pista 5", "Pista 6"],
  "15:15": ["Pista 1", "Pista 2", "Pista 3", "Pista 4", "Pista 5", "Pista 6"],
  "16:15": ["Pista 1", "Pista 2", "Pista 3", "Pista 4", "Pista 5", "Pista 6"],
  "17:15": ["Pista 1", "Pista 2", "Pista 3", "Pista 4", "Pista 5", "Pista 6"],
  "18:15": ["Pista 1", "Pista 2", "Pista 3", "Pista 4", "Pista 5", "Pista 6"],
  "19:15": ["Pista 1", "Pista 2", "Pista 3", "Pista 4", "Pista 5", "Pista 6"],
  "20:15": ["Pista 1", "Pista 2", "Pista 3", "Pista 4", "Pista 5", "Pista 6"],
  "21:15": ["Pista 1", "Pista 2", "Pista 3", "Pista 4", "Pista 5", "Pista 6"],
};

document.addEventListener("DOMContentLoaded", () => {
  loadStoredData();
  document
    .getElementById("delete-all-btn")
    .addEventListener("click", deleteAllData);
  document.getElementById("add-day-btn").addEventListener("click", addDay);
});

function deleteAllData() {
  const confirmDelete = confirm(
    "¿Estás seguro de que deseas borrar toda la disponibilidad guardada?",
  );
  if (confirmDelete) {
    clearAvailabilityData();
    clearAvailabilityTables();
  }
}

function clearAvailabilityData() {
  localStorage.removeItem("availabilityData");
}

function clearAvailabilityTables() {
  const availabilityTables = document.getElementById("availability-tables");
  while (availabilityTables.firstChild) {
    availabilityTables.removeChild(availabilityTables.firstChild);
  }
}

function addDay() {
  const daySelect = document.getElementById("day-select");
  const day = daySelect.value;

  if (day) {
    const availabilityTables = document.getElementById("availability-tables");
    if (!availabilityTables.querySelector(`#availability-${day}`)) {
      const tableContainer = document.createElement("div");
      tableContainer.innerHTML = `
                <h3>${day} <button onclick="removeDay('${day}')">Eliminar Día</button></h3>
                <table id="availability-${day}">
                    <thead>
                        <tr>
                            <th>Hora</th>
                            <th class="pista-cell">Pista 1</th>
                            <th class="pista-cell">Pista 2</th>
                            <th class="pista-cell">Pista 3</th>
                            <th class="pista-cell">Pista 4</th>
                            <th class="pista-cell">Pista 5</th>
                            <th class="pista-cell">Pista 6</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            `;
      availabilityTables.appendChild(tableContainer);
      populateAvailabilityTable(day, availabilityTableTemplate);

      // Actualiza localStorage inmediatamente después de agregar el día
      let availabilityData =
        JSON.parse(localStorage.getItem("availabilityData")) || {};
      if (!availabilityData[day]) {
        availabilityData[day] = {};
      }
      localStorage.setItem(
        "availabilityData",
        JSON.stringify(availabilityData),
      );

      daySelect.value = "";
      addAvailabilityListeners();
    } else {
      alert("El día ya está agregado.");
    }
  } else {
    alert("Por favor, seleccione un día válido.");
  }
}

function removeDay(day) {
  const confirmRemove = confirm(
    `¿Estás seguro de que deseas eliminar el día ${day}?`,
  );
  if (confirmRemove) {
    const tableContainer = document.querySelector(
      `#availability-${day}`,
    ).parentElement;
    tableContainer.remove();

    let availabilityData =
      JSON.parse(localStorage.getItem("availabilityData")) || {};
    delete availabilityData[day];
    localStorage.setItem("availabilityData", JSON.stringify(availabilityData));
  } else {
    alert("Operación cancelada");
  }
}
function populateAvailabilityTable(day, availabilityTemplate) {
  const tbody = document.querySelector(`#availability-${day} tbody`);
  tbody.innerHTML = "";

  // Crear las filas de la tabla
  Object.keys(availabilityTemplate).forEach((time) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td class="hour-cell">${time}</td>`;
    availabilityTemplate[time].forEach((pista, index) => {
      const cell = document.createElement("td");
      cell.setAttribute("data-day", day);
      cell.setAttribute("data-time", time);
      cell.setAttribute("data-pista", pista);
      cell.classList.add("availability-cell");
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  });

  // Añadir event listener para las celdas de hora
  const hourCells = document.querySelectorAll(
    `#availability-${day} .hour-cell`,
  );
  hourCells.forEach((cell) => {
    const time = cell.textContent;
    cell.addEventListener("mouseover", () => {
      const cells = document.querySelectorAll(
        `#availability-${day} [data-time="${time}"]`,
      );
      cells.forEach((c) => c.classList.add("preview"));
    });
    cell.addEventListener("mouseout", () => {
      const cells = document.querySelectorAll(
        `#availability-${day} [data-time="${time}"]`,
      );
      cells.forEach((c) => c.classList.remove("preview"));
    });
    cell.addEventListener("click", () => {
      const cells = document.querySelectorAll(
        `#availability-${day} [data-time="${time}"]`,
      );
      const isSelected = Array.from(cells).some((c) =>
        c.classList.contains("selected"),
      );
      cells.forEach((c) => {
        c.classList.toggle("selected", !isSelected);
        updateAvailabilityData(
          day,
          time,
          c.getAttribute("data-pista"),
          !isSelected,
        );
      });
    });
  });

  // Añadir event listener para las celdas de pista
  const pistaCells = document.querySelectorAll(
    `#availability-${day} thead th:not(:first-child)`,
  );
  pistaCells.forEach((cell, index) => {
    const pista = `Pista ${index + 1}`;
    cell.addEventListener("mouseover", () => {
      const cells = document.querySelectorAll(
        `#availability-${day} [data-pista="${pista}"]`,
      );
      cells.forEach((c) => c.classList.add("preview"));
    });
    cell.addEventListener("mouseout", () => {
      const cells = document.querySelectorAll(
        `#availability-${day} [data-pista="${pista}"]`,
      );
      cells.forEach((c) => c.classList.remove("preview"));
    });
    cell.addEventListener("click", () => {
      const cells = document.querySelectorAll(
        `#availability-${day} [data-pista="${pista}"]`,
      );
      const isSelected = Array.from(cells).some((c) =>
        c.classList.contains("selected"),
      );
      cells.forEach((c) => {
        c.classList.toggle("selected", !isSelected);
        updateAvailabilityData(
          day,
          c.getAttribute("data-time"),
          pista,
          !isSelected,
        );
      });
    });
  });
}

function addAvailabilityListeners() {
  const cells = document.querySelectorAll(".availability-cell");

  cells.forEach((cell) => {
    cell.removeEventListener("click", availabilityCellClickHandler);
  });

  cells.forEach((cell) => {
    cell.addEventListener("click", availabilityCellClickHandler);
  });
}

function availabilityCellClickHandler() {
  const cell = this;
  cell.classList.toggle("selected");
  const day = cell.getAttribute("data-day");
  const time = cell.getAttribute("data-time");
  const pista = cell.getAttribute("data-pista");
  const isChecked = cell.classList.contains("selected");
  updateAvailabilityData(day, time, pista, isChecked);
}

function loadStoredData() {
  const availabilityData =
    JSON.parse(localStorage.getItem("availabilityData")) || {};
  Object.keys(availabilityData).forEach((day) => {
    const availabilityTables = document.getElementById("availability-tables");
    if (!availabilityTables.querySelector(`#availability-${day}`)) {
      const tableContainer = document.createElement("div");
      tableContainer.innerHTML = `
                <h3>${day} <button onclick="removeDay('${day}')">Eliminar Día</button></h3>
                <table id="availability-${day}">
                    <thead>
                        <tr>
                            <th>Hora</th>
                            <th>Pista 1</th>
                            <th>Pista 2</th>
                            <th>Pista 3</th>
                            <th>Pista 4</th>
                            <th>Pista 5</th>
                            <th>Pista 6</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            `;
      availabilityTables.appendChild(tableContainer);
      populateAvailabilityTable(day, availabilityTableTemplate);
      restoreAvailability(day, availabilityData[day]);
      addAvailabilityListeners();
    }
  });
}

function updateAvailabilityData(day, time, pista, isChecked) {
  let availabilityData =
    JSON.parse(localStorage.getItem("availabilityData")) || {};

  if (!availabilityData[day]) {
    availabilityData[day] = {};
  }
  if (!availabilityData[day][time]) {
    availabilityData[day][time] = [];
  }

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
  const table = document.getElementById(`availability-${day}`);
  if (table) {
    const cells = table.querySelectorAll(".availability-cell");
    cells.forEach((cell) => {
      const time = cell.getAttribute("data-time");
      const pista = cell.getAttribute("data-pista");
      if (dayData[time] && dayData[time].includes(pista)) {
        cell.classList.add("selected");
      }
    });
  }
}
