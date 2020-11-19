const speeddata = require('./geojsonmodel.js');
const segmentmmmeanmodel = require('./segmentmmmeanspeedmodel');
const roadnamemodel = require('./roadname_way_model');
const roadnamefusedmodel = require('./roadname_way_fused_model');

const geocal = require('./geocalculation.js');


// find all the record
exports.findAll = (req, res) => {
    speeddata.find()
        .then(stable => {
            res.send(stable);
        }).catch(err => {
            res.status(500).send({
                message: err.message || "Something wrong while retrieving ."
            });
        });
};
//console.debug(exports.findAll);
//index the params
exports.index = function(req, res) {
    speeddata.get(function(err, sdata) {
        if (err) {
            res.json({
                status: "error",
                message: err,
            });
        }
        res.json({
            status: "success",
            message: "getdata retrieved successfully",
            data: sdata
        });
    });
};
//find geojson of road segments-----------------------------------------------------------------------------------------------------------------------------------------------
exports.findthenodes = (req, res, next) => {
    var a = req.query.start_node;
    var b = req.query.end_node;
    var fromdate = req.query.fromdate;
    var todate = req.query.todate;
    var flag = req.query.flag;
    var Start = new Date();

    var fd = fromdate.split("/").reverse().join("-");
    var td = todate.split("/").reverse().join("-");
    //console.log(fd, td);
    var date1 = new Date(fd);
    date1.setHours(23, 59, 59, 999);
    var date2 = new Date(td);
    date2.setHours(23, 59, 59, 999);
    //console.log(date1, date2);
    var st;
    var et;
    if (flag == 1) {
        // full day
        st = 0
        et = 24
    } else if (flag == 3) {
        //day
        st = 0
        et = 12
    } else if (flag == 2) {
        //night
        st = 12
        et = 24
    } else {
        st = 0
        et = 24
    }
   // console.log(flag);
    speeddata.aggregate([{$match: {
      'DateTime': {
              '$gte': date1, 
              '$lte': date2
            }}}, {$group: {
       '_id': {
              'segment_id': '$segment_id'
            }, 
            'meanspeed': {
              '$avg': 
                  '$speed'
      
                      }
      }}, {$lookup: {
      
             'from': 'segments_details_view', 
            'localField': '_id.segment_id', 
            'foreignField': '_id', 
            'as': 'segment_details'
      }}, {$replaceRoot: {
        'newRoot': {
              '$mergeObjects': [
                {
                  '$arrayElemAt': [
                    '$segment_details', 0
                  ]
                }, {
                  '$arrayElemAt': [
                    '$way', 0
                  ]
                }, '$$ROOT'
              ]
            }
      }}, {$project: {
        '_id': 0, 
            'type': 'Feature', 
            'properties': {
              'start_node': '$start_node', 
              'end_node': '$end_node', 
              'meanspeed': {$toInt:'$meanspeed'}, 
              'roadname': '$name', 
              'way_id': '$way_id',
              'max_speed':{$toInt:"$maxspeed"},
              'highway':"$highway",
              'one_way':"$oneway",
              'lanes':{$toInt:"$lanes"},
              "segment_distance":"$distance",
              "is_in":"$is_in",
              "service":"$service",
              "surface":"$surface"
      
                    }, 
            'geometry': {
              'type': 'LineString', 
              'coordinates': '$geometries.coordinates.coordinates'
            }
          }}]
  )
        .then(stable => {
            // console.log(stable);
            var end = new Date() - Start
            //console.log("endtime", end)
            if (!stable) {
                return res.status(404).send({
                    message: "record not found "
                });
            }
            //var geojson = geocal.calgeojson(stable)
            res.send(stable);
            res.end();

        }).catch(err => {
            console.log(err);
            if (err.kind === 'osm_way_id') {
                return res.status(404).send({
                    message: "record not found "
                });
            }
            return res.status(500).send({
                message: "something wrong with name "
            });
        });

};


//find min maximum and mean speed segmentwise---------------------------------------------------------------------------------------------------------------------------------

