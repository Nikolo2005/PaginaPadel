document.addEventListener("DOMContentLoaded", () => {
  setupAvailabilityDays();
  addEventListeners();
  updateTournamentData();
  updateTournamentMatches();
  updateAvailabilityData();
  updateOccupiedSlots();
  updateMatchRounds();
  addRoundColorEventListeners();
  loadCellDataFromLocalStorage();
  deselectRoundInputs();
  updateRoundCellCounts();
});

function updateTournamentData() {
  const tournamentData =
    JSON.parse(localStorage.getItem("tournamentData")) || [];
  document.getElementById("num-parejas").textContent = tournamentData.length;
}

function updateTournamentMatches() {
  const tournamentMatches =
    JSON.parse(localStorage.getItem("tournamentMatches")) || [];
  document.getElementById("num-partidos").textContent =
    tournamentMatches.length;
}

function updateAvailabilityData() {
  const availabilityData =
    JSON.parse(localStorage.getItem("availabilityData")) || {};
  let availableSlots = 0;

  Object.values(availabilityData).forEach((day) => {
    Object.values(day).forEach((pistas) => {
      availableSlots += pistas.length;
    });
  });

  document.getElementById("num-horarios-disponibles").textContent =
    availableSlots;
}

function updateOccupiedSlots() {
  const availabilityData =
    JSON.parse(localStorage.getItem("availabilityData")) || {};
  const tournamentMatches =
    JSON.parse(localStorage.getItem("tournamentMatches")) || [];
  let occupiedSlots = 0;

  tournamentMatches.forEach((match) => {
    if (match.schedule) {
      const { day, time, court } = match.schedule;
      if (
        availabilityData[day] &&
        availabilityData[day][time] &&
        availabilityData[day][time].includes(court)
      ) {
        occupiedSlots++;
      }
    }
  });

  document.getElementById("num-horarios-ocupados").textContent = occupiedSlots;
}

function updateMatchRounds() {
  const tournamentMatches =
    JSON.parse(localStorage.getItem("tournamentMatches")) || [];

  const rounds = {
    "Treintaidosavos de Final": "num-32s",
    "Dieciseisavos de Final": "num-16s",
    "Octavos de Final": "num-8s",
    "Cuartos de Final": "num-4s",
    Semifinal: "num-2s",
    Final: "num-1s",
  };

  Object.keys(rounds).forEach((round) => {
    const count = tournamentMatches.filter(
      (match) => match.round === round,
    ).length;
    document.getElementById(rounds[round]).textContent = count;
  });
}

let availabilityData = JSON.parse(localStorage.getItem("availabilityData"));

if (!availabilityData) {
  availabilityData = {
    Lunes: {},
  };
  localStorage.setItem("availabilityData", JSON.stringify(availabilityData));
}

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

let availableDays = Object.keys(availabilityData);
let currentDayIndex = 0;
let selectedRound = null;

const roundColors = {
  "32s": "rgb(255, 0, 0)", // Red
  "16s": "rgb(255, 127, 0)", // Orange
  "8s": "rgb(255, 255, 0)", // Yellow
  "4s": "rgb(0, 255, 0)", // Green
  "2s": "rgb(0, 0, 255)", // Blue
  "1s": "rgb(139, 0, 255)", // Purple
};

function setupAvailabilityDays() {
  updateSelectedDay();
}

function addEventListeners() {
  document.getElementById("previous-day-btn").addEventListener("click", () => {
    if (currentDayIndex > 0) {
      currentDayIndex--;
      updateSelectedDay();
    }
  });

  document.getElementById("next-day-btn").addEventListener("click", () => {
    if (currentDayIndex < availableDays.length - 1) {
      currentDayIndex++;
      updateSelectedDay();
    }
  });
}

function updateSelectedDay() {
  const selectedDayLabel = document.getElementById("selected-day-label");
  selectedDayLabel.textContent = `${availableDays[currentDayIndex]}`;
  populateAvailabilityTable(
    availableDays[currentDayIndex],
    availabilityData[availableDays[currentDayIndex]],
  );
}

