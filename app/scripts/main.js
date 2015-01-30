/* global beer */
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

/** 
 * Add SET CURSOR POSITION using jQuery 
 * source: http://www.sitepoint.com/jqueryhtml5-input-focus-cursor-positions/
 */
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

var Bar = function(data, station) {
    this.name = data.name;
    this.url = data.url;
    this.directions = data.directions;
    this.latLng = data.latLng;
    this.placeID = data.placeID;
    this.station = station;
    this.contentString = '';
    this.marker = '';
    this.infoWindow = '';
    
};

var MyViewModel = function() {
    var self = this;
    self.bars = [];
    //this observable will hold the filtered list of bars to display
    self.barList = ko.observableArray();

    /** create new Bar instance and push into regular array self.bars */
    self.createBar = function(station) {
            return function (bar) {
                self.bars.push(new Bar(bar, station));
            };  
    };
    
    /** create a Marker object and store it as a property for each bar*/
    self.createMarkers = function(bars) {
        bars.forEach(function(bar) {
            bar.marker = new google.maps.Marker({
                position: bar.latLng,
                map: self.myMap().googleMap,
                title: bar.name
            });
        });
    };

    self.addInfoWindow = function(bars) {
        bars.forEach(function(bar) {
            bar.contentString = '<div>' +
                '<strong>'+
                bar.name + '</strong>'+
                '</div>';
            
            function infoWindowClick(bar) {
                return function() {
                    self.myMap().infoWindow.close();
                    self.myMap().infoWindow.setContent(bar.contentString);
                    self.myMap().infoWindow.open(self.myMap().googleMap, 
                                                 bar.marker);
                };
            }
            google.maps.event.addListener(bar.marker, 'click', infoWindowClick(bar));
        });
    };

    self.init = function() {
        //Import beer.js data into viewmodel by creating Bar instances
        for (var station in beer) {
            beer[station].forEach(self.createBar(station));
        }
        self.barList(self.bars);
        //populate the markers after viewMovel bindings have been applied
        self.createMarkers(self.bars);
        self.addInfoWindow(self.bars);
    };
    
    /* BEGIN Live search functionality */
    //self.query holds the search term from the filter box on the view
    //self.search will be subscribed to self.query later
    self.query = ko.observable('');
    self.search = function(value) {
        var i,
            l = self.bars.length;

        //hide the markers currently displayed on the map
        self.barList().forEach(function(bar) {
            bar.marker.setVisible(false);
        });
        //remove all current bars from view
        //.removeAll() seems to empty out the array passed to self.barList
        //clear barList by setting the value to an empty array
        self.barList([]);

        self.bars.forEach(function(bar) {
            if (bar.name.toLowerCase().indexOf(value.toLowerCase()) >= 0) {
                self.barList.push(bar);
            }
        });

        //show the markers for bars currently displayed in list view
        self.barList().forEach(function(bar) {
            bar.marker.setVisible(true);
        });        
    };
    /* END Live search functionality */

    /* myMap holds the googleMap object and the map options */
    self.myMap = ko.observable({
        //google Map obejct will be created by the custom map bindinghandler
        googleMap: '',
        
        //map options that will be passed to the Map constructor
        center: ko.observable(new google.maps.LatLng(37.789307, -122.401309)),
        zoom: ko.observable(13),
        mapTypeID: ko.observable('roadmap'),
        streetViewControl: false,
        panControlOptions: {
            position: google.maps.ControlPosition.LEFT_BOTTOM
        },
        zoomControlOptions: {
            position: google.maps.ControlPosition.LEFT_BOTTOM
        },
        
        //set map bounds for BART train network
        defaultBounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(37.574255, -122.517149),
            new google.maps.LatLng(38.027824, -121.851789)),
        
        //restrict searches to within the USA for more relevant results
        componentRestrictions: {'country': 'us'},
        infoWindow: new google.maps.InfoWindow()
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
        var center = ko.unwrap(mapObj.center);
        var zoom = ko.unwrap(mapObj.zoom),
            streetViewControl = ko.unwrap(mapObj.streetViewControl),
            mapTypeID = ko.unwrap(mapObj.mapTypeID);
        //TODO: write a function to automatically created the options object?
        var mapOptions = {
            center: center,
            zoom: zoom,
            mapTypeID: mapTypeID,
            streetViewControl: streetViewControl,
            panControlOptions: ko.unwrap(mapObj.panControlOptions),
            zoomControlOptions: ko.unwrap(mapObj.zoomControlOptions)
        };
            
        //create and initialize google map object
        mapObj.googleMap = new google.maps.Map(element, mapOptions);
    }
};

