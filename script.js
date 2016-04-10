var map = new L.map('map')
// 5.8777,51.0828,7.8113,51.9307
map.fitBounds([[51.0828,5.8777],[51.9307,7.8113]])

L.tileLayer('http://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Load Lines
var re10FetchPromise = fetch('lines/re10.geojson')
  .then(fetchToJson)
var re1FetchPromise = fetch('lines/re1.geojson')
  .then(fetchToJson)


var verspaetungPromise = fetch('data/verspaetung.csv')
  .then(function (response) {
    return response.text()
  })
  .then(function (verspaetungenText) {
    return Papa.parse(verspaetungenText, {
      header: true
    }).data
  })

var lines = ['RB27', 'RB31', 'RB32', 'RB33', 'RB35', 'RB36', 'RB37', 'RB38', 'RB40', 'RE1', 'RE2', 'RE3', 'RE4', 'RE5', 'RE6', 'RE7', 'RE8', 'RE10', 'RE11', 'RE13', 'RE14', 'RE16']
var linesPromises = Promise.all(
  lines.map(function (line) {
    var filename = 'lines/' + line.toLowerCase() + '.geojson'
    return fetch(filename)
      .then(fetchToJson)
    })
  )

Promise.all([verspaetungPromise, linesPromises])
  .then(function (fetchs) {
    var verspaetungen = fetchs[0]
    
    var linesData = fetchs[1]
    
    var verspaetungenValues = verspaetungen.map(function (item) { return Number(item.Verspaetung) })
    var minVerspaetung = Math.min.apply(null, verspaetungenValues)
    var maxVerspaetung = Math.max.apply(null, verspaetungenValues)

    var scale = chroma.scale(['yellow', 'red']).domain([minVerspaetung, maxVerspaetung])

    for (var i = 0; i < lines.length; i++) {
      console.log(lines[i])
      addLine(lines[i], linesData[i], 2015)
    }

    function addLine (ref, geojson, year) {
      var verspaetung = findRow(ref, verspaetungen, year || 2015)
      var color = scale(Number(verspaetung.Verspaetung)).hex()
      L.geoJson(geojson, {
        style: {
          color: color,
          weight: 5,
          opacity: 1
        },
        filter: function filter (feature) {
          return feature.geometry.type === 'LineString'
        },
        onEachFeature: function onEachFeature (feature, layer) {
          // does this feature have a property named popupContent?
            layer.bindPopup('Linie ' + ref + '<br>Ø Verspätung ' + verspaetung.Verspaetung + ' Minuten')
        }

      }).addTo(map)
    }
  }, function (e) {
    window.alert('Daten konnten nicht geladen werden. Fehlermeldung: \n\n\n' + JSON.stringify(e, null, 4))
    console.error(e)
  })
  .catch(function (e) {
    window.alert('Daten konnten nicht geladen werden. Fehlermeldung: \n\n\n' + JSON.stringify(e, null, 4))
    console.error(e)
  })


function findRow (line, rows, year) {
  for(var i = 0; i < rows.length; i++) {
    var row = rows[i]
    if (row.Linie === line) {
      if (year !== undefined || year === row.Jahr) {
        return row
      }
      return row
    }
  }
}

function fetchToJson (response) {
  return response.json()
}