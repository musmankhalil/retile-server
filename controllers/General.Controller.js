
/// <summary>
/// Used to send route response from controlelrs.
/// </summary>
/// <param name="res">Route result object</param>
/// <param name="result">Response object to be sent</param>
/// <returns>Returns nothing</returns>
const sendResponse = (res, result) => {
    if (result) {
        if (result.isFile) {
            if (result.statusCode) {
                res.status(result.statusCode).sendFile(result.response);
            } else {
                res.sendFile(result.response);
            }
        } else {
            if (result.statusCode) {
                res.status(result.statusCode).send(result.response);
            } else {
                res.send(result.response);
            }
        }
    }
}

module.exports = {
    SendAPIResponse: sendResponse
}