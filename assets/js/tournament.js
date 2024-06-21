const availabilityTable = {
    "Viernes": {
        "Viernes":[],
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
        
        // Más horas según sea necesario...
    },
};

document.addEventListener('DOMContentLoaded', () => {
    populateAvailabilityTable();
    loadStoredData();
    addAvailabilityListeners();
    restoreAvailability();
});

function addAvailabilityListeners() {
    const cells = document.querySelectorAll('#availability td');
    cells.forEach(cell => {
        const checkbox = cell.querySelector('input[type="checkbox"]');
        if (checkbox) {
            cell.addEventListener('click', function () {
                checkbox.checked = !checkbox.checked;
                const day = checkbox.dataset.day;
                const time = checkbox.dataset.time;
                const pista = checkbox.dataset.pista;
                updateAvailabilityData(day, time, pista, checkbox.checked);
            });

            checkbox.addEventListener('click', function (event) {
                event.stopPropagation();
            });
        }
    });
}

function updateAvailabilityData(day, time, pista, isChecked) {
    let availabilityData = JSON.parse(localStorage.getItem('availabilityData')) || {};
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
        availabilityData[day][time] = availabilityData[day][time].filter(item => item !== pista);
    }
    localStorage.setItem('availabilityData', JSON.stringify(availabilityData));
}

function loadStoredData() {
    const storedData = JSON.parse(localStorage.getItem('tournamentData'));
    if (storedData) {
        displayPairsInTournament(storedData);
    }

    const storedMatches = JSON.parse(localStorage.getItem('tournamentMatches'));
    if (storedMatches) {
        displayMatches(storedMatches);
    }

    const availabilityData = JSON.parse(localStorage.getItem('availabilityData'));
    if (availabilityData) {
        restoreAvailability(availabilityData);
    }
}

