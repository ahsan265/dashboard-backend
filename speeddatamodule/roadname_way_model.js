var mongoose = require('mongoose');
// Setup schema
var roadnamescheema = mongoose.Schema({}, { collection: 'segments_details_view' });
// Export Contact model
var roadname = module.exports = mongoose.model('segments_details_view', roadnamescheema);
//for geojson export
module.exports.get = function(callback, limit) {
    //console.log(callback);
    roadname.find(callback).limit(limit);
}