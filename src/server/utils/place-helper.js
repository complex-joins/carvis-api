var fetch = require('node-fetch');
fetch.Promise = require('bluebird');
var _ = require('lodash');

var key = process.env.GOOGLE_PLACES_API_KEY;

var placesCall = function(place, cb, nearbyLoc) {
  var loc, radius;
  if (nearbyLoc) { // nearby location was passed in as reference to search near
    loc = '' + nearbyLoc[0] + ',' + nearbyLoc[1];
    radius = '150000';
  } else { // default to searching the entire world
    loc = '0,0';
    radius = '20000000';
  }

  var url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${place}&location=${loc}&radius=${radius}&key=${key}';
  url = _.template(url)({
    place: place,
    key: key,
    loc: loc,
    radius: radius
  });

  fetch(url).then( function(res) {
    return res.json();
  }).then( function(data) {
    console.log('data in response from google places api:', data);
    var placeDesc = data.predictions[0].description;
    console.log('Place found:', placeDesc);
    // TODO: filter out place results with distance from home > 100 miles
    var placeId = data.predictions[0].place_id;
    var detailURL = 'https://maps.googleapis.com/maps/api/place/details/json?placeid=${placeId}&key=${key}';
    detailURL = _.template(detailURL)({
      placeId: placeId,
      key: key
    });

    fetch(detailURL).then( function(res) {
      return res.json();
    }).then( function(data) {
      var placeLat = data.result.geometry.location.lat;
      var placeLong = data.result.geometry.location.lng;
      var routableAddress = data.result.formatted_address;
      // ie. "48 Pirrama Road, Pyrmont NSW, Australia"
      cb(placeDesc, [placeLat, placeLong]);
    }).catch( function(err) {
      console.log('error on place detail', err);
    });
  }).catch(function(err) {
    console.log('err in places', err);
  });
};

module.exports = placesCall;