function restoreAvailability(availabilityData) {
    Object.keys(availabilityData).forEach(day => {
        Object.keys(availabilityData[day]).forEach(time => {
            availabilityData[day][time].forEach(pista => {
                const checkbox = document.querySelector(`#availability input[type="checkbox"][data-day="${day}"][data-time="${time}"][data-pista="${pista}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        });
    });
}

function populateAvailabilityTable() {
    const tbody = document.querySelector('#availability tbody');
    tbody.innerHTML = '';

    Object.keys(availabilityTable).forEach(day => {
        Object.keys(availabilityTable[day]).forEach(time => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${time}</td>`;
            availabilityTable[day][time].forEach((pista, index) => {
                const cell = document.createElement('td');
                cell.innerHTML = `<input type="checkbox" data-day="${day}" data-time="${time}" data-pista="${pista}">`;
                row.appendChild(cell);
            });
            tbody.appendChild(row);
        });
    });
}

const form = document.getElementById('tournament-form');
const matchesTableBody = document.getElementById('matches-body');
const deleteAllButton = document.getElementById('delete-all-btn');
const generateMatchesButton = document.getElementById('generate-matches-btn');
const generateCSVButton = document.getElementById('generate-csv-btn');

deleteAllButton.addEventListener('click', function () {
    const confirmDelete = confirm('¿Estás seguro de que deseas borrar todas las parejas y datos guardados?');
    if (confirmDelete) {
        localStorage.removeItem('tournamentData');
        localStorage.removeItem('tournamentMatches');
        document.getElementById('tournament-body').innerHTML = '';
        matchesTableBody.innerHTML = '';
    }
});

form.addEventListener('submit', function (event) {
    event.preventDefault();
    const pairInput = document.getElementById('pair').value;
    const category = document.getElementById('category').value;
    const sex = document.getElementById('sex').value;
    const pairArray = pairInput.split('-').map(name => name.trim());
    if (pairArray.length === 2) {
        const pair = { player1: pairArray[0], player2: pairArray[1], category, sex };
        let storedData = JSON.parse(localStorage.getItem('tournamentData')) || [];
        storedData.push(pair);
        localStorage.setItem('tournamentData', JSON.stringify(storedData));
        displayPairsInTournament(storedData);
    } else {
        alert('Debe ingresar dos nombres separados por un guión para formar una pareja.');
    }
});

function displayPairsInTournament(pairs) {
    const tableBody = document.getElementById('tournament-body');
    tableBody.innerHTML = '';
    pairs.forEach(pair => {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `<td>${pair.player1} - ${pair.player2}</td><td>${pair.category}</td><td>${pair.sex}</td><td><button onclick="deletePair(this)">Eliminar</button></td>`;
        tableBody.appendChild(newRow);
    });
}

function deletePair(button) {
    const row = button.parentElement.parentElement;
    const pairNames = row.cells[0].textContent.split(' - ');
    const player1 = pairNames[0].trim();
    const player2 = pairNames[1].trim();
    let storedData = JSON.parse(localStorage.getItem('tournamentData')) || [];
    storedData = storedData.filter(pair => !(pair.player1 === player1 && pair.player2 === player2));
    localStorage.setItem('tournamentData', JSON.stringify(storedData));
    displayPairsInTournament(storedData);
}

generateMatchesButton.addEventListener('click', function () {
    const storedData = JSON.parse(localStorage.getItem('tournamentData'));
    const selectedTimes = getSelectedTimes();
    if (storedData && storedData.length >= 2 && selectedTimes.length > 0) {
        let matches;
        do {
            matches = createMatches(storedData, selectedTimes);
        } while (containsInvalidMatches(matches));
        localStorage.setItem('tournamentMatches', JSON.stringify(matches));
        displayMatches(matches);
    } else {
        alert('Debe haber al menos dos parejas y una disponibilidad seleccionada para generar partidos.');
    }
});

function getSelectedTimes() {
    const selectedTimes = [];
    const checkboxes = document.querySelectorAll('#availability input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        const timeData = {
            day: checkbox.dataset.day,
            time: checkbox.dataset.time,
            pista: checkbox.dataset.pista,
        };
        selectedTimes.push(timeData);
    });
    return selectedTimes;
}

function containsInvalidMatches(matches) {
    return matches.some(match => match.pair1.player1.startsWith('BYE') && match.pair2.player1.startsWith('BYE'));
}

function createMatches(pairs, selectedTimes) {
    const matches = [];
    let totalByes = 0;
    let totalPairs = 0;
    let availabilitySufficient = true;

    // Shuffle function (Fisher-Yates shuffle)
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Group pairs by category and sex
    const pairsByCategoryAndSex = pairs.reduce((acc, pair) => {
        const key = `${pair.category}-${pair.sex}`;
        acc[key] = acc[key] || [];
        acc[key].push(pair);
        return acc;
    }, {});

    // Check if there is enough availability for all rounds in all categories and sexes
    let totalRequiredMatches = 0;

    Object.keys(pairsByCategoryAndSex).forEach(key => {
        let pairsInCategoryAndSex = pairsByCategoryAndSex[key];
        const totalPairsCategoryAndSex = pairsInCategoryAndSex.length;
        totalPairs += totalPairsCategoryAndSex;
        const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(totalPairsCategoryAndSex)));
        totalByes += nextPowerOf2 - totalPairsCategoryAndSex;
        totalRequiredMatches += nextPowerOf2 - 1;
    });

    if (totalRequiredMatches > selectedTimes.length) {
        availabilitySufficient = false;
    }

    if (!availabilitySufficient) {
        alert('No hay suficiente disponibilidad para generar los partidos. Seleccione más disponibilidad.');
        return [];
    }

    let timeIndex = 0;

    Object.keys(pairsByCategoryAndSex).forEach(key => {
        let pairsInCategoryAndSex = pairsByCategoryAndSex[key];

        // Calculate total pairs and ensure it's a power of 2
        const totalPairsCategoryAndSex = pairsInCategoryAndSex.length;
        const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(totalPairsCategoryAndSex)));
        const additionalByes = nextPowerOf2 - totalPairsCategoryAndSex;

        // Generate additional byes
        const byes = Array.from({ length: additionalByes }, () => ({
            player1: 'BYE',
            player2: '',
            category: pairsInCategoryAndSex[0].category,
            sex: pairsInCategoryAndSex[0].sex,
        }));

        // Merge real pairs with byes
        const mergedPairs = [...pairsInCategoryAndSex, ...byes];

        // Shuffle mergedPairs
        const shuffledPairs = shuffle(mergedPairs);

        // Generate matches for the first round within the category and sex
        let currentRoundPairs = shuffledPairs;
        let roundNumber = 1;

        while (currentRoundPairs.length > 1) {
            const nextRoundPairs = [];
            for (let i = 0; i < currentRoundPairs.length; i += 2) {
                const pair1 = currentRoundPairs[i];
                const pair2 = currentRoundPairs[i + 1];

                const matchTime = selectedTimes[timeIndex % selectedTimes.length];
                timeIndex++;

                matches.push({
                    pair1: pair1,
                    pair2: pair2,
                    time: matchTime,
                    category: pairsInCategoryAndSex[0].category,
                    sex: pairsInCategoryAndSex[0].sex,
                    round: roundNumber,
                });

                // For the next round, we push a placeholder pair
                nextRoundPairs.push({
                    player1: '',
                    player2: '',
                    category: pairsInCategoryAndSex[0].category,
                    sex: pairsInCategoryAndSex[0].sex,
                });
            }
            currentRoundPairs = nextRoundPairs;
            roundNumber++;
        }
    });

    return matches;
}

