var margin = {top: 20, right: 40, bottom: 20, left: 50},
  width = 1100 - margin.left - margin.right,
  height = 300 - margin.top - margin.bottom,
  radius = 32;

var xScale = d3.scaleBand()
  .rangeRound([0, width - 150])
  .padding(0.1)
  .align(0.1);

var yScale = d3.scaleLinear()
  .rangeRound([height, 0]);

var z = d3.scaleOrdinal()
  .range(["#ffffb3", "#bebada", "#8dd3c7", "#80b1d3", "#fdb462", "#b3de69", "#ffed6f", "#fb8072","#bc80bd"]);

var stack = d3.stack();

var format = d3.format(",d");

var pack = d3.pack()
  .size([800, 800])
  .padding(3);

var svgChart = d3.select("#chart").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)    
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var dataPath = [{"year":2010,"value":0},{"year":2010,"value":700000000}];

var line = d3.line()
  .x(392)
  .y(function(d) { 
    if (d.value === 0) return 260;
    else return -20; 
  });

svgChart.append("path") 
  .datum(dataPath)   
  .attr("class", "line")
  .attr("d", line)
  .style("stroke-width","10px")
  .style("stroke","grey")
  .call(d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended));

var svgEntities = d3.select("#entities").append("svg")
  .attr("width", 900)
  .attr("height", 900);      

var xAxis = svgChart.append("g")
  .attr("class", "axis x--axis");

var yAxis = svgChart.append("g")
  .attr("class", "axis y--axis");

// Data objects
var organizationData = []
var methodData = []
var columns = []

var xPositions = [-359, -294, -230, -164, -99, -34, 30, 95, 161, 225, 291, 355, 420];

function update(data, attrX, selected) {

  var fnAccX = function(d) {return d[attrX]};

  xScale.domain(data.map(fnAccX));

  if (selected !== undefined) yScale.domain([0,d3.max(data, function(d) {return d[selected]; })]);
  else yScale.domain([0,d3.max(data, function(d) {return d.total; })]);

  var stackedData = stack
    .keys(data.columns.filter(function (d) {
      return selected === undefined ? 
        true :
          selected.indexOf(d)!= -1 ?
            true : 
            false; 
    }))
    .value(function (d, key) { 
      return selected === undefined ? 
        d[key] :
          selected.indexOf(key)!= -1 ?
            d[key] : 
            0; 
    })(data);

  // Bars
  var bars = svgChart.selectAll(".serie")
    .data(stackedData, function (d) { return d.key;});
  // Bars enter
  var barsEnter = bars.enter().append("g");

  // Bars update
  bars.merge(barsEnter)
    .attr("class", "serie")
    .attr("fill", function(d) { return z(d.key); })
    .selectAll(".rect").data(function(d) { return d; }).enter().append("rect")
      .attr("x", function(d) { return xScale(d.data.year); })      
      .attr("y", height)   
      .attr("width", xScale.bandwidth())
      .attr("height", 0)
      .transition()
      .duration(1000)
      .attr("height", function(d) { return yScale(d[0]) - yScale(d[1]); })
      .attr("y", function(d) { return yScale(d[1]); });

  //Exit
  bars.exit().remove();

  xAxis
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(xScale));

  yAxis
    .attr("class", "axis axis--y")
    .call(d3.axisLeft(yScale).ticks(10, "s"))
    .append("text")
      .attr("x", 2)
      .attr("y", yScale(yScale.ticks(10).pop()))
      .attr("dy", "0.35em")
      .attr("fill", "#000");

  var legend = svgChart.selectAll(".legend")
    .data(data.columns.reverse())
    .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; })
      .style("font", "10px sans-serif");

  legend.append("rect")
    .attr("x", width - 80)
    .attr("width", 18)
    .attr("height", 18)
    .on("click", function(d) { 
      if (d === "Show all") {
        update(data, "year");
      }
      else {
        update(data, "year", [d]);
      } 
    })
    .attr("fill", function (d) {
      if (d === "Show all") {
        return "white";
      }
      else return z(d);
    });

  legend.append("text")
    .attr("x", width - 60)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("font-size", function (d,i) {
      if (d === "Show all") {
        return "15px";
      }
      else return "10px";
    })
    .on("click", function(d) { 
      if (d === "Show all") {
        update(data, "year");
      }
      else {
        update(data, "year", [d]);
      } 
    })
    .text(function(d) { return d; });
}

function updateEntities (data) {
  var root = d3.hierarchy({children: data})
    .sum(function(d) { 
      if (d["Records Stolen"] === undefined) d["Records Stolen"] = 0;
      return d["Records Stolen"]; 
    })
    .sort(function(a, b) { return b.value - a.value; });

  pack(root);

  var node = svgEntities.selectAll("g")
    .data(root.children);
    
  var nodeEnter = node.enter().append("g");

  var mergedNode = node.merge(nodeEnter)
    .attr("transform", function(d) { 
        return "translate(" + d.x + "," + d.y + ")"; })
    .attr("class", "node");

  mergedNode.append("circle")
    .attr("id", function(d) { return "node-" + d.data.Entity; })
    .attr("r", function(d) { return d.r; })
    .on("click", function(d) { 
      updateDetail(objectToArray(d.data)); 
    });

  mergedNode.append("clipPath")
    .attr("id", function(d) { return "clip-" + d.data.Entity; })
    .append("use")
      .attr("xlink:href", function(d) { return "#node-" + d.data.Entity + ""; });

  mergedNode.append("text")
    .attr("text-anchor","middle")
    .style("font-size","10")
    .attr("clip-path", function(d) { return "url(#clip-" + d.data.Entity + ")"; })
    .selectAll("tspan")
      .data(function(d) { return d.data.Entity.split(/(?=[A-Z][^A-Z])/g); })
    .enter().append("tspan")
      .attr("x", 0)
      .attr("y", function(d, i, nodes) { return 13 + (i - nodes.length / 2 - 0.5) * 10; })
      .text(function(d) { return d; });

  mergedNode.append("title")
    .text(function(d) { return d.data.Entity + "\n" + format(d.value); });

  node.exit().remove();
}

