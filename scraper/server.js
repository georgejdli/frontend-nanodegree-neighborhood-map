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
    var url = 'http://beerbybart.com/';

    // The structure of our request call
    // The first parameter is our URL
    // The callback function takes 3 parameters, an error, response status code and the html
    request(url, function(error, response, html){
        
        //This function will write the collected data into a JSON file
        //called output.json. It is called when all requests to each bar info
        //page have been completed
        function writeToJSON () {
            fs.writeFile('output.json', JSON.stringify(json, null, 4), function(err){

                console.log('File successfully written! - Check your project directory for the output.json file');
            });
        }

        // First we'll check to make sure no errors occurred when making the request

        if(!error) {
            // Next, we'll utilize the cheerio library on the returned html which will essentially give us jQuery functionality

            var $ = cheerio.load(html);

            var json = {};
            
            //use a counter to make sure we don't output the JSON file before all the requests have finished (since these request are async)
            //after each bar name has been grabbed the counter will increment
            //when the request to each bar info page has been completed
            //the counter will decrement
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

                //For the current BART station, grab the name, 
                //url, and directions for each bar and create an object
                data.children().first().children().first().children().filter(function(currentStation){
                    //$(this) is the li that has <a> tags
                    var barRegex,
                        name,
                        url,
                        directions,
                        waitingForDirections = 1;
                    
                    barRegex = /.*?(?=\(|$)/;
                    name = $(this).find('a').text();
                    //strip the end of the name string of whitespace and ('s
                    name = name.match(barRegex)[0].trim();
                    console.log(name);
                    
                    //callback to create bar object when directions are grabbed
                    function directionsCallback() {
                            json[station][currentStation] = {'name': name, 
                                                'url': url,
                                                'directions': directions
                                                };
                    }

                    if(name) {
                        counter = counter + 1;
                        url = $(this).find('a').attr('href');

                        //follow the url for each bar info page and
                        //scrape the directions
                        request(url, function(error, response, html){
                            if(!error) {
                                var $ = cheerio.load(html);

                                directions = $('.entrytext > blockquote').children().first().text().trim() || $('.entrytext').find('img').parent().text();
                            }

                            directionsCallback();
                            
                            //counter reaches 0 when all the requests for bar
                            //directions have completed
                            if(--counter === 0) {
                                writeToJSON();
                            }
                            //console.log(counter);
                        });

                    }
                });
            });
        }
    });

    // Finally, we'll just send out a message to the browser reminding you that this app does not have a UI.
    res.send('Check your console!');

});

app.listen('8081');

console.log('Magic happens on port 8081');
//open http://localhost:8081/scrape in browser to trigger json output
exports = module.exports = app;