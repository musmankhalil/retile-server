var connObj = require('../config/db')
var mysql = require('mysql')


// console.log(connObj)
var pool = mysql.createPool(connObj);


var DB = (function () {
    /// <summary>
    /// Used to execute queries on the database.
    /// </summary>
    /// <param name="query">Database query to be executed</param>
    /// <param name="params">Query parameters</param>
    /// <param name="callback">Callback function executed after the query is succesful</param>
    /// <returns>Returns query results in callback function as param</returns>
    function _query(query, params, callback) {
        pool.getConnection(function (err, connection) {

            if (err) {
                if (err) {
                    //connection.release();
                    console.log('ERROR ON GET CONNECTION', err)
                }
                //callback(null, err);
                //throw err;
                console.log('ERROR ON DB')
            }

            if (connection) {
                connection.query(query, params, function (err, rows) {
                    connection.release();
                    if (!err) {
                        callback(rows);
                    }
                    else {
                        callback(null, err);
                    }
                });

                /***************** ********************************************/
                // Added one more check before connection.on('error', function (err) {
                // Check added, as Emitter error handler which was being attached every time a connection was being pulled from the MySQL Connection Pool 
                // and doing so the maxListeners limit was exceeding. It has been resolved after adding this check.
                /***************** ********************************************/
                if (connection.listeners('error').length == 0) {
                    connection.on('error', function (err) {
                        connection.release();
                        callback(null, err);
                        //throw err;
                        console.log(err.code);
                        if (err.code === 'PROTOCOL_CONNECTION_LOST') {

                        }
                    });
                }
            }
        });

        pool.setMaxListeners(40);
    };

    /// <summary>
    /// This method creates a MySql DB Pool Connection or Returns one if there's already a free connection available.
    /// </summary>
    /// <param name="callback">Callback function executed after the connection is succesfully created.</param>
    /// <returns>Returns Connection object in callback function as param</returns>
    function _getPoolConnection(callback) {
        try {
            pool.getConnection(function (err, connection) {
                if (connection) {
                    callback(connection);
                } else {
                    callback(null);
                }
            });
        } catch (error) {
            callback(null)
            console.log('---------- [DB.Controller] Error on GetPoolConnection ----------\n', error)
        }
    }

    return {
        Query: _query,
        GetPoolConnection: _getPoolConnection
    };
})();


module.exports = DB