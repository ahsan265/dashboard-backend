var mongoose = require('mongoose');
// Setup schema
var roadnamesfused = mongoose.Schema({}, { collection: 'fused_traffic_road_data' });
// Export Contact model
var roadnamefs = module.exports = mongoose.model('fused_traffic_road_data', roadnamesfused);
//for geojson export
module.exports.get = function(callback, limit) {
    //console.log(callback);
    roadnamefs.find(callback).limit(limit);
}