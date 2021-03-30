const DB = require('./DB.Controller');
const Cookies = require('cookies');
const btoa = require('btoa');

//https://www.npmjs.com/package/cookies
// Optionally define keys to sign cookie values to prevent client tampering
const keys = ['jujuba'];

/// <summary>
/// Used to get Display device details against a provided ID.
/// </summary>
/// <param name="req">request object from route. Required id is sent within this object</param>
/// <param name="res">Route result object</param>
/// <param name="callback">Callback function executed after display details are succesfully fetched</param>
/// <returns>Returns response in callback function as param</returns>
const getDisplayByID = (req, res, callback) => {
    var cookies = new Cookies(req, res, { keys: keys });
    var date = new Date();
    var lastVisit = cookies.get('_rtlv', { signed: true });
    if (typeof lastVisit === undefined) {
        cookies.set('_rtlv', date.getTime(), { signed: true });
    } else {
        var diffTime = Math.round((date.getTime() - parseInt(lastVisit)) / 1000);
        if (diffTime < 10) {
            callback({ isFile: true, response: __dirname + '/views/error/' });
        } else {
            if (req.params.id != 'favicon.ico') {
                usingRemote = req.params.id;
                console.log('remote on access', req.params.id);
                DB.GetPoolConnection(function (conn) {
                    try {
                        if (conn) {
                            SQL = `SELECT temporaryid, inuse, interactive, status FROM screens WHERE path = ${conn.escape(req.params.id)} and inuse='false'`;
                            conn.release();
                            try {
                                DB.Query(SQL, null, function (resp, err) {
                                    if (err) { console.log("ERROR ON DISPLAY SELECTED", err); }
                                    if (resp) {
                                        console.log(resp);
                                        if (resp.length > 0 && 'undefined' !== typeof resp[0].temporaryid && resp[0].temporaryid != '') {
                                            cookies.set('_rtpath', resp[0].temporaryid, { path: '/' });
                                            callback({ response: `<script>window.location.replace('/remote/${resp[0].temporaryid}');</script>` });
                                        } else {
                                            console.log('Display is busy or inactive.');
                                            DB.GetPoolConnection(function (conn) {
                                                try {
                                                    if (conn) {
                                                        SQL = `SELECT storeid FROM screens WHERE path = ${conn.escape(req.params.id)}`;
                                                        conn.release();
                                                        try {
                                                            DB.Query(SQL, null, function (resp, err) {
                                                                if (err) { console.log("ERROR NO STORE AVAILABLE", err); }
                                                                if (resp) {
                                                                    if (resp.length > 0 && 'undefined' !== typeof resp[0].storeid) {
                                                                        var qs = btoa('storeid=' + resp[0].storeid);
                                                                        callback({ statusCode: 200, response: `<script>window.location.replace('/view/${qs}/');</script>` });
                                                                    } else {
                                                                        callback({ statusCode: 200, response: `<script>window.location.replace('https://lowes.com');</script>` });
                                                                    }
                                                                }
                                                            });
                                                        } catch (error) {
                                                            console.log('---------- [Display.Controller] Error on DB Query ----------\n', error)
                                                        }
                                                    }
                                                } catch (error) {
                                                    console.log('---------- [Display.Controller] Error on GetPoolConnection ----------\n', error)
                                                }
                                            })
                                        }
                                    }
                                });
                            } catch (error) {
                                console.log('---------- [Display.Controller] Error on DB Query ----------\n', error)
                            }
                        }
                    } catch (error) {
                        console.log('---------- [Display.Controller] Error on GetPoolConnection ----------\n', error)
                    }
                })

            }
        }
        cookies.set('_rtlv', date.getTime(), { signed: true });
    }
    var ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
}

module.exports = {
    GetDisplayByID: getDisplayByID,
}