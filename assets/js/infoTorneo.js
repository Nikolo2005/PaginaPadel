document.addEventListener("DOMContentLoaded", () => {
  const tournamentData =
    safeParseJSON(localStorage.getItem("tournamentData")) || [];
  const tournamentMatches =
    safeParseJSON(localStorage.getItem("tournamentMatches")) || [];
  const totalPlayers = new Set();
  const totalPairs = new Set();
  let totalByes = 0;

  tournamentData.forEach((pair) => {
    totalPlayers.add(pair.player1);
    totalPlayers.add(pair.player2);
    totalPairs.add(pair);
  });

  tournamentMatches.forEach((match) => {
    if (match.pair1.player1 === "BYE" || match.pair2.player1 === "BYE") {
      totalByes++;
    }
  });

  document.getElementById("total-count").textContent = tournamentMatches.length;
  document.getElementById("total-categories-count").textContent =
    new Set(tournamentMatches.map((match) => match.category)).size / 2;
  document.getElementById("total-rounds-count").textContent = new Set(
    tournamentMatches.map((match) => match.round),
  ).size;
  document.getElementById("total-players-count").textContent =
    totalPairs.size * 2;
  document.getElementById("total-pairs-count").textContent = totalPairs.size;
  document.getElementById("total-byes-count").textContent = totalByes;
});

function safeParseJSON(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Failed to parse JSON:", error);
    return null;
  }
}