exports.findspeedminmaxmean = (req, res) => {
    var Start = new Date();
    var a = req.query.start_node;
    var b = req.query.end_node;
    var fromdate = req.query.fromdate;
    var todate = req.query.todate;
    var fd = fromdate.split("/").reverse().join("-");
    var td = todate.split("/").reverse().join("-");
    var date1 = new Date(fd);
    date1.setHours(23, 59, 59, 999);
    var date2 = new Date(td);
    date2.setHours(23, 59, 59, 999);
    var sn = parseInt(a);
    var en = parseInt(b);
    segmentmmmeanmodel.aggregate([{
            '$match': {
                '$and': [{
                    'start_node': sn
                }, {
                    'end_node': en
                }]
            }
        }, {
            '$lookup': {
                'from': 'fused_traffic_data',
                'let': {
                    'segment_id': '$_id'
                },
                'pipeline': [{
                    '$match': {
                        '$expr': {
                            '$and': [{
                                '$eq': [
                                    '$segment_id', '$$segment_id'
                                ]
                            }, {
                                '$gte': [
                                    '$DateTime', date1
                                ]
                            }, {
                                '$lt': [
                                    '$DateTime', date2
                                ]
                            }]
                        }
                    }
                }, {
                    '$project': {
                        '_id': 0,
                        'speed': 1
                    }
                }],
                'as': 'speeds'
            }
        }, {
            '$project': {
                '_id': 0,
                'max': {
                    '$max': '$speeds.speed'
                },
                'min': {
                    '$min':  '$speeds.speed' 
                },
                'meanspeed': {
                    '$avg':  '$speeds.speed'
                }
            }
        }])
        .then(stable => {
            var end = new Date() - Start
                // console.log("endtime", end)
                //console.log(stable)
            if (!stable || !stable.length > 0) {
                return res.status(404).send({
                    message: "record not found"
                });
            }
            res.send(stable);
            //console.log(stable);
        }).catch(err => {
            console.log(err);
            if (err.kind === 'osm_way_id') {
                return res.status(404).send({
                    message: "record not found"
                });
            }
            return res.status(500).send({
                message: "something wrong with"
            });
        });
};
exports.findroadnamemeanminmax = (req, res) => {
    var roadname = req.query.roadname;

    var fromdate = req.query.fromdate;
    var todate = req.query.todate;
    var fd = fromdate.split("/").reverse().join("-");
    var td = todate.split("/").reverse().join("-");
    var date1 = new Date(fd);
    date1.setHours(23, 59, 59, 999);
    var date2 = new Date(td);
    date2.setHours(23, 59, 59, 999);
  console.log(roadname,date1,date2)
  roadnamefusedmodel.aggregate([
    
      // Stage 2
      {
        $match: {
            // enter query here
            'name': roadname,
             'DateTime': {
                '$gte': date1, 
                '$lte': date2
            }
        }
      },
  
      // Stage 3
      {
        $group: {
            // specifications
            _id:"$name",
           max: {
                  $max: 
                      '$speed'
        
                          },
                min: {
                  $min:
                      '$speed'
                },
                meanspeed: {
                  $avg: 
                      '$speed'
                }
        }
      },
  
    ])
        .then(stable => {
            //console.log(stable)
            if (!stable || !stable.length > 0) {
                return res.status(404).send({
                    message: "record not found" 
                });
            }
            res.send(stable);
            //console.log(stable);
        }).catch(err => {
            console.log(err);
            if (err.kind === 'osm_way_id') {
                return res.status(404).send({
                    message: "record not found" 
                });
            }
            return res.status(500).send({
                message: "something wrong" 
            });
        });
};
// date range from and to for mean speed day wise on segments---------------------------------------------------------------------------------------------------------------
exports.finddate = (req, res) => {
    var a = req.query.start_node;
    var b = req.query.end_node;


    // var num = parseInt(a);
    // var num1 = parseInt(b);
    //console.log(a);
    var fromdate = req.query.fromdate;
    var todate = req.query.todate;
    var fd = fromdate.split("/").reverse().join("-");
    var td = todate.split("/").reverse().join("-");
    var date1 = new Date(fd);
    date1.setHours(23, 59, 59, 999);
    var date2 = new Date(td);
    date2.setHours(23, 59, 59, 999);
    //console.log(a,b,date1,date2);
    var sn = parseInt(a);
    var en = parseInt(b);
    segmentmmmeanmodel.aggregate([{
            '$match': {
                '$and': [{
                    'start_node': sn
                }, {
                    'end_node': en
                }]
            }
        }, {
            '$lookup': {
                'from': 'fused_traffic_data',
                'let': {
                    'segment_id': '$_id'
                },
                'pipeline': [{
                    '$match': {
                        '$expr': {
                            '$and': [{
                                '$eq': [
                                    '$segment_id', '$$segment_id'
                                ]
                            }, {
                                '$gte': [
                                    '$DateTime', date1
                                ]
                            }, {
                                '$lt': [
                                    '$DateTime', date2
                                ]
                            }]
                        }
                    }
                }],
                'as': 'agg_speeds'
            }
        }, {
            '$unwind': {
                'path': '$agg_speeds'
            }
        }, {
            '$project': {
                'Date': {
                    '$dayOfWeek': '$agg_speeds.DateTime'
                },
                'agg_speeds.speed': 1
            }
        }, {
            '$group': {
                '_id': '$Date',
                'meanspeed': {
                    '$avg': {
                        '$round': [
                            '$agg_speeds.speed', 1
                        ]
                    }
                }
            }
        }, {
            '$sort': {
                '_id': 1
            }
        }, {
            '$project': {
                '_id': 0,
                'day': '$_id',
                'meanspeed': { $toInt: "$meanspeed" },
            }

        }])
        .then(stable => {
            //console.log(stable)
            if (!stable) {
                return res.status(404).send({
                    message: "record not found " + req.query.start_node
                });
            }

            res.send(stable);

        }).catch(err => {
            if (err.kind === 'start_node') {
                return res.status(404).send({
                    message: "record not found " + req.query.start_node
                });
            }
            return res.status(500).send({
                message: "something wrong with " + req.query.start_node
            });
        });
};

