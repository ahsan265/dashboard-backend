
module.exports = (myapp) => {

    const speedata = require('./speedcontroller.js');
  
  //single record http://localhost:3000/geodata/speeddata
  
  myapp.get('/geodata/speednodes', speedata.findthenodes);

  myapp.get('/geodata/speedmeanminmax', speedata.findspeedminmaxmean);

  myapp.get('/geodata/speeddate', speedata.finddate);
  myapp.get('/geodata/findhourlyspeed',speedata.findhourlyspeed);
  myapp.get('/geodata/findtimeslotspeed',speedata.findtimeslotspeed);
  myapp.get('/geodata/findroadnamecongestionratio',speedata.findroadnamecongestionratio);
  myapp.get('/geodata/totalroadislamabad',speedata.gettotalroadsislamabad);
  myapp.get('/geodata/findroad',speedata.findroadname);
  myapp.get('/geodata/raoddaywisemeanspeed',speedata.raoddaywisemeanspeed)
  myapp.get('/geodata/minmaxmeanbyroadname',speedata.findroadnamemeanminmax)

  }