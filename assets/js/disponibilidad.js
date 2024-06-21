const availabilityTableTemplate = {
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
};

document.addEventListener('DOMContentLoaded', () => {
    loadStoredData();
    document.getElementById('add-day-btn').addEventListener('click', addDay);
});

function addDay() {
    const dayInput = document.getElementById('day-input');
    const day = dayInput.value.trim();

    if (day) {
        const availabilityTables = document.getElementById('availability-tables');
        if (!availabilityTables.querySelector(`#availability-${day}`)) {
            const tableContainer = document.createElement('div');
            tableContainer.innerHTML = `
                <h3>${day} <button onclick="removeDay('${day}')">Eliminar Día</button></h3>
                <table id="availability-${day}">
                    <thead>
                        <tr>
                            <th>Hora</th>
                            <th>Pista 1</th>
                            <th>Pista 2</th>
                            <th>Pista 3</th>
                            <th>Pista 4</th>
                            <th>Pista 5</th>
                            <th>Pista 6</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            `;
            availabilityTables.appendChild(tableContainer);
            populateAvailabilityTable(day, availabilityTableTemplate);
            dayInput.value = '';
            addAvailabilityListeners(); // Add listeners to the new table
        } else {
            alert('El día ya está agregado.');
        }
    } else {
        alert('Por favor, ingrese un día válido.');
    }
}

function removeDay(day) {
    const tableContainer = document.querySelector(`#availability-${day}`).parentElement;
    tableContainer.remove();

    let availabilityData = JSON.parse(localStorage.getItem('availabilityData')) || {};
    delete availabilityData[day];
    localStorage.setItem('availabilityData', JSON.stringify(availabilityData));
}

function populateAvailabilityTable(day, availabilityTemplate) {
    const tbody = document.querySelector(`#availability-${day} tbody`);
    tbody.innerHTML = '';

    Object.keys(availabilityTemplate).forEach(time => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${time}</td>`;
        availabilityTemplate[time].forEach((pista, index) => {
            const cell = document.createElement('td');
            cell.setAttribute('data-day', day);
            cell.setAttribute('data-time', time);
            cell.setAttribute('data-pista', pista);
            cell.classList.add('availability-cell');
            row.appendChild(cell);
        });
        tbody.appendChild(row);
    });
}

function addAvailabilityListeners() {
    const cells = document.querySelectorAll('.availability-cell');
    
    // Primero, eliminamos cualquier listener existente para evitar duplicaciones
    cells.forEach(cell => {
        cell.removeEventListener('click', availabilityCellClickHandler);
    });

    // Luego, añadimos el listener a cada celda de disponibilidad
    cells.forEach(cell => {
        cell.addEventListener('click', availabilityCellClickHandler);
    });
}

// Función manejadora de clic en celda de disponibilidad
function availabilityCellClickHandler() {
    const cell = this;
    cell.classList.toggle('selected');
    const day = cell.getAttribute('data-day');
    const time = cell.getAttribute('data-time');
    const pista = cell.getAttribute('data-pista');
    const isChecked = cell.classList.contains('selected');
    updateAvailabilityData(day, time, pista, isChecked);
}


function loadStoredData() {
    const availabilityData = JSON.parse(localStorage.getItem('availabilityData')) || {};
    Object.keys(availabilityData).forEach(day => {
        const availabilityTables = document.getElementById('availability-tables');
        const tableContainer = document.createElement('div');
        tableContainer.innerHTML = `
            <h3>${day} <button onclick="removeDay('${day}')">Eliminar Día</button></h3>
            <table id="availability-${day}">
                <thead>
                    <tr>
                        <th>Hora</th>
                        <th>Pista 1</th>
                        <th>Pista 2</th>
                        <th>Pista 3</th>
                        <th>Pista 4</th>
                        <th>Pista 5</th>
                        <th>Pista 6</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        `;
        availabilityTables.appendChild(tableContainer);
        populateAvailabilityTable(day, availabilityTableTemplate);
        restoreAvailability(day, availabilityData[day]);
        addAvailabilityListeners(); // Añadir listeners después de restaurar la tabla
    });
}


function updateAvailabilityData(day, time, pista, isChecked) {
    let availabilityData = JSON.parse(localStorage.getItem('availabilityData')) || {};
    
    // Verificamos si hay datos previos para este día y hora
    if (!availabilityData[day]) {
        availabilityData[day] = {};
    }
    if (!availabilityData[day][time]) {
        availabilityData[day][time] = [];
    }
    
    // Actualizamos los datos según si la pista está seleccionada o no
    if (isChecked) {
        if (!availabilityData[day][time].includes(pista)) {
            availabilityData[day][time].push(pista);
        }
    } else {
        availabilityData[day][time] = availabilityData[day][time].filter(item => item !== pista);
    }
    
    // Guardamos los datos actualizados en el localStorage
    localStorage.setItem('availabilityData', JSON.stringify(availabilityData));
}


function restoreAvailability(day, dayData) {
    const table = document.getElementById(`availability-${day}`);
    if (table) {
        const cells = table.querySelectorAll('.availability-cell');
        cells.forEach(cell => {
            const time = cell.getAttribute('data-time');
            const pista = cell.getAttribute('data-pista');
            if (dayData[time] && dayData[time].includes(pista)) {
                cell.classList.add('selected');
            }
        });
    }
}

// Event listener para el botón de borrar todas las parejas y datos guardados
const deleteAllButton = document.getElementById('delete-all-btn');
deleteAllButton.addEventListener('click', function () {
    const confirmDelete = confirm('¿Estás seguro de que deseas borrar todas las parejas y datos guardados?');
    if (confirmDelete) {
        localStorage.removeItem('tournamentData');
        localStorage.removeItem('tournamentMatches');
        document.getElementById('tournament-body').innerHTML = '';
        matchesTableBody.innerHTML = '';
    }
});

// Función para mostrar las parejas en el torneo
function displayPairsInTournament(data) {
    // Implementar lógica para mostrar las parejas en la interfaz gráfica
}

// Función para mostrar los partidos
function displayMatches(matches) {
    // Implementar lógica para mostrar los partidos en la interfaz gráfica
}
