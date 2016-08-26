const fetch = require('node-fetch');
const key = process.env.GOOGLE_PLACES_API_KEY;

export const placesCall = (place, cb, nearbyLoc) => {
  let loc, radius;
  if (nearbyLoc) { // nearby location was passed in as reference to search near
    loc = '' + nearbyLoc[0] + ',' + nearbyLoc[1];
    radius = '150000';
  } else { // default to searching the entire world
    loc = '0,0';
    radius = '20000000';
  }

  let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${place}&location=${loc}&radius=${radius}&key=${key}`;

  fetch(url)
    .then(res => {
      return res.json();
    })
    .then(data => {
      // if no predictions found, break out
      if (!data.predictions.length) {
        cb(null, null);
        return;
      }

      let placeDesc = data.predictions[0].description;
      console.log('Place found:', placeDesc);
      // TODO: filter out place results with distance from home > 100 miles
      let placeId = data.predictions[0].place_id;
      let detailURL = `https://maps.googleapis.com/maps/api/place/details/json?placeid=${placeId}&key=${key}`;

      fetch(detailURL)
        .then(res => {
          return res.json();
        })
        .then(data => {
          let placeLat = data.result.geometry.location.lat;
          let placeLong = data.result.geometry.location.lng;
          let routableAddress = data.result.formatted_address;
          cb(placeDesc, [placeLat, placeLong]);
        })
        .catch(err => {
          console.log('error on place detail', err, '\nplace:', place);
        });
    })
    .catch(err => {
      console.log('err in places:', err, '\nplace:', place, '\nurl', url);
    });
};
