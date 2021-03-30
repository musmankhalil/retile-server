var SQL = null;
const usingRemote = null;
const screens = [];

const authConfig = require('../config/auth')

module.exports = function (app, io, jwt, DB, crypto) {

    /// <summary>
    /// Middleware to authenticate socket connection.
    /// </summary>
    io.sockets.use(function (socket, next) {
        if (socket.handshake.query && socket.handshake.query.token) {
            jwt.verify(socket.handshake.query.token, authConfig.secretKey, function (err, decoded) {
                if (err) {
                    console.log("Authentication Error Occured");
                    return next(new Error('Authentication Error'));
                } else {
                    console.log("Remote Connection Authenticated");
                    socket.decoded = decoded;
                    next();
                }
            });
        }
        else {
            console.log("Authentication Error Occured");
            next(new Error('Authentication Error'));
        }
    });

    /// <summary>
    /// Socket hook to establish SocketIO connection.
    /// </summary>
    io.on('connection', (socket) => {

        var socketId = socket.id;
        var ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.substring(7);

        //console.log(socket.handshake.headers['user-agent']);

        // 1- VALIDADE SOURCE OF CONNECTION
        // 2- MAKE SURE JWT HEX IS VALID
        // 3- PROCESS COMMAND


        /// <summary>
        /// Socket hook to write logs to the database.
        /// </summary>
        socket.on("log", function (data) {
            console.log(data.type);
            if (data.level == 'info') {
                DB.GetPoolConnection(function (conn) {
                    try {
                        if (conn) {
                            SQL = `INSERT INTO logs VALUES (null, ${conn.escape(socket.id)}, NOW(), ${conn.escape(data.fingerprint)}, ${conn.escape(data.storeid)}, ${conn.escape(data.sku)}, '{\"data\":${conn.escape(data.type)},\"user-agent\":\"${conn.escape(socket.handshake.headers['user-agent'])}\"}',${conn.escape(data.displayid)}, ${conn.escape(data.screenid)}, UPPER(${conn.escape(data.gridposition)}), ${conn.escape(ip)}, ${conn.escape(data.level)})`;
                            conn.release();
                            try {
                                DB.Query(SQL, null, function (res, err) {
                                    if (err) {
                                        console.log(err);
                                    }
                                });
                            } catch (error) {
                                console.log('---------- [Socket.Route] Error on DB Query ----------\n', error)
                            }
                        }
                    } catch (error) {
                        console.log('---------- [Socket.Route] Error on GetPoolConnection ----------\n', error)
                    }
                })
            } else {
                DB.GetPoolConnection(function (conn) {
                    try {
                        if (conn) {
                            SQL = `INSERT INTO logs VALUES (null, ${conn.escape(socket.id)}, NOW(), ${conn.escape(data.fingerprint)}, ${conn.escape(data.storeid)}, ${conn.escape(data.sku)}, '{\"data\":${conn.escape(data.type)},\"user-agent\":\"${conn.escape(socket.handshake.headers['user-agent'])}\"}','', '', '', ${conn.escape(ip)}, ${conn.escape(data.level)})`;
                            conn.release();
                            try {
                                DB.Query(SQL, null, function (res, err) {
                                    if (err) {
                                        console.log(err);
                                    }
                                });
                            } catch (error) {
                                console.log('---------- [Socket.Route] Error on DB Query ----------\n', error)
                            }
                        }
                    } catch (error) {
                        console.log('---------- [Socket.Route] Error on GetPoolConnection ----------\n', error)
                    }
                })
            }
        });

        /// <summary>
        /// Socket hook to update menu on client side.
        /// </summary>
        socket.on("serverMenuUpdate", function (data) {
            app.io.emit("clientMenuUpdate", data);
        });

        /// <summary>
        /// Socket hook to read and parse messages from remote.
        /// </summary>
        socket.on('remote-said', (msg) => {
            console.log('DISPLAY ID', msg.displayid);
            lastMSG = msg;
            io.to(msg.displayid).emit('remote-said', lastMSG)
        });

        /// <summary>
        /// Socket hook to set display as interactive.
        /// </summary>
        socket.on('show-interactive', (msg) => {
            io.to(msg.displayid).emit('show-interactive', true);
            console.log('show-interactive', msg);
        });

        /// <summary>
        /// Socket hook to show grid on display.
        /// </summary>
        socket.on('show-grid', (msg) => {
            io.to(msg.displayid).emit('show-grid', msg);
            console.log('show-grid');
        });

        /// <summary>
        /// Socket hook to reload display data.
        /// </summary>
        socket.on('reload', function () {
            io.to(msg.displayid).broadcast.emit('reload', 'now');
            console.log('reload');
        });

        /// <summary>
        /// Socket hook to handle server ready status. Not doing anything productive right now.
        /// </summary>
        socket.on('serverReady', function (msg) {
            console.log(msg);
        });

        /// <summary>
        /// Socket hook to process logout.
        /// </summary>
        socket.on('hello', function (msg) {
            console.log(msg);
            if (msg.hasOwnProperty('reason')) {
                console.log('bye from server', socketId);
                io.to(socketId).emit('logout', 'bye');
            }
        });

        /// <summary>
        /// Socket hook to update last communication status between display and server.
        /// </summary>
        socket.on('displayPing', function (msg) {
            DB.GetPoolConnection(function (conn) {
                try {
                    if (conn) {
                        SQL = `UPDATE screens SET lastping = now() WHERE socket = ${conn.escape(socket.id)} `;
                        conn.release();
                        try {
                            DB.Query(SQL, null, function (res, err) {
                                if (err) {
                                    console.log(err);
                                }
                            });
                        } catch (error) {
                            console.log('---------- [Socket.Route] Error on DB Query ----------\n', error)
                        }
                    }
                } catch (error) {
                    console.log('---------- [Socket.Route] Error on GetPoolConnection ----------\n', error)
                }
            })
        });

        /// <summary>
        /// Socket hook to fetch display data.
        /// </summary>
        socket.on('getDisplayData', function (msg) {
            var socketId = socket.id;
            console.log('Display ID:', socketId, 'requested data.');
            DB.GetPoolConnection(function (conn) {
                try {
                    if (conn) {
                        SQL = `SELECT content FROM screens WHERE displayid = ${conn.escape(msg.displayid)} `;
                        conn.release();
                        try {
                            DB.Query(SQL, null, function (res, err) {
                                if (err) { console.log(err); }
                                if (res) {
                                    if (res.length >= 1) {
                                        io.to(socketId).emit('setDisplayData', res[0].content);
                                    }
                                }
                            });
                        } catch (error) {
                            console.log('---------- [Socket.Route] Error on DB Query ----------\n', error)
                        }
                    }
                } catch (error) {
                    console.log('---------- [Socket.Route] Error on GetPoolConnection ----------\n', error)
                }
            })
        });

        /// <summary>
        // Socket hook acting as message relay to send information to the display.
        /// </summary>
        socket.on('messageTo', function (data) {
            console.log("Message to", data);
            io.to(data.displayid).emit(data.messageName, data);
        });

        //REMOTE CALLS

        /// <summary>
        /// Socket hook to get store id.
        /// </summary>
        socket.on('getStoreId', function () {

            var SQL = `SELECT post_parent AS storeId FROM rtl_posts WHERE ID = (SELECT parentid FROM screens WHERE remoteId = '${socket.id}') LIMIT 0, 1`;
            var socketId = socket.id;

            if (undefined !== screens.find(el => el.remoteid == socket.id) && screens.length > 0) {

                var usedisplay = screens[screens.indexOf(screens.find(el => el.remoteid == `${socket.id} `))].usedisplay;
                var storeid = screens[screens.indexOf(screens.find(el => el.remoteid == `${socket.id} `))].storeid;

                io.to(socketId).emit('setStoreId', storeid);
                io.to(socketId).emit('setUseDisplay', usedisplay);
                return;

            } else {
                DB.GetPoolConnection(function (conn) {
                    try {
                        if (conn) {
                            SQL = `SELECT post_parent AS storeId FROM rtl_posts WHERE ID = (SELECT parentid FROM screens WHERE remoteId = ${conn.escape(socket.id)}) LIMIT 0, 1`;
                            conn.release();
                            try {
                                DB.Query(SQL, null, function (res, err) {
                                    if (err) { console.log(err); }
                                    if (res) {
                                        if (res.length >= 1) {
                                            io.to(socketId).emit('setStoreId', res[0].storeId);
                                        }
                                    }
                                });
                            } catch (error) {
                                console.log('---------- [Socket.Route] Error on DB Query ----------\n', error)
                            }
                        }
                    } catch (error) {
                        console.log('---------- [Socket.Route] Error on GetPoolConnection ----------\n', error)
                    }
                })
            }


        });

        // RECOVER PRODUCT DATA 

        /// <summary>
        /// Socket hook to search a product from database.
        /// </summary>
        socket.on('searchProduct', function (data) {
            // SEARCH FOR LOCATOR QUERY
            var socketId = socket.id;
            var SQL = `SELECT data FROM products WHERE id = (SELECT t1.productid FROM product_locator AS t1 WHERE t1.storeid = ${data.storeid} AND t1.locator = UPPER('${data.query}') LIMIT 0, 1) LIMIT 0, 1`;
            var locator = data.query;

            DB.GetPoolConnection(function (conn) {
                try {
                    if (conn) {
                        SQL = `SELECT data FROM products WHERE id = (SELECT t1.productid FROM product_locator AS t1 WHERE t1.storeid = ${conn.escape(data.storeid)} AND t1.locator = UPPER(${conn.escape(data.query)}) LIMIT 0, 1) LIMIT 0, 1`;
                        conn.release();
                        try {
                            DB.Query(SQL, null, function (res, err) {
                                if (err) { console.log(err); }
                                if (res) {
                                    if (res.length >= 1) {
                                        // SEND INFO TO REMOTE
                                        io.to(socketId).emit('setProductData', res[0].data);
                                        //SEND INFO TO DISPLAY
                                        var dataToDisplay = JSON.parse(res[0].data);
                                        dataToDisplay.core.locator = locator; // INCLUDE LOCATOR TO BE DISPLAYED ON PRODUCT BODY INFO

                                        io.to(data.displayid).emit('setProductData', JSON.stringify(dataToDisplay));

                                    } else {
                                        io.to(socketId).emit('setProductData', null);
                                    }
                                }
                            });
                        } catch (error) {
                            console.log('---------- [Socket.Route] Error on DB Query ----------\n', error)
                        }
                    }
                } catch (error) {
                    console.log('---------- [Socket.Route] Error on GetPoolConnection ----------\n', error)
                }
            })


        });


        // DISCONNECT
        /// <summary>
        /// Socket hook handling disconnection fallback.
        /// </summary>
        socket.on('disconnect', function (data) {
            //RELEASE SCREEN WHEN REMOTE DISCONNECT
            if (socket.handshake.query.type == 'remote') {
                //socket.handshake.query.usedisplay = '123456';
                //console.log(socket.handshake);
                DB.GetPoolConnection(function (conn) {
                    try {
                        if (conn) {
                            SQL = `SELECT socket FROM screens WHERE remoteid = ${conn.escape(socket.id)} `
                            conn.release();
                            try {
                                DB.Query(SQL, null, function (res, err) {
                                    if (err) { console.log(err); }
                                    if (res) {
                                        //console.log('display socket', res[0].socket);
                                        // RESET THE DISPLAY TO IT'S STARTING MODE
                                        if (res.length >= 1) {
                                            //io.to(res[0].socket).emit('remote-said', true);
                                            io.to(res[0].socket).emit('reset', 'now');
                                        }
                                        //console.log("disconnected ", socket.id);
                                        //SQL = `SELECT _id, displayid FROM displays WHERE remoteid ${ socket.id } `;
                                        DB.GetPoolConnection(function (conn) {
                                            try {
                                                if (conn) {

                                                    SQL = `UPDATE screens SET inuse = 'false', remoteid = '' WHERE remoteid = ${conn.escape(socket.id)} `;
                                                    conn.release();
                                                    console.log(socket.handshake.query.type);
                                                    try {
                                                        DB.Query(SQL, null, function (res, err) { });
                                                    } catch (error) {
                                                        console.log('---------- [Socket.Route] Error on DB Query ----------\n', error)
                                                    }
                                                    //con.query(SQL, function(err,res){});
                                                }
                                            } catch (error) {
                                                console.log('---------- [Socket.Route] Error on GetPoolConnection ----------\n', error)
                                            }
                                        })
                                    }
                                });
                            } catch (error) {
                                console.log('---------- [Socket.Route] Error on DB Query ----------\n', error)
                            }
                        }
                    } catch (error) {
                        console.log('---------- [Socket.Route] Error on GetPoolConnection ----------\n', error)
                    }
                })

            }
            if (socket.handshake.query.type == 'display') {
                socketId = socket.id;
                var now = new Date().toISOString();
                console.log('disconnect remote', usingRemote);
                var secret = toString(usingRemote);
                var hash = crypto.createHmac('sha256', secret)
                    .update(now)
                    .digest('hex');
                DB.GetPoolConnection(function (conn) {
                    try {
                        if (conn) {

                            SQL = `UPDATE screens SET inuse = 'false', remoteid = '', status = 'off', socket = '', temporaryid = '' WHERE socket = ${conn.escape(socket.id)} `;
                            conn.release();
                            //console.log(SQL);
                            //con.query(SQL, function(err, res){});
                            try {
                                DB.Query(SQL, null, function (res, err) { });
                            } catch (error) {
                                console.log('---------- [Socket.Route] Error on DB Query ----------\n', error)
                            }
                        }
                    } catch (error) {
                        console.log('---------- [Socket.Route] Error on GetPoolConnection ----------\n', error)
                    }
                })

            }
            //INFORM REMOTE IF DISPLAY IS DOWN
        });

        //CREATE A MEMORY OBJECT TO STORE ALL AVAILABLE SCREENS AT THE TIME OF LOGIN
        if (socket.handshake.query.type == 'display') {
            var now = new Date().toISOString();
            console.log("\x1b[32m", 'Display Active', socket.handshake.query.uid, "\x1b[0m");
            var secret = toString(usingRemote);
            var hash = crypto.createHmac('sha256', secret)
                .update(now)
                .digest('hex');

            console.log("temporaryid:", hash);

            SQL = `INSERT INTO screens(_id, displayid, path, socket, remoteid, status, inuse, interactive, firstping, lastping, temporaryid, storeid) VALUES(null, '${socket.handshake.query.uid}', md5('${socket.handshake.query.uid}'), '${socket.id}', '', 'live', 'false', 'true', now(), now(), '${hash}', 0)`;

            if (undefined === screens.find(el => el.displayid == socket.handshake.query.uid)) {
                screens.push({ 'displayid': `${socket.handshake.query.uid} `, 'usedisplay': ``, 'storeid': '' })
            }

            DB.GetPoolConnection(function (conn) {
                try {
                    if (conn) {
                        SQL = `INSERT INTO screens(_id, displayid, path, socket, remoteid, status, inuse, interactive, firstping, lastping, temporaryid, storeid) VALUES(null, ${conn.escape(socket.handshake.query.uid)}, md5(${conn.escape(socket.handshake.query.uid)}), ${conn.escape(socket.id)}, '', 'live', 'false', 'true', now(), now(), ${conn.escape(hash)}, 0)`;
                        conn.release();
                        //con.query(SQL, function(err, result) {
                        try {
                            DB.Query(SQL, null, function (res, err) {
                                if (err) {
                                    //console.log('DB Error', err)
                                    if (err.code == 'ER_DUP_ENTRY') {
                                        //-> TO DO When Error type is uniqueViolated verify if screen is in use and update screen status accordinly
                                        DB.GetPoolConnection(function (conn) {
                                            try {
                                                if (conn) {
                                                    SQL = `UPDATE screens SET socket = ${conn.escape(socket.id)}, status = 'live', inuse = 'false', lastping = now(), temporaryid = ${conn.escape(hash)} WHERE displayid = ${conn.escape(socket.handshake.query.uid)} `;
                                                    conn.release();
                                                    //console.log('here',  SQL);
                                                    //con.query(SQL, function(err, result) { });
                                                    try {
                                                        DB.Query(SQL, null, function (res, err) { });
                                                    } catch (error) {
                                                        console.log('---------- [Socket.Route] Error on DB Query ----------\n', error)
                                                    }
                                                }
                                            } catch (error) {
                                                console.log('---------- [Socket.Route] Error on GetPoolConnection ----------\n', error)
                                            }
                                        })
                                    }
                                }
                                if (res) {
                                    if (res !== undefined) {
                                        console.log('no result');
                                    }
                                }
                            });
                        } catch (error) {
                            console.log('---------- [Socket.Route] Error on DB Query ----------\n', error)
                        }
                    }
                } catch (error) {
                    console.log('---------- [Socket.Route] Error on GetPoolConnection ----------\n', error)
                }
            })


            // SET INFO NEEDED ON REMOTE IN LOCAL VARIABLE FOR QUICK ACCESS
            DB.GetPoolConnection(function (conn) {
                try {
                    if (conn) {
                        SQL = `SELECT socket, storeid FROM screens WHERE displayid = ${conn.escape(socket.handshake.query.uid)} LIMIT 0, 1`;
                        conn.release();
                        try {
                            DB.Query(SQL, null, function (res, err) {
                                if (err) { }
                                if (res) {
                                    if (res !== undefined) {
                                        screens[screens.indexOf(screens.find(el => el.displayid == `${socket.handshake.query.uid} `))].storeid = res[0].storeid;
                                        screens[screens.indexOf(screens.find(el => el.displayid == `${socket.handshake.query.uid} `))].usedisplay = res[0].socket;
                                    }
                                }
                            });
                        } catch (error) {
                            console.log('---------- [Socket.Route] Error on DB Query ----------\n', error)
                        }
                    }
                } catch (error) {
                    console.log('---------- [Socket.Route] Error on GetPoolConnection ----------\n', error)
                }
            })

        }

        //ACTIVATE WHEN REMOTE CONNECT
        if (socket.handshake.query.type == 'remote') {
            var socketId = socket.id;
            // Create a cookies object
            var path = socket.handshake.headers.referer.split("/");
            // var ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.substring(7);
            var ip = "127.0.0.1";

            //console.log("path" ,  path[4]);
            //console.log('USING REMOTE',  usingRemote);
            DB.GetPoolConnection(function (conn) {
                try {
                    if (conn) {
                        //SQL = `INSERT INTO logs VALUES(null, '${socket.id}', NOW(), '${data.fingerprint}', '${data.storeid}', '${data.sku}', '{\"data\":\"scan qr code\"}', ${ data.displayid }, ${ data.screenid }, UPPER('${data.gridposition}'), '${ip}')`;
                        SQL = `INSERT INTO logs VALUES(null, ${conn.escape(socket.id)}, NOW(), ${conn.escape(socket.handshake.query.uid)}, '1', '', '{\"data\":\"scan qr code\"}', '0', '0', '0', ${conn.escape(ip)}, 'info')`;
                        conn.release();

                        console.log(socket.handshake);
                        try {
                            DB.Query(SQL, null, function (res, err) {
                                if (err) {
                                    console.log(err);
                                }
                            });
                        } catch (error) {
                            console.log('---------- [Socket.Route] Error on DB Query ----------\n', error)
                        }


                    }
                } catch (error) {
                    console.log('---------- [Socket.Route] Error on GetPoolConnection ----------\n', error)
                }
            })


            DB.GetPoolConnection(function (conn) {
                try {
                    if (conn) {
                        SQL = `SELECT displayid, status, socket, inuse, remoteid FROM screens WHERE temporaryid = ${conn.escape(path[4])} `;
                        conn.release();
                        //console.log(SQL);
                        // IF NO DISPLAY AVAILABLE SEND ERROR TO REMOTE
                        try {
                            DB.Query(SQL, null, function (res, err) {

                                if (err) {
                                    // SEND DISPLAY IS NOT AVAILABLE IF CAN FIND DISPLAY
                                    io.to(socketId).emit('busy', 'bye');
                                    // SEND ALERT OF FAKE DISPLAY NOT CONNECTED
                                }
                                //console.log(res[0]);
                                if (res) {
                                    if (typeof res[0] !== 'undefined' && res[0].inuse == 'false') {
                                        console.log('was available', res[0].socket);
                                        if (res[0].socket != 'undefined' && res[0].socket != '') {
                                            io.to(socketId).emit('setdisplay', res[0].socket); // SET SCREEN OCKET TO THE REMOTE;

                                            if ('undefined' === typeof screens[screens.indexOf(screens.find(el => el.displayid == `${res[0].displayid} `))].remoteid) {
                                                screens[screens.indexOf(screens.find(el => el.displayid == `${res[0].displayid} `))].remoteid = socketId;
                                            }
                                            DB.GetPoolConnection(function (conn) {
                                                try {
                                                    if (conn) {
                                                        SQL = `UPDATE screens SET  remoteid = ${conn.escape(socket.id)}, inuse = 'true', lastping = now() WHERE temporaryid = ${conn.escape(path[4])} `;
                                                        conn.release();
                                                        try {
                                                            DB.Query(SQL, null, function (res, err) { });
                                                        } catch (error) {
                                                            console.log('---------- [Socket.Route] Error on DB Query ----------\n', error)
                                                        }
                                                    }
                                                } catch (error) {
                                                    console.log('---------- [Socket.Route] Error on GetPoolConnection ----------\n', error)
                                                }
                                            })
                                        } else {
                                            // SEND DISPLAY IS NOT AVAILABLE IF CAN FIND DISPLAY
                                            io.to(socketId).emit('busy', 'bye');
                                        }
                                    } else {
                                        //CHECK IF REMOTE REQUESTING IS THE ONE USING THE DISPLAY
                                        //IF IS PROCEED
                                        console.log('was busy');
                                        // SEND DISPLAY IS NOT AVAILABLE IF CAN FIND DISPLAY
                                        io.to(socketId).emit('busy', 'bye');
                                    }
                                }
                            });
                        } catch (error) {
                            console.log('---------- [Socket.Route] Error on DB Query ----------\n', error)
                        }

                    }
                } catch (error) {
                    console.log('---------- [Socket.Route] Error on GetPoolConnection ----------\n', error)
                }
            })
        }
    });
};