function displayMatches(matches) {
    matchesTableBody.innerHTML = '';
    matches.forEach((match, index) => {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${match.category}</td>
            <td>${match.pair1.player1 ? `${match.pair1.player1} - ${match.pair1.player2}` : 'TBD'}</td>
            <td>${match.pair2.player1 ? `${match.pair2.player1} - ${match.pair2.player2}` : 'TBD'}</td>
            <td>${match.time.time}</td>
            <td>${match.time.pista}</td>
            <td>${match.time.day}</td>
            <td>${match.sex}</td>
            <td>Ronda ${match.round}</td>
        `;
        matchesTableBody.appendChild(newRow);
    });
}

generateCSVButton.addEventListener('click', function () {
    const storedMatches = JSON.parse(localStorage.getItem('tournamentMatches'));
    if (storedMatches) {
        const matchesByCategoryAndSex = groupMatchesByCategoryAndSex(storedMatches);
        Object.keys(matchesByCategoryAndSex).forEach(category => {
            Object.keys(matchesByCategoryAndSex[category]).forEach(sex => {
                const matches = matchesByCategoryAndSex[category][sex];
                const csvContent = convertMatchesToCSV(matches);
                downloadCSV(csvContent, `partidos_${category}_${sex}.csv`);
            });
        });
    } else {
        alert('No hay partidos generados para exportar.');
    }
});

function groupMatchesByCategoryAndSex(matches) {
    return matches.reduce((acc, match) => {
        const category = match.category;
        const sex = match.sex;
        acc[category] = acc[category] || { masculino: [], femenino: [], mixto: [] };
        acc[category][sex].push(match);
        return acc;
    }, {});
}

function convertMatchesToCSV(matches) {
    const rows = matches.map(match => [
        match.category,
        `${match.pair1.player1} - ${match.pair1.player2}`,
        `${match.pair2.player1} - ${match.pair2.player2}`,
        match.time.time,
        match.time.pista,
        match.time.day,
        match.sex,
        `Ronda ${match.round}`,
    ]);

    const csvContent = rows.map(row => row.join(',')).join('\n');
    return csvContent;
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