// date range from and to for mean speed day wise using roadname-------------------------------------------------------------------------------------------------------------
exports.raoddaywisemeanspeed = (req, res) => {

    var name = req.query.roadname;

    //console.log(name);
    var fromdate = req.query.fromdate;
    var todate = req.query.todate;
    var fd = fromdate.split("/").reverse().join("-");
    var td = todate.split("/").reverse().join("-");
    var date1 = new Date(fd);
    date1.setHours(23, 59, 59, 999);
    var date2 = new Date(td);
    date2.setHours(23, 59, 59, 999);
   // console.log(name, date1, date2)
   roadnamefusedmodel.aggregate([
		// Stage 1
		{
			$match: {
			
			    'DateTime': {
			        '$gte': date1, 
			        '$lte': date2
              },
              'name': name
			}
		},


		// Stage 3
		{
			$group: {
			  _id: {days:{$dayOfWeek:"$DateTime"}},
			  meanspeed: {
			    $avg: {
			      $round: [
			        '$speed',
			        1
			      ]
			    }
			  }
			}
		},

		// Stage 4
		{
			$project: {
			    // specifications
			    day:"$_id.days",
			    meanspeed:1,
			    _id:0
			}
		},

		// Stage 5
		{
			$sort: {
			   day:1
			    
			}
		},

	])
        .then(stable => {
            //console.log("weekly", stable)
            if (!stable) {
                return res.status(404).send({
                    message: "record not found"
                });
            }

            res.send(stable);

        }).catch(err => {
            if (err.kind === 'name') {
                return res.status(404).send({
                    message: "record not found"
                });
            }
            return res.status(500).send({
                message: "something wrong"
            });
        });
};
//for hourly base traffic statistics on road-----------------------------------------------------------------------------------------------------------------------------------
exports.findhourlyspeed = (req, res) => {
    var roadname = req.query.roadname;
    var fromdate = req.query.fromdate;
    var todate = req.query.todate;
    var fd = fromdate.split("/").reverse().join("-");
    var td = todate.split("/").reverse().join("-");
    var date1 = new Date(fd);
    date1.setHours(23, 59, 59, 999);
    var date2 = new Date(td);
    date2.setHours(23, 59, 59, 999);
    //console.log(roadname,fd,td)
    roadnamefusedmodel.aggregate([
      // Stage 1
      {
        $match: {
          'name': roadname,
            'DateTime': {
                '$gte': date1, 
                '$lte': date2
                }
        }
      },
      // Stage 3
      {
        $group: {
          _id:{ hours: '$hours'},
          meanspeed: {
            $avg: {
              $round: [
                '$speed',
                1
              ]
            }
          }
        },
        
      },
      {
        $sort: {
           _id: 1
        }
      },
      {
        $project:{ _id:0,
          hours: '$_id.hours',
          meanspeed: {$toInt:'$meanspeed'}

        }
      },
      // Stage 4
      
  
    ]
  )
        .then(stable => {
            //console.log(stable)
            if (!stable) {
                return res.status(404).send({
                    message: "record not found "
                });
            }

            res.send(stable);

        }).catch(err => {
            if (err.kind === 'start_node') {
                return res.status(404).send({
                    message: "record not found "
                });
            }
            return res.status(500).send({
                message: "something wrong with "
            });
        });
};
// find speed on the basis of time slot.-----------------------------------------------------------------------------------------------------------------------------------------
exports.findtimeslotspeed = (req, res) => {



    //console.log(a);
    var roadname = req.query.roadname;

    var fromdate = req.query.fromdate;
    var todate = req.query.todate;
    var fd = fromdate.split("/").reverse().join("-");
    var td = todate.split("/").reverse().join("-");
    var date1 = new Date(fd);
    date1.setHours(23, 59, 59, 999);
    var date2 = new Date(td);
    date2.setHours(23, 59, 59, 999);
    roadnamefusedmodel.aggregate([
      // Stage 1
      {
        $match: {
          'name': roadname,
            'DateTime': {
                '$gte': date1, 
                '$lte': date2
                }
        }
      },
      // Stage 3
      {
        $bucket: {
          groupBy: '$hours',
          boundaries: [ 7,10,13,16,17,19,20,22],
          default: 'other',
          output: {
             meanspeed: { $avg:'$speed' }
          }
        }
      },
  
      // Stage 4
      {
        $match: {
            _id:{$in:[7,13,17,20]}
        }
      },
  
    ])
        .then(stable => {

            if (!stable) {
                return res.status(404).send({
                    message: "record not found " + req.query.start_node
                });
            }

            res.send(stable);

        }).catch(err => {
            //console.log(err);
            if (err.kind === 'start_node') {
                return res.status(404).send({
                    message: "record not found " + req.query.start_node
                });
            }
            return res.status(500).send({
                message: "something wrong with " + req.query.start_node
            });
        });
};