function populateAvailabilityTable(day, availabilityTemplate) {
  const availabilityTables = document.getElementById("availability-tables");
  availabilityTables.innerHTML = "";

  const table = document.createElement("table");
  const tbody = document.createElement("tbody");
  table.classList.add("availability-table");
  table.appendChild(tbody);

  const header = document.createElement("tr");
  header.innerHTML =
    "<th>Hora</th><th>Pista 1</th><th>Pista 2</th><th>Pista 3</th><th>Pista 4</th><th>Pista 5</th><th>Pista 6</th>";
  tbody.appendChild(header);

  const allTimes = Object.keys(availabilityTableTemplate);

  allTimes.forEach((time) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td class="hour-cell">${time}</td>`;

    for (let i = 1; i <= 6; i++) {
      const pistaName = `Pista ${i}`;
      const cell = document.createElement("td");
      cell.dataset.day = day;
      cell.dataset.time = time;
      cell.dataset.pista = pistaName;
      cell.classList.add("availability-cell");

      if (
        availabilityTemplate[time] &&
        availabilityTemplate[time].includes(pistaName)
      ) {
        cell.addEventListener("click", () => {
          if (selectedRound) {
            const currentColor = getComputedStyle(cell).backgroundColor;
            const selectedColor = roundColors[selectedRound];

            if (currentColor === selectedColor) {
              cell.style.backgroundColor = "";
              removeCellDataFromLocalStorage(day, time, pistaName);
            } else {
              cell.style.backgroundColor = selectedColor;
              saveCellDataToLocalStorage(day, time, pistaName, selectedRound);
            }
            updateRoundCellCounts();
          }
        });
      } else {
        cell.classList.add("disabled-cell");
      }

      row.appendChild(cell);
    }

    tbody.appendChild(row);
  });

  availabilityTables.appendChild(table);
  loadCellDataFromLocalStorage();
}

function addRoundColorEventListeners() {
  document.querySelectorAll('input[name="round"]').forEach((input) => {
    input.addEventListener("change", (event) => {
      selectedRound = event.target.value;
    });
  });
}

function deselectRoundInputs() {
  document.querySelectorAll('input[name="round"]').forEach((input) => {
    input.checked = false;
  });
}

function saveCellDataToLocalStorage(day, time, pista, round) {
  let cellData = JSON.parse(localStorage.getItem("cellData")) || {};
  if (!cellData[day]) {
    cellData[day] = {};
  }
  if (!cellData[day][time]) {
    cellData[day][time] = {};
  }
  cellData[day][time][pista] = round;
  localStorage.setItem("cellData", JSON.stringify(cellData));
}

function removeCellDataFromLocalStorage(day, time, pista) {
  let cellData = JSON.parse(localStorage.getItem("cellData")) || {};
  if (cellData[day] && cellData[day][time] && cellData[day][time][pista]) {
    delete cellData[day][time][pista];
    if (Object.keys(cellData[day][time]).length === 0) {
      delete cellData[day][time];
    }
    if (Object.keys(cellData[day]).length === 0) {
      delete cellData[day];
    }
    localStorage.setItem("cellData", JSON.stringify(cellData));
  }
}

function loadCellDataFromLocalStorage() {
  const cellData = JSON.parse(localStorage.getItem("cellData")) || {};
  Object.keys(cellData).forEach((day) => {
    Object.keys(cellData[day]).forEach((time) => {
      Object.keys(cellData[day][time]).forEach((pista) => {
        const round = cellData[day][time][pista];
        const cell = document.querySelector(
          `td[data-day="${day}"][data-time="${time}"][data-pista="${pista}"]`,
        );
        if (cell) {
          cell.style.backgroundColor = roundColors[round];
        }
      });
    });
  });
  updateRoundCellCounts();
}

function updateRoundCellCounts() {
  const cellData = JSON.parse(localStorage.getItem("cellData")) || {};
  const roundCounts = {
    "32s": 0,
    "16s": 0,
    "8s": 0,
    "4s": 0,
    "2s": 0,
    "1s": 0,
  };

  Object.keys(cellData).forEach((day) => {
    Object.keys(cellData[day]).forEach((time) => {
      Object.keys(cellData[day][time]).forEach((pista) => {
        const round = cellData[day][time][pista];
        if (roundCounts[round] !== undefined) {
          roundCounts[round]++;
        }
      });
    });
  });

  updateRoundCellCountElement("num-32s-cells", roundCounts["32s"]);
  updateRoundCellCountElement("num-16s-cells", roundCounts["16s"]);
  updateRoundCellCountElement("num-8s-cells", roundCounts["8s"]);
  updateRoundCellCountElement("num-4s-cells", roundCounts["4s"]);
  updateRoundCellCountElement("num-2s-cells", roundCounts["2s"]);
  updateRoundCellCountElement("num-1s-cells", roundCounts["1s"]);
}

function updateRoundCellCountElement(elementId, newCount) {
  const element = document.getElementById(elementId);
  const oldCount = parseInt(element.textContent, 10);

  if (oldCount !== newCount) {
    element.textContent = newCount;
    element.classList.remove("flash");
    void element.offsetWidth; // Trigger reflow to restart the animation
    element.classList.add("flash");
  }
}
