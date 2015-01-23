// to depend on a bower installed component:
// define(['component/componentName/file'])
/*
define(['jquery', 'knockout'], function($, ko) {
    var viewModel = {
        status: ko.observable('active')
    };
    ko.applyBindings(viewModel, $('html')[0]);
});
*/
/*
    THe view in KO is just the HTML with declarative bindings to link it to the view model.
    Or use templates to generate HTML using data from view model
 */
/*
    Model: Applicatiohn's stored data. Make AJAX calls to some server side code read and write this stored model data.
 */

//jQuery SET CURSOR POSITION
//source: http://www.sitepoint.com/jqueryhtml5-input-focus-cursor-positions/
$.fn.setCursorPosition = function(pos) {
  this.each(function(index, elem) {
    if (elem.setSelectionRange) {
      elem.setSelectionRange(pos, pos);
    } else if (elem.createTextRange) {
      var range = elem.createTextRange();
      range.collapse(true);
      range.moveEnd('character', pos);
      range.moveStart('character', pos);
      range.select();
    }
  });
  return this;
};

var MyViewModel = function() {
    var self = this;
    self.myMap = ko.observable({
        lat: ko.observable(37.789307),
        lng: ko.observable(-122.401309),
        zoom: ko.observable(13),
        mapTypeID: ko.observable('roadmap'),
        infowindow: '',
    });
    
    //If radio button for BART Stations is selected, then "BART" will be
    // prefilled on the search form to make search for a station a bit easier
    self.mySearch = ko.observable('Enter a search term');
    self.searchBART = ko.observable("false");
    self.appendBART = ko.computed(function() {
        if(self.searchBART() === "true") {
            
            return ' BART';
        } else {
            return '';
        }
    });
    self.isSelected = ko.observable(false);
};

//When searchBART radio button is selected, ' BART' will be added to search box
//This custom binding handler will place the caret at the starting position
//of the input box so a user can easily type the station name before ' BART'
ko.bindingHandlers.setCursorPosZero = {
    update: function(element, valueAccessor, allBindings, bindingContext) {
        if( ko.unwrap(valueAccessor()) ) {
            $(element).focus().setCursorPosition(0);
        }
    }
};

//Define custom binding for google Maps using the below resources
//http://stackoverflow.com/questions/12722925/google-maps-and-knockoutjshtml
//http://jsfiddle.net/schmidlop/5eTRV/10/
ko.bindingHandlers.map = {
    init: function(element, valueAccessor, allBindings, bindingContext) {
        var mapObj = ko.unwrap(valueAccessor());
        var latLng = {
            lat: ko.unwrap(mapObj.lat), 
            lng: ko.unwrap(mapObj.lng)
        };
        var zoom = ko.unwrap(mapObj.zoom),
            mapTypeID = ko.unwrap(mapObj.mapTypeID);
        var mapOptions = {
            center: latLng,
            zoom: zoom,
            mapTypeID: mapTypeID,
            streetViewControl: false,
            panControlOptions: {
                position: google.maps.ControlPosition.LEFT_BOTTOM
            },
            zoomControlOptions: {
                position: google.maps.ControlPosition.LEFT_BOTTOM
            }
        };
            
        mapObj.googleMap = new google.maps.Map(element, mapOptions);

        var image = {
            url: '',
            size: new google.maps.Size(20, 32),
            origin: new google.maps.Point(0,0),
            anchor: new google.maps.Point(10,32)
        };
        var defaultBounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(37.574255, -122.517149),
            new google.maps.LatLng(38.027824, -121.851789));
        
        var request = {
            bounds: defaultBounds,
            query: '21st Amendment'
            //types: ['bar']
        };

        mapObj.infowindow = new google.maps.InfoWindow();
        mapObj.service = new google.maps.places.PlacesService(mapObj.googleMap);
        mapObj.service.textSearch(request, callback);

        function callback(results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                    createMarker(results[0]);
                    console.log('callback');
            }
        }

        function createMarker(place) {
            var placeLoc = place.geometry.location;
            var marker = new google.maps.Marker({
                map: mapObj.googleMap,
                position: placeLoc
            });
            google.maps.event.addListener(marker, 'click', function() {
                mapObj.infowindow.setContent(place.name);
                mapObj.infowindow.open(mapObj.googleMap, this);
              });
        }
        
        
        //map.fitBounds(defaultBounds);
        
        //create search box, search box is an input element seperate from map div
        //https://developers.google.com/maps/documentation/javascript/examples/places-searchbox
        
        var input = document.getElementById('pac-input');
        var types = document.getElementById('type-selector');

        mapObj.googleMap.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
        
         mapObj.googleMap.controls[google.maps.ControlPosition.LEFT_TOP].push(types);

        var autocomplete = new google.maps.places.Autocomplete(input, {
            bounds: defaultBounds
        });
        autocomplete.bindTo('bounds', mapObj.googleMap);

        var infowindow = new google.maps.InfoWindow();
        var marker = new google.maps.Marker({
        map: mapObj.googleMap,
        anchorPoint: new google.maps.Point(0, -29)
        });

        google.maps.event.addListener(autocomplete, 'place_changed', function(){
        infowindow.close();
        marker.setVisible(false);
        var place = autocomplete.getPlace();
        if (!place.geometry) {
          return;
        }

        // If the place has a geometry, then present it on a map.
        if (place.geometry.viewport) {
          mapObj.googleMap.fitBounds(place.geometry.viewport);
        } else {
          mapObj.googleMap.setCenter(place.geometry.location);
          mapObj.googleMap.setZoom(17);  // Why 17? Because it looks good.
        }
        marker.setIcon(/** @type {google.maps.Icon} */({
          url: place.icon,
          size: new google.maps.Size(71, 71),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(17, 34),
          scaledSize: new google.maps.Size(35, 35)
        }));
        marker.setPosition(place.geometry.location);
        marker.setVisible(true);

        var address = '';
        if (place.address_components) {
          address = [
            (place.address_components[0] && place.address_components[0].short_name || ''),
            (place.address_components[1] && place.address_components[1].short_name || ''),
            (place.address_components[2] && place.address_components[2].short_name || '')
          ].join(' ');
        }

        infowindow.setContent('<div><strong>' + place.name + '</strong><br>' + address);
        infowindow.open(mapObj.googleMap, marker);
        });

    }
};

var viewModel = new MyViewModel();
$(document).ready(function() {
    ko.applyBindings(viewModel);
});


//BART counts as a train_station and can be used to filter places search
//Use array of BART stations for search autocomplete
//let user search for a location and find the nearest BART station for them
//When results are filtered out hide the markers with marker.setVisible(false)
//idea: load all the markers initially; when searching by station just zoom 
//when searching by bar name then just use a filter

//hard code the latitude and longitude in beer.js to avoid having to look up places all the time