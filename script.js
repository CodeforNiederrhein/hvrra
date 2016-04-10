var map = new L.map('map', {
  maxZoom: 12
})
// 5.8777,51.0828,7.8113,51.9307
map.fitBounds([[51.0828,5.8777],[51.9307,7.8113]])

L.tileLayer('http://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);


var verspaetungPromise = fetch('data/verspaetung.csv')
  .then(function (response) {
    return response.text()
  })
  .then(function (verspaetungenText) {
    return Papa.parse(verspaetungenText, {
      header: true
    }).data
  })

var linesPromises = fetch('lines/lines.topojson')
  .then(fetchToJson)

Promise.all([verspaetungPromise, linesPromises])
  .then(function (fetchs) {
    var verspaetungen = fetchs[0]
    var validLines = findLines(verspaetungen)
    
    var lines = fetchs[1]
    
    var verspaetungenValues = verspaetungen.map(function (item) { return Number(item.Verspaetung) })
    var minVerspaetung = Math.min.apply(null, verspaetungenValues)
    var maxVerspaetung = Math.max.apply(null, verspaetungenValues)

    var scale = chroma.scale(['lightgray', 'orange', 'red']).domain([minVerspaetung, maxVerspaetung])

    for (var i in lines.objects) {
      var linename = i.toUpperCase()
      if (validLines.indexOf(linename) !== -1) {
        var line = topojson.feature(lines, lines.objects[i])
        addLine(linename, line, 2015)
      }
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

function findLines (rows) {
  return rows.map(function (row) { return row.Linie })
}

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