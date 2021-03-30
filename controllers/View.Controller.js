/// <summary>
/// Used to fetch HTML content view.
/// </summary>
/// <param name="callback">Function to be called upon success. Resulting View object is passed as the parameter</param>
/// <returns>Returns nothing</returns>
const getView = (callback) => {
    callback({ isFile: true, statusCode: 200, response: appName + '/views/content/' });
}

/// <summary>
/// Used to fetch HTML content view.
/// </summary>
/// <param name="callback">Function to be called upon success. Resulting View object is passed as the parameter</param>
/// <returns>Returns nothing</returns>
const getViewById = (callback) => {
    callback({ isFile: true, statusCode: 200, response: appName + '/views/content/' });
}

module.exports = {
    GetView: getView,
    GetViewById: getViewById
}