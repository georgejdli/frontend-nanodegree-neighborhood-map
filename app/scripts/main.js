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

var Bar = function(data, station) {
    this.name = data.name;
    this.url = data.url;
    this.directions = data.directions;
    this.latLng = data.latLng;
    this.placeID = data.placeID;
    this.station = station;
    this.contentString = '';
    this.marker = '';
    
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

    /** add InfoWindow clickhandler for each bar */
    self.addInfoWindow = function(bars) {
        bars.forEach(function(bar) {
            bar.contentString = '<div id="info-content">' +
                '<a href="'+
                bar.url + 
                '"target="_blank"><strong>'+
                bar.name + '</strong></a><br>'+
                '<p>' + bar.directions + '</p>'+
                '</div>';
            function infoWindowClick(bar) {
                return function() {
                    //display more info in list view?
                    self.myMap().infoWindow.close();
                    self.myMap().infoWindow.setContent(bar.contentString);
                    //hide list view
                    self.isCollapsed(true);
                    self.myMap().infoWindow.open(self.myMap().googleMap,
                                                 bar.marker);
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
        self.barList(self.bars);
        //populate the markers after viewMovel bindings have been applied
        self.createMarkers(self.bars);
        self.addInfoWindow(self.bars);
        //listview scroll not working on mobile initially
        //triggering a marker click seems to fix it (thus opening infowindow)
        //so using this as a workaround
        //not quite sure why this is the case though
        new google.maps.event.trigger( self.bars[41].marker, 'click' );
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
            if ((bar.name.toLowerCase().indexOf(value.toLowerCase()) >= 0)||
                (bar.station.toLowerCase().indexOf(value.toLowerCase()) >= 0)){
                self.barList.push(bar);
            }
        });

        //show the markers for bars currently displayed in list view
        self.barList().forEach(function(bar) {
            bar.marker.setVisible(true);
        });        
    };
    /* END Live search functionality */
    /* TODO: write event handler for all list items so that when clicked on
     * the corresponding info window if opened
     */
    self.listHandler = function() {
        self.myMap().infoWindow.close();
        self.myMap().infoWindow.setContent(this.contentString);
        //hide list view
        self.isCollapsed(true);
        self.myMap().infoWindow.open(self.myMap().googleMap,
                                     this.marker);
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
        infoWindow: new google.maps.InfoWindow({
            maxWidth: 200
        })
    });

    self.isSelected = ko.observable(false);

    self.refreshListview = function(element) {
        var listview = $(element).closest("[data-role='listview']");
        if (listview.data("mobile-listview")) {
            listview.listview('refresh');
        }
    };

    self.isCollapsed = ko.observable(true);
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

ko.bindingHandlers.liveSearchBox = {
    init: function(element, valueAccessor, allBindings, bindingContext) {
        var mapObj = ko.unwrap(valueAccessor());
        //set position for search box 
        mapObj.googleMap.controls[google.maps.ControlPosition.TOP_LEFT].push(element);
    }
};

ko.bindingHandlers.collapse = {
    init: function(element, valueAccessor, allBindings, bindingContext) {
        var isCollapsed = valueAccessor();
        $(element).collapsible({
            collapse: function( event, ui ) {
                isCollapsed(true);
            },
            expand: function( event, ui ) {
                isCollapsed(false);
            }
        });
    },
    update: function(element, valueAccessor, allBindings, bindingContext) {
        var isCollapsed = ko.unwrap(valueAccessor());
        if (isCollapsed === true) {
            //viewModel.refreshListview(element);
            $(element).collapsible('collapse');
        } else if (isCollapsed === false) {
            $(element).collapsible('expand');
        }
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