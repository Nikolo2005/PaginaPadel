document.addEventListener("DOMContentLoaded", () => {
  addEventListeners();
  displayMatchesByCategory(
    JSON.parse(localStorage.getItem("tournamentMatches")) || [],
  );
  setupPopup();
  setupAvailabilityDays();
});

// Datos de Disponibilidad en Local Storage
const availabilityData = JSON.parse(localStorage.getItem("availabilityData"));

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

// Añadir eventos a los botones
function addEventListeners() {
  document
    .getElementById("delete-all-btn")
    .addEventListener("click", deleteAllData);
  document
    .getElementById("generate-matches-btn")
    .addEventListener("click", () => {
      if (
        confirm(
          "¿Estás seguro de que deseas generar los partidos? Este proceso reemplazará los partidos actuales.",
        )
      ) {
        generateMatches();
      }
    });
  document
    .getElementById("generate-json-btn")
    .addEventListener("click", generateJSON);

  // Navegación de días
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

// Actualizar el día seleccionado y la tabla de disponibilidad
function updateSelectedDay() {
  const selectedDayLabel = document.getElementById("selected-day-label");
  selectedDayLabel.textContent = `${availableDays[currentDayIndex]}`;
  populateAvailabilityTable(
    availableDays[currentDayIndex],
    availabilityData[availableDays[currentDayIndex]],
  );
}

// Eliminar todos los emparejamientos
function deleteAllData() {
  if (
    confirm("¿Estás seguro de que deseas borrar todas los emparejamientos?")
  ) {
    localStorage.removeItem("tournamentMatches");
    document.getElementById("matches-body").innerHTML = "";
    updateTotalMatches(0);
  }
}

// Generar partidos
function generateMatches() {
  const storedData = JSON.parse(localStorage.getItem("tournamentData"));
  if (!storedData || storedData.length < 2) {
    alert("Debe haber al menos dos parejas para generar partidos.");
    return;
  }

  const matches = createMatches(storedData);
  const consolationMatches = createConsolationMatches(matches);
  const allMatches = [...matches, ...consolationMatches];

  if (containsInvalidMatches(allMatches)) {
    alert("No se pueden generar partidos válidos.");
    return;
  }

  localStorage.setItem("tournamentMatches", JSON.stringify(allMatches));
  displayMatchesByCategory(allMatches);
}

// Crear partidos
function createMatches(pairs) {
  const matches = [];
  const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const pairsByCategoryAndSex = pairs.reduce((acc, pair) => {
    const key = `${pair.category}-${pair.sex}`;
    (acc[key] = acc[key] || []).push(pair);
    return acc;
  }, {});

  Object.values(pairsByCategoryAndSex).forEach((pairsInCategory) => {
    const totalPairs = pairsInCategory.length;
    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(totalPairs)));
    const additionalByes = nextPowerOf2 - totalPairs;
    const byes = Array.from({ length: additionalByes }, () => ({
      player1: "BYE",
      player2: "",
      category: pairsInCategory[0].category,
      sex: pairsInCategory[0].sex,
    }));

    pairsInCategory = shuffle(pairsInCategory);
    let mergedPairs = [];
    let pairIndex = 0;
    for (let i = 0; i < nextPowerOf2; i++) {
      if (
        byes.length > 0 &&
        (i % 2 === 1 || pairIndex >= pairsInCategory.length - byes.length)
      ) {
        mergedPairs.push(byes.pop());
      } else {
        mergedPairs.push(pairsInCategory[pairIndex++]);
      }
    }

    let currentRoundPairs = mergedPairs;
    let roundNumber = Math.log2(nextPowerOf2) - 1;

    while (currentRoundPairs.length > 1) {
      const nextRoundPairs = [];
      for (let i = 0; i < currentRoundPairs.length; i += 2) {
        let [pair1, pair2] = [currentRoundPairs[i], currentRoundPairs[i + 1]];
        if (pair1.player1 === "BYE" && pair2.player1 !== "BYE") {
          [pair1, pair2] = [pair2, pair1];
        }

        matches.push({
          pair1,
          pair2,
          category: pair1.category,
          sex: pair1.sex,
          round: getRoundName(roundNumber),
          schedule: null,
        });

        if (pair1.player1 !== "BYE" && pair2.player1 === "BYE") {
          nextRoundPairs.push(pair1);
        } else if (pair1.player1 !== "BYE" && pair2.player1 !== "BYE") {
          nextRoundPairs.push({
            player1: "",
            player2: "",
            category: pair1.category,
            sex: pair1.sex,
          });
        }
      }
      currentRoundPairs = nextRoundPairs;
      roundNumber--;
    }
  });

  return matches;
}

