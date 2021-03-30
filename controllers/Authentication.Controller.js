const jwt = require('jsonwebtoken')
const authConfig = require('../config/auth')


/// <summary>
/// Used to create JWT Token for autehntication upon request from any connecting device.
/// </summary>
/// <returns>Returns Access Token.</returns>
const getAuthToken = () => {
    const accesstoken = jwt.sign({ deviceType: 'display' }, authConfig.secretKey);
    return accesstoken;
}

module.exports = {
    GetAuthToken: getAuthToken,
}