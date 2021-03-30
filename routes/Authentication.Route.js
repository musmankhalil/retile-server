
const authController = require('../controllers/Authentication.Controller');
const DB = require('../controllers/DB.Controller');



module.exports = function (app) {

    /// <summary>
    /// Route to fetch JWT Authentication Token.
    /// </summary>
    /// <returns>Returns JWT Authentication Token</returns>
    app.get('/getToken', (req, res) => {
        res.send(authController.GetAuthToken());
    });

};