// Crear partidos de consolación
function createConsolationMatches(matches) {
  const consolationMatches = [];
  const matchesByCategoryAndSex = matches.reduce((acc, match) => {
    const key = `${match.category}-${match.sex}`;
    (acc[key] = acc[key] || []).push(match);
    return acc;
  }, {});

  Object.entries(matchesByCategoryAndSex).forEach(
    ([key, matchesInCategory]) => {
      const numConsolationMatches = Math.floor(matchesInCategory.length / 2);
      let numMatches = numConsolationMatches + 1;
      let roundNumber = Math.ceil(Math.log2(numMatches));

      for (let i = 0; i < numConsolationMatches; i++) {
        const consolationMatch = {
          pair1: { player1: "", player2: "" },
          pair2: { player1: "", player2: "" },
          category: `consolación-${matchesInCategory[0].category}`,
          sex: matchesInCategory[0].sex,
          round: getRoundName(roundNumber - 1),
          schedule: null,
        };
        consolationMatches.push(consolationMatch);
        numMatches--;
        if (numMatches === Math.pow(2, Math.ceil(Math.log2(numMatches)))) {
          roundNumber--;
        }
      }
    },
  );

  return consolationMatches;
}

// Funciones para verificar partidos inválidos
function containsInvalidMatches(matches) {
  return matches.some(
    (match) => match.pair1.player1 === "BYE" && match.pair2.player1 === "BYE",
  );
}

function getRoundName(roundNumber) {
  const roundNames = [
    "Final",
    "Semifinal",
    "Cuartos de Final",
    "Octavos de Final",
    "Dieciseisavos de Final",
    "Treintaidosavos de Final",
  ];
  return roundNumber < roundNames.length
    ? roundNames[roundNumber]
    : `Ronda ${roundNumber}`;
}

// Calcular total de partidos
function calculateTotalMatches(matches) {
  const matchesCount = calculateMatchesPerCategory(matches);
  return Object.values(matchesCount).reduce((total, count) => total + count, 0);
}

// Calcular partidos por categoría
function calculateMatchesPerCategory(matches) {
  const matchesByCategoryAndSex = matches.reduce((acc, match) => {
    const key = `${match.category}-${match.sex}`;
    (acc[key] = acc[key] || []).push(match);
    return acc;
  }, {});

  const matchesCount = {};
  for (const [key, matchesInCategory] of Object.entries(
    matchesByCategoryAndSex,
  )) {
    matchesCount[key] =
      matchesInCategory.length >= 1 ? matchesInCategory.length : 0;
  }

  return matchesCount;
}

// Función para mostrar partidos por categoría
function displayMatchesByCategory(matches) {
  const matchesBody = document.getElementById("matches-body");
  matchesBody.innerHTML = "";

  const matchesCount = calculateMatchesPerCategory(matches);
  const totalMatches = calculateTotalMatches(matches);
  const matchesByCategoryAndSex = matches.reduce((acc, match) => {
    const key = `${match.category}-${match.sex}`;
    (acc[key] = acc[key] || []).push(match);
    return acc;
  }, {});

  const categoryStatesMatches =
    JSON.parse(localStorage.getItem("categoryStatesMatches")) || {};

  Object.entries(matchesByCategoryAndSex).forEach(
    ([key, matchesInCategory]) => {
      const categoryRow = document.createElement("tr");
      categoryRow.classList.add("category-header");
      categoryRow.innerHTML = `<td colspan="5">${key} <span class="match-count">(${matchesCount[key]})</span></td>`;
      categoryRow.addEventListener("click", () => toggleCategoryMatches(key));
      matchesBody.appendChild(categoryRow);

      matchesInCategory.forEach((match, index) => {
        const row = document.createElement("tr");
        row.classList.add("hidden-row", `${key}-matches`);

        const isUnprogrammed =
          match.pair1.player1 === "BYE" ||
          match.pair2.player1 === "BYE" ||
          !match.schedule;
        if (
          isUnprogrammed &&
          match.pair1.player1 !== "BYE" &&
          match.pair2.player1 !== "BYE"
        ) {
          row.classList.add("unprogrammed-match");
        }
        if (match.pair1.player1 === "BYE" || match.pair2.player1 === "BYE") {
          row.classList.add("by-rows");
        }

        row.innerHTML = `
                <td class="overflow-cell">${match.pair1.player1 !== "BYE" ? `${match.pair1.player1} - ${match.pair1.player2}` : "BYE"}</td>
                <td class="overflow-cell">${match.pair2.player1 !== "BYE" ? `${match.pair2.player1} - ${match.pair2.player2}` : "BYE"}</td>
                <td>${match.round}</td>
                <td>${isUnprogrammed ? "" : match.schedule ? `${match.schedule.day} ${match.schedule.time} ${match.schedule.court}` : "No programado"}</td>
                ${
                  match.pair1.player1 !== "BYE" && match.pair2.player1 !== "BYE"
                    ? `<td>
                        <button class="edit-btn" data-match-index="${index}" data-category="${key}">Editar</button>
                        <button class="clear-schedule-btn" data-match-index="${index}" data-category="${key}">Borrar Horario</button>
                    </td>`
                    : `<td></td>`
                }
            `;
        if (categoryStatesMatches[key]) {
          row.classList.remove("hidden-row");
        }
        matchesBody.appendChild(row);
      });
    },
  );

  updateTotalMatches(totalMatches);

  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      const matchIndex = event.target.getAttribute("data-match-index");
      const category = event.target.getAttribute("data-category");
      openSchedulePopup(category, matchIndex);
    });
  });

  document.querySelectorAll(".clear-schedule-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      const matchIndex = event.target.getAttribute("data-match-index");
      const category = event.target.getAttribute("data-category");
      clearMatchSchedule(category, matchIndex);
    });
  });
}

