const displayController = require('../controllers/Display.Controller');
const API = require('../controllers/General.Controller');

module.exports = function (app) {
    /// <summary>
    /// Route to fetch Display. Calls GetDisplatByID Function from controller.
    /// </summary>
    /// <param name="id">Gets id param as API query</param>
    /// <returns>Returns dislay data</returns>
    app.get('/display/:id', (req, res) => {
        displayController.GetDisplayByID(req, res, function (result) {
            API.SendAPIResponse(res, result);
        });
    });
}