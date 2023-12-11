/* Add map layer */

let mapOptions = {
    center:[33.7443,-84.3910],
    zoom:15
}

let map = new L.map('map' , mapOptions);

let layer = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');

map.addLayer(layer);


/* Load Atlanta Graph */
let nodes = [];
let edges = [];
let graph = null;
let selectedHour = 0; //minuit -> 1h du mating

//Unique Forward/Backward Values: [ "Residential" 30m/h, "Forbidden", "Tertiary" 30m/h, "Secondary"50mph, "Primary"50mph, "Trunk"60mph, "Motorway"70 mph  ]
// see https://wiki.openstreetmap.org/wiki/Key:highway
road_type_speed = {
    "Forbidden": 0.0,
    "Residential": 30.0,
    "Tertiary": 30.0,
    "Secondary": 45.0,
    "Primary": 60.0, 
    "Trunk": 70.0,
    "Motorway" : 70.0
}

console.log("Loading graph...")

d3.dsv(",", "./Graph-Data/atlanta/edges_si_final.csv", function(d) {
    const lineString = d.wkt;
    const coordinates = lineString
    .match(/\(([^)]+)\)/)[1] // Extract the part inside the parentheses
    .split(', ')             // Split the coordinates by comma and space
    .map(coord => coord.split(' ').map(parseFloat)); // Parse each coordinate as floats
    var si_chris = d.SI2.split(" ").map(function(value) {
        return 1.0 - parseFloat(value);
    });
    return {
        source: parseInt(d.source),
        target: parseInt(d.target),
        length: parseFloat(d.length),
        length_gab: parseFloat(d.length_gabriel_2),
        si_chris: si_chris, 
        forward: d.car_forward,
        backward: d.car_backward,
        polyline: coordinates.map(subarray => [...subarray].reverse())
    };
}).then(function(data) {
    data.forEach(function(row) {
        if (row.length>0){
            if (row.forward !== "Forbidden"){
                si_chris_updated = row.si_chris
                for (var i = 0; i < si_chris_updated.length; i++) {
                    si_chris_updated[i] = row.si_chris[i]* row.length/(road_type_speed[row.forward]*1.6)
                }

                e = {
                    source: row.source, 
                    target: row.target, 
                    attributes:{
                        length: row.length, 
                        length_gab: row.length_gab,
                        time: row.length/(road_type_speed[row.forward]*1.6),
                        time_gab: row.length_gab/(road_type_speed[row.forward]*1.6),
                        roadType: row.forward,
                        polyline: row.polyline},
                    undirected: false
                }

                for (var i = 0; i < si_chris_updated.length; i++) {
                    e["attributes"]["si_ "+i.toString()] = si_chris_updated[i]
                }

                edges.push(e);
            }
            if (row.backward !== "Forbidden"){
                si_chris_updated = row.si_chris
                for (var i = 0; i < si_chris_updated.length; i++) {
                    si_chris_updated[i] = row.si_chris[i]* row.length/(road_type_speed[row.backward]*1.6)
                }
                e = {
                    source: row.target, 
                    target: row.source, 
                    attributes:{
                        length: row.length, 
                        length_gab: row.length_gab,
                        time: row.length/(road_type_speed[row.backward]*1.6),
                        time_gab: row.length_gab/(road_type_speed[row.backward]*1.6),
                        roadType: row.backward, 
                        polyline: [...row.polyline].reverse()},
                    undirected: false
                };

                for (var i = 0; i < si_chris_updated.length; i++) {
                    e["attributes"]["si_ "+i.toString()] = si_chris_updated[i]
                }

                edges.push(e);
            }
        }
    });

    d3.dsv(",", "./Graph-Data/atlanta/nodes.csv", function(d) {
        return {
        id: parseInt(d.id),
        lat: parseFloat(d.lat),
        lng: parseFloat(d.lon)
        }
    }).then(function(data) {
        data.forEach(function(row) {
            nodes.push({key: row.id, attributes:{lng:row.lng, lat:row.lat}})
        });

        graph = new graphology.MultiGraph();

        graph.import({
            nodes: nodes,
            edges: edges
        });

        console.log("Graph loaded !")
    });
});