// Actualizar el total de partidos
function updateTotalMatches(total) {
  const totalCountElement = document.getElementById("total-count");
  totalCountElement.textContent = total; // Actualiza el total de partidos
}

// Limpiar horarios de partidos
function clearMatchSchedule(category, matchIndex) {
  const matches = JSON.parse(localStorage.getItem("tournamentMatches")) || [];
  const matchesByCategoryAndSex = matches.reduce((acc, match) => {
    const key = `${match.category}-${match.sex}`;
    (acc[key] = acc[key] || []).push(match);
    return acc;
  }, {});

  if (
    matchesByCategoryAndSex[category] &&
    matchesByCategoryAndSex[category][matchIndex]
  ) {
    const match = matchesByCategoryAndSex[category][matchIndex];
    match.schedule = null; // Clear the schedule

    const updatedMatches = Object.values(matchesByCategoryAndSex).flat();
    localStorage.setItem("tournamentMatches", JSON.stringify(updatedMatches));
    displayMatchesByCategory(updatedMatches); // Refresh the display
  }
}

// Alternar visibilidad de categorías de partidos
function toggleCategoryMatches(categoryKey) {
  const categoryRows = document.querySelectorAll(`.${categoryKey}-matches`);
  categoryRows.forEach((row) => row.classList.toggle("hidden-row"));

  const categoryStatesMatches =
    JSON.parse(localStorage.getItem("categoryStatesMatches")) || {};
  categoryStatesMatches[categoryKey] = !categoryStatesMatches[categoryKey];
  localStorage.setItem(
    "categoryStatesMatches",
    JSON.stringify(categoryStatesMatches),
  );
}

// Generar archivo ZIP con los partidos
function generateJSON() {
  const matches = JSON.parse(localStorage.getItem("tournamentMatches")) || [];
  const matchesByCategoryAndSex = matches.reduce((acc, match) => {
    const key = `${match.category}-${match.sex}`;
    (acc[key] = acc[key] || []).push(match);
    return acc;
  }, {});

  const zip = new JSZip();

  Object.entries(matchesByCategoryAndSex).forEach(
    ([key, matchesInCategory]) => {
      const fileName = `${key}_matches.json`;
      const fileContent = JSON.stringify(matchesInCategory, null, 2);

      zip.file(fileName, fileContent);
    },
  );

  zip
    .generateAsync({ type: "blob" })
    .then((content) => {
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = "tournament_matches.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    })
    .catch((error) => {
      console.error("Error al generar el archivo ZIP:", error);
    });
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
  const matches = JSON.parse(localStorage.getItem("tournamentMatches")) || [];
  const matchesByCategoryAndSex = matches.reduce((acc, match) => {
    const key = `${match.category}-${match.sex}`;
    (acc[key] = acc[key] || []).push(match);
    return acc;
  }, {});

  const match = matchesByCategoryAndSex[category][matchIndex]; // Ensure match is defined here

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
      } else {
        cell.classList.add("disabled-cell");
        cell.style.opacity = 0.5;
      }

      row.appendChild(cell);
    }

    tbody.appendChild(row);
  });

  availabilityTables.appendChild(table);
}

// Manejar la importación de partidos desde un archivo ZIP (sin cambios)
document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("import-zip");
  fileInput.addEventListener("change", importMatchesFromZip);
});

// Funciones adicionales para importar y guardar partidos
function importMatchesFromZip() {
  const fileInput = document.getElementById("import-zip");
  const file = fileInput.files[0]; // Obtener el archivo seleccionado

  if (!file) {
    return; // Si no hay archivo seleccionado, salir de la función
  }

  const reader = new FileReader();
  reader.onload = function (event) {
    const content = event.target.result;
    JSZip.loadAsync(content) // Cargar el contenido del ZIP
      .then((zip) => {
        const promises = [];
        zip.forEach((relativePath, zipEntry) => {
          if (zipEntry.name.endsWith(".json")) {
            promises.push(zipEntry.async("string"));
          }
        });

        localStorage.removeItem("tournamentMatches");

        Promise.all(promises)
          .then((filesContent) => {
            filesContent.forEach((jsonString) => {
              const matchData = JSON.parse(jsonString);
              saveMatches(matchData);
            });
            alert("Partidos importados con éxito.");
            displayMatchesByCategory(
              JSON.parse(localStorage.getItem("tournamentMatches")),
            );
          })
          .catch((error) => {
            console.error("Error al leer los archivos JSON del ZIP:", error);
          });
      })
      .catch((error) => {
        console.error("Error al cargar el ZIP:", error);
      });
  };

  reader.readAsArrayBuffer(file); // Leer el archivo como un buffer de array
}

function saveMatches(matchData) {
  const existingMatches =
    JSON.parse(localStorage.getItem("tournamentMatches")) || [];
  const updatedMatches = existingMatches.concat(matchData);
  localStorage.setItem("tournamentMatches", JSON.stringify(updatedMatches));
}
