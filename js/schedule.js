

// script.js

document.getElementById('teamsForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const file = document.getElementById('csvFile').files[0];
    
    if (file) {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        const csv = e.target.result;
        parseCSV(csv);
      };
      
      reader.readAsText(file);
    }
  });
  
  function parseCSV(csv) {
    Papa.parse(csv, {
      delimiter: ",",  // Delimitador para separar los campos
      header: false,    // No hay encabezados en el CSV
      complete: function(results) {
        const matches = results.data.map(row => ({
          partido: row[0],
          equipo1: row[1].split(' - ').map(team => team.trim()),
          equipo2: row[2].split(' - ').map(team => team.trim())
        }));
  
        if (matches.length !== 4) {
          alert('El archivo CSV debe contener exactamente 4 partidos.');
          return;
        }
        
        const teams = extractTeams(matches); // Extraer equipos únicos de los partidos
        if (teams.length !== 8) {
          alert('Debe haber exactamente 8 equipos distintos en el archivo CSV.');
          return;
        }
  
        generateBracket(matches); // Generar el esquema del torneo con los partidos
      }
    });
  }
  
  function extractTeams(matches) {
    const teamsSet = new Set();
    
    matches.forEach(match => {
      match.equipo1.forEach(team => teamsSet.add(team));
      match.equipo2.forEach(team => teamsSet.add(team));
    });
    
    return Array.from(teamsSet);
  }
  
  function generateBracket(matches) {
    const bracketDiv = document.getElementById('bracket');
    bracketDiv.innerHTML = ''; // Limpiar el contenido previo del esquema del torneo
    
    const rounds = [
      ['Cuartos de Final', [0, 1], [2, 3]], // Los índices corresponden a los partidos en 'matches'
      ['Semifinales', [0, 1]],
      ['Final', [0]]
    ];
  
    rounds.forEach((round, roundIndex) => {
      const roundTitle = document.createElement('h3');
      roundTitle.textContent = round[0];
      bracketDiv.appendChild(roundTitle);
      
      round[1].forEach(matchIndex => {
        const match = matches[matchIndex];
        const matchDiv = document.createElement('div');
        matchDiv.classList.add('match');
        
        const team1Div = document.createElement('div');
        team1Div.classList.add('team');
        team1Div.textContent = match.equipo1.join(' & ');
        matchDiv.appendChild(team1Div);
        
        const vsDiv = document.createElement('div');
        vsDiv.textContent = 'vs';
        matchDiv.appendChild(vsDiv);
        
        const team2Div = document.createElement('div');
        team2Div.classList.add('team');
        team2Div.textContent = match.equipo2.join(' & ');
        matchDiv.appendChild(team2Div);
        
        bracketDiv.appendChild(matchDiv);
      });
    });
  }