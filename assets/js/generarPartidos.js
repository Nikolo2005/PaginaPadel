document.addEventListener('DOMContentLoaded', () => {
    addEventListeners();
    // Attempt to display matches on page load
    const matches = JSON.parse(localStorage.getItem('tournamentMatches')) || [];
    displayMatches(matches);
});


function addEventListeners() {
    const deleteAllButton = document.getElementById('delete-all-btn');
    const generateMatchesButton = document.getElementById('generate-matches-btn');
    const generateCSVButton = document.getElementById('generate-csv-btn');

    deleteAllButton.addEventListener('click', deleteAllData);
    generateMatchesButton.addEventListener('click', generateMatches);
    generateCSVButton.addEventListener('click', generateCSV);
}

function deleteAllData() {
    const confirmDelete = confirm('¿Estás seguro de que deseas borrar todas las parejas y datos guardados?');
    if (confirmDelete) {
        localStorage.removeItem('tournamentData');
        localStorage.removeItem('tournamentMatches');
        // No se manipula directamente el DOM relacionado con 'tournament-body'
    }
}

function generateMatches() {
    const storedData = JSON.parse(localStorage.getItem('tournamentData'));
    const availabilityData = JSON.parse(localStorage.getItem('availabilityData'));

    if (storedData && storedData.length >= 2 && availabilityData) {
        let matches;
        do {
            matches = createMatches(storedData, availabilityData);
        } while (containsInvalidMatches(matches));
        localStorage.setItem('tournamentMatches', JSON.stringify(matches));
        displayMatches(matches);
    } else {
        alert('Debe haber al menos dos parejas y una disponibilidad seleccionada para generar partidos.');
    }
}

function containsInvalidMatches(matches) {
    return matches.some(match => match.pair1.player1.startsWith('BYE') && match.pair2.player1.startsWith('BYE'));
}

function createMatches(pairs, availabilityData) {
    const matches = [];
    let totalByes = 0;
    let totalPairs = 0;
    let availabilitySufficient = true;
    let timeIndex = 0;

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

    if (totalRequiredMatches > getTotalAvailableSlots(availabilityData)) {
        availabilitySufficient = false;
    }

    if (!availabilitySufficient) {
        alert('No hay suficiente disponibilidad para generar los partidos. Seleccione más disponibilidad.');
        return [];
    }

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

                const matchTime = getNextAvailableSlot(availabilityData, timeIndex);
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

function getTotalAvailableSlots(availabilityData) {
    let totalSlots = 0;
    Object.keys(availabilityData).forEach(day => {
        Object.keys(availabilityData[day]).forEach(time => {
            totalSlots += availabilityData[day][time].length;
        });
    });
    return totalSlots;
}

function getNextAvailableSlot(availabilityData, index) {
    const slots = [];
    Object.keys(availabilityData).forEach(day => {
        Object.keys(availabilityData[day]).forEach(time => {
            availabilityData[day][time].forEach(pista => {
                slots.push({ day, time, pista });
            });
        });
    });
    return slots[index % slots.length];
}

function displayMatches(matches) {
    const matchesTableBody = document.getElementById('matches-body');
    matchesTableBody.innerHTML = '';
    matches.forEach((match, index) => {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${match.category}</td>
            <td>${match.pair1.player1 ? `${match.pair1.player1} - ${match.pair1.player2}` : 'TBD'}</td>
            <td>${match.pair2.player1 ? `${match.pair2.player1} - ${match.pair2.player2}` : 'TBD'}</td>
            <td>${match.time.day}</td>
            <td>${match.time.time}</td>
            <td>${match.time.pista}</td>
            <td>${match.sex}</td>
            <td>${match.round}</td>
        `;
        matchesTableBody.appendChild(newRow);
    });
}

function generateCSV() {
    const matches = JSON.parse(localStorage.getItem('tournamentMatches')) || [];

    // Agrupar matches por categoría y sexo
    const matchesByCategoryAndSex = matches.reduce((acc, match) => {
        const key = `${match.category}-${match.sex}`;
        acc[key] = acc[key] || [];
        acc[key].push(match);
        return acc;
    }, {});

    // Iterar sobre cada grupo y generar CSV
    Object.keys(matchesByCategoryAndSex).forEach(key => {
        const csvRows = [
            ['Categoría', 'Pareja 1', 'Pareja 2', 'Día', 'Hora', 'Pista', 'Ronda'],
            ...matchesByCategoryAndSex[key].map(match => [
                match.category,
                `${match.pair1.player1} - ${match.pair1.player2}`,
                `${match.pair2.player1} - ${match.pair2.player2}`,
                match.time.day,
                match.time.time,
                match.time.pista,
                match.round,
            ]),
        ];

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(row => row.join(',')).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${key}_matches.csv`); // Nombre del archivo basado en la categoría y sexo
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}
