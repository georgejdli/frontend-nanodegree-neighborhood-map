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

var MapMarker = function() {

};

var pointsOfInterest = [
    {name: 'Golden Gate Bakery', lat: 37.796403688833124, lng: -122.40689384384154},
    {name: 'Chinese Consulate-General', lat: 37.78469908113653, lng: -122.42779898090362},
    {name: 'Hard Knox Cafe', lat: 37.78224431215672, lng: -122.48572396678924}
];

var MyViewModel = function() {
    var self = this;
    self.myMap = ko.observable({
        lat: ko.observable(37.789307),
        lng: ko.observable(-122.401309),
        zoom: ko.observable(13),
        mapTypeID: ko.observable('roadmap'),
        infowindow: ''
    });
    //self.myMap().googleMap to access google map object to add markers
    self.mySearch = ko.observable('Enter a search term');
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
        var mapOptions = {center: latLng,
                            zoom: zoom,
                            mapTypeID: mapTypeID};
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
        
        /*pointsOfInterest.forEach(function(point, index) {
            mapObj.marker = new google.maps.Marker({
                //marker will not be displayed if map is not specified
                //can use marker.setMap(map) to set it later
                map: mapObj.googleMap,
                //position: latLng,
                position: new google.maps.LatLng(point.lat, point.lng),
                //title appears as a tool tip
                title: point.name,
                //can use animation to indicate selected marker
                //toggle between marker.setAnimation(google.maps.Animation.BOUNCE
                //and marker.setAnimation(null)
                //google.maps.event.addListener(marker, 'click', toggleBounce);
                //animation: google.maps.Animation.BOUNCE,
                //icon: image
                //draggable: true
            });
        });*/

        var request = {
            bounds: defaultBounds,
            query: '21st Amendment (Montgomery)',
            types: ['bar']
        };

        mapObj.infowindow = new google.maps.InfoWindow();
        mapObj.service = new google.maps.places.PlacesService(mapObj.googleMap);
        mapObj.service.textSearch(request, callback);

        function callback(results, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
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
        
        mapObj.googleMap.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
        
        var searchBox = new google.maps.places.SearchBox(input);

        
        //$('#' + element.getAttribute('id')).data('mapObj',mapObj);
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