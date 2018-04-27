var map = L.map('map').setView([35.815616, -78.631317], 12);

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png', {
  maxZoom: 18
}).addTo(map);

// Initialize Carto
var client = new carto.Client({
  apiKey: 'e1fAyeU6JSGKm5X7oLrsUQ',
  username: 'prcr-devlab'
});

// Initialze source data
var source = new carto.source.SQL('SELECT cartodb_id, the_geom, the_geom_webmercator, geoid10, dscore, ascore, pscore, total_score, pop FROM blocks_2017_demo');

var style = new carto.style.CartoCSS(`
  #layer {
    line-width: 0.25;
    line-color: '#000';
    polygon-fill: ramp([total_score], cartocolor(Fall), equal(5));
  }
`)

// Add style to the data
//
// Note: any column you want to show up in the popup needs to be in the list of
// featureClickColumns below

var layer = new carto.layer.Layer(source, style,{
  featureClickColumns: ['geoid10', 'total_score', 'pop', 'dscore', 'ascore', 'pscore']
})

var sidebar = document.querySelector('.sidebar-feature-content');
layer.on('featureClicked', function (event) {
//   Create the HTML that will go in the sidebar. event.data has all the data for 
//   the clicked feature.
  
//   This is exactly like the way we do it in the popups example:
  
    // https://glitch.com/edit/#!/carto-popups
  var content = '<h3>' + event.data['geoid10'] + '</h3>'
  content += '<table>';
  content += '<tr><th>Distance Score</th><th>Acreage Score</th><th>Parks Score</th><th>Total Score</th><th>Population</th></tr>';
  content += '<tr><td>' + event.data['dscore'] + '</td><td>' + event.data['ascore'] + '</td><td>' + event.data['pscore'] + '</td><td>' + event.data['total_score'] + '</td><td>' + event.data['pop'] + '</td></tr>';
  content += '</table>';
  
  // Then put the HTML inside the sidebar. Once you click on a feature, the HTML
  // for the sidebar will change.
  sidebar.innerHTML = content;
});

// Add the data to the map as a layer
client.addLayer(layer);
client.getLeafletLayer().addTo(map);

var scoreSlider = document.getElementById('price-slider');
noUiSlider.create(scoreSlider, {
	start: [0, 15],
	connect: true,
	range: {
		'min': 0,
		'max': 15
	},
  tooltips: [true, true]
});

var popSlider = document.getElementById('pop-slider');
noUiSlider.create(popSlider, {
  start: [0, 2103],
  connect: true,
  range: {
    'min': 0,
    'max': 2103
  },
  tooltips: [true, true]
});

// A function to handle inputs from multiple sliders
var sliderQuery = function (){
  var scoreValues = scoreSlider.noUiSlider.get();
  var popValues = popSlider.noUiSlider.get();
  return source.setQuery('SELECT * FROM blocks_2017_demo WHERE total_score >= ' + scoreValues[0] + ' AND total_score <= ' + scoreValues[1] + ' AND pop >= ' + popValues[0] + ' AND pop <= ' + popValues[1]);
}

scoreSlider.noUiSlider.on('change', sliderQuery);
popSlider.noUiSlider.on('change', sliderQuery);