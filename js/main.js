/*
	Code to analyze .har data and generate interactive HTML report
	@author: Lord DiabLO (Ishan)
	@purpose: Page Performance analyzer
*/
$.getJSON("../har/output-har.json", function(data) {
	analyzieData.init(data);
});
var analyzieData = (function($, window) {
	var params = {
		size : 0,
		time : 0,
		score : 0,
		grade : "",
		url : "",
		requests : 0,
		sizeThreshold : 1000000,
		timeThreshold : 1000,
		js : {},
		css : {},
		image : {},
		html : {},
		json : {},
		largeRequests : [],
		slowRequests : [],
		suggestionArray : []
	}

	/* @purpose: To initialize the params components and parseData */
	function init(data) {
		params.size = bytesToMb(data.w);
		params.time = msToSec(data.lt);
		params.score = data.o;
		params.grade = calculateGrade(data.o);
		params.url = cleanURL(data.u);
		params.requests = data.r;

		if(typeof data.stats["js"] !== "undefined") {
			params.js.requests = data.stats["js"].r;
			params.js.size = bytesToMb(data.stats["js"].w);
		}

		if(typeof data.stats["css"] !== "undefined") {
			params.css.requests = data.stats["css"].r;
			params.css.size = bytesToMb(data.stats["css"].w);
		}

		if(typeof data.stats["image"] !== "undefined") {
			params.image.requests = data.stats["image"].r;
			params.image.size = bytesToMb(data.stats["image"].w);
		}

		if(typeof data.stats["doc"] !== "undefined") {
			params.html.requests = data.stats["doc"].r;
			params.html.size = bytesToMb(data.stats["doc"].w);
		}

		if(typeof data.stats["json"] !== "undefined" || typeof data.stats["doc"] !== "undefined") {
			params.json.requests = data.stats["doc"].r - 1 ;
			params.json.size = bytesToMb(data.stats["doc"].w);
		}

		params.suggestionArray = parsePerformanceData(data.g, data.comps);
		params.largeRequests = filterRequestsOnType(data.comps, "size", params.sizeThreshold);
		params.slowRequests = filterRequestsOnType(data.comps, "resp", params.timeThreshold);

		renderComps(params.suggestionArray);
		renderCriticalFileTable();
	}

	/* Utility function =>	@purpose: To decode URI in URL */
	function cleanURL(url) {
		url = decodeURIComponent(url);
		return url;
	}

	/* Utility function =>	@purpose: converts Bytes to MB */
	function bytesToMb(bytes) {
		return parseFloat((bytes/1048576).toFixed(2));
	}

	/* Utility function =>	@purpose: ms to Seconds	*/
	function msToSec(time) {
		return parseFloat((time/1000).toFixed(2));
	}

	/* Utility function =>	@purpose: parse percentage	*/
	function parsePercentage(data) {
		return parseFloat((data*100).toFixed(1))
	}

	/*	@purpose: Sort array based on size and property	*/
	function sortRequestsOnType(arr, type) {
		return arr.sort(function(object1, object2) {
			return object2[type] - object1[type]
		});
	}

	/*	@purpose: Filter Array based on size, property and threshold */
	function filterRequestsOnType(arr, type, threshold) {
		return arr.filter(function(object) {
			return object[type] > threshold
		});
	}

	/*	@purpose: To add anchor tag around componeents array of requests */
	function parseComponentArray(arr) {
		for(var i=0; i<arr.length; i++) {
			arr[i] = "<a href='"+ cleanURL(arr[i]) +"' target='_blank'>" + cleanURL(arr[i]) + "</a></br>";
		}
		return arr;
	}

	/*	@purpose: To compare data.comps with array of url and measure data differences	*/
	function calculateComponentsArrayParameters(arr, fileInformationArray) {
		var size = 0, responseTime = 0, js = 0, css = 0, xhr = 0, image = 0;
		for(var i=0; i < arr.length; i++) {
			var x = fileInformationArray.find(function(obj) {
				return obj.url === arr[i]
			});
			if(typeof x !== "undefined") {
				size = size + x.size;
				responseTime = responseTime + x.resp;
				switch(x.type) {
					case "js" :
						js++;
						break;
					case "css" :
						css++;
						break;
					case "json" :
						xhr++;
						break;
					case "image" :
						image++;
						break;
				}
			}
		}
		return {
			"size" : bytesToMb(size),
			"responseTime" : msToSec(responseTime),
			"js" : js,
			"css" : css,
			"xhr" : xhr,
			"image" : image
		}
	}

	/*	@purpose: To copy data from data.g of data and add in suggestion array below */
	function parsePerformanceData(input, fileInformationArray) {
		delete input["ycdn"];
		delete suggestion["ycdn"];

		for(var key in suggestion) {
			if(typeof input[key] !== "undefined") {
				suggestion[key].score = input[key].score;
				suggestion[key].requestData = calculateComponentsArrayParameters(input[key].components, fileInformationArray);
				suggestion[key].components = parseComponentArray(input[key].components);
			} else {
				delete suggestion[key]
			}
		}

		var suggestionArray = arraySortScore(objectToArray(suggestion));
		return suggestionArray;
	}

	function fileSizeSuggestion(type) {
		if (type === "js") {
			return "To reduce large JavaScript file size, minify the file and gzip if not zipped.";
		} else if (type === "css") {
			return "To reduce large CSS file size, minify the file and gzip if not zipped.";
		} else if (type === "doc") {
			return "Large json request can be reduced by minification of requests, or by filtering data at REST level, to get only required data.";
		} else {
			return "Compress images to reduce their size. Use jpeg instead of png if possible. Lazy load images on website if multiple large images are used.";
		}
	}

	/*	@purpose: Convert any object to Array with its key as 1 prop and props as a combine other */
	function objectToArray(obj) {
	    var arr = [];
	    var prop;
	    for (prop in obj) {
	        if (obj.hasOwnProperty(prop)) {
	            arr.push({
	                'key': prop,
	                'value': obj[prop]
	            });
	        }
	    }
	    return arr; // returns array
	}

	/*	@purpose: Sort arrays based on the score prop */
	function arraySortScore(arr) {
		arr.sort(function(a, b) {
	        return a.value.score - b.value.score;
	    });
	    return arr;
	}

	/*	@purpose: To initialize the components and parseData */
	function calculateGrade(input, componentsLength) {

		if(typeof input === "undefined") {
			if(componentsLength > 0) {
				return "<span class='text-warning'><strong>Moderate</strong></span>"
			}
			else {
				"<span class='text-success'><strong>Low</strong></span>"
			}
		}

		if(input < 30) {
			return "<span class='text-danger'><strong>Critical</strong></span>";
		} else if(input >= 30 && input < 50) {
			return "<span class='text-warning'><strong>Very High</strong></span>";
		} else if(input >= 50 && input < 70) {
			return "<span class='text-warning'><strong>High</strong></span>";
		} else if(input >= 70 && input < 80) {
			return "<span class='text-warning'><strong>Moderate</strong></span>";
		} else if(input >= 80 && input < 90) {
			return "<span class='text-success'><strong>Low</strong></span>";
		} else if(input > 90) {
			return "<span class='text-success'><strong>Low</strong></span>";
		}
	}

	/*	@purpose: to parse data in each suggestion object and return the required data in issue and affected file section of our web page, you can pass tableField to seperate issue from affected files tab.	*/
	function parseColumnData(suggestionDataObject, tableColumn) {
		var str = '',
			components = suggestionDataObject.value.components,
			requestDataObject = suggestionDataObject.value.requestData;

		if(suggestionDataObject.key === "ynumreq") {
			if(tableColumn === "issue") {
				str = str + suggestionDataObject.value.issueTitle;
			} else {
				str = str + suggestionDataObject.value.subTitle +
					" Requests on our web page :</br><ul><li> JavaScript : " + (params.js.requests ? params.js.requests : '0') +
					"</li><li>CSS: " + (params.css.requests ? params.css.requests : '0') +
					"</li><li>Ajax Calls: " + (params.json.requests ? params.json.requests : '0') +
					"</li><li>Images: " + (params.image.requests ? params.image.requests : '0') + "</li></ul>";
			}
		}

		if(tableColumn === "issue") {
			if(components.length) {
				str = str + suggestionDataObject.value.issueTitle + "<br/><a href='#file-list-table'><small>(see affected file list below)</small></a>";
			}
		} else {
			if(requestDataObject.js) {
				str = str + "Affected Files: <ul><li>" + suggestionDataObject.value.subTitle + " JS files: <strong>" + requestDataObject.js + "</strong> out of <strong>" + params.js.requests + "</strong></li>";
			}
			if(requestDataObject.css) {
				str = str + "<li>" + suggestionDataObject.value.subTitle + " CSS files: <strong>" + requestDataObject.css + "</strong> out of <strong>" + params.css.requests + "</strong></li>";
			}
			if(requestDataObject.images) {
				str = str + "<li> " + suggestionDataObject.value.subTitle + " Images files: <strong>" + requestDataObject.images + "</strong> out of <strong>" + params.js.images + "</strong></li>";
			}
			if(requestDataObject.size) {
				str = str + "</ul>";
			}

			/*if(requestDataObject.size) {
				str = str + "Impact of Affected Requests</br> <ul><li>Total size: <strong>" + requestDataObject.size + " MB</strong> which is <strong>" +  parsePercentage(requestDataObject.size/params.size) + "%</strong> of our total web page size.</li>";
			}
			if(requestDataObject.responseTime) {
				str = str + "<li>Time invested: <strong>" + requestDataObject.responseTime + "sec</strong></li></ul>";
			}*/
		}

		return str;
	}

	/* @purpose: init all the render comps function*/
	function renderComps() {
		var suggestions = params.suggestionArray;
		//Top List rendered
		renderPageInformationList();
		renderFileTypeList();
		renderCriticalIssueTable(suggestions);
		renderNonCriticalIssueTable(suggestions);
		renderAffectedFilesTable(suggestions);
	}

	/* @purpose: render the list which contains page-size, score, url, requests and size*/
	function renderPageInformationList() {
		$("#page-size").html("Total page size: <span class='label label-info'>" + params.size + " MB</span>");
		$("#page-score").html("<span> Severity: " + params.grade + "</span>");
		$("#page-url").html("Page URL: <a href='"+ params.url +"' target='_blank'>" + params.url + "</a>");
		$("#page-requests").html("Total number of page requests: <span class='label label-default'>" + params.requests + "</span>");
		$("#page-load").html("Total Page load time: <span class='label label-info'>" + params.time +" sec</span>");
	}

	/* @purpose: calculates and render type of files and displays in list*/
	function renderFileTypeList() {
		//Type of files in webpage
		if(params.js.size > 0) {
			$(".list-group").append("<li class='list-group-item'> Total JavaScript files: <strong>"+ params.js.requests + "</strong> which is <span class='label label-info'>" + parsePercentage(params.js.requests/params.requests) + "%</span> of total requests</li>");
		}

		if(params.css.size > 0) {
			$(".list-group").append("<li class='list-group-item'> Total CSS files: <strong>"+ params.css.requests + "</strong> which is <span class='label label-info'>" + parsePercentage(params.css.requests/params.requests) + "%</span> of total requests</li>");
		}

		if(params.image.size > 0) {
			$(".list-group").append("<li class='list-group-item'> Total Image files: <strong>"+ params.image.requests + "</strong> which is <span class='label label-info'>" + parsePercentage(params.image.requests/params.requests) + "%</span> of total requests</li>");
		}

		if(params.json.size > 0) {
			$(".list-group").append("<li class='list-group-item'> Total json files: <strong>"+ params.json.requests + "</strong> which is <span class='label label-info'>" + parsePercentage(params.json.requests/params.requests) + "%</span> of total requests</li>");
		}
	}

	/* @purpose: render table 1 of our report, displays critical issues*/
	function renderCriticalIssueTable(suggestionsArray) {
		var suggestions = suggestionsArray.filter(function(object) { return object.value.score < 79 })
		//Table render
		for(var i=0; i< suggestions.length; i++) {
			tr = $('<tr/>');
			tr.append("<td>" + suggestions[i].value.title + "</td>");
		    tr.append("<td>" + calculateGrade(suggestions[i].value.score, suggestions[i].value.components.length) + "</td>");
		    tr.append("<td>" + parseColumnData(suggestions[i], "issue") + "</td>");
		    tr.append("<td> Fix type: <strong>" + suggestions[i].value.fixType + "</strong></br></br>" + suggestions[i].value.message + "</td>");
		    tr.append("<td>" + parseColumnData(suggestions[i], "affectedFiles") + "</td>");
		    //tr.append("<td>" + params.suggestionArray[i].value.components + "</td>");
		    $("#performance-table").append(tr);
		}
	}

	/* @purpose: render table 2 of our report display critical files*/
	function renderCriticalFileTable() {
		if(params.largeRequests.length) {
			for(var i=0; i < params.largeRequests.length; i++) {
				tr = $('<tr/>');
				tr.append("<td>File size > <strong>" + bytesToMb(params.sizeThreshold) + " MB</strong></td>");

				tr.append("<td>" + fileSizeSuggestion(params.largeRequests[i].type) + "</td>");

			    tr.append("<td><a href='"+ cleanURL(params.largeRequests[i].url) +"' target='_blank'>" + cleanURL(params.largeRequests[i].url) + "</a></br></br>File size: <strong>" + bytesToMb(params.largeRequests[i].size) + "MB </strong></td>");

			    $("#critcal-file-table").append(tr);
			}
		}
		if(params.slowRequests.length) {
			for(var i=0; i < params.slowRequests.length; i++) {
				tr = $('<tr/>');
				tr.append("<td>Slow request response > <strong>" + msToSec(params.timeThreshold) + " sec</td>");
				tr.append("<td>Slow response can be due to network delay, large file size, corrupted data</td>");
			    tr.append("<td><a href='"+ cleanURL(params.slowRequests[i].url) +"' target='_blank'>"  + cleanURL(params.slowRequests[i].url) + "</a></br></br>Response time: <strong>" + msToSec(params.slowRequests[i].resp) + "sec </strong></td>");
			    $("#critcal-file-table").append(tr);
			}
		}
	}

	/* @purpose: render table 3  non-critcial issues i.e suggestions*/
	function renderNonCriticalIssueTable(suggestionsArray) {
		var suggestions = suggestionsArray.filter(function(object) { return object.value.score >= 79 })
		//Table render
		for(var i=0; i< suggestions.length; i++) {
			tr = $('<tr/>');
			tr.append("<td>" + suggestions[i].value.title + "</td>");
		    tr.append("<td>" + calculateGrade(suggestions[i].value.score, suggestions[i].value.components.length) + "</td>");
		    tr.append("<td> Fix type: <strong>" + suggestions[i].value.fixType + "</strong></br></br>" + suggestions[i].value.message + "</td>");
		    $("#non-critical-table").append(tr);
		}
	}

	/* @purpose: render table 4 of our report, with all file lists*/
	function renderAffectedFilesTable(suggestionsArray) {
		var suggestions = suggestionsArray.filter(function(object) { return object.value.components.length > 0 })
		//Table render
		for(var i=0; i< suggestions.length; i++) {
			tr = $('<tr/>');
			tr.append("<td>" + suggestions[i].value.title + "</td>");
		    tr.append("<td>" + calculateGrade(suggestions[i].value.score, suggestions[i].value.components.length) + "</td>");
		    tr.append("<td>" + parseColumnData(suggestions[i], "issue") + "</td>");
		    tr.append("<td>" + suggestions[i].value.components + "</td>");

		    $("#file-list-table").append(tr);
		}
	}

	/* Suggestion Object modifiy it for any suggestions on a certain type of issue*/
	var suggestion = {
		"ynumreq": {
			"score": 0,
			"components": [],
			"title" : "Reduce the amount of HTTP requests",
			"subTitle" : "Total number of",
			"fixType" : "client side",
			"issueTitle" : "Too many HTTP requests is hampering page render and it's performance",
			"message" : "Solution:</br> <ul><li>Combine multiple JS files into a single JS files</li><li>Combine multiple CSS files into single CSS</li> <li>Combine multiple images files into a single Sprite Image</li></ul>"
		},
		"ycdn": {
			"score": 0,
			"components": [],
			"title": "Use a Content Delivery Network (CDN)",
			"subTitle" : "Non CDN files",
			"fixType" : "server side",
			"issueTitle" : "Multiple files can be used from CDN to reduce load time",
			"message" : "User proximity to web servers impacts response times.  Deploying content across multiple geographically dispersed servers helps users perceive that pages are loading faster."
		},
		"yemptysrc": {
			"score": 0,
			"components": [],
			"title": "Empty src or href detected",
			"subTitle" : "Total number of",
			"fixType" : "client side",
			"issueTitle" : "Page has empty src and href that could lead to corrupt user data and slow rendering",
			"message" : "This behavior could possibly corrupt user data, waste server computing cycles generating a page that will never be viewed, and in the worst case, cripple our servers by sending a large amount of unexpected traffic."
		},
		"yexpires": {
			"score": 0,
			"components": [],
			"title": "Add Expires headers",
			"subTitle" : "non-cached",
			"fixType" : "server side",
			"issueTitle" : "Multiple files detected with expired cache header or low cache header time",
			"message" : "By using Expires headers these components become cacheable, which avoids unnecessary HTTP requests on subsequent page views.  Expires headers are most often associated with images, but they can and should be used on all page components including scripts, style sheets, and Flash."
		},
		"ycompress": {
			"score": 0,
			"components": [],
			"title": "Compress components with gzip",
			"subTitle" : "uncompressed",
			"fixType" : "server side",
			"issueTitle" : "Files detected which are not gziped",
			"message" : "Gzip generally reduces the response size by about 70%. It can be configured on client's server"
		},
		"ycsstop": {
			"score": 0,
			"components": [],
			"title": "Put CSS at top",
			"subTitle" : "Total number of",
			"fixType" : "client side",
			"issueTitle" : "Following css files are below the body of our page which is wrong practice and may cause a flash of unstyled page",
			"message" : "Moving style sheets to the document HEAD element helps pages appear to load quicker since this allows pages to render progressively."
		},
		"yjsbottom": {
			"score": 0,
			"components": [],
			"title": "Put JavaScript at bottom",
			"subTitle" : "Total number of",
			"fixType" : "client side",
			"issueTitle" : "JS files should always be at the bottom of page",
			"message" : "JavaScript scripts block parallel downloads; that is, when a script is downloading, the browser will not start any other downloads.  To help the page load faster, move scripts to the bottom of our page if they are deferrable."
		},
		"yexternal": {
			"priority": 9,
			"score": 0,
			"components": [],
			"title": "Make JavaScript and CSS external",
			"subTitle" : "Total number of",
			"fixType" : "client side",
			"issueTitle" : "Inline CSS and JS detected on page which may cause performance issues",
			"message" : "If the JavaScript and CSS are in external files cached by the browser, the HTML document size is reduced without increasing the number of HTTP requests."
		},
		"ydns": {
			"score": 0,
			"components": [],
			"title": "Reduce DNS lookups",
			"subTitle" : "",
			"fixType" : "client side",
			"issueTitle" : "DNS lookups detected",
			"message" : "DNS has a cost; typically it takes 20 to 120 milliseconds for it to look up the IP address for a hostname.  The browser cannot download anything from the host until the lookup completes."
		},
		"yminify": {
			"score": 0,
			"components": [],
			"title": "Minify JavaScript and CSS",
			"subTitle" : "Unminified",
			"fixType" : "client side",
			"issueTitle" : "Unminified JS and CSS detected",
			"message" : "Grunt, gulp or any other task runner has built in minification configuration, we can set that in it's config files which one's to minify and bundle. Minification removes unnecessary characters from a file to reduce its size, thereby improving load times. "
		},
		"yredirects": {
			"score": 0,
			"components": [],
			"title": "Avoid URL redirects",
			"subTitle" : "External resources",
			"fixType" : "client side",
			"issueTitle" : "Ensure we have no external resource requets",
			"message" : "Try to have all the required files and resources on the same server.Inserting a redirect between the user and the final HTML document delays everything on the page since nothing on the page can be rendered and no components can be downloaded until the HTML document arrives."
		},
		"ydupes": {
			"score": 0,
			"components": [],
			"title": "Remove duplicate JavaScript and CSS",
			"subTitle" : "duplicates",
			"fixType" : "client side",
			"issueTitle" : "Duplicate files detected, Avoid refernce to same resources multiple times",
			"message" : "Many dependency files like jquery, jquery-ui, bootstrap etc can have multiple reference, have a single refernce to the file in your require.js config. If an external script is included twice and is not cacheable, it generates two HTTP requests during page loading.  Even if the script is cacheable, extra HTTP requests occur when the user reloads the page."
		},
		"yetags": {
			"score": 0,
			"components": [],
			"title": "Configure entity tags (ETags)",
			"subTitle" : "",
			"fixType" : "server side",
			"issueTitle" : "Configure entity tags (ETags) on resources",
			"message" : "Entity tags (ETags) are a mechanism web servers and the browser use to determine whether a component in the browser's cache matches one on the origin server.  Since ETags are typically constructed using attributes that make them unique to a specific server hosting a site, the tags will not match when a browser gets the original component from one server and later tries to validate that component on a different server."
		},
		"yxhr": {
			"score": 0,
			"components": [],
			"title": "Make AJAX cacheable",
			"subTitle" : "Uncached AJAX",
			"fixType" : "server side",
			"issueTitle" : "Certain AJAX calls can be cached",
			"message" : "To verify that previously cached response is similar to new response could be done by adding a timestamp to the response to check that the response hasn't been modified, hence the browser will use the cached one."
		},
		"yxhrmethod": {
			"score": 0,
			"components": [],
			"title": "Use GET for AJAX requests",
			"subTitle" : "",
			"fixType" : "client side",
			"issueTitle" : "Avoid use of POST on AJAX requests",
			"message" : "When using the XMLHttpRequest object, the browser implements POST in two steps:  (1) send the headers, and (2) send the data.  It is better to use GET instead of POST since GET sends the headers and the data together (unless there are many cookies).  IE's maximum URL length is 2 KB, so if you are sending more than this amount of data you may not be able to use GET."
		},
		"ymindom": {
			"score": 0,
			"components": [],
			"title": "Reduce the number of DOM elements",
			"subTitle" : "",
			"fixType" : "client side",
			"issueTitle" : "HTML page is too heavy with many DOM",
			"message" : "A complex page means more bytes to download, and it also means slower DOM access in JavaScript.  Reduce the number of DOM elements on the page to improve performance."
		},
		"yno404": {
			"score": 0,
			"components": [],
			"title": "Avoid HTTP 404 (Not Found) error",
			"subTitle" : "Total number of",
			"fixType" : "client side",
			"issueTitle" : "Certain files detected with 404 response",
			"message" : "Making an HTTP request and receiving a 404 (Not Found) error is expensive and degrades the user experience. Verify the path of the resources."
		},
		"ymincookie": {
			"score": 0,
			"components": [],
			"title": "Reduce cookie size",
			"subTitle" : "",
			"fixType" : "client side",
			"issueTitle" : "Cookie size is too much!",
			"message" : "HTTP cookies are used for authentication, personalization, and other purposes.  Cookie information is exchanged in the HTTP headers between web servers and the browser, so keeping the cookie size small minimizes the impact on response time."
		},
		"ycookiefree": {
			"score": 0,
			"components": [],
			"title": "Use cookie-free domains",
			"subTitle" : "",
			"fixType" : "server side",
			"issueTitle" : "Avoid cached file refernce in cookies",
			"message" : "When the browser requests a static image and sends cookies with the request, the server ignores the cookies.  These cookies are unnecessary network traffic.  To workaround this problem, make sure that static components are requested with cookie-free requests by creating a subdomain and hosting them there."
		},
		"ynofilter": {
			"score": 0,
			"components": [],
			"title": "Avoid AlphaImageLoader filter",
			"subTitle" : "",
			"fixType" : "client side",
			"issueTitle" : "Files detected with Alpha filters",
			"message" : "This filter blocks rendering and freezes the browser while the image is being downloaded.  Additionally, it increases memory consumption.  The problem is further multiplied because it is applied per element, not per image."
		},
		"yimgnoscale": {
			"score": 0,
			"components": [],
			"title": "Do not scale images in HTML",
			"subTitle" : "",
			"fixType" : "client side",
			"issueTitle" : "Do not scale images in HTML",
			"message" : "Web page designers sometimes set image dimensions by using the width and height attributes of the HTML image element.  Avoid doing this since it can result in images being larger than needed.  For example, if your page requires image myimg.jpg which has dimensions 240x720 but displays it with dimensions 120x360 using the width and height attributes, then the browser will download an image that is larger than necessary."
		},
		"yfavicon": {
			"score": 0,
			"components": [],
			"title": "Make favicon small and cacheable",
			"subTitle" : "",
			"fixType" : "client side",
			"issueTitle" : "Favicon icon on your browser tab is too big",
			"message" : "Making favicon.ico cacheable avoids frequent requests for it."
		}
	}

	return {
		init : init
	}
})(jQuery, window);