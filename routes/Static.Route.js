module.exports = function (app, express, path) {

    app.use('/', express.static('public'));
    // app.use('/assets', express.static(path.join(__dirname, '', '/assets')));
    // app.use('/css', express.static(path.join(__dirname, '', '/assets/css')));
    // app.use('/js', express.static(path.join(__dirname, '', '/assets/js')));
    // app.use('/images', express.static(path.join(__dirname, '', '/assets/images')));
    // app.use('/widgets', express.static(path.join(__dirname, '', '/assets/widgets')));
    // app.use('/remote/css', express.static(path.join(__dirname, '', './assets/css')));
    // app.use('/remote/js', express.static(path.join(__dirname, '', './assets/js')));
    // app.use('/view/css', express.static(path.join(__dirname, '', './assets/css')));
    // app.use('/view/js', express.static(path.join(__dirname, '', './assets/js')));
    // app.use('/assets', express.static(path.join(__dirname, '', '/assets')));

    app.use('/css', express.static(path.join(appName, '', '/assets/css')));
    // console.log();
    app.use('/js', express.static(path.join(appName, '', '/assets/js')));
    app.use('/images', express.static(path.join(appName, '', '/assets/images')));
    app.use('/widgets', express.static(path.join(appName, '', '/assets/widgets')));
    app.use('/remote/css', express.static(path.join(appName, '', './assets/css')));
    app.use('/remote/css', express.static(path.join(appName, '', './assets/css')));
    app.use('/view/css', express.static(path.join(appName, '', './assets/css')));
    app.use('/view/js', express.static(path.join(appName, '', './assets/js')));
    app.use('/remote-js', express.static(path.join(appName, '', '/views/remote/remote.js')));
    app.use('/content-js', express.static(path.join(appName, '', '/views/content/content.js')));
    app.use('/color-picker-widget', express.static(path.join(appName, '', '/widgets/ColorPicker/')));
    app.use('/custom-coverage-calculator-widget', express.static(path.join(appName, '', '/widgets/CustomCoverageCalculator/')));

    //RETURN FAVICON AS NO CONTENT
    //https://stackoverflow.com/questions/35408729/express-js-prevent-get-favicon-ico
    app.get('/favicon.ico', (req, res) => res.status(204));

};