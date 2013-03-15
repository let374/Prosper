var WIDTH = 800,
	HEIGHT = 350,
	MARGINS = {top: 50, right: 50, bottom: 50, left: 100},
	xRange = d3.scale.linear().range ([MARGINS.left, WIDTH - MARGINS.right]),
	yRange = d3.scale.linear().range ([HEIGHT - MARGINS.top, MARGINS.bottom]),
	rRange = d3.scale.linear().range([5,20]),
	colours = ["#981C30","#989415","#1E4559","#7F7274","#4C4A12","#ffffff","#4B0612","#1EAAE4","#AD5E71","#000000"],
	rawData,
	drawingData,
	xAxis = d3.svg.axis().scale(xRange).tickSize(20).tickSubdivide(true),
	yAxis = d3.svg.axis().scale(yRange).tickSize(10).orient("right").tickSubdivide(true),
	fields,
	lastUpdated,
	lastUpdateTime,
	currentTime,
	nextUpdateTime,
	vis;

function startTime() {
	currentTime = new Date();
	var timeleft = (Date.parse(nextUpdateTime) - Date.parse(currentTime))/1000;
	document.getElementById('timer').innerHTML=timeleft + " seconds left to Update";
	if (currentTime > nextUpdateTime) {update();}
	else {t=setTimeout(function(){startTime()},500);}
}

function init () {
	vis = d3.select("#visualisation");
	vis.append("svg:g") // add a container for the axis
		.attr("class", "x axis") // add some classes so we can style it
		.attr("transform", "translate(0," + HEIGHT + ")")
		.call(xAxis); // finally, add the axis to the visualisation
	vis.append("svg:g")
		.attr("class", "y axis")
		.call(yAxis);
 
	//get field level data

	d3.json("prosperlistingfields.php")
		.get(function(error,data) {
			fields = data;
			document.getElementById("progress").innerHTML = "loading: 0";
			generateFieldsList(fields);
			//generate field lists
			//d3.json("test.php?modDate=2001-01-01T00:00:00.00Z") //listing update only pulls active listings
			d3.json("prosperactivelistings.php")
			    .on("progress", function() {
			    	var progress = d3.event.loaded;
			    	document.getElementById("progress").innerHTML = "loading: " + progress;
			    	//var dataSize = "<?php echo $_SESSION["dataSize"]; ?>";
			    	//console.log(dataSize);
			    })
				.get(function(error,data) {
					rawData = data;
					processedData = processData(rawData);
					drawingData = processedData;
					document.getElementById("progress").innerHTML = "loaded";
					document.getElementById("lastDBUpdated").innerHTML = "Last DB Updated: " + lastUpdated;
					redraw();
					lastUpdateTime = new Date();
					document.getElementById("lastUpdated").innerHTML = "Last Updated: " + lastUpdateTime;
					nextUpdateTime = lastUpdateTime;
					nextUpdateTime.setSeconds(lastUpdateTime.getSeconds() + 30);
					document.getElementById("nextUpdated").innerHTML = "Next Updated: " + lastUpdateTime;
					startTime();
				});
		});
}

function generateFieldsList (data) {
	var xselect = document.getElementById("x-axis"),
		yselect = document.getElementById("y-axis"),
		rselect = document.getElementById("r-axis"),
		xlist = '',
		ylist = '',
		rlist = '';


	for (var key in data) {
		if (data.hasOwnProperty(key) && data[key] != "string" && data[key] != 
			"datetime") {
			xlist += '<li><label><input' + (key=="PercentFunded" ? ' checked="checked" ' : ' ') + 'type="radio" name="x-axis" value="' + key + '">' + key + '</label></li>';
			ylist += '<li><label><input' + (key=="BorrowerRate" ? ' checked="checked" ' : ' ') + 'type="radio" name="y-axis" value="' + key + '">' + key + '</label></li>';
			rlist += '<li><label><input' + (key=="VerificationStage" ? ' checked="checked" ' : ' ') + 'type="radio" name="r-axis" value="' + key + '">' + key + '</label></li>';
		}
	}
	xselect.innerHTML = xlist;
	yselect.innerHTML = ylist;
	rselect.innerHTML = rlist;
}

