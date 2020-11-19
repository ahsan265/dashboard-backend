var csv = require('csv-parser');
var fs = require('fs');
var turf = require("@turf/turf");

//variables
var se_node = [];
var nodearray = [];

var Unique_segment_nodes = [];
var nodesfromislamabadjson = [];
var geomfromgeojson = [];
var geoname = [];


//islamabad json data.
var rawjson_islamabad = fs.readFileSync('./data/3-islamabad-updated.json');
var json_of_islamabad = JSON.parse(rawjson_islamabad);
//islamabad geojson data.
var rawgeojson_islamabad = fs.readFileSync('./data/1-islamabad-updated.json');
var geojson_of_islamabad = JSON.parse(rawgeojson_islamabad);
//console.log("geojson_of_islamabad",geojson_of_islamabad);
var start;



exports.calgeojson = (Unique_segment_nodes) => {

    Start = new Date();
    var Unique_segment_wayid = [];
    var nodesfromway = [];
    var geomonwayid = [];
    var coordofgeom = [];
    var segment_geom = [];
    var matchednodepair_detected = [];
    var nodearraymerged;
    var geommerged;
    var nodemerged;

    //get unique way id of segments
    way_id = Unique_segment_nodes.map(a => ({ way_id: a.way_id }));
    keys = ['way_id'],
        Unique_segment_wayid = way_id.filter(
            (s => o =>
                (k => !s.has(k) && s.add(k))
                (keys.map(k => o[k]).join('|'))
            )
            (new Set)
        );

    // Unique_segment_wayid.map(( value) => {

    //     find_way_nodes(value.way_id);
    //     fingeomsilamabad(value.way_id)
    // });
    for (var i = 0; i < Unique_segment_wayid.length; i++) {
        find_way_nodes(Unique_segment_wayid[i].way_id);
        fingeomsilamabad(Unique_segment_wayid[i].way_id)
    }

    //console.log(Unique_segment_wayid)

    //remove nested array of json.
    nodemerged = nodesfromislamabadjson.filter(udf => udf !== undefined);
    //console.log(nodemerged);

    // remove nested array of geojson.
    geommerged = geomfromgeojson.filter(udf => udf !== undefined);
    //var end = new Date() - start
    //console.log(end);
    //console.log(geommerged);
    nodemerged.forEach(element => {
        nodesfromway.push({ nodes: element.nodes, way_id: element.id });

    });

    // merge wayid nodes in one array.
    nodearraymerged = [].concat.apply([], nodesfromway);;
    //console.log(geommerged);



    //get geometry.

    geommerged.forEach((val) => {
        geomonwayid.push({ geometry: val.geometry, way_id: val.id });

    });
    //get coordinates of geometry.
    geomonwayid.forEach((val) => {
        coordofgeom.push({ geometry: val.geometry.coordinates, way_id: val.way_id });
    });


    //merge coordinates in one array.
    var coordmerged = [].concat.apply([], coordofgeom);
    //console.log(nodearraymerged[0].way_id);

    //console.log(nodearraymerged.length,coordmerged.length)
    //line = turf.lineString(coordmerged);
    //console.log("line",line);
    // console.log("coordmerged",coordmerged);
    var nodeandcoord = [];
    var nodeandcoordequal = [];
    var a = [];
    var b = [];
    var i;
    for (i = 0; i < nodearraymerged.length; i++) {
        var waymodif = nodearraymerged[i].way_id
        if ("way/" + waymodif == coordmerged[i].way_id)
            nodeandcoord.push({ node: nodearraymerged[i].nodes, coord: coordmerged[i].geometry, way_id: nodearraymerged[i].way_id })


        for (var j = 0; j < nodeandcoord[i].node.length; j++) {
            nodeandcoordequal.push({ node: nodeandcoord[i].node[j], coord: nodeandcoord[i].coord[j], way_id: nodeandcoord[i].way_id })
        }

    }
    //console.log("hello",nodeandcoordequal);
    //nodepair/uniquesegmentnodepair
    Unique_segment_nodes.forEach((element) => {
        var snc = nodeandcoordequal.find(val => val.node == element.start_node && val.way_id == element.way_id);
        var enc = nodeandcoordequal.find(val => val.node == element.end_node && val.way_id == element.way_id);
        //console.log(snc,enc)
        // var start,stop;
        if (snc != null && enc != null) {
            //  start = snc.coord;
            //  stop = enc.coord;
            var line = {
                type: 'Feature',
                properties: {},
                geometry: { type: 'LineString', coordinates: [snc.coord, enc.coord] }
            };

            // sliced = turf.lineSlice(start, stop, line);
            segment_geom.push(line);

            matchednodepair_detected.push({ start_node: snc.node, end_node: enc.node, way_id: element.way_id, roadname: element.roadname, meanspeed: element.meanspeed });

        }


    });


    finalresponse = segment_geom.map((r, i) => { r.properties = Object.assign({}, matchednodepair_detected[i]); return r; });
    var end = new Date() - Start
        //console.log(end) 
    console.log(finalresponse[50])
    return finalresponse;




};

// get nodes using wayid by iterating.
function find_way_nodes(node) {
    //console.log(node);
    var way_id_nodes;
    way_id_nodes = json_of_islamabad.find((item) => {
        return (item.id == node && item.type == 'way')
    });
    nodesfromislamabadjson.push(way_id_nodes);
}
//find geometry aginsts node id.
function fingeomsilamabad(node) {
    var way_id_geom = [];
    var string_nod = "way/" + node;
    way_id_geom = geojson_of_islamabad.find((item) => {
        return (item.id == string_nod)
    });

    //console.log(way_id_geom)
    geomfromgeojson.push(way_id_geom)

}