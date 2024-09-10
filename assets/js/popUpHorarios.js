document.addEventListener("DOMContentLoaded", () => {
  setupPopup();
  setupAvailabilityDays();
});

// Datos de Disponibilidad en Local Storage
let availabilityData = JSON.parse(localStorage.getItem("availabilityData"));

if (!availabilityData) {
  // Si no hay disponibilidad almacenada, agregar un día de disponibilidad vacío
  availabilityData = {
    ["Lunes"]: {},
  };
  localStorage.setItem("availabilityData", JSON.stringify(availabilityData));
}

// Definición del template de disponibilidad de horarios
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

// Días disponibles
let availableDays = Object.keys(availabilityData); // Obtener solo los días disponibles
let currentDayIndex = 0; // Para rastrear el día actualmente seleccionado

function setupAvailabilityDays() {
  // Inicialmente llenar la tabla con el primer día
  populateAvailabilityTable(
    availableDays[currentDayIndex],
    availabilityData[availableDays[currentDayIndex]],
  );
}

// Abre el popup de programación
let currentEditingCategory;
let currentEditingMatchIndex;
let currentEditingMatch = -1;
const popup = document.getElementById("schedule-popup");

// Configurar el popup de programación
function setupPopup() {
  document
    .getElementById("cancel-schedule-btn")
    .addEventListener("click", () => {
      popup.style.display = "none";
    });
}

function openSchedulePopup(category, matchIndex) {
  if (!availabilityData || Object.keys(availabilityData).length === 0) {
    alert(
      "No hay disponibilidad horaria. Por favor, agregue disponibilidad antes de programar los partidos.",
    );
    return;
  }

  const matches = JSON.parse(localStorage.getItem("tournamentMatches")) || [];
  const matchesByCategoryAndSex = matches.reduce((acc, match) => {
    const key = `${match.category}-${match.sex}`;
    (acc[key] = acc[key] || []).push(match);
    return acc;
  }, {});

  if (!matchesByCategoryAndSex[category]) {
    console.error(
      `La categoría ${category} no existe en matchesByCategoryAndSex`,
    );
    return;
  }

  const match = matchesByCategoryAndSex[category][matchIndex];
  if (!match) {
    console.error(
      `El índice ${matchIndex} no es válido para la categoría ${category}`,
    );
    return;
  }

  currentEditingCategory = category;
  currentEditingMatchIndex = matchIndex;

  const availabilityTables = document.getElementById("availability-tables");
  const selectedDayLabel = document.getElementById("selected-day-label"); // Obtener la referencia a la etiqueta del día

  availabilityTables.innerHTML = ""; // Limpiar el área de disponibilidad

  // Llenar el día seleccionado
  selectedDayLabel.textContent = `${availableDays[currentDayIndex]}`;
  populateAvailabilityTable(
    availableDays[currentDayIndex],
    availabilityData[availableDays[currentDayIndex]],
  ); // Rellenar con el día actual

  document.getElementById("save-schedule-btn").onclick = () => {
    const selectedCells = availabilityTables.querySelectorAll(
      ".availability-cell.selected",
    );
    if (selectedCells.length === 0) {
      alert("Por favor, selecciona al menos una pista y hora.");
      return;
    }

    const schedules = Array.from(selectedCells).map((cell) => ({
      time: cell.dataset.time,
      pista: cell.dataset.pista,
    }));

    match.schedule = {
      day: availableDays[currentDayIndex],
      time: schedules[0].time,
      court: schedules[0].pista,
    };

    const updatedMatches = Object.values(matchesByCategoryAndSex).flat();
    localStorage.setItem("tournamentMatches", JSON.stringify(updatedMatches));
    displayMatchesByCategory(updatedMatches);
    popup.style.display = "none";
  };

  popup.style.display = "flex";
}

// Función para llenar la tabla de disponibilidad
function populateAvailabilityTable(day, availabilityTemplate) {
  const availabilityTables = document.getElementById("availability-tables");
  availabilityTables.innerHTML = "";

  const table = document.createElement("table");
  const tbody = document.createElement("tbody");
  table.classList.add("availability-table");
  table.appendChild(tbody);

  const header = document.createElement("tr");
  header.innerHTML = "<th>Hora</th>";
  const allTimes = Object.keys(availabilityTableTemplate);

  // Obtener los horarios ya seleccionados
  const matches = JSON.parse(localStorage.getItem("tournamentMatches")) || [];
  const selectedSchedules = matches
    .filter((match) => match.schedule)
    .map(
      (match) =>
        `${match.schedule.day}-${match.schedule.time}-${match.schedule.court}`,
    );

  // Filtrar las pistas disponibles
  const availablePistas = Array.from(
    { length: 6 },
    (_, i) => `Pista ${i + 1}`,
  ).filter((pista) =>
    allTimes.some((time) => availabilityTemplate[time]?.includes(pista)),
  );

  if (availablePistas.length === 0) {
    availabilityTables.innerHTML =
      "<p>No hay disponibilidad seleccionada para este día.</p>";
    return;
  }

  availablePistas.forEach((pista) => {
    header.innerHTML += `<th>${pista}</th>`;
  });
  tbody.appendChild(header);

  allTimes.forEach((time) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td class="hour-cell">${time}</td>`;

    availablePistas.forEach((pistaName) => {
      const cell = document.createElement("td");
      cell.dataset.day = day;
      cell.dataset.time = time;
      cell.dataset.pista = pistaName;
      cell.classList.add("availability-cell");

      const scheduleKey = `${day}-${time}-${pistaName}`;

      if (
        availabilityTemplate[time] &&
        availabilityTemplate[time].includes(pistaName)
      ) {
        if (selectedSchedules.includes(scheduleKey)) {
          cell.classList.add("occupied-cell");
        } else {
          cell.addEventListener("click", () => {
            const selectedCells = availabilityTables.querySelectorAll(
              ".availability-cell.selected",
            );
            selectedCells.forEach((selectedCell) => {
              selectedCell.classList.remove("selected");
            });
            cell.classList.add("selected");

            const scheduleData = {
              day: day,
              time: time,
              court: pistaName,
            };

            currentEditingMatch.schedule = scheduleData; // Usa la variable global

            const matches =
              JSON.parse(localStorage.getItem("tournamentMatches")) || [];
            localStorage.setItem("tournamentMatches", JSON.stringify(matches));
            displayMatchesByCategory(matches);
          });
        }
      } else {
        cell.classList.add("disabled-cell");
      }

      row.appendChild(cell);
    });

    tbody.appendChild(row);
  });

  availabilityTables.appendChild(table);
}
