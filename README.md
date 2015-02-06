#Neighborhood Map Project
This is a single page application featuring a map of locations found
here: http://beerbybart.com/ ("Great craft beer venues without driving")

This project is built using Knockout.js

Here is a live version of the project: 
http://georgejdli.github.io/frontend-nanodegree-neighborhood-map/dist/

Check the resource.txt file for a list of references used.

##How to use the app
Scroll through the list of establishments and click on any entry to show the location on the map. Use the search bar to filter locations on the list and map views by name or BART station. Click on the "results" box to show/hide the list view.

###Search functionality
- Searches the venue name and the associated BART station fields
- Improved performance by caching results
	-For example if the word "Montgomery" is input into the search bar one
	 	letter at at time (no clipboard events involved):
		-The results for "M" are stored, let's say 26 out of 72 are 
		returned
		-The search for "Mo" starts with cached results for "M". So 
		instead of searching all 72 items again it now only has to search
		26 items for "Mo"
		-and so forth
	-If the user decides to enter "Montgomery" again the search function 
		will return the cached results instead of performing another search
	-References to cached search results are cleared out after 200
		searches to prevent any potential memory problems

###Building the app from source
- requires Node.js, npm
- [cd] in project root directory
- run [npm install && bower install] to grab dependencies
- run [gulp serve] or [gulp watch] to view project from source
- run [gulp build] to build
- files will be in /dist

###Updating the venue list - Running the scraper
- This is not an ideal solution but it works (unless the page structure changes...)
- I thought it would be best to hard code the coordinate data since the list of map locations is static
- Requires Node.js and npm
- [cd scraper] via command line
- run [npm install] to grab dependencies
- run [node server.js]
- if successful open output.json
- glance over the data to make sure everything loaded correctly
- copy the contents and paste it into the [var beer =] declaration in app/scripts/beer.js
- [cd] into the root directory and run [gulp watch]
- In the browser console run [setCoor] to grab lat and lng data from google text search
	- since there is a limit on the number of searches per second this function will have to be run multiple times until it returns <= 0
	- use [copy(beer)] in the console to copy the newly updated object and paste it back into the [var beer =] declaration in app/scripts/beer.js