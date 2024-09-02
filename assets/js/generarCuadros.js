document.addEventListener("DOMContentLoaded", function () {
  let categories = {};

  // Recuperar datos de localStorage si existen
  const savedCategories = localStorage.getItem("categories");
  if (savedCategories) {
    categories = JSON.parse(savedCategories);
    renderTournaments();
  }

  const fileInputZip = document.getElementById("fileInputZip");
  const delCuadros = document.getElementById("delCuadros");

  if (fileInputZip) {
    fileInputZip.addEventListener("change", handleFileInput);
  } else {
    console.error("Element with id 'fileInputZip' not found.");
  }

  if (delCuadros) {
    delCuadros.addEventListener("click", deleteTournaments);
  } else {
    console.error("Element with id 'delCuadros' not found.");
  }

  function handleFileInput(event) {
    const file = event.target.files[0];
    if (file && file.type === "application/zip") {
      const reader = new FileReader();
      reader.onload = function (event) {
        JSZip.loadAsync(event.target.result)
          .then(processZipFile)
          .catch(handleError);
      };
      reader.onerror = handleError;
      reader.readAsArrayBuffer(file);
    } else {
      alert("Por favor, sube un archivo ZIP válido.");
    }
  }

  function processZipFile(zip) {
    const filePromises = [];
    zip.forEach((relativePath, zipEntry) => {
      if (
        zipEntry.name.endsWith(".json") &&
        !zipEntry.name.includes("tournament_data") &&
        !zipEntry.name.includes("availability_data")
      ) {
        filePromises.push(
          zipEntry.async("string").then((fileData) => {
            try {
              const json = JSON.parse(fileData);
              const isConsolation = zipEntry.name.startsWith("consolation-");
              const categoryName = isConsolation
                ? zipEntry.name.replace("consolation-", "").split("_")[0]
                : zipEntry.name.split("_")[0];
              if (!categories[categoryName]) {
                categories[categoryName] = {};
              }
              if (isConsolation) {
                categories[categoryName].consolation = json;
              } else {
                categories[categoryName].main = json;
              }
            } catch (error) {
              console.error("Error parsing JSON file:", error);
              alert(
                "Error al analizar el archivo JSON. Por favor, verifica el formato.",
              );
            }
          }),
        );
      }
    });

    Promise.all(filePromises)
      .then(() => {
        // Guardar datos en localStorage
        localStorage.setItem("categories", JSON.stringify(categories));
        renderTournaments();
      })
      .catch(handleError);
  }

  function handleError(error) {
    console.error("Error:", error);
    alert("Ocurrió un error. Inténtalo de nuevo.");
  }

  function renderTournaments() {
    const container = document.getElementById("tournament-container");
    container.innerHTML = "";

    Object.keys(categories).forEach((categoryName) => {
      const category = categories[categoryName];

      const categoryContainer = document.createElement("div");
      categoryContainer.classList.add("category-container");

      // Crear y añadir el título de la categoría
      const categoryTitle = document.createElement("h2");
      categoryTitle.textContent = categoryName;

      // Crear y añadir el botón de descarga
      const downloadButton = document.createElement("button");
      downloadButton.textContent = "Descargar Cuadro";
      downloadButton.addEventListener("click", () =>
        downloadCategory(categoryName, categoryContainer),
      );

      // Contenedor para el título y el botón
      const titleContainer = document.createElement("div");
      titleContainer.classList.add("title-container");
      titleContainer.appendChild(categoryTitle);
      titleContainer.appendChild(downloadButton);

      categoryContainer.appendChild(titleContainer);

      if (category.main) {
        const mainDiv = document.createElement("div");
        mainDiv.classList.add("tournament");
        generateTournament(category.main, mainDiv, "main");
        categoryContainer.appendChild(mainDiv);
      }

      if (category.consolation) {
        const consolationDiv = document.createElement("div");
        consolationDiv.classList.add("consolation");
        generateTournament(category.consolation, consolationDiv, "consolation");
        categoryContainer.appendChild(consolationDiv);
      }

      container.appendChild(categoryContainer);
    });
  }

  function deleteTournaments() {
    const container = document.getElementById("tournament-container");
    container.innerHTML = "";
    localStorage.removeItem("categories");
    categories = {};
  }

  function downloadCategory(categoryName, categoryContainer) {
    html2canvas(categoryContainer, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jspdf.jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`${categoryName}.pdf`);
    });
  }

  function generateTournament(data, container, type) {
    if (!Array.isArray(data) || data.length === 0) {
      alert(
        "Los datos del torneo están vacíos o no están formateados correctamente.",
      );
      return;
    }

    // Limpiar el contenido del contenedor antes de regenerar el cuadro
    container.innerHTML = "";

    let rounds = {};
    let sortedRounds = [];

    data.forEach((match) => {
      const round = match.round;
      if (!rounds[round]) {
        rounds[round] = [];
      }
      rounds[round].push(match);
    });

    sortedRounds = Object.keys(rounds).sort((a, b) => {
      const roundOrder = {
        "Treintaidosavos de Final": 0,
        "Cuartos de Final": 1,
        Semifinal: 2,
        Final: 3,
      };
      return roundOrder[a] - roundOrder[b];
    });

    const roundPositions = {};
    let totalHeight = 0;

    sortedRounds.forEach((round, roundIndex) => {
      const roundDiv = document.createElement("div");
      roundDiv.classList.add("round");
      roundDiv.innerHTML = `<p>${round}</p>`;

      roundPositions[round] = [];

      rounds[round].forEach((match, matchIndex) => {
        const matchWrapperDiv = document.createElement("div");
        matchWrapperDiv.classList.add("match-wrapper");

        const matchDiv = document.createElement("div");
        matchDiv.classList.add("match");

        const pair1 =
          match.pair1 && match.pair1.player1
            ? match.pair1.player1 === "BYE"
              ? "BYE"
              : `${match.pair1.player1} - ${match.pair1.player2}`
            : null;
        const pair2 =
          match.pair2 && match.pair2.player1
            ? match.pair2.player1 === "BYE"
              ? "BYE"
              : `${match.pair2.player1} - ${match.pair2.player2}`
            : null;

        const pair1Div = document.createElement("div");
        pair1Div.classList.add("pair");
        pair1Div.textContent = pair1 || "‎ ";

        const pair2Div = document.createElement("div");
        pair2Div.classList.add("pair");
        pair2Div.textContent = pair2 || "‎ ";

        // Verificar si todos los jugadores de ambas parejas no están vacíos
        const allPlayersPresent =
          match.pair1.player1 &&
          match.pair1.player2 &&
          match.pair2.player1 &&
          match.pair2.player2;

        if (allPlayersPresent) {
          if (pair1 && pair1 !== "BYE") {
            const advanceButton1 = document.createElement("button");
            advanceButton1.textContent = "➜";
            advanceButton1.classList.add("advance-button");
            advanceButton1.addEventListener("click", () =>
              advancePair(
                pair1,
                roundIndex,
                matchIndex,
                1,
                container,
                sortedRounds,
                rounds,
              ),
            );
            pair1Div.appendChild(advanceButton1);
          }
          if (pair2 && pair2 !== "BYE") {
            const advanceButton2 = document.createElement("button");
            advanceButton2.textContent = "➜";
            advanceButton2.classList.add("advance-button");
            advanceButton2.addEventListener("click", () =>
              advancePair(
                pair2,
                roundIndex,
                matchIndex,
                2,
                container,
                sortedRounds,
                rounds,
              ),
            );
            pair2Div.appendChild(advanceButton2);
          }
        }

        matchDiv.appendChild(pair1Div);

        if (match.schedule) {
          const scheduleDiv = document.createElement("div");
          scheduleDiv.classList.add("schedule");
          scheduleDiv.innerText = `${match.schedule.day}, ${match.schedule.time}, ${match.schedule.court}`;
          matchDiv.appendChild(scheduleDiv);
        }

        matchDiv.appendChild(pair2Div);
        matchWrapperDiv.appendChild(matchDiv);

        let topPosition;
        if (roundIndex === 0) {
          topPosition = matchIndex * 90;
        } else {
          const prevRound = sortedRounds[roundIndex - 1];
          const prevRoundMatches = roundPositions[prevRound];
          const prevMatch1 = prevRoundMatches[matchIndex * 2];
          const prevMatch2 = prevRoundMatches[matchIndex * 2 + 1];
          topPosition = (prevMatch1 + prevMatch2) / 2;
        }

        matchWrapperDiv.style.position = "absolute";
        matchWrapperDiv.style.top = `${topPosition}px`;
        roundPositions[round].push(topPosition);

        roundDiv.appendChild(matchWrapperDiv);

        if (roundIndex > 0) {
          const leftConnectorDiv = document.createElement("div");
          leftConnectorDiv.classList.add("round-connector-left");
          matchWrapperDiv.appendChild(leftConnectorDiv);

          const verticalConnectorDiv = document.createElement("div");
          verticalConnectorDiv.classList.add("vertical-connector");

          const prevRound = sortedRounds[roundIndex - 1];
          const prevRoundMatches = roundPositions[prevRound];
          const topPrevMatch1 = prevRoundMatches[matchIndex * 2];
          const topPrevMatch2 = prevRoundMatches[matchIndex * 2 + 1];
          const height = Math.abs(topPrevMatch1 - topPrevMatch2);

          verticalConnectorDiv.style.height = `${height}px`;
          matchWrapperDiv.appendChild(verticalConnectorDiv);
        }

        if (roundIndex < sortedRounds.length - 1) {
          const rightConnectorDiv = document.createElement("div");
          rightConnectorDiv.classList.add("round-connector-right");
          matchWrapperDiv.appendChild(rightConnectorDiv);
        }
      });

      container.appendChild(roundDiv);

      const lastMatchIndex = rounds[round].length - 1;
      const lastMatchPosition = roundPositions[round][lastMatchIndex];
      totalHeight = Math.max(totalHeight, lastMatchPosition + 90);
    });

    container.style.height = `${totalHeight + 100}px`;

    // Guardar datos actualizados en localStorage
    localStorage.setItem("categories", JSON.stringify(categories));
  }

  function advancePair(
    pair,
    roundIndex,
    matchIndex,
    pairIndex,
    container,
    sortedRounds,
    rounds,
    isAuto = false,
  ) {
    const nextRoundIndex = roundIndex + 1;

    if (nextRoundIndex >= sortedRounds.length) {
      alert("No hay más rondas.");
      return;
    }

    const nextRound = sortedRounds[nextRoundIndex];
    const nextMatchIndex = Math.floor(matchIndex / 2);
    const nextMatch = rounds[nextRound][nextMatchIndex];

    console.log(`Avanzando pareja: ${pair}`);
    console.log(
      `Ronda actual: ${sortedRounds[roundIndex]}, Partido actual: ${matchIndex}`,
    );
    console.log(
      `Siguiente ronda: ${nextRound}, Siguiente partido: ${nextMatchIndex}`,
    );
    console.log(`Estado actual del siguiente partido:`, nextMatch);

    // Colocar la pareja en pair1 para partidos impares y en pair2 para partidos pares dentro de la misma ronda
    if (matchIndex % 2 === 0) {
      nextMatch.pair1 = {
        player1: pair.split(" - ")[0],
        player2: pair.split(" - ")[1],
      };
    } else {
      nextMatch.pair2 = {
        player1: pair.split(" - ")[0],
        player2: pair.split(" - ")[1],
      };
    }

    console.log(`Estado actualizado del siguiente partido:`, nextMatch);

    const currentMatch = rounds[sortedRounds[roundIndex]][matchIndex];
    currentMatch.advanced = true;

    // Guardar datos actualizados en localStorage
    localStorage.setItem("categories", JSON.stringify(categories));

    if (!isAuto) {
      generateTournament(
        Object.values(rounds).flat(),
        container,
        sortedRounds,
        rounds,
      );
    }
  }
});