function redraw() {
	var listings = vis.selectAll ("circle").data(drawingData, function (d) { return d.id;}),
		axes = getAxes();

	listings.enter()
		.insert("svg:circle")
			.attr("cx", function(d) { return xRange (d[axes.xAxis]); })
			.attr("cy", function(d) { return yRange (d[axes.yAxis]); })
			.attr("stroke", "black")
			.style("opacity", 0)
			.attr("fill-opacity", 0)
			;

	xRange.domain([
		d3.min(drawingData, function(d) { return +d[axes.xAxis]; }),
		d3.max(drawingData, function(d) { return +d[axes.xAxis]; })
	]);

	yRange.domain([
		d3.min(drawingData, function(d) { return +d[axes.yAxis]; }),
		d3.max(drawingData, function(d) { return +d[axes.yAxis]; })
	]);

	rRange.domain([
		d3.min(drawingData, function(d) { return +d[axes.radiusAxis]; }),
		d3.max(drawingData, function(d) { return +d[axes.radiusAxis]; })
	]);

	var t = vis.transition().duration(1500).ease("exp-in-out");
	t.select(".x.axis").call(xAxis);
	t.select(".y.axis").call(yAxis);

	//transition the points
	listings.transition().duration(1500).ease("exp-in-out")
		.style("opacity", 1)
		.attr("r", function(d) { return rRange (d[axes.radiusAxis]); })
		.attr("cx", function (d) { return xRange (d[axes.xAxis]); })
		.attr("cy", function (d) { return yRange (d[axes.yAxis]); })
		;

	//remove the points if we don't need them anymore
	listings.exit()
	.transition().duration(1500).ease("exp-in-out")
	.attr("cx", function (d) { return xRange (d[axes.xAxis]); })
	.attr("cy", function (d) { return yRange (d[axes.yAxis]); })
		.style("opacity", 0)
		.attr("r", 0)
			.remove();
}

window.scrollTo(0,0);
init();

function getAxes () {
	var x = document.querySelector("#x-axis input:checked").value,
		y = document.querySelector("#y-axis input:checked").value,
		r = document.querySelector("#r-axis input:checked").value;
	return {
		xAxis: x,
		yAxis: y,
		radiusAxis: r
	};
}


function processData (data) {

	var processed = [];

	data.forEach(function (data) {
		var listing = [];
		listing = { id: data.ListingNumber };
		for (var attribute in data) {
			if (data.hasOwnProperty (attribute)) {
				if(fields[attribute] == "datetime") {
					listing[attribute] = new Date(data[attribute]);
					//listing[attribute] = (data[attribute]);
				}
				if(attribute == "LastModifiedDate") {
					isNaN(lastUpdated) ? lastUpdated = listing[attribute] : (listing[attribute] > lastUpdated ? lastUpdated = listing[attribute] : lastUpdated = lastUpdated); //this might be causing problems
				}
				else {listing[attribute] = data[attribute];}
			}
		}

		processed.push(listing);
	})

	return processed;
}

function update () {
	document.getElementById("progress").innerHTML = "loading: 0";
	d3.json("prosperlistingupdate.php?modDate="+lastUpdated.toJSON())
	    .on("progress", function() {
	    	var progress = d3.event.loaded;
	    	document.getElementById("progress").innerHTML = "loading: " + progress;
	    	//var dataSize = "<?php echo $_SESSION["dataSize"]; ?>";
	    	//console.log(dataSize);
	    })
		.get(function(error,data) {
			rawData = data;
			processedData = processData(rawData);
			drawingData = processedData;
			document.getElementById("progress").innerHTML = "loaded";
			document.getElementById("lastDBUpdated").innerHTML = "Last DB Updated: " + lastUpdated;
			lastUpdateTime = new Date();
			document.getElementById("lastUpdated").innerHTML = "Last Updated: " + lastUpdateTime;
			nextUpdateTime = lastUpdateTime;
			nextUpdateTime.setSeconds(lastUpdateTime.getSeconds() + 30);
			document.getElementById("nextUpdated").innerHTML = "Next Updated: " + lastUpdateTime;
			redraw();
			startTime();
		});
}

document.getElementById("controls").addEventListener ("click", redraw, false);
document.getElementById("controls").addEventListener ("keyup", redraw, false);

//change all php files to include session.php
//change listing update so it takes in last updated variable
//pass last updated into listingupdate.php
//if there's no change to the db, don't download new data