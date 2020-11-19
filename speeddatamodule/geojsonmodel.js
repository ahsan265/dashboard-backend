var mongoose = require('mongoose');
// Setup schema
var speedataschema = mongoose.Schema({}, { collection: 'fused_traffic_data' });
// Export Contact model
var speedgeojson = module.exports = mongoose.model('fused_traffic_data', speedataschema);
//for geojson export
module.exports.get = function(callback, limit) {
    //console.log(callback);
    speedgeojson.find(callback).limit(limit);
}