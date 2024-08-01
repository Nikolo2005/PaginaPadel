document
  .getElementById("fileInput")
  .addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file && file.type === "application/json") {
      const reader = new FileReader();
      reader.onload = function (event) {
        try {
          const json = JSON.parse(event.target.result);
          generateTournament(json, file.name);
        } catch (error) {
          console.error("Error parsing JSON file:", error);
          alert(
            "Error al analizar el archivo JSON. Por favor, verifica el formato.",
          );
        }
      };
      reader.onerror = function (error) {
        console.error("Error reading file:", error);
        alert("Error al leer el archivo. Inténtalo de nuevo.");
      };
      reader.readAsText(file);
    } else {
      alert("Por favor, sube un archivo JSON válido.");
    }
  });

function generateTournament(data, fileName) {
  if (!Array.isArray(data) || data.length === 0) {
    alert(
      "Los datos del torneo están vacíos o no están formateados correctamente.",
    );
    return;
  }

  const tournamentDiv = document.getElementById("tournament");
  tournamentDiv.innerHTML = "";

  const rounds = {};

  data.forEach((match) => {
    const round = match.round;
    if (!rounds[round]) {
      rounds[round] = [];
    }
    rounds[round].push(match);
  });

  const sortedRounds = Object.keys(rounds).sort((a, b) => {
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

      const pair1 = match.pair1.player1
        ? `${match.pair1.player1} - ${match.pair1.player2}`
        : "‎ ";
      const pair2 = match.pair2.player1
        ? `${match.pair2.player1} - ${match.pair2.player2}`
        : "‎ ";

      const pair1Div = document.createElement("div");
      pair1Div.classList.add("pair");
      pair1Div.textContent = pair1;

      const pair2Div = document.createElement("div");
      pair2Div.classList.add("pair");
      pair2Div.textContent = pair2;

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

    tournamentDiv.appendChild(roundDiv);

    const lastMatchIndex = rounds[round].length - 1;
    const lastMatchPosition = roundPositions[round][lastMatchIndex];
    totalHeight = Math.max(totalHeight, lastMatchPosition + 90);
  });

  tournamentDiv.style.height = `${totalHeight + 100}px`;
}

document.getElementById("downloadPdf").addEventListener("click", function () {
  html2canvas(document.querySelector("#tournament"), { scale: 2 }).then(
    (canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jspdf.jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save("tournament.pdf");
    },
  );
});
