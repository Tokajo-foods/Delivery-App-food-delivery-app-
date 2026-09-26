/**
 * Google Maps JavaScript API HTML for the restaurant location WebView picker.
 * Uses Maps + Places libraries (not Expo / Apple maps).
 */
export function buildGoogleMapHtml(lat: number, lng: number, apiKey: string): string {
  const key = apiKey.replace(/'/g, "\\'");
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; background: #e8eaed; }
  .center-pin {
    position: absolute; left: 50%; top: 50%;
    transform: translate(-50%, -100%);
    z-index: 1000; pointer-events: none;
  }
  .center-pin svg { filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35)); }
</style>
</head>
<body>
<div id="map"></div>
<div class="center-pin">
  <svg width="44" height="44" viewBox="0 0 24 24" fill="#9E1B32" stroke="#9E1B32" stroke-width="1.5">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
    <circle cx="12" cy="10" r="3" fill="#fff" stroke="#fff"></circle>
  </svg>
</div>
<script>
  var map;
  var autocompleteService;
  var placesService;
  var geocoder;
  var suppressIdleUntil = 0;
  function post(payload) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    }
  }
  function emitCenter() {
    if (!map) return;
    if (Date.now() < suppressIdleUntil) return;
    var c = map.getCenter();
    var lng = c.lng();
    while (lng > 180) lng -= 360;
    while (lng < -180) lng += 360;
    post({ type: 'move', lat: c.lat(), lng: lng });
  }
  function setMapView(lat, lng, zoom) {
    if (!map) return;
    suppressIdleUntil = Date.now() + 800;
    map.setCenter({ lat: lat, lng: lng });
    if (zoom) map.setZoom(zoom);
    else map.setZoom(17);
  }
  function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: ${lat}, lng: ${lng} },
      zoom: 16,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      gestureHandling: 'greedy',
      mapId: undefined
    });
    autocompleteService = new google.maps.places.AutocompleteService();
    placesService = new google.maps.places.PlacesService(map);
    geocoder = new google.maps.Geocoder();
    map.addListener('idle', emitCenter);
    document.addEventListener('message', handleRN);
    window.addEventListener('message', handleRN);
    post({ type: 'ready' });
    emitCenter();
  }
  function handleRN(e) {
    try {
      var msg = JSON.parse(e.data);
      if (msg.type === 'setView' && map) {
        setMapView(msg.lat, msg.lng, msg.zoom);
      }
      if (msg.type === 'autocomplete' && autocompleteService) {
        var req = {
          input: String(msg.query || '').trim(),
          componentRestrictions: { country: 'in' },
          language: 'en'
        };
        if (typeof msg.lat === 'number' && typeof msg.lng === 'number') {
          req.location = new google.maps.LatLng(msg.lat, msg.lng);
          req.radius = typeof msg.radius === 'number' ? msg.radius : 50000;
          // Soft bias toward the visible map area (Google Maps-style local search).
          req.origin = req.location;
        }
        autocompleteService.getPlacePredictions(req, function(predictions, status) {
          post({
            type: 'autocompleteResults',
            requestId: msg.requestId,
            status: status,
            predictions: (predictions || []).map(function(p) {
              return {
                description: p.description,
                placeId: p.place_id,
                mainText: (p.structured_formatting && p.structured_formatting.main_text) || '',
                secondaryText: (p.structured_formatting && p.structured_formatting.secondary_text) || '',
                types: p.types || []
              };
            })
          });
        });
      }
      if (msg.type === 'placeDetails' && placesService) {
        placesService.getDetails({
          placeId: msg.placeId,
          fields: ['geometry', 'formatted_address', 'name']
        }, function(place, status) {
          if (status !== google.maps.places.PlacesServiceStatus.OK || !place || !place.geometry || !place.geometry.location) {
            post({ type: 'placeDetailsResult', requestId: msg.requestId, ok: false });
            return;
          }
          var plat = place.geometry.location.lat();
          var plng = place.geometry.location.lng();
          setMapView(plat, plng, 17);
          post({
            type: 'placeDetailsResult',
            requestId: msg.requestId,
            ok: true,
            lat: plat,
            lng: plng,
            formattedAddress: place.formatted_address || place.name || ''
          });
        });
      }
      if (msg.type === 'geocodeText' && geocoder) {
        geocoder.geocode({ address: msg.query, componentRestrictions: { country: 'IN' } }, function(results, status) {
          if (status !== 'OK' || !results || !results[0]) {
            post({ type: 'geocodeTextResult', requestId: msg.requestId, ok: false });
            return;
          }
          var r = results[0];
          var glat = r.geometry.location.lat();
          var glng = r.geometry.location.lng();
          setMapView(glat, glng, 17);
          post({
            type: 'geocodeTextResult',
            requestId: msg.requestId,
            ok: true,
            lat: glat,
            lng: glng,
            formattedAddress: r.formatted_address || msg.query
          });
        });
      }
    } catch (err) {}
  }
</script>
<script async defer
  src="https://maps.googleapis.com/maps/api/js?key=${key}&callback=initMap&libraries=places&v=weekly">
</script>
</body>
</html>`;
}
