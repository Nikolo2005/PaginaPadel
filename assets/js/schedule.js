document.getElementById('csvFile').addEventListener('change', function(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function(event) {
      const csvData = event.target.result;
      const data = parseCSV(csvData);
      const hierarchyData = createHierarchy(data);
      renderBracket(hierarchyData);
  };
  reader.readAsText(file);
});

function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  const data = lines.map(line => {
      const [match, team1, team2, time, court, date] = line.split(',');
      return { match, team1, team2, time, court, date };
  });
  return data;
}

function createHierarchy(data) {
  const rounds = Math.ceil(Math.log2(data.length));
  let hierarchy = buildHierarchy(data, rounds);
  return hierarchy;
}

function buildHierarchy(matches, rounds) {
  if (rounds === 0) {
      return { name: matches[0].team1 + " vs " + matches[0].team2, team1: matches[0].team1, team2: matches[0].team2, time: matches[0].time };
  }

  let half = Math.ceil(matches.length / 2);
  let left = buildHierarchy(matches.slice(0, half), rounds - 1);
  let right = buildHierarchy(matches.slice(half), rounds - 1);

  return { name: "", children: [left, right] };
}

function renderBracket(rootData) {
  d3.select("#bracket").html(""); // Clear any existing SVG

  const width = 960;
  const height = 760;
  const rectWidth = 150; // Width of node rectangles
  const rectHeight = 50; // Height of node rectangles
  const textOffsetX = 0; // Additional horizontal offset for texts
  const textOffsetY = 20; // Vertical offset between team texts

  const svg = d3.select("#bracket").append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", "translate(40,0)");

  const root = d3.hierarchy(rootData);

  const treeLayout = d3.tree().size([height, width - 160]);
  treeLayout(root);

  root.descendants().forEach(d => {
      d.y = width - d.depth * (width / (root.height + 1));
  });

  const link = svg.selectAll(".link")
      .data(root.descendants().slice(1))
      .enter().append("path")
      .attr("class", "link")
      .attr("d", d => {
          return "M" + d.y + "," + d.x
              + "C" + (d.y + d.parent.y) / 2 + "," + d.x
              + " " + (d.y + d.parent.y) / 2 + "," + d.parent.x
              + " " + d.parent.y + "," + d.parent.x;
      });

  const node = svg.selectAll(".node")
      .data(root.descendants())
      .enter().append("g")
      .attr("class", "node")
      .attr("transform", d => "translate(" + d.y + "," + d.x + ")");

  node.append("rect")
      .attr("width", rectWidth)
      .attr("height", rectHeight)
      .attr("x", -rectWidth / 2) // Center horizontally
      .attr("y", -rectHeight / 2); // Center vertically

  node.append("text")
      .attr("class", "team-text team1-text")
      .attr("text-anchor", "middle")
      .attr("dy", `-${textOffsetY}px`)
      .attr("x", textOffsetX)
      .text(d => d.data.team1);

  node.append("text")
      .attr("class", "team-text team2-text")
      .attr("text-anchor", "middle")
      .attr("dy", `${textOffsetY}px`)
      .attr("x", textOffsetX)
      .text(d => d.data.team2);

  node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "5px") // Adjust vertical position for time text
      .text(d => d.data.time); // Display match time in the center of each rectangle
}