/* Compute itineraries on Graph */
function computePaths(graph, sourceCoords, targetCoords){
    console.log("Computing path ...")
    let nearestSourceNode = null;
    let nearestTargetNode = null;
    let minSourceDistance = Infinity;
    let minTargetDistance = Infinity;

    // Iterate over each node and execute the callback
    graph.forEachNode((node, attributes) => {
        const sourceDistance = euclideanDistance(sourceCoords, attributes);
        const targetDistance = euclideanDistance(targetCoords, attributes);

        if (sourceDistance < minSourceDistance) {
            minSourceDistance = sourceDistance;
            nearestSourceNode = node;
        }

        if (targetDistance < minTargetDistance) {
            minTargetDistance = targetDistance;
            nearestTargetNode = node;
        }
      });

    console.log(nearestSourceNode,nearestTargetNode)

    const shortestPath = graphologyLibrary.shortestPath.dijkstra.bidirectional(
        graph, 
        nearestSourceNode,
        nearestTargetNode,
        'time'
    );

    const safestPath = graphologyLibrary.shortestPath.dijkstra.bidirectional(
        graph, 
        nearestSourceNode,
        nearestTargetNode,
        'time_gab'
    );

    console.log('si_'+selectedHour.toString())

    const safestHourPath = graphologyLibrary.shortestPath.dijkstra.bidirectional(
        graph, 
        nearestSourceNode,
        nearestTargetNode,
        'si_'+selectedHour.toString()
    );


    let paths = [null, null, null]
    if (shortestPath !== null){
        const edgePath = graphologyLibrary.shortestPath.edgePathFromNodePath(graph, shortestPath);

        var polyLinePath = []
        edgePath.forEach(function(e){
            if (polyLinePath.length <= 1) {
                polyLinePath = graph.getEdgeAttribute(e, 'polyline')
            }else{
                polyLinePath = polyLinePath.slice(0, -1).concat(graph.getEdgeAttribute(e, 'polyline'))
            }
        })
        paths[0] = new L.polyline(polyLinePath,{
            color: 'red'
        });
    }
    if (safestPath !== null){
        const edgePath = graphologyLibrary.shortestPath.edgePathFromNodePath(graph, safestPath);

        var polyLinePath = []
        edgePath.forEach(function(e){
            if (polyLinePath.length <= 1) {
                polyLinePath = graph.getEdgeAttribute(e, 'polyline')
            }else{
                polyLinePath = polyLinePath.slice(0, -1).concat(graph.getEdgeAttribute(e, 'polyline'))
            }
        })
        paths[1] = new L.polyline(polyLinePath,{
            color: 'green'
        });
    }
    if (safestHourPath !== null){
        const edgePath = graphologyLibrary.shortestPath.edgePathFromNodePath(graph, safestPath);

        var polyLinePath = []
        edgePath.forEach(function(e){
            if (polyLinePath.length <= 1) {
                polyLinePath = graph.getEdgeAttribute(e, 'polyline')
            }else{
                polyLinePath = polyLinePath.slice(0, -1).concat(graph.getEdgeAttribute(e, 'polyline'))
            }
        })

        epsilon = 0.00005
        for (var i = 0; i < polyLinePath.length; i++) {
            polyLinePath[i] = [polyLinePath[i][0]+epsilon, polyLinePath[i][1]+epsilon]
        }
        paths[2] = new L.polyline(polyLinePath,{
            color: 'blue'
        });
    }

    console.log("Paths computed !", paths)

    return paths;
}


function euclideanDistance(coord1, coord2) {
    const latDiff = coord2.lat - coord1.lat;
    const lngDiff = coord2.lng - coord1.lng;
  
    // Assuming coordinates are in degrees, convert to kilometers
    const latDistance = latDiff * 111; // 1 degree of latitude is approximately 111 kilometers
    const lngDistance = lngDiff * 111 * Math.cos((coord1.lat + coord2.lat) / 2);
    const distance = Math.sqrt(latDistance * latDistance + lngDistance * lngDistance);  
    return distance;
}














/* Add maker */
// let marker = new L.Marker([33.754311,-84.389763]); // A-146352,Source2,2,2016-12-01 11:05:48,2016-12-01 12:05:23,33.754311,-84.389763,,,0.01,Accident on Marietta St at Decatur St.,Marietta St NW,Atlanta,Fulton,GA,30303-2813,US,US/Eastern,KFTY,2016-12-01 10:53:00,51.1,,48.0,30.05,10.0,NNW,11.5,,Clear,True,False,True,False,False,False,False,False,False,False,False,True,False,Day,Day,Day,Day

// marker.addTo(map);


/* Add polyline (future itinerary) */
// var polylinePoints = [
//     [33.748884, -84.389334],
//     [33.750321, -84.391887],
//     [33.749179, -84.392767],
//     [33.750517, -84.395149],
//     [33.750535, -84.39708],
//     [33.750106, -84.398475],
//     [33.74834, -84.400792]
//   ];            

// var polyline = new L.polyline(polylinePoints,{
//     color: 'red'
// }).addTo(map);


/* Add heatlayer */

// minOpacity - the minimum opacity the heat will start at
// maxZoom - zoom level where the points reach maximum intensity (as intensity scales with zoom), equals maxZoom of the map by default
// max - maximum point intensity, 1.0 by default
// radius - radius of each "point" of the heatmap, 25 by default
// blur - amount of blur, 15 by default
// gradient - color gradient config, e.g. {0.4: 'blue', 0.65: 'lime', 1: 'red'}

