// get dependencies
const express = require('express');
const bodyParser = require('body-parser');
var compression = require('compression')
const app = express();
app.use(compression())




// parse requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


//Enable CORS for all HTTP methods
//app.use(CORS);
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Headers");
    res.header("Access-Control-Allow-Credentials");
    res.header("Access-Control-Allow-Origin","*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Authorization,Origin, X-Requested-With, Content-Type, Accept");
    next();
  });


// Configuring the database
const config = require('./config.js');
const mongoose = require('mongoose');
// require('./geojsondatamodule/router.js')(app);
require('./speeddatamodule/speedrouter.js')(app);

mongoose.Promise = global.Promise;

// Connecting to the database
mongoose.connect(config.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Successfully connected to the database");    
}).catch(err => {
    console.log('Could not connect to the database. Exiting now...', err);
    process.exit();
});
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

// default route
app.get('/poidata', bodyParser.json(),(req, res) => {
    
    res.json(req.body,{"message": "hello traffcity"});
});

// listen on port 3000
app.listen(config.serverport, () => {
    console.log("Server is listening on port 8081");
});
