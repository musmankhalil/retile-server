const API = require('../controllers/General.Controller');
const viewController = require('../controllers/View.Controller');

module.exports = function (app) {
    /// <summary>
    /// Route to HTML View Content. Calls GetView Function from controller.
    /// </summary>
    /// <returns>Returns HTML View Content</returns>
    app.get('/view/', function (req, res) {
        viewController.GetView((result) => {
            API.SendAPIResponse(res, result);
        });
    });

    /// <summary>
    /// Route to fetch HTML View Content. Calls GetViewByID Function from controller.
    /// </summary>
    /// <param name="id">Gets id param as API query</param>
    /// <returns>Returns HTML View Content</returns>
    app.get('/view/:id', function (req, res) {
        viewController.GetViewById((result) => {
            API.SendAPIResponse(res, result);
        });
    });

};