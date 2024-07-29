document.addEventListener("DOMContentLoaded", () => {
  addEventListeners();
  const matches = JSON.parse(localStorage.getItem("tournamentMatches")) || [];
  displayMatchesByCategory(matches);
  setupPopup();
});

function addEventListeners() {
  document
    .getElementById("delete-all-btn")
    .addEventListener("click", deleteAllData);
  document
    .getElementById("generate-matches-btn")
    .addEventListener("click", generateMatches);
  document
    .getElementById("generate-json-btn")
    .addEventListener("click", generateJSON);
}

function deleteAllData() {
  if (
    confirm(
      "¿Estás seguro de que deseas borrar todas las parejas y datos guardados?",
    )
  ) {
    localStorage.removeItem("tournamentMatches");
    document.getElementById("matches-body").innerHTML = "";
  }
}

function generateMatches() {
  const storedData = JSON.parse(localStorage.getItem("tournamentData"));
  if (!storedData || storedData.length < 2) {
    alert("Debe haber al menos dos parejas para generar partidos.");
    return;
  }

  const matches = createMatches(storedData);
  if (containsInvalidMatches(matches)) {
    alert("No se pueden generar partidos válidos.");
    return;
  }

  localStorage.setItem("tournamentMatches", JSON.stringify(matches));
  displayMatchesByCategory(matches);
}

function containsInvalidMatches(matches) {
  return matches.some(
    (match) => match.pair1.player1 === "BYE" && match.pair2.player1 === "BYE",
  );
}

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
          schedule: null, // Placeholder for schedule details
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

