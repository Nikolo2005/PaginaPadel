document.addEventListener('DOMContentLoaded', () => {
    addEventListeners();
    const pairs = JSON.parse(localStorage.getItem('tournamentData')) || [];
    displayPairsByCategory(pairs);
    restoreCategoryState();
});

function restoreCategoryState() {
    const categories = document.querySelectorAll('.category-header');
    categories.forEach(category => {
        const key = category.textContent;
        const isCollapsed = JSON.parse(localStorage.getItem(key + '-collapsed'));
        if (isCollapsed) {
            toggleCategoryPairs(key);
        }
    });
}

function addEventListeners() {
    const form = document.getElementById('tournament-form');
    const deleteAllButton = document.getElementById('delete-all-btn');

    form.addEventListener('submit', addPair);
    deleteAllButton.addEventListener('click', deleteAllData);
}

function addPair(event) {
    event.preventDefault();

    const player1 = document.getElementById('player1').value;
    const player2 = document.getElementById('player2').value;
    const category = document.getElementById('category').value;
    const sex = document.getElementById('sex').value;

    const newPair = { player1, player2, category, sex };

    const pairs = JSON.parse(localStorage.getItem('tournamentData')) || [];
    pairs.push(newPair);
    localStorage.setItem('tournamentData', JSON.stringify(pairs));

    displayPairsByCategory(pairs);

    document.getElementById('tournament-form').reset();
}

function deleteAllData() {
    const confirmDelete = confirm('¿Estás seguro de que deseas borrar todas las parejas y datos guardados?');
    if (confirmDelete) {
        localStorage.removeItem('tournamentData');
        const tournamentBody = document.getElementById('tournament-body');
        tournamentBody.innerHTML = ''; // Limpiar las parejas al eliminar datos
    }
}

function displayPairsByCategory(pairs) {
    const tournamentBody = document.getElementById('tournament-body');
    tournamentBody.innerHTML = ''; // Limpiar el cuerpo de la tabla antes de añadir las nuevas parejas

    const pairsByCategoryAndSex = pairs.reduce((acc, pair) => {
        const key = `${pair.category}-${pair.sex}`;
        acc[key] = acc[key] || [];
        acc[key].push(pair);
        return acc;
    }, {});

    Object.keys(pairsByCategoryAndSex).forEach(key => {
        const pairsInCategory = pairsByCategoryAndSex[key];

        const categoryRow = document.createElement('tr');
        categoryRow.classList.add('category-header');
        const categoryCell = document.createElement('td');
        categoryCell.colSpan = 4; // Asegúrate de que coincida con el número de columnas de tu tabla
        categoryCell.textContent = key;
        categoryCell.addEventListener('click', () => {
            toggleCategoryPairs(key); // Función para mostrar/ocultar parejas al hacer clic en el encabezado
        });
        categoryRow.appendChild(categoryCell);
        tournamentBody.appendChild(categoryRow);

        pairsInCategory.forEach(pair => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="overflow-cell">${pair.player1} - ${pair.player2}</td>
                <td>${pair.category}</td>
                <td>${pair.sex}</td>
                <td><button onclick="deletePair('${pair.player1}', '${pair.player2}')">Eliminar</button></td>
            `;
            row.classList.add(`${key}-pairs`);
            tournamentBody.appendChild(row);
        });
    });
}

function toggleCategoryPairs(categoryKey) {
    const pairsRows = document.querySelectorAll(`.${categoryKey}-pairs`);
    const isHidden = pairsRows[0].classList.contains('hidden-row');
    pairsRows.forEach(row => {
        row.classList.toggle('hidden-row');
    });
    localStorage.setItem(categoryKey + '-collapsed', JSON.stringify(!isHidden));
}

function deletePair(player1, player2) {
    const confirmDelete = confirm(`¿Estás seguro de que deseas eliminar la pareja ${player1} - ${player2}?`);
    if (confirmDelete) {
        const pairs = JSON.parse(localStorage.getItem('tournamentData')) || [];
        const pairIndex = pairs.findIndex(pair => pair.player1 === player1 && pair.player2 === player2);
        
        if (pairIndex !== -1) {
            pairs.splice(pairIndex, 1);
            localStorage.setItem('tournamentData', JSON.stringify(pairs));
            displayPairsByCategory(pairs);
        } else {
            alert(`No se encontró la pareja ${player1} - ${player2}.`);
        }
    }
}
