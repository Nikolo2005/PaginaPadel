document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    const matches = getStoredMatches();
    displayMatchesByCategory(matches);
}

function setupEventListeners() {
    document.getElementById('delete-all-btn').addEventListener('click', deleteAllData);
    document.getElementById('generate-matches-btn').addEventListener('click', generateMatches);
    document.getElementById('generate-csv-btn').addEventListener('click', generateCSV);
}

function getStoredMatches() {
    return JSON.parse(localStorage.getItem('tournamentMatches')) || [];
}

function deleteAllData() {
    if (confirm('¿Estás seguro de que deseas borrar todas las parejas y datos guardados?')) {
        localStorage.removeItem('tournamentMatches');
        document.getElementById('matches-body').innerHTML = '';
    }
}

function generateMatches() {
    const storedData = JSON.parse(localStorage.getItem('tournamentData'));
    const availabilityData = JSON.parse(localStorage.getItem('availabilityData'));

    if (isValidData(storedData, availabilityData)) {
        let matches;
        do {
            matches = createMatches(storedData, availabilityData);
        } while (containsInvalidMatches(matches));

        if (matches.length === 0) {
            alert('No hay suficiente disponibilidad para generar los partidos sin conflictos de horario.');
        } else {
            saveMatches(matches);
        }
    } else {
        alert('Debe haber al menos dos parejas y una disponibilidad seleccionada para generar partidos.');
    }
}

function isValidData(storedData, availabilityData) {
    return storedData && storedData.length >= 2 && availabilityData;
}

function containsInvalidMatches(matches) {
    return matches.some(match => match.pair1.player1.startsWith('BYE') && match.pair2.player1.startsWith('BYE'));
}

function saveMatches(matches) {
    localStorage.setItem('tournamentMatches', JSON.stringify(matches));
    displayMatchesByCategory(matches);
}

function createMatches(pairs, availabilityData) {
    const matches = [];
    const usedSlots = new Set();
    const pairsByCategoryAndSex = groupPairsByCategoryAndSex(pairs);

    Object.keys(pairsByCategoryAndSex).forEach(key => {
        const pairsInCategoryAndSex = pairsByCategoryAndSex[key];
        const shuffledPairs = preparePairsForMatches(pairsInCategoryAndSex);
        const roundSchedules = getRoundSchedules(availabilityData, shuffledPairs.length / 2);

        if (!roundSchedules) {
            alert('No hay suficiente disponibilidad para todas las rondas.');
            return [];
        }

        generateRounds(matches, shuffledPairs, roundSchedules, usedSlots, pairsInCategoryAndSex[0].category, pairsInCategoryAndSex[0].sex);
    });

    return matches;
}

function groupPairsByCategoryAndSex(pairs) {
    return pairs.reduce((acc, pair) => {
        const key = `${pair.category}-${pair.sex}`;
        acc[key] = acc[key] || [];
        acc[key].push(pair);
        return acc;
    }, {});
}

function preparePairsForMatches(pairsInCategoryAndSex) {
    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(pairsInCategoryAndSex.length)));
    const additionalByes = nextPowerOf2 - pairsInCategoryAndSex.length;

    const byes = Array.from({ length: additionalByes }, () => ({
        player1: 'BYE',
        player2: '',
        category: pairsInCategoryAndSex[0].category,
        sex: pairsInCategoryAndSex[0].sex,
    }));

    return shuffle([...pairsInCategoryAndSex, ...byes]);
}

function generateRounds(matches, shuffledPairs, roundSchedules, usedSlots, category, sex) {
    let currentRoundPairs = shuffledPairs;
    const totalRounds = Math.log2(currentRoundPairs.length);
    const roundNames = getRoundNames(totalRounds);
    let roundNumber = 0;

    while (currentRoundPairs.length > 1) {
        const nextRoundPairs = [];

        for (let i = 0; i < currentRoundPairs.length; i += 2) {
            let [pair1, pair2] = [currentRoundPairs[i], currentRoundPairs[i + 1]];

            if (pair1.player1 === 'BYE' && pair2.player1 !== 'BYE') {
                [pair1, pair2] = [pair2, pair1];
            }

            let matchTime = null;
            if (pair1.player1 !== 'BYE' && pair2.player1 !== 'BYE') {
                matchTime = getNextAvailableSlot(roundSchedules, roundNumber + 1, usedSlots);
                if (!matchTime) {
                    alert('No hay suficiente disponibilidad para generar los partidos sin conflictos de horario.');
                    return [];
                }
                usedSlots.add(`${matchTime.day}-${matchTime.time}-${matchTime.pista}`);
            }

            matches.push(createMatch(pair1, pair2, matchTime, category, sex, roundNames[roundNumber]));
            nextRoundPairs.push(createEmptyPair(category, sex));
        }

        currentRoundPairs = nextRoundPairs;
        roundNumber++;
    }
}

function getRoundNames(totalRounds) {
    const roundNames = [];
    const rounds = ['Final', 'Semifinal', 'Cuartos de Final', 'Octavos de Final', 'Dieciseisavos de Final', 'Treintaidosavos de Final'];
        
    for (let i = 0; i < totalRounds; i++) {
        if (rounds[i]) {
            roundNames.unshift(rounds[i]);
        } else {
            roundNames.unshift(`Ronda ${totalRounds - i}`);
        }
    }

    return roundNames;
}

