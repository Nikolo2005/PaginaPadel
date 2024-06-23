document.addEventListener('DOMContentLoaded', () => {
    addEventListeners();
    // Intentar mostrar los partidos al cargar la página
    const matches = JSON.parse(localStorage.getItem('tournamentMatches')) || [];
    displayMatchesByCategory(matches);
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
        localStorage.removeItem('tournamentMatches');
        const matchesBody = document.getElementById('matches-body');
        matchesBody.innerHTML = ''; // Limpiar los partidos al eliminar datos
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
        displayMatchesByCategory(matches);
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

    const totalAvailableSlots = getTotalAvailableSlots(availabilityData);
    const requiredNonByeMatches = totalRequiredMatches - totalByes;

    if (requiredNonByeMatches > totalAvailableSlots) {
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
                let pair1 = currentRoundPairs[i];
                let pair2 = currentRoundPairs[i + 1];

                // Ensure BYE is always in pair2
                if (pair1.player1 === 'BYE' && pair2.player1 !== 'BYE') {
                    [pair1, pair2] = [pair2, pair1];
                }

                let matchTime = null;
                if (pair1.player1 !== 'BYE' && pair2.player1 !== 'BYE') {
                    matchTime = getNextAvailableSlot(availabilityData, timeIndex);
                    timeIndex++;
                }

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

function displayMatchesByCategory(matches) {
    const matchesBody = document.getElementById('matches-body');
    matchesBody.innerHTML = ''; // Limpiar el cuerpo de la tabla antes de añadir los nuevos partidos

    // Agrupar matches por categoría y sexo
    const matchesByCategoryAndSex = matches.reduce((acc, match) => {
        const key = `${match.category}-${match.sex}`;
        acc[key] = acc[key] || [];
        acc[key].push(match);
        return acc;
    }, {});

    // Iterar sobre cada grupo y generar filas de tabla por categoría
    Object.keys(matchesByCategoryAndSex).forEach(key => {
        const matchesInCategory = matchesByCategoryAndSex[key];

        // Crear fila de encabezado para la categoría
        const categoryRow = document.createElement('tr');
        categoryRow.classList.add('category-header');
        categoryRow.innerHTML = `<td colspan="6">${key}</td>`;
        categoryRow.addEventListener('click', () => {
            toggleCategoryMatches(key); // Función para mostrar/ocultar partidos al hacer clic en el encabezado
        });
        matchesBody.appendChild(categoryRow);

        // Crear filas de partidos dentro de la categoría
        matchesInCategory.forEach(match => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="overflow-cell">${match.pair1.player1 !== 'BYE' ? `${match.pair1.player1} - ${match.pair1.player2}` : 'BYE'}</td>
                <td class="overflow-cell">${match.pair2.player1 !== 'BYE' ? `${match.pair2.player1} - ${match.pair2.player2}` : 'BYE'}</td>
                <td>${match.time ? match.time.day : ''}</td>
                <td>${match.time ? match.time.time : ''}</td>
                <td>${match.time ? match.time.pista : ''}</td>
                <td>${match.round}</td>
            `;
            row.classList.add('hidden-row', `${key}-matches`); // Ocultar las filas por defecto
            matchesBody.appendChild(row);
        });
    });
}

function toggleCategoryMatches(categoryKey) {
    const matchesRows = document.querySelectorAll(`.${categoryKey}-matches`);
    matchesRows.forEach(row => {
        row.classList.toggle('hidden-row'); // Alternar clase para mostrar/ocultar las filas de partidos
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
            ['Categoría', 'Pareja 1', 'Pareja 2', 'Día', 'Hora', 'Pista', 'Sexo', 'Ronda'],
            ...matchesByCategoryAndSex[key].map(match => [
                match.category,
                `${match.pair1.player1} - ${match.pair1.player2}`,
                `${match.pair2.player1} - ${match.pair2.player2}`,
                match.time ? match.time.day : '',
                match.time ? match.time.time : '',
                match.time ? match.time.pista : '',
                match.sex,
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