// find roadname with number of congested mild and free ---------------------------------------------------------------------------------------------------------------------------------------------
exports.findroadnamecongestionratio = (req, res, next) => {
    // var a=req.query.start_node;
    var roadname = req.query.roadname;
    var fromdate = req.query.fromdate;
    var todate = req.query.todate;

    var fd = fromdate.split("/").reverse().join("-");
    var td = todate.split("/").reverse().join("-");
    var date1 = new Date(fd);
    date1.setHours(23, 59, 59, 999);
    var date2 = new Date(td);
    date2.setHours(23, 59, 59, 999);

    //  var fdate=fromdate.toString();
    //  var tdate=todate.toString();

    //console.log(fd,td);

    roadnamefusedmodel.aggregate([
     
      // Stage 2
      {
        $match: {
            // enter query here
             'name': roadname,
             'DateTime': {
                '$gte': date1, 
                '$lte': date2
            }
        }
      },
  
      // Stage 3
      {
        $group: {
            _id:'$segment_id',
          speed: {
            $avg:'$speed'
        }
        }
      },
  
      // Stage 4
      {
        $project: {
            '_id':1,
          'speed':1,
        
            'Total_road': {
            $cond: [ { $gte: [ "$speed", 0 ] }, 1, 0 ]
        
              },
        
            'congested': {
            $cond: [{ $and:[{ $gte: [ "$speed", 0 ] },{ $lte: [ "$speed", 25 ] }]}, 1, 0 ]
        
              },
        
            'mild': {
            $cond: [ {$and:[{ $gt: [ "$speed", 25 ] },{ $lte: [ "$speed", 50 ] }]}, 1, 0 ]
        
              },
        
            'free': {
            $cond: [ { $gt: [ "$speed", 50 ] }, 1, 0]
            }
        }
      },
  
      // Stage 5
      {
        $group: {
              _id: 0,
              totalroadsegments:{
            $sum:'$Total_road'
          },
          congestedroadsegments:{
            $sum:'$congested'
          },
          mildroadsegments:{
            $sum:'$mild'
          },
          freeroadsegments:{
            $sum:'$free'
          }
        
        }
      },
  
    ])
        .then(stable => {
            //console.log("hello",stable);
            if (!stable) {
                return res.status(404).send({
                    message: "record not found " 
                });
            }
            //   var geojson=geocal.calgeojson(stable)
            res.send(stable);

            // res.end();
            console.log(stable.length);

        }).catch(err => {
            if (err.kind === 'name') {
                return res.status(404).send({
                    message: "record not found " 
                });
            }
            return res.status(500).send({
                message: "something wrong with name " 
            });
        });

};

