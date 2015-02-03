#Neighborhood Map Project
This is a single page application featuring a map of locations found
here: http://beerbybart.com/ ("Great craft beer venues without driving")

This project is built using Knockout.js

Here is a live version of the project: [coming soon]

##How to use the app
Scroll through the list of establishments and click on any entry to show the location on the map. Use the search bar to filter locations on the list and map views by name or BART station. Click on the "results" box to show/hide the list view.

###Search functionality
-Searches the venue name and the associated BART station fields
-Improved performance by caching results
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