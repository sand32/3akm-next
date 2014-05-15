module.exports = function(app, prefix){
    // GET /name/1234
    app.get(prefix + "/name/:nameId(\\d+)", function(req, res){
        // Retrieve data for the guest by the given ID
        // If null data returned, 404
    });

    // PUT /name/1234
    app.post(prefix + "/name/:nameId(\\d+)", function(req, res){
        // If the name by the given ID doesn't exist, 404
        // Update a guest record in the database
    });

    // GET /name
    app.get(prefix + "/name", function(req, res){
        // Retrieve the list of all known guests
    });

    // POST /name
    app.post(prefix + "/name", function(req, res){
        // Add a guest to the database
    });

    // PUT /year/2014
    app.put(prefix + "/year/:year(\\d{4})", function(req, res){
        // Add to the list of valid years
    });

    // GET /year
    app.get(prefix + "/year", function(req, res){
        // Retrieve the list of valid years
    });

    // GET /rsvp/2014/1234
    app.get(prefix + "/rsvp/:year(\\d{4})/:nameId(\\d+)", function(req, res){
        // Check that the given year is valid, 404 if not
        // Check that the given name ID is valid, 404 if not
        // Retrieve record from database
    });

    // PUT /rsvp/2014/1234
    app.put(prefix + "/rsvp/:year(\\d{4})/:nameId(\\d+)", function(req, res){
        // Check that the given year is valid, 404 if not
        // Check that the given name ID is valid, 404 if not
        // Update record in database
    });

    // GET /rsvp/2014
    app.get(prefix + "/rsvp/:year(\\d{4})", function(req, res){
        // Check that the given year is valid, 404 if not
        // Retrieve the list of RSVPs for the given year
    });
}