// var heat = L.heatLayer([
// 	[33.75,-84.3910],
//     [33.75,-84.392],
//     [33.75,-84.393],
//     [33.754311,-84.389763],
// ], {radius: 10,
//     max: 1.0,
//     minOpacity: 0.7,
//     gradient : {0.33: 'yellow', 0.66: 'orange', 1: 'red'}
// }).addTo(map);


/* Add start/end markers on click*/
markerA = null;
markerB = null;
shortestPath = null;
safestPath = null;
safestHourPath = null;

map.on('click', function(e) {
    if (markerA == null) {
        _firstLatLng = e.latlng;
        console.log(_firstLatLng)
        markerA = new L.marker(_firstLatLng).addTo(map).bindPopup('Start').openPopup();
    } else if (markerB == null) {
        _secondLatLng = e.latlng;
        console.log(_secondLatLng)
        markerB = new L.marker(_secondLatLng).addTo(map).bindPopup('End').openPopup();

        paths = computePaths(graph,_firstLatLng,_secondLatLng);
        shortestPath = paths[0];
        if (shortestPath !== null){
            shortestPath.addTo(map);
        }

        safestHourPath = paths[2]
        if (safestHourPath !== null){
            safestHourPath.addTo(map);
        }

        safestPath = paths[1]
        if (safestPath !== null){
            safestPath.addTo(map);
        }
        
    } else {
        if (shortestPath !== null) {
            map.removeLayer(shortestPath);
            shortestPath = null;
        }
        if (safestPath !== null) {
            map.removeLayer(safestPath);
            safestPath = null;
        }
        if (safestHourPath !== null) {
            map.removeLayer(safestHourPath);
            safestHourPath = null;
        }

        
        _firstLatLng = e.latlng;
        console.log(_firstLatLng)
        map.removeLayer(markerA);
        map.removeLayer(markerB);
        markerB = null;

        markerA = new L.marker(_firstLatLng).addTo(map).bindPopup('Start').openPopup();
    }
});


/* Add search box and markers */

let apiKey = "dfa9df93871e47789c5740763d586fa2";

const addressSearchControl = new L.control.addressSearch(apiKey,{
    position:"topleft",
    placeholder:"Enter address",
    resultCallback: (address) => {
            if (markerA == null) {
                _firstLatLng = {"lat":address.lat,"lng":address.lon};
                console.log(_firstLatLng)
                markerA = new L.marker(_firstLatLng).addTo(map).bindPopup('Start').openPopup();
            } else if (markerB == null) {
                _secondLatLng = {"lat":address.lat,"lng":address.lon};
                console.log(_secondLatLng)
                markerB = new L.marker(_secondLatLng).addTo(map).bindPopup('End').openPopup();
                
                paths = computePaths(graph,_firstLatLng,_secondLatLng);
                shortestPath = paths[0];
                if (shortestPath !== null){
                    shortestPath.addTo(map);
                }

                safestHourPath = paths[2]
                if (safestHourPath !== null){
                    safestHourPath.addTo(map);
                }

                safestPath = paths[1]
                if (safestPath !== null){
                    safestPath.addTo(map);
                }

            } else {
                if (shortestPath !== null) {
                    map.removeLayer(shortestPath);
                    shortestPath = null;
                }
                if (safestPath !== null) {
                    map.removeLayer(safestPath);
                    safestPath = null;
                }
                if (safestHourPath !== null) {
                    map.removeLayer(safestHourPath);
                    safestHourPath = null;
                }

                _firstLatLng = {"lat":address.lat,"lng":address.lon};
                console.log(_firstLatLng)
                map.removeLayer(markerA);
                map.removeLayer(markerB);
                markerB = null;
        
                markerA = new L.marker(_firstLatLng).addTo(map).bindPopup('Start').openPopup();
            }
    }
});

map.addControl(addressSearchControl);

/* Add hour slider */
document.addEventListener('DOMContentLoaded', function() {
    // Get the select element
    const hourDropdown = document.getElementById('hour-dropdown');

    // Populate the dropdown with options for each hour
    for (let hour = 0; hour <= 23; hour++) {
      const option = document.createElement('option');
      option.value = hour;
      option.textContent = `${hour % 12 || 12}:00 ${hour < 12 ? 'AM' : 'PM'}`;
      hourDropdown.appendChild(option);
    }

    hourDropdown.addEventListener('change', function() {
        // Get the selected value (hour)
        selectedHour = hourDropdown.value;
      });
  });
  


//Unique Forward/Backward Values: [ "Residential" 30m/h, "Forbidden", "Tertiary" 30m/h, "Secondary"50mph, "Primary"50mph, "Trunk"60mph, "Motorway"70 mph  ]
// see https://wiki.openstreetmap.org/wiki/Key:highway
