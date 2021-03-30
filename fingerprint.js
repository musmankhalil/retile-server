
const getFingerprint = function () {

    var fp = Math.floor(Math.random() * 100);
    return fp;
}

exports.getFingerprint = getFingerprint;