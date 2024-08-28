document.addEventListener("DOMContentLoaded", () => {
  addEventListeners();
  displayMatchesByCategory(
    JSON.parse(localStorage.getItem("tournamentMatches")) || [],
  );
});

// Añadir eventos a los botones
function addEventListeners() {
  document
    .getElementById("delete-schedules-btn")
    .addEventListener("click", () => {
      if (confirm("¿Estás seguro de que deseas borrar todos los horarios?")) {
        let tournamentMatches =
          JSON.parse(localStorage.getItem("tournamentMatches")) || [];
        tournamentMatches.forEach((match) => {
          match.schedule = null;
        });
        localStorage.setItem(
          "tournamentMatches",
          JSON.stringify(tournamentMatches),
        );
        alert("Todos los horarios han sido borrados.");
        location.reload(); // Recargar la página para reflejar los cambios
      }
    });

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
  try {
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
  } catch (error) {
    console.error("Error generating matches:", error);
    alert(
      "Ocurrió un error al generar los partidos. Por favor, inténtelo de nuevo.",
    );
  }
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

    // Barajar los partidos de la primera ronda
    let firstRoundMatches = [];
    for (let i = 0; i < mergedPairs.length; i += 2) {
      firstRoundMatches.push([mergedPairs[i], mergedPairs[i + 1]]);
    }
    firstRoundMatches = shuffle(firstRoundMatches);

    // Generar partidos de la primera ronda
    let currentRoundPairs = [];
    firstRoundMatches.forEach((match) => {
      const [pair1, pair2] = match;
      matches.push({
        pair1,
        pair2,
        category: pair1.category,
        sex: pair1.sex,
        round: getRoundName(Math.log2(nextPowerOf2) - 1),
        schedule: null,
      });
      currentRoundPairs.push(pair1.player1 === "BYE" ? pair2 : pair1);
    });

    let roundNumber = Math.log2(nextPowerOf2) - 2;

    // Generar las siguientes rondas
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
          match.pair1.player1 !== "BYE" &&
          match.pair2.player1 !== "BYE" &&
          !match.schedule;
        if (isUnprogrammed) {
          row.classList.add("unprogrammed-match");
        }

        row.innerHTML = `
                <td class="overflow-cell">${match.pair1.player1 !== "BYE" ? `${match.pair1.player1} - ${match.pair1.player2}` : "BYE"}</td>
                <td class="overflow-cell">${match.pair2.player1 !== "BYE" ? `${match.pair2.player1} - ${match.pair2.player2}` : "BYE"}</td>
                <td>${match.round}</td>
                <td>${isUnprogrammed ? "" : match.schedule ? `${match.schedule.day} ${match.schedule.time} ${match.schedule.court}` : ""}</td>
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
  const availabilityData =
    JSON.parse(localStorage.getItem("availabilityData")) || {};
  const tournamentData =
    JSON.parse(localStorage.getItem("tournamentData")) || [];

  const matchesByCategoryAndSex = matches.reduce((acc, match) => {
    const key = `${match.category}-${match.sex}`;
    (acc[key] = acc[key] || []).push(match);
    return acc;
  }, {});

  const zip = new JSZip();

  // Añadir partidos al ZIP
  Object.entries(matchesByCategoryAndSex).forEach(
    ([key, matchesInCategory]) => {
      const fileName = `${key}_matches.json`;
      const fileContent = JSON.stringify(matchesInCategory, null, 2);
      zip.file(fileName, fileContent);
    },
  );

  // Añadir disponibilidad horaria al ZIP
  const availabilityFileName = "availability_data.json";
  const availabilityFileContent = JSON.stringify(availabilityData, null, 2);
  zip.file(availabilityFileName, availabilityFileContent);

  // Añadir inscripciones al ZIP
  const tournamentFileName = "tournament_data.json";
  const tournamentFileContent = JSON.stringify(tournamentData, null, 2);
  zip.file(tournamentFileName, tournamentFileContent);

  // Generar y descargar el ZIP
  zip
    .generateAsync({ type: "blob" })
    .then((content) => {
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = "tournament_data.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    })
    .catch((error) => {
      console.error("Error al generar el archivo ZIP:", error);
    });
}

// Manejar la importación de partidos desde un archivo ZIP
document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("import-zip");
  fileInput.addEventListener("change", importMatchesFromZip);
});

// Funciones adicionales para importar y guardar partidos
function importMatchesFromZip() {
  localStorage.removeItem("tournamentMatches");
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
            promises.push(
              zipEntry.async("string").then((fileContent) => {
                return { name: zipEntry.name, content: fileContent };
              }),
            );
          }
        });

        Promise.all(promises)
          .then((filesContent) => {
            filesContent.forEach(({ name, content }) => {
              const data = JSON.parse(content);
              if (name.includes("matches")) {
                saveMatches(data);
              } else if (name === "availability_data.json") {
                localStorage.setItem("availabilityData", JSON.stringify(data));
              } else if (name === "tournament_data.json") {
                localStorage.setItem("tournamentData", JSON.stringify(data));
              }
            });

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
