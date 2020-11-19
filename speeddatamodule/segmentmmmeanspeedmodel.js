var mongoose = require('mongoose');
// Setup schema
var segmentschema = mongoose.Schema({}, { collection: 'segments' });
// Export Contact model
var segmentwisemeanminmaxspeed = module.exports = mongoose.model('segments', segmentschema);

//for segmentwisemeanmaxminspeed export
module.exports.get = function(callback, limit) {
    //console.log(callback);
    segmentwisemeanminmaxspeed.find(callback).limit(limit);
}