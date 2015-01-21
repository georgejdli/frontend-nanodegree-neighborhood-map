/*
    Using this tutorial: https://scotch.io/tutorials/scraping-the-web-with-node-js
 */

var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();

app.get('/scrape', function(req, res){
    // URL for  Beer by BART
    
    var link = 'http://beerbybart.com/';

    // The structure of our request call
    // The first parameter is our URL
    // The callback function takes 3 parameters, an error, response status code and the html
    request(link, function(error, response, html){
        // First we'll check to make sure no errors occurred when making the request

        if(!error) {
            // Next, we'll utilize the cheerio library on the returned html which will essentially give us jQuery functionality

            var $ = cheerio.load(html);

            var json = {};
            var counter = 0;

            //function method filters , and then excecutes the function for each item in the filtered group
            //so right now it's iteratiing over each STATION
            //exclude Milbrase Station for now by excluding the last station entry
            $('.entrytext > ul').slice(1, -1).filter(function(i){
                var data = $(this);
                //get name of station only, not the text in nested tags that text() would normally return
                var station = data.children().first().contents().filter(function() {
                    return this.nodeType === 3;
                }).text().trim();
                console.log("Station loaded " + i);
                //initial each station array to hold each bar object
                json[station] = [];

                //use another filter to iterate over the child elements to get the bar name and the link to the info page
                data.children().first().children().first().children().filter(function(i){
                    //$(this) is the li that has <a> tags
                    var barRegex,
                        name,
                        url,
                        directions,
                        waitingForDirections = 1;
                    
                    barRegex = /.*?(?=\(|$)/;
                    name = $(this).find('a').text();
                    //strip the end of the name string of whitespace and (
                    name = name.match(barRegex)[0].trim();
                    console.log(name);
                    
                    function directionsCallback() {
                            json[station][i] = {'name': name, 
                                                'url': url,
                                                'directions': directions
                                                };
                    }

                    if(name) {
                        counter = counter + 1;
                        url = $(this).find('a').attr('href');
                        //call back function is executing AFTER json has been written
                        request(url, function(error, response, html){
                            if(!error) {
                                var $ = cheerio.load(html);

                                directions = $('.entrytext > blockquote').text();
                            }
                            //console.log("Request description");
                            directionsCallback();
                            if(--counter === 0) {
                                writeToJSON();
                            }
                            console.log(counter);
                        });

                    }
                });
            });
            
            function writeToJSON () {
                fs.writeFile('output.json', JSON.stringify(json, null, 4), function(err){

                    console.log('File successfully written! - Check your project directory for the output.json file');
                });
            }

        }
    });

    // Finally, we'll just send out a message to the browser reminding you that this app does not have a UI.
    res.send('Check your console!');

});

app.listen('8081');

console.log('Magic happens on port 8081');
//open http://localhost:8081/scrape in browser to trigger json output
exports = module.exports = app;