// total road in islamabad congest,mild and free------------------------------------------------------------------------------------------------------------------------------
exports.gettotalroadsislamabad = (req, res, next) => {
    var fromdate = req.query.fromdate;
    var todate = req.query.todate;

    var fd = fromdate.split("/").reverse().join("-");
    var td = todate.split("/").reverse().join("-");
    var date1 = new Date(fd);
    date1.setHours(23, 59, 59, 999);
    var date2 = new Date(td);
    date2.setHours(23, 59, 59, 999);

    roadnamefusedmodel.aggregate([
      // Stage 1
      {
        $match: {
            'DateTime': {
                '$gte': date1, 
                '$lte': date2
            },
          $or:[{"highway":"primary"},
          {"highway":"secondary"},
          {"highway":"tertiary"},
          {"highway":"trunk"},
          {"highway":"trunk_link"}] 
                
        }
      },
  
      // Stage 2
      {
        $group: {
            _id: '$name',
          meanspeed: {
            $avg: '$speed'
        }
        }
      },
  
      // Stage 3
      {
        $project: {
         _id:1,
          meanspeedspeed:1,
          roadname:'$name',
          
           Total_road: {
            $cond: [
              {
                $gte: [
                  '$meanspeed',
                  0
                ]
              },
              1,
              0
            ]
          },
          congested: {
            $cond: [
              {
                $and: [
                  {
                    $gte: [
                      '$meanspeed',
                      0
                    ]
                  },
                  {
                    $lte: [
                      '$meanspeed',
                      25
                    ]
                  }
                ]
              },
              1,
              0
            ]
          },
          mild: {
            $cond: [
              {
                $and: [
                  {
                    $gt: [
                      '$meanspeed',
                      25
                    ]
                  },
                  {
                    $lte: [
                      '$meanspeed',
                      50
                    ]
                  }
                ]
              },
              1,
              0
            ]
          },
          free: {
            $cond: [
              {
                $gt: [
                  '$meanspeed',
                  50
                ]
              },
              1,
              0
            ]
          }
        }
      },
  
      // Stage 4
      {
        $group: {
             _id: 0,
             totalroad: {
            $sum: '$Total_road'
          },
          congestedroad: {
            $sum: '$congested'
          },
          mildroad: {
            $sum: '$mild'
          },
          freeroad: {
            $sum: '$free'
          }
        }
      },
  
      // Stage 5
      {
        $project: {
           _id:0,
           totalroad:1,
          congestedroad:1,
          mildroad:1,
          freeroad:1
        }
      },
  
    ])
        .then(stable => {
         // console.log(stable);
            if (!stable) {
                return res.status(404).send({
                    message: "record not found " + req.query.start_node + req.query.end_node
                });
            }
            res.send(stable);
        }).catch(err => {
            console.log(err);
            if (err.kind === 'osm_way_id') {
                return res.status(404).send({
                    message: "record not found " + req.query.start_node + req.query.end_node
                });
            }
            return res.status(500).send({
                message: "something wrong with name " + req.query.start_node + req.query.end_node
            });
        });

};
// get road name by using date range 
exports.findroadname = (req, res, next) => {
  var Start = new Date();

    var fromdate = req.query.fromdate;
    var todate = req.query.todate;

    var fd = fromdate.split("/").reverse().join("-");
    var td = todate.split("/").reverse().join("-");
    var date1 = new Date(fd);
    date1.setHours(23, 59, 59, 999);
    var date2 = new Date(td);
    date2.setHours(23, 59, 59, 999);

    console.log(fd, td);
    var st;
    var et;
 
    roadnamefusedmodel.aggregate([
      // Stage 1
      {
        $match: {
            // enter query here
            'DateTime': {
                '$gte': date1, 
                '$lte': date2
            }
        }
      },
  
      // Stage 2
      {
        $match: {
            // enter query here
            $or:[{"highway":"primary"},{
          "highway":"secondary"},
          {"highway":"tertiary"}]
        }
      },
  
      // Stage 3
  
      {
        $group: {
            
          _id: { 'roadname': '$name' },
        }
      }, {
                '$project': {
                    '_id': 0,
                    'roadname': '$_id.roadname'
                }
            }
  
    ])
        .then(stable => {
            if (!stable) {
                return res.status(404).send({
                    message: "record not found " 
                });
            }
            res.send(stable);
            res.end();

        }).catch(err => {
            if (err.kind === 'date') {
                return res.status(404).send({
                    message: "record not found " 
                });
            }
            return res.status(500).send({
                message: "something wrong with name "
            });
        });

};