function createMatch(pair1, pair2, time, category, sex, roundName) {
    return { pair1, pair2, time, category, sex, round: roundName };
}


function createEmptyPair(category, sex) {
    return { player1: '', player2: '', category, sex };
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getRoundSchedules(availabilityData, rounds) {
    const slots = gatherSlots(availabilityData);

    const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    
    slots.sort((a, b) => {
        if (a.day !== b.day) return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
        return a.time.localeCompare(b.time);
    });

    return distributeSlotsIntoRounds(slots, rounds);
}

function gatherSlots(availabilityData) {
    const slots = [];
    Object.keys(availabilityData).forEach(day => {
        Object.keys(availabilityData[day]).forEach(time => {
            availabilityData[day][time].forEach(pista => {
                slots.push({ day, time, pista });
            });
        });
    });
    return slots;
}

function distributeSlotsIntoRounds(slots, rounds) {
    const roundSchedules = Array.from({ length: rounds }, () => []);
    const slotsPerRound = Math.floor(slots.length / rounds);

    if (slotsPerRound < 1) return null;

    let extraSlots = slots.length % rounds;
    let slotIndex = 0;

    for (let i = 0; i < rounds; i++) {
        let roundSlotCount = slotsPerRound + (extraSlots > 0 ? 1 : 0);
        if (extraSlots > 0) extraSlots--;
        roundSchedules[i] = slots.slice(slotIndex, slotIndex + roundSlotCount);
        slotIndex += roundSlotCount;
    }

    return roundSchedules;
}

function getNextAvailableSlot(roundSchedules, roundNumber, usedSlots) {
    const roundSlots = roundSchedules[roundNumber - 1];
    for (let slot of roundSlots) {
        if (!usedSlots.has(`${slot.day}-${slot.time}`)) {
            return slot;
        }
    }
    return null;
}


function displayMatchesByCategory(matches) {
    const matchesBody = document.getElementById('matches-body');
    matchesBody.innerHTML = '';

    const matchesByCategoryAndSex = matches.reduce((acc, match) => {
        const key = `${match.category}-${match.sex}`;
        acc[key] = acc[key] || [];
        acc[key].push(match);
        return acc;
    }, {});

    Object.keys(matchesByCategoryAndSex).forEach(key => {
        appendCategoryHeader(matchesBody, key);
        matchesByCategoryAndSex[key].forEach(match => appendMatchRow(matchesBody, match, key));
    });
}

function appendCategoryHeader(matchesBody, key) {
    const categoryRow = document.createElement('tr');
    categoryRow.classList.add('category-header');
    categoryRow.innerHTML = `<td colspan="6">${key}</td>`;
    categoryRow.addEventListener('click', () => toggleCategoryMatches(key));
    matchesBody.appendChild(categoryRow);
}

function appendMatchRow(matchesBody, match, key) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td class="overflow-cell">${match.pair1.player1 !== 'BYE' ? `${match.pair1.player1} - ${match.pair1.player2}` : 'BYE'}</td>
        <td class="overflow-cell">${match.pair2.player1 !== 'BYE' ? `${match.pair2.player1} - ${match.pair2.player2}` : 'BYE'}</td>
        <td>${match.time ? match.time.day : ''}</td>
        <td>${match.time ? match.time.time : ''}</td>
        <td>${match.time ? match.time.pista : ''}</td>
        <td>${match.round}</td>
    `;
    row.classList.add('hidden-row', `${key}-matches`);
    matchesBody.appendChild(row);
}

function toggleCategoryMatches(categoryKey) {
    const matchesRows = document.querySelectorAll(`.${categoryKey}-matches`);
    matchesRows.forEach(row => {
        row.classList.toggle('hidden-row');
    });
}

function generateCSV() {
    const matches = getStoredMatches();
    const matchesByCategoryAndSex = groupMatchesByCategoryAndSex(matches);

    Object.keys(matchesByCategoryAndSex).forEach(key => {
        const csvContent = createCSVContent(matchesByCategoryAndSex[key]);
        downloadCSV(csvContent, `partidos_${key}.csv`);
    });
}

function groupMatchesByCategoryAndSex(matches) {
    return matches.reduce((acc, match) => {
        const key = `${match.category}-${match.sex}`;
        acc[key] = acc[key] || [];
        acc[key].push(match);
        return acc;
    }, {});
}

function createCSVContent(matches) {
    const csvRows = [
        ['Categoría', 'Pareja 1', 'Pareja 2', 'Día', 'Hora', 'Pista', 'Sexo', 'Ronda'],
        ...matches.map(match => [
            match.category,
            `${match.pair1.player1} - ${match.pair1.player2}`,
            `${match.pair2.player1} - ${match.pair2.player2}`,
            match.time ? match.time.day : '',
            match.time ? match.time.time : '',
            match.time ? match.time.pista : '',
            match.sex,
            match.round
        ])
    ];
    return 'data:text/csv;charset=utf-8,' + csvRows.map(row => row.join(',')).join('\n');
}

function downloadCSV(content, filename) {
    const encodedUri = encodeURI(content);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
