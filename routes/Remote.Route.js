const remoteController = require('../controllers/Remote.Controller')
const API = require('../controllers/General.Controller')

module.exports = function (app) {

    /// <summary>
    /// Route to fetch Remote. Calls GetRemoteByID Function from controller.
    /// </summary>
    /// <param name="id">Gets id param as API query</param>
    /// <returns>Returns remote data</returns>
    app.get('/remote/:id', function (req, res) {
        remoteController.GetRemoteById(req, res, (result) => {
            API.SendAPIResponse(res, result);
        });
    });

};