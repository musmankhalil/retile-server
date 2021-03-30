const DB = require('./DB.Controller');

/// <summary>
/// Used to get Remote view against a provided ID.
/// </summary>
/// <param name="req">request object from route. Required id is sent within this object</param>
/// <param name="res">Route result object</param>
/// <param name="callback">Callback function executed after display details are succesfully fetched</param>
/// <returns>Returns response in callback function as param</returns>
const getRemoteById = (req, res, callback) => {
    DB.GetPoolConnection(function (conn) {
        try {
            if (conn) {
                SQL = `SELECT _id, socket FROM screens WHERE temporaryid = ${conn.escape(req.params.id)}`;
                conn.release();
                try {
                    DB.Query(SQL, null, function (resp, err) {
                        if (err) { console.log(err); }
                        if (resp) {
                            if (resp.length > 0) {
                                callback({ isFile: true, response: appName + '/views/remote/' });
                            } else {
                                callback({ isFile: true, response: appName + '/views/error/' });
                            }
                        }
                    });
                } catch (error) {
                    console.log('---------- [Remote.Controller] Error on DB Query ----------\n', error)
                }
            }
        } catch (error) {
            console.log('---------- [Remote.Controller] Error on GetPoolConnection ----------\n', error)
        }
    })
}

module.exports = {
    GetRemoteById: getRemoteById,
}