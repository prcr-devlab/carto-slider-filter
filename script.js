var map = L.map('map').setView([35.815616, -78.631317], 12);

L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
	subdomains: 'abcd',
	maxZoom: 19
}).addTo(map);

// Initialize Carto
var client = new carto.Client({
  apiKey: 'e1fAyeU6JSGKm5X7oLrsUQ',
  username: 'prcr-devlab'
});

// Initialze source data
var baseMainColumnsQuery = `
SELECT 
cartodb_id,
  the_geom, the_geom_webmercator,
  geoid10,
  dscore, ascore, pscore, total_score, pop, 
  pop/(ST_Area(the_geom_webmercator)/2589988.11) AS pop_density,
`
var baseOpacityQuery = `
CASE WHEN pop/(ST_Area(the_geom_webmercator)/2589988.11) > 10000 THEN 1
  WHEN pop/(ST_Area(the_geom_webmercator)/2589988.11) < 10 THEN 0.1
    ELSE (pop/(ST_Area(the_geom_webmercator)/2589988.11))/(SELECT
                                                             max(pop/(ST_Area(the_geom_webmercator)/2589988.11))
                                                               FROM blocks_2017_demo
                                                               WHERE pop/(ST_Area(the_geom_webmercator)/2589988.11) > 10 
                                                               AND pop/(ST_Area(the_geom_webmercator)/2589988.11) < 10000)
  END AS opacity
` 
var baseQuery = `
  ${baseMainColumnsQuery}
  ${baseOpacityQuery}
FROM blocks_2017_demo
`
var source = new carto.source.SQL(baseQuery);

var style = new carto.style.CartoCSS(`
  #layer {
    line-width: 0.25;
    line-color: '#000';
    polygon-opacity: [opacity]
  }
  #layer [total_score <= 15] {
    polygon-fill: '#d7191c';
  }
  #layer [total_score <= 13] {
    polygon-fill: '#fdae61';
  }
  #layer [total_score <= 11] {
    polygon-fill: '#ffffbf';
  }
  #layer [total_score <= 9] {
    polygon-fill: '#a6d96a';
  }
  #layer [total_score <= 7] {
    polygon-fill: '#1a9641';
  }
`)

// Add style to the data
//
// Note: any column you want to show up in the popup needs to be in the list of
// featureClickColumns below

var layer = new carto.layer.Layer(source, style,{
  featureClickColumns: ['geoid10', 'total_score', 'pop', 'dscore', 'ascore', 'pscore','opacity', 'pop_density', ]
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
  content += '<p><b>Opacity:</b> ' + event.data['opacity'] + '</p>'
  content += '<p><b>Population Density:</b> ' + event.data['pop_density'] + '</p>'
  
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
		'min': 3,
		'max': 15
	},
  format: wNumb({
    decimals: 0
  }),
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
  format: wNumb({
    decimals: 0
  }),
  tooltips: [true, true]
});

var popDensitySlider = document.getElementById('pop-density-slider');
noUiSlider.create(popDensitySlider, {
  start: [0, 77130],
  connect: true,
  range: {
    'min': 0,
    '50%': 10000,
    'max': 77130
  },
  format: wNumb({
    decimals: 0
  }),
  tooltips: [true, true]
});

var popDensityOpacitySlider = document.getElementById('pop-density-opacity-slider');
noUiSlider.create(popDensityOpacitySlider, {
  start: [10, 10000],
  connect: true,
  range: {
    'min': 0,
    '50%': 10000,
    'max': 77130
  },
  format: wNumb({
    decimals: 0
  }),
  tooltips: [true, true]
});

// A function to handle inputs from multiple sliders
var sliderQuery = function (){
  var scoreValues = scoreSlider.noUiSlider.get();
  var popValues = popSlider.noUiSlider.get();
  var popDensityValues = popDensitySlider.noUiSlider.get();
  var popDensityOpacityValues = popDensityOpacitySlider.noUiSlider.get();
  // console.log(popDensitySlider.get())
  // var popDensityOpacityValues = [10, 10000] 
  baseOpacityQuery = `
  CASE WHEN pop/(ST_Area(the_geom_webmercator)/2589988.11) > ${popDensityOpacityValues[1]} THEN 1
    WHEN pop/(ST_Area(the_geom_webmercator)/2589988.11) < ${popDensityOpacityValues[0]} THEN 0.1
      ELSE (pop/(ST_Area(the_geom_webmercator)/2589988.11))/(SELECT
                                                               max(pop/(ST_Area(the_geom_webmercator)/2589988.11))
                                                                 FROM blocks_2017_demo
                                                                 WHERE pop/(ST_Area(the_geom_webmercator)/2589988.11) > ${popDensityOpacityValues[0]} 
                                                                 AND pop/(ST_Area(the_geom_webmercator)/2589988.11) < ${popDensityOpacityValues[1]})
    END AS opacity
  `
  console.log(baseOpacityQuery)
  var whereClauseQuery = `
  WHERE total_score >= ${scoreValues[0]}
  AND total_score <= ${scoreValues[1]}
  AND pop >= ${popValues[0]}
  AND pop <= ${popValues[1]}
  AND pop/(ST_Area(the_geom_webmercator)/2589988.11) >= ${popDensityValues[0]}
  AND pop/(ST_Area(the_geom_webmercator)/2589988.11) <= ${popDensityValues[1]}
  `
  var query = `
  ${baseMainColumnsQuery}
  ${baseOpacityQuery}
  FROM blocks_2017_demo
  ${whereClauseQuery}
  ` 
  console.log(query)
  return source.setQuery(query);
}

scoreSlider.noUiSlider.on('change', sliderQuery);
popSlider.noUiSlider.on('change', sliderQuery);
popDensitySlider.noUiSlider.on('change', sliderQuery)
popDensityOpacitySlider.noUiSlider.on('change', sliderQuery);