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
//Model for each venue
var Bar = function(data, station) {
    this.name = data.name;
    this.url = data.url;
    this.directions = data.directions;
    this.latLng = data.latLng;
    this.placeID = data.placeID;
    this.station = station;
    this.contentString = ko.observable('');
    this.fourSquareString = ko.observable('');
    this.marker = '';
    
};

var MyViewModel = function() {
    var self = this;
    self.bars = ko.observableArray([]);
    //this observable will hold the filtered list of bars to display
    self.barList = ko.observableArray();
    var clickedMarker;
    /** create new Bar instance and push into regular array self.bars */
    self.createBar = function(station) {
            return function (bar) {
                self.bars().push(new Bar(bar, station));
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

    self.getFourSquareInfo = function(bar) {
        //no search results for The Rare Barrel Sour Beer Co.
        //this is a work around
        var name = bar.name;
        if (name === 'The Rare Barrel Sour Beer Co.') {
            name = 'The Rare Barrel';
        }
        //search for the venue
        var search = "https://api.foursquare.com/v2/venues/search?";
        var latLng = "ll=" + bar.latLng.lat + "," + bar.latLng.lng;
        var radius = "&radius=50";
        var query = "&query=" + name;
        var limit = "&limit=1";
        var intent = "&intent=browse";
        var client = "&client_id=DBE2OM01EX5TA1G35UFY54KCTCODNUZK5IYX1YBJN01DPDQJ&client_secret=GXDUOK5LQGMZ41TOBFF1XC4GDULDZIN1CCOC3ZZUJ2JQQ1MW&v=20140806&m=foursquare";
        var url = search + latLng + radius + query + limit + intent + client;
        $.getJSON(url, function(data) {
            //if there is a search result extract the data
            //otherwise do nothing so the UI isn't affected
            if (data.response.venues.length > 0) {
                var venue = data.response.venues[0];
                bar.address = venue.location.formattedAddress.join() || "";
                bar.categories = venue.categories[0].name || "";
                bar.checkinsCount = venue.stats.checkinsCount || "0";
                bar.fourSquareURL = "http://foursquare.com/v/" + 
                                    venue.id + 
                                    "?ref=DBE2OM01EX5TA1G35UFY54KCTCODNUZK5IYX1YBJN01DPDQJ";
                bar.fourSquareString(
                    '<span>' + bar.categories + '</span></br>'+
                    '<span><a href="' + 
                    bar.fourSquareURL + 
                    '" target="_blank">' +
                    'Checkins: </a>' + bar.checkinsCount + '</span>' +
                    '<p>' + bar.address + '</p>'
                );
                //update contentString
                bar.contentString( '<div id="info-content">' +
                    '<a href="'+
                    bar.url + 
                    '" target="_blank"><strong>'+
                    bar.name + '</strong></a><br>'+
                    bar.fourSquareString()+
                    '<p><em>' + bar.station + '</em><br>'+
                    '<span>' + bar.directions + '</span></p>'+
                    '</div>'
                );
            }
            
        }).fail(function() {
            //sometimes requests will time out or fail
            //then let the user know Fourswaure data couldn't load
            bar.contentString( '<div id="info-content">' +
                '<a href="'+
                bar.url + 
                '" target="_blank"><strong>'+
                bar.name + '</strong></a><br>'+
                '<p><em>' + bar.station + '</em><br>'+
                '<span>' + bar.directions + '</span></p>'+
                '<p> Could not load Foursquare data </p>'+
                '</div>'
            );
        });
    };

    /** add InfoWindow clickhandler for each bar */
    self.addInfoWindow = function(bars) {
        bars.forEach(function(bar) {
            bar.contentString( '<div id="info-content">' +
                '<a href="'+
                bar.url + 
                '" target="_blank"><strong>'+
                bar.name + '</strong></a><br>'+
                bar.fourSquareString()+
                '<p><em>' + bar.station + '</em><br>'+
                '<span>' + bar.directions + '</span></p>'+
                '</div>'
            );
            function infoWindowClick(bar) {
                return function() {
                    //only retrieve Foursquare data if it doesn't exist
                    if(!bar.fourSquareString()) {
                        self.getFourSquareInfo(bar);
                        //update current infoWindow if and when Foursquare request is successful
                        //use KO's subscribe since putting this cb function
                        //inside the getJSON call didn't work
                        bar.contentString.subscribe(function() {
                            self.myMap().infoWindow().setContent(bar.contentString());
                    });
                    }
                    self.myMap().infoWindow().close();
                    //reset the color of the previously open marker
                    if (clickedMarker) {
                        clickedMarker.setIcon();
                    }
                    //Load hardcoded data even if getJSON call fails
                    self.myMap().infoWindow().setContent(bar.contentString());
                    //hide list view so it doesn't block infowindow on mobile
                    self.showList(false);
                    self.myMap().googleMap.setCenter(bar.latLng);
                    //set marker color to a different color to indicate that it isselected
                    bar.marker.setIcon('https://www.google.com/mapfiles/marker_yellow.png');
                    clickedMarker = bar.marker;
                    self.myMap().infoWindow().open(self.myMap().googleMap,
                                                 bar.marker);
                    //pan the map down so infowindow isnt blocked by search bar
                    self.myMap().googleMap.panBy(0,-100);
                };
            }
            google.maps.event.addListener(bar.marker,
                                'click', infoWindowClick(bar));
        });
    };

    self.init = function() {
        //Import beer.js data into viewmodel by creating Bar instances
        for (var station in beer) {
            beer[station].forEach(self.createBar(station));
        }
        self.barList(self.bars());
        //populate the markers after viewMovel bindings have been applied
        self.createMarkers(self.bars());
        self.addInfoWindow(self.bars());
    };
    
    /* BEGIN Live search functionality */
    //self.query holds the search term from the filter box on the view
    //self.search will be subscribed to self.query later
    self.query = ko.observable('');
    self.searchCache = {};
    //keep track of the number of searches performed
    self.searchCacheCount = 0;
    self.search = function(value) {
        var val = value.toLowerCase();        
        self.searchCacheCount++;
        self.myMap().infoWindow().close();
        //hide the markers currently displayed on the map
        self.barList().forEach(function(bar) {
            bar.marker.setVisible(false);
        });
        //remove all current bars from view
        //.removeAll() seems to empty out the array passed to self.barList
        //clear barList by setting the value to an empty array
        self.barList([]);

        var cache = [];
        function filterByName(bar) {
            if ((bar.name.toLowerCase().indexOf(val) >= 0)||
            (bar.station.toLowerCase().indexOf(val) >= 0)){
            return bar;
            }
        }

        function addToCache() {
            var priorResults = self.searchCache[val.slice(0, val.length - 1)];
            if (priorResults) {
                cache = priorResults.filter(filterByName);
            } else {
                cache = self.bars().filter(filterByName);
            }
            self.searchCache[val] = cache;
            self.barList(cache);
        }

        if (self.searchCache[val]) {
            self.barList(self.searchCache[val]);
        } else {
            addToCache();
        }
        
        //show the markers for bars currently displayed in list view
        self.barList().forEach(function(bar) {
            bar.marker.setVisible(true);
        });

        //remove references to search results to prevent potential memory leaks
        if (self.searchCacheCount > 200) {
            self.searchCacheCount = {};
        }     
    };
    self.query.subscribe(self.search);
    /* END Live search functionality */

    /** Event handler for each list view item */
    self.listHandler = function() {
        if(!this.fourSquareString()) {
            self.getFourSquareInfo(this);
            //pass the current state of "this" to the cb function as "that"
            this.contentString.subscribe( (function(that) {
                return function(){
                    self.myMap().infoWindow().setContent(that.contentString());
                };
            }(this)) );
        }
        self.myMap().infoWindow().close();
        //reset the color of the previously open marker
        if (clickedMarker) {
            clickedMarker.setIcon();
        }
        self.myMap().infoWindow().setContent(this.contentString());
        //hide list view so infoWindow isn't blocked
        self.showList(false);
        
        self.myMap().googleMap.setCenter(this.latLng);

        //set marker color to a different color to indicate that it is selected
        this.marker.setIcon('https://www.google.com/mapfiles/marker_yellow.png');
        clickedMarker = this.marker;
        self.myMap().infoWindow().open(self.myMap().googleMap,
                                     this.marker);
        //pan the map down so infowindow isnt blocked by search bar
        self.myMap().googleMap.panBy(0,-100);
    };

    /* myMap holds the googleMap object and the map options */
    self.myMap = ko.observable({
        //google Map obejct will be created by the custom map bindinghandler
        googleMap: '',
        
        //map options that will be passed to the Map constructor
        center: ko.observable(new google.maps.LatLng(37.789307, -122.401309)),
        zoom: ko.observable(13),
        mapTypeID: ko.observable('roadmap'),
        streetViewControl: false,
        mapTypeControl: false,
        panControlOptions: {
            position: google.maps.ControlPosition.LEFT_BOTTOM
        },
        zoomControlOptions: {
            position: google.maps.ControlPosition.LEFT_BOTTOM
        },
        
        //set map bounds for BART train network
        defaultBounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(37.574255, -122.53),
            new google.maps.LatLng(38.027824, -121.851789)),
        
        //restrict searches to within the USA for more relevant results
        componentRestrictions: {'country': 'us'},
        infoWindow: ko.observable(new google.maps.InfoWindow({
            maxWidth: 200,
            zIndex: 20,
        }))
    });

    self.isSelected = ko.observable(false);
    self.showList = ko.observable(true);
    self.toggleListVis  = function() {
        self.showList(!self.showList());
    };
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
        var mapOptions = {
            center: center,
            zoom: zoom,
            mapTypeID: mapTypeID,
            streetViewControl: streetViewControl,
            mapTypeControl: ko.unwrap(mapObj.mapTypeControl),
            panControlOptions: ko.unwrap(mapObj.panControlOptions),
            zoomControlOptions: ko.unwrap(mapObj.zoomControlOptions)
        };
            
        //create and initialize google map object
        mapObj.googleMap = new google.maps.Map(element, mapOptions);
    }
};

