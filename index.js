/* REFERENCES
* Fingerprinting: http://clientjs.org/
* nedb: https://stackabuse.com/nedb-a-lightweight-javascript-database/
* color on terminal: https://coderwall.com/p/yphywg/printing-colorful-text-in-terminal-when-run-node-js-script
* SSL Websocket: https://medium.com/better-programming/secure-websockets-with-express-and-socket-io-d9a0976c1427
*/

/********** Required Libraries (Node Moduels) ***********/
const express = require('express');
const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');
const path = require("path");
const crypto = require('crypto');
const Cookies = require('cookies');
const process = require('process');
const btoa = require('btoa');
const jwt = require('jsonwebtoken')
const events = require('events')

/********** Required External Project Files ***********/
const DB = require('./controllers/DB.Controller');
const fp = require('./fingerprint.js');
// const decode = require('./lib/decode.js')(19);
global.appName = __dirname;

/********** Required Routes ***********/
const staticRoute = require('./routes/Static.Route')(app, express, path);
const authRoute = require('./routes/Authentication.Route')(app, jwt);
const displayRoute = require('./routes/Display.Route')(app, Cookies, DB);
const remoteRoute = require('./routes/Remote.Route')(app, DB);
const viewRoute = require('./routes/View.Route')(app);
const socketRoute = require('./routes/Socket.Route')(app, io, jwt, DB, crypto);


/*********** Implementation Start ***********/

//To Increase MaxListeners Capability: 
//https://stackoverflow.com/questions/8313628/node-js-request-how-to-emitter-setmaxlisteners
events.EventEmitter.defaultMaxListeners = 40;



//https://hackernoon.com/graceful-shutdown-in-nodejs-2f8f59d1c357
//https://nodejs.org/api/process.html?ref=hackernoon.com#process_signal_events

process.on('beforeExit', (code) => {
    console.log('Process beforeExit event with code: ', code);
});

process.on('exit', (code) => {
    console.log('Process exit event with code: ', code);
});


/// <summary>
/// This is method is responsible for starting our http server.
/// </summary>
/// <returns></returns>

const start_server = () => {
    try {
        // start_server();
        http.listen(4040, () => {
            console.log('listening on *:4040');
        });
    } catch (error) {
        console.log('---------- [Index] Error while starting server ----------\n', error);
        console.log('---------- Trying again in 10 secs ----------');
        setTimeout(start_server, 10000);
    }
}

start_server();


