
var locations = [
     {
        name: 'Flashback Games',
            lat: 33.422976,
            lng: -111.915741,
    },
    {
        name: 'The Chuckbox',
            lat: 33.423902,
            lng: -111.936609
        
    }, {
       name: 'ASU School of Sustainable Engineering and the Built Environment',
            lat: 33.424351,
            lng: -111.935831
        
    }, {
        name: 'ASU Gammage',
            lat: 33.417922,
            lng: -111.938056
        
    }, {
        name: 'Inferno Escape Room',
            lat: 33.424025,
            lng: -111.915187
        
    }, {
       name: 'Sonoran Cycles Bike Shop Tempe',
            lat: 33.424864,
            lng: -111.925743
        
    }];


var map;
function initMap() {
    "use strict";
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 33.425428, lng: -111.940095},
        zoom: 13,
        disableDefaultUI: true
    });
    ko.applyBindings(new ViewModel());
}


function googleError() {
    "use strict";
    document.getElementById('error').innerHTML = "<h2>Google Maps is not loading. Please try refreshing the page later.</h2>";
}


var Place = function (data) {
    "use strict";
    this.name = ko.observable(data.name);
    this.lat = ko.observable(data.lat);
    this.lng = ko.observable(data.lng);
    this.id = ko.observable(data.id);
    this.marker = ko.observable();
    this.phone = ko.observable('');
    this.description = ko.observable('');
    this.address = ko.observable('');
    this.rating = ko.observable('');
    this.url = ko.observable('');
    this.canonicalUrl = ko.observable('');
    this.photoPrefix = ko.observable('');
    this.photoSuffix = ko.observable('');
    this.contentString = ko.observable('');
};


var ViewModel = function () {
    "use strict";
    var self = this;
    this.placeList = ko.observableArray([]);

    locations.forEach(function (placeItem) {
        self.placeList.push(new Place(placeItem));
    });

    var infowindow = new google.maps.InfoWindow({
        maxWidth: 200,
    });

    var marker;

    self.placeList().forEach(function (placeItem) {

        marker = new google.maps.Marker({
            position: new google.maps.LatLng(placeItem.lat(), placeItem.lng()),
            map: map,
            animation: google.maps.Animation.DROP
        });
        placeItem.marker = marker;

        $.ajax({
            url: 'https://api.foursquare.com/v2/venues/' + placeItem.id() +
            '?client_id=2XRDLP41TS3MKI34441A4JEU3NYYAFICJUP4A0FH4KBOPZBL&client_secret=ALPEL0BQWWBA42X25O0UW0IKJIL54QKBJBYDJJIMAWDPKVLS&v=20130815',
            dataType: "json",
            success: function (data) {
                var result = data.response.venue;

                var contact = result.hasOwnProperty('contact') ? result.contact : '';
                if (contact.hasOwnProperty('formattedPhone')) {
                    placeItem.phone(contact.formattedPhone || '');
                }

                var location = result.hasOwnProperty('location') ? result.location : '';
                if (location.hasOwnProperty('address')) {
                    placeItem.address(location.address || '');
                }

                var bestPhoto = result.hasOwnProperty('bestPhoto') ? result.bestPhoto : '';
                if (bestPhoto.hasOwnProperty('prefix')) {
                    placeItem.photoPrefix(bestPhoto.prefix || '');
                }

                if (bestPhoto.hasOwnProperty('suffix')) {
                    placeItem.photoSuffix(bestPhoto.suffix || '');
                }

                var description = result.hasOwnProperty('description') ? result.description : '';
                placeItem.description(description || '');

                var rating = result.hasOwnProperty('rating') ? result.rating : '';
                placeItem.rating(rating || 'none');

                var url = result.hasOwnProperty('url') ? result.url : '';
                placeItem.url(url || '');

                placeItem.canonicalUrl(result.canonicalUrl);

                var contentString = '<div id="iWindow"><h4>' + placeItem.name() + '</h4><div id="pic"><img src="' +
                        placeItem.photoPrefix() + '110x110' + placeItem.photoSuffix() +
                        '" alt="Image Location"></div><p>Information from Foursquare:</p><p>' +
                        placeItem.phone() + '</p><p>' + placeItem.address() + '</p><p>' +
                        placeItem.description() + '</p><p>Rating: ' + placeItem.rating() +
                        '</p><p><a href=' + placeItem.url() + '>' + placeItem.url() +
                        '</a></p><p><a target="_blank" href=' + placeItem.canonicalUrl() +
                        '>Foursquare Page</a></p><p><a target="_blank" href=https://www.google.com/maps/dir/Current+Location/' +
                        placeItem.lat() + ',' + placeItem.lng() + '>Directions</a></p></div>';

                google.maps.event.addListener(placeItem.marker, 'click', function () {
                    infowindow.open(map, this);
                    placeItem.marker.setAnimation(google.maps.Animation.BOUNCE);
                    setTimeout(function () {
                        placeItem.marker.setAnimation(null);
                    }, 500);
                    infowindow.setContent(contentString);
                    map.setCenter(placeItem.marker.getPosition());
                });
            },
            error: function (e) {
                infowindow.setContent('<h5>Foursquare data is unavailable. Please try refreshing later.</h5>');
                document.getElementById("error").innerHTML = "<h4>Foursquare data is unavailable. Please try refreshing later.</h4>";
            }
        });

        google.maps.event.addListener(marker, 'click', function () {
            infowindow.open(map, this);
            placeItem.marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function () {
                placeItem.marker.setAnimation(null);
            }, 500);
        });
    });

    self.showInfo = function (placeItem) {
        google.maps.event.trigger(placeItem.marker, 'click');
        self.hideElements();
    };

    self.toggleNav = ko.observable(false);
    this.navStatus = ko.pureComputed (function () {
        return self.toggleNav() === false ? 'nav' : 'navClosed';
        }, this);

    self.hideElements = function (toggleNav) {
        self.toggleNav(true);
        return true;
    };

    self.showElements = function (toggleNav) {
        self.toggleNav(false);
        return true;
    };

    self.visible = ko.observableArray();

    self.placeList().forEach(function (place) {
        self.visible.push(place);
    });

    self.userInput = ko.observable('');

    self.filterMarkers = function () {
        var searchInput = self.userInput().toLowerCase();
        self.visible.removeAll();
        self.placeList().forEach(function (place) {
            place.marker.setVisible(false);
            if (place.name().toLowerCase().indexOf(searchInput) !== -1) {
                self.visible.push(place);
            }
        });
        self.visible().forEach(function (place) {
            place.marker.setVisible(true);
        });
    };
}; 