ko.bindingHandlers.autocompleteSearchBox = {
    init: function(element, valueAccessor, allBindings, bindingContext) {
        var mapObj = ko.unwrap(valueAccessor());
        //set position for search box 
        mapObj.googleMap.controls[google.maps.ControlPosition.TOP_LEFT].push(element);
        
        //initialize Autocomplete service
        var autocomplete = new google.maps.places.Autocomplete(element, {
            bounds: ko.unwrap(mapObj.defaultBounds),
            componentRestrictions: ko.unwrap(mapObj.componentRestrictions)
        });
        autocomplete.bindTo('bounds', mapObj.googleMap);

        var marker = new google.maps.Marker({
            map: mapObj.googleMap,
            anchorPoint: new google.maps.Point(0, -29)
        });

        google.maps.event.addListener(autocomplete, 'place_changed', function(){
            mapObj.infoWindow.close();
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
                mapObj.googleMap.setZoom(15);
            }
            //marker.setIcon(/** @type {google.maps.Icon} */({
                /*url: place.icon,
                size: new google.maps.Size(71, 71),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(17, 34),
                scaledSize: new google.maps.Size(35, 35)
            }));*/
            marker.setPosition(place.geometry.location);
            marker.setVisible(true);

            var address = '';
            //address includes street and city only, no zipcode
            if (place.address_components) {
                address = [
                    (place.address_components[0] && place.address_components[0].short_name || ''),
                    (place.address_components[1] && place.address_components[1].short_name || ''),
                    (place.address_components[2] && place.address_components[2].short_name || '')
                ].join(' ');
            }

            mapObj.infoWindow.setContent('<div><strong>' + place.name + '</strong><br>' + address);
            mapObj.infoWindow.open(mapObj.googleMap, marker);
        });
    }
};

ko.bindingHandlers.typeSelector = {
    init: function(element, valueAccessor, allBindings, bindingContext) {
        var mapObj = ko.unwrap(valueAccessor());
        //set position for search type selector
        mapObj.googleMap.controls[google.maps.ControlPosition.LEFT_TOP].push(element);
    }
};

var viewModel = new MyViewModel();
viewModel.query.subscribe(viewModel.search);

$(document).ready(function() {
    ko.applyBindings(viewModel);
    //start the app
    viewModel.init();
});

/**
 * Run scraper/server.js with node to get updated list of bars
 * Run this in browser console to get geocode location and place_id for each bar
 * There is a limit of 10 searches/sec so this function will have to be
 * run multiple times to get the data for each bar.
 * This function will not work if the placeID property is already defined
 * When the function returns <=0 all data has been loaded
 * Use copy(beer) in console to copy object to clipboard
 * @return {object} Return the number of search requests remaining to run
 */
//bug: Lucky 13 returns some location in Slovakia as the only result

var numBars = 0;
var success = 0;
for (var station in beer) {
        beer[station].forEach(function(bar, index) {
            numBars++;
        });
}
function setCoor() {
    var mapObj = ko.unwrap(viewModel.myMap());
    var service = new google.maps.places.PlacesService(mapObj.googleMap);
    var SEARCH_LIMIT = 10;
    var requests = 0;

    //textSearch callback function
    function callback(station, index) {
        return function(results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                requests++;
                success++;
                beer[station][index].latLng = {lat: '', lng: ''};
                beer[station][index].latLng.lat = results[0].geometry.location.lat();
                beer[station][index].latLng.lng = results[0].geometry.location.lng();
                beer[station][index].placeID = results[0].place_id;
            }
        };
    }

    for (var station in beer) {
        beer[station].forEach(function(bar, index) {
            if (requests >= SEARCH_LIMIT) {
                return;
            }
            //if you are simply adding new properties to each bar object then
            //change the condition to bar[property]
            if (bar.placeID) {
                return;
            }
            var name;
            //Bug in google textSearch, this is a workaround
            if (bar.name === 'Lucky 13') {
                name = 'Lucky13';
            } else {
                name = bar.name;
            }
            var request = {
                query: name,
                bounds: mapObj.defaultBounds,
                types: ['establishment', 'bar']
            };

            service.textSearch(request, callback(station, index));

        });
    }
    return {'bars remaining': numBars - success - 10};
}

//let user search for a location and find the nearest BART station for them
//When results are filtered out hide the markers with marker.setVisible(false)
//idea: load all the markers initially; when searching by station just zoom 
//when searching by bar name then just use a filter

//hard code the latitude and longitude in beer.js to avoid having to look up places all the time

//don't bother with extending the binding context for descedent bindings
//putting custom controls like search box and type selector inside the map div
//doesn't work; they don't render on the map canvas correctly
//It's ok to manually query a dom element to initialize the google Map object