function displayMatchesByCategory(matches) {
  const matchesBody = document.getElementById("matches-body");
  matchesBody.innerHTML = "";

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
      categoryRow.innerHTML = `<td colspan="5">${key}</td>`;
      categoryRow.addEventListener("click", () => toggleCategoryMatches(key));
      matchesBody.appendChild(categoryRow);

      matchesInCategory.forEach((match, index) => {
        const row = document.createElement("tr");
        row.classList.add("hidden-row", `${key}-matches`);
        row.innerHTML = `
        <td class="overflow-cell">${match.pair1.player1 !== "BYE" ? `${match.pair1.player1} - ${match.pair1.player2}` : "BYE"}</td>
        <td class="overflow-cell">${match.pair2.player1 !== "BYE" ? `${match.pair2.player1} - ${match.pair2.player2}` : "BYE"}</td>
        <td>${match.round}</td>
        <td>${match.schedule ? `${match.schedule.day} ${match.schedule.time} ${match.schedule.court}` : "No programado"}</td>
        ${
          match.pair1.player1 !== "BYE" && match.pair2.player1 !== "BYE"
            ? `<td><button class="edit-btn" data-match-index="${index}" data-category="${key}">Editar</button></td>`
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

  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      const matchIndex = event.target.getAttribute("data-match-index");
      const category = event.target.getAttribute("data-category");
      openSchedulePopup(category, matchIndex);
    });
  });
}

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

function generateJSON() {
  const matches = JSON.parse(localStorage.getItem("tournamentMatches")) || [];
  const matchesByCategoryAndSex = matches.reduce((acc, match) => {
    const key = `${match.category}-${match.sex}`;
    (acc[key] = acc[key] || []).push(match);
    return acc;
  }, {});

  Object.entries(matchesByCategoryAndSex).forEach(
    ([key, matchesInCategory]) => {
      const blob = new Blob([JSON.stringify(matchesInCategory, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${key}_matches.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
  );
}

function setupPopup() {
  const popup = document.getElementById("schedule-popup");
  document
    .getElementById("cancel-schedule-btn")
    .addEventListener("click", () => {
      popup.style.display = "none";
    });
}

let currentEditingCategory = "";
let currentEditingMatchIndex = -1;

function openSchedulePopup(category, matchIndex) {
  const matches = JSON.parse(localStorage.getItem("tournamentMatches")) || [];
  const matchesByCategoryAndSex = matches.reduce((acc, match) => {
    const key = `${match.category}-${match.sex}`;
    (acc[key] = acc[key] || []).push(match);
    return acc;
  }, {});

  const match = matchesByCategoryAndSex[category][matchIndex];

  currentEditingCategory = category;
  currentEditingMatchIndex = matchIndex;

  const availabilityData =
    JSON.parse(localStorage.getItem("availabilityData")) || {};
  const savedMatches =
    JSON.parse(localStorage.getItem("tournamentMatches")) || [];
  const popup = document.getElementById("schedule-popup");
  const dayInput = document.getElementById("day-input");
  const timeInput = document.getElementById("time-input");
  const courtInput = document.getElementById("court-input");

  // Clear previous options and selections
  dayInput.innerHTML = "<option value='' selected>Selecciona un día</option>";
  timeInput.innerHTML =
    "<option value='' selected>Selecciona una hora</option>";
  courtInput.innerHTML =
    "<option value='' selected>Selecciona una pista</option>";

  // Populate day options
  Object.keys(availabilityData).forEach((day) => {
    const option = document.createElement("option");
    option.value = day;
    option.textContent = day;
    dayInput.appendChild(option);
  });

  dayInput.addEventListener("change", updateTimes);
  timeInput.addEventListener("change", updateCourts);

  function updateTimes() {
    const selectedDay = dayInput.value;
    timeInput.innerHTML =
      "<option value='' selected>Selecciona una hora</option>";
    courtInput.innerHTML =
      "<option value='' selected>Selecciona una pista</option>"; // Clear courts on day change

    if (availabilityData[selectedDay]) {
      Object.keys(availabilityData[selectedDay]).forEach((time) => {
        if (hasAvailableCourts(selectedDay, time)) {
          const option = document.createElement("option");
          option.value = time;
          option.textContent = time;
          timeInput.appendChild(option);
        }
      });
    }
  }

  function updateCourts() {
    const selectedDay = dayInput.value;
    const selectedTime = timeInput.value;
    courtInput.innerHTML =
      "<option value='' selected>Selecciona una pista</option>"; // Clear previous courts

    if (
      availabilityData[selectedDay] &&
      availabilityData[selectedDay][selectedTime]
    ) {
      const availableCourts = availabilityData[selectedDay][
        selectedTime
      ].filter((court) => {
        return !savedMatches.some(
          (m) =>
            m.schedule &&
            m.schedule.day === selectedDay &&
            m.schedule.time === selectedTime &&
            m.schedule.court === court,
        );
      });

      // Combine available and unavailable courts, sorting by number
      const allCourts = availabilityData[selectedDay][selectedTime].map(
        (court) => ({
          court,
          isAvailable: availableCourts.includes(court),
        }),
      );

      allCourts.sort((a, b) => {
        const numA = parseInt(a.court.match(/\d+/), 10); // Extract numbers from string
        const numB = parseInt(b.court.match(/\d+/), 10);
        return numA - numB;
      });

      allCourts.forEach(({ court, isAvailable }) => {
        const option = document.createElement("option");
        option.value = court;
        option.textContent = court;
        if (!isAvailable) {
          option.disabled = true;
        }
        courtInput.appendChild(option);
      });
    }
  }

  function hasAvailableCourts(day, time) {
    const occupiedCourts = savedMatches
      .filter(
        (m) => m.schedule && m.schedule.day === day && m.schedule.time === time,
      )
      .map((m) => m.schedule.court);

    return availabilityData[day][time].some(
      (court) => !occupiedCourts.includes(court),
    );
  }

  // Save schedule
  document.getElementById("save-schedule-btn").onclick = () => {
    const selectedDay = dayInput.value;
    const selectedTime = timeInput.value;
    const selectedCourt = courtInput.value;

    if (!selectedDay || !selectedTime || !selectedCourt) {
      alert("Por favor, complete todos los campos.");
      return;
    }

    match.schedule = {
      day: selectedDay,
      time: selectedTime,
      court: selectedCourt,
    };

    const matches = JSON.parse(localStorage.getItem("tournamentMatches")) || [];
    const matchesByCategoryAndSex = matches.reduce((acc, match) => {
      const key = `${match.category}-${match.sex}`;
      (acc[key] = acc[key] || []).push(match);
      return acc;
    }, {});

    if (currentEditingCategory && currentEditingMatchIndex > -1) {
      matchesByCategoryAndSex[currentEditingCategory][
        currentEditingMatchIndex
      ] = match;
      const updatedMatches = Object.values(matchesByCategoryAndSex).flat();
      localStorage.setItem("tournamentMatches", JSON.stringify(updatedMatches));
      displayMatchesByCategory(updatedMatches);
    }

    popup.style.display = "none";
  };

  popup.style.display = "flex";
}