/** @type {binding handler} 
  * clear search box functionality yet to be implemented 
*/
ko.bindingHandlers.clearable = {
    init: function(element, valueAccessor, allBindings, bindingContext) {
        $(element).wrap('<div class="clear-holder" />');
        var helper = $('<span class="clear-helper">&#xd7;</span>');
        $(element).parent().append(helper);
        helper.click(function(){
            $(element).val("");
        });
    }
};

var viewModel;
$(document).ready(function() {
    if (typeof google === 'object' && typeof google.maps === 'object') {
        viewModel = new MyViewModel();
        ko.applyBindings(viewModel);
        //initialize the app
        viewModel.init();
    } else { /** If google maps API fails to load then show error message */
        //Since google Maps is a big part of the app if it doesn't load
        //then there isn't a point in initializing the viewModel
        var errorMsg = "<h1> There was a problem loading Google Maps. Sooory.</h1>";
        var errorImg = "<img id='sorry' src='images/sorry.png'>";
        $('#map-canvas').html(errorMsg + errorImg);
        $('#filter').hide();
    }

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
            } else if (bar.name === 'Sunol Ridge') {
                //another workaround to get the right location
                name = 'Sunol Ridge Restaurant';
            } else if (bar.name === 'Pyramid') {
                name = 'Pyramid Alehouse';
            } else if (bar.name === 'Rosamunde Sausage Grill' && station === '12th Street Station, Oakland') {
                name = 'Rosamunde Sausage Grill Oakland';
            } else if (bar.name === 'Lanesplitter' && station === 'MacArthur Station, Oakland') {
                name = 'Lanesplitter Telegraph';
            }
            else {
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