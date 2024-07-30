document
  .getElementById("fileInput")
  .addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file && file.type === "application/json") {
      const reader = new FileReader();
      reader.onload = function (event) {
        try {
          const json = JSON.parse(event.target.result);
          generateTournament(json);
        } catch (error) {
          console.error("Error parsing JSON file:", error);
          alert("Error parsing JSON file. Please check the file format.");
        }
      };
      reader.onerror = function (error) {
        console.error("Error reading file:", error);
        alert("Error reading file. Please try again.");
      };
      reader.readAsText(file);
    } else {
      alert("Please upload a valid JSON file.");
    }
  });

function generateTournament(data) {
  if (!Array.isArray(data) || data.length === 0) {
    alert("The tournament data is empty or not formatted correctly.");
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
      "Cuartos de Final": 1,
      Semifinal: 2,
      Final: 3,
    };
    return roundOrder[a] - roundOrder[b];
  });

  const roundPositions = {};

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

      matchDiv.innerHTML = `<div class="pair">${pair1}</div><div class="connector"></div><div class="pair">${pair2}</div>`;

      if (match.schedule) {
        const scheduleDiv = document.createElement("div");
        scheduleDiv.classList.add("schedule");
        scheduleDiv.innerText = `${match.schedule.day}, ${match.schedule.time}, ${match.schedule.court}`;
        matchDiv.appendChild(scheduleDiv);
      }

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

      // Draw the connectors
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
  });
}