function updateDetail(data) {

  d3.select("#titleDetail").text(data.Entity + " (" + data.Year + ")");

  d3.select("#story").text(data.Story);

  if (data.sources.length !== 0) {
    d3.select("#source")
      .text("Read More")
      .attr("xlink:href", data.sources[0]["value"])
      .on("click", function() { window.open(data.sources[0]["value"]);});
  }

  var detailText = d3.select("#detail").selectAll("p")
    .data(data.data);

  var detailTextEnter = detailText.enter().append("p");

  detailText.merge(detailTextEnter)
    .attr("x",0)
    .attr("y", function (d,i) {
      return i * 30;})
    .text(function (d) {return d.key + ": " + d.value;});

  detailText.exit().remove()

}

function dragstarted(d) {
  d3.select(this).raise().classed("active", true);
}

function dragged(d) {
  for (var i = 0; i < xPositions.length; i++) {
    if(between(d3.event.x- 405, xPositions[i]-16,xPositions[i]+16)) {
      d3.select(this).attr("transform", "translate(" + xPositions[i] + "," + 0 + ")");
      updateEntities(organizationData.filter(function (d) {return d.year === (i+2004);}));
      updateDetail(objectToArray(organizationData.filter(function (d) {return d.year === (i+2004);})[0]));
    } 
  };
}

function dragended(d) {
  d3.select(this).classed("active", false);
}

function between(x, min, max) {
  return x >= min && x <= max;
}

function objectToArray (data) {
  var object = {};
  object.Entity = data.Entity;
  object.Year = data.year;
  object.Story = data.story;
  object.sources = [];
  var array = [];
  for (var key in data) {
    if (key !== "Entity" && key !== "id" && key !== "interesting" && key !== "year" && key !== "story") {
      if (data[key] !== undefined && data[key] !== "") {
        if (key.includes("sourceLink")) {
          object.sources.push({"key":key,"value":data[key]});}
        else array.push({"key": (key.charAt(0).toUpperCase() + key.slice(1)), "value": data[key]});
      }
    }
  }
  object.data = array;
  return object;
}

d3.csv("data.csv", function(err, data) {
  if(err) {
  	console.err(err);
    alert(err);
    return;
  }

  data.forEach(function (d, i) {
    var organization = {}
    organization["id"] = i;
    organization["Entity"]=d["Entity"];
    organization["Alternative Name"]=d["alternative name"];
    organization["story"]=d["story"];
    organization["year"]=+d["YEAR"];
    organization["year"] = +(2004 + organization["year"]);
    organization["organization"]=d["ORGANISATION"];
    organization["Method of Leak"]=(d["METHOD OF LEAK"]).trim();
    organization["interesting"]=d["interesting story"];
    organization["Records Stolen"]=+d["NO OF RECORDS STOLEN"];
    organization["Records Stolen"]=(organization["Records Stolen"]);
    organization["Data Sensitivity"]=+d["DATA SENSITIVITY"];
    organization["exclude"]=d["Exclude"];
    organization["sourceLink1"]=d["1st source link"];
    organization["sourceLink2"]=d["1nd source link"];
    organization["sourceLink3"]=d["3rd source"];
    organization["sourceName"]=d["source name"];
    organizationData.push(organization);

    var encontro = false;

    for (var i = columns.length - 1; i >= 0; i--) {
      if (columns[i] === organization["Method of Leak"]) {
        encontro = true;
      }
    };
    if (!encontro) {
      columns.push(organization["Method of Leak"]);
    }
  });

  columns.push("Show all");

  for (var i = 0; i < 13; i++) {
    var method = {};
    method.id = i;
    method.year = (2004 + i);
    for (var j = columns.length - 1; j >= 0; j--) {
      method[columns[j]] = 0;
    };
    method.total = 0;
    methodData.push(method);
  }

  for (var i = organizationData.length - 1; i >= 0; i--) {
    for (var j = 0; j < methodData.length; j++) {
      if (methodData[j].year === organizationData[i].year) {
        if (!isNaN(organizationData[i]["Records Stolen"])) {
          methodData[j][organizationData[i]["Method of Leak"]] += organizationData[i]["Records Stolen"];
          methodData[j].total += organizationData[i]["Records Stolen"];
        }
      }
    };
  };

  methodData.columns = columns;
  z.domain(data.columns);
  update(methodData, "year");
  updateEntities(organizationData.filter(function (d) {return d.year === 2016;}));
  updateDetail(objectToArray(organizationData.filter(function (d) {return d.year === 2016;})[0]));
});
