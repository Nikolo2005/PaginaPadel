document.addEventListener('DOMContentLoaded', () => {
    loadStoredData();
});

function loadStoredData() {
    const storedData = JSON.parse(localStorage.getItem('tournamentData'));
    if (storedData) {
        displayPairsInTournament(storedData);
    }
}

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
    
    // Encontrar el índice de la primera pareja que coincida
    const indexToDelete = storedData.findIndex(pair => pair.player1 === player1 && pair.player2 === player2);
    
    if (indexToDelete !== -1) {
        // Mostrar confirmación antes de eliminar
        const confirmDelete = confirm(`¿Estás seguro de que deseas eliminar la pareja ${player1} - ${player2}?`);
        
        if (confirmDelete) {
            // Eliminar solo la primera instancia encontrada
            storedData.splice(indexToDelete, 1);
            localStorage.setItem('tournamentData', JSON.stringify(storedData));
            displayPairsInTournament(storedData);
        }
    } else {
        console.warn('No se encontró la pareja para eliminar.');
    }
}



const form = document.getElementById('tournament-form');
form.addEventListener('submit', function (event) {
    event.preventDefault();
    const player1Input = document.getElementById('player1').value.trim();
    const player2Input = document.getElementById('player2').value.trim();
    const category = document.getElementById('category').value;
    const sex = document.getElementById('sex').value;

    if (player1Input && player2Input) {
        const pair = { player1: player1Input, player2: player2Input, category, sex };
        let storedData = JSON.parse(localStorage.getItem('tournamentData')) || [];
        storedData.push(pair);
        localStorage.setItem('tournamentData', JSON.stringify(storedData));
        displayPairsInTournament(storedData);

        // Limpiar solo los campos de jugador1 y jugador2
        document.getElementById('player1').value = '';
        document.getElementById('player2').value = '';
    } else {
        alert('Debe ingresar los nombres de ambos jugadores.');
    }
});


const deleteAllButton = document.getElementById('delete-all-btn');
deleteAllButton.addEventListener('click', function () {
    const confirmDelete = confirm('¿Estás seguro de que deseas borrar todas las parejas y datos guardados?');
    if (confirmDelete) {
        localStorage.removeItem('tournamentData');
        document.getElementById('tournament-body').innerHTML = '';
    }
});
