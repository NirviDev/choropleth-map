const educationFile =
  "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json";
const countyFile =
  "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json";

d3.queue()
  .defer(d3.json, countyFile)
  .defer(d3.json, educationFile)
  .await(choroplethMap);

function choroplethMap(error, county, education) {
  if (error) throw error;

  let width = 960,
    height = 600;

  let bachelorsOrHigherMin = d3.min(education, (d) => d.bachelorsOrHigher);

  let bachelorsOrHigherMax = d3.max(education, (d) => d.bachelorsOrHigher);

  let color = d3
    .scaleThreshold()
    .domain(
      d3.range(
        bachelorsOrHigherMin,
        bachelorsOrHigherMax,
        (bachelorsOrHigherMax - bachelorsOrHigherMin) / 8
      )
    )
    .range(d3.schemeBlues[9]);

    let zoom = d3
    .zoom()
    .scaleExtent([0.1, 50])
    .on("zoom", function () {
      d3.select(".counties").attr("transform", d3.event.transform);
      d3.select(".states").attr("transform", d3.event.transform);
    });

  let svg = d3
    .select(".diagram-canvas")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .call(zoom);

  let tooltip = d3
    .select(".diagram-canvas")
    .append("div")
    .attr("id", "tooltip")
    .style("opacity", 0);

  let path = d3.geoPath();

  let xScale = d3
    .scaleLinear()
    .domain([bachelorsOrHigherMin, bachelorsOrHigherMax])
    .rangeRound([600, 860]);
// Legend
let svgLegend = d3
    .select(".diagram-canvas")
    .append("svg")
    .attr("id", "svgLegend")
    .attr("width", width)
    .attr("height", 40);

  let legend = svgLegend
    .append("g")
    .attr("id", "legend")
    .attr("transform", "translate(100,0)");

  legend
    .selectAll("rect")
    .data(
      color.range().map(function (d) {
        d = color.invertExtent(d);
        if (d[0] == null) d[0] = xScale.domain()[0];
        if (d[1] == null) d[1] = xScale.domain()[1];
        return d;
      })
    )
    .enter()
    .append("rect")
    .attr("height", 15)
    .attr("x", function (d) {
      return xScale(d[0]);
    })
    .attr("width", function (d) {
      return xScale(d[1]) - xScale(d[0]);
    })
    .attr("fill", function (d) {
      return color(d[0]);
    });

  legend
    .call(
      d3
        .axisBottom(xScale)
        .tickSize(22)
        .tickFormat(function (xScale) {
          return Math.round(xScale) + "%";
        })
        .tickValues(color.domain())
    )
    .select(".domain")
    .remove();
// Counties 
  svg
    .append("g")
    .attr("class", "counties")
    .selectAll("path")
    .data(topojson.feature(county, county.objects.counties).features)
    .enter()
    .append("path")
    .attr("class", "county")
    .attr("data-fips", function (d) {
      return d.id;
    })
    .attr("data-education", function (d) {
      var result = education.filter(function (obj) {
        return obj.fips == d.id;
      });
      if (result[0]) {
        return result[0].bachelorsOrHigher;
      }
      //could not find a matching fips id in the data
      console.log("could find data for: ", d.id);
      return 0;
    })
    .attr("fill", function (d) {
      var result = education.filter(function (obj) {
        return obj.fips == d.id;
      });
      if (result[0]) {
        return color(result[0].bachelorsOrHigher);
      }
      //could not find a matching fips id in the data
      return color(0);
    })
    .attr("d", path)
    .on("mouseover", function (d) {
      tooltip.style("opacity", 0.9);
      tooltip
        .html(function () {
          var result = education.filter(function (obj) {
            return obj.fips == d.id;
          });
          if (result[0]) {
            return (
              result[0]["area_name"] +
              " /" +
              result[0]["state"] +
              "/" +
              "<br/>" +
              result[0].bachelorsOrHigher +
              "%"
            );
          }
          //could not find a matching fips id in the data
          return 0;
        })
        .attr("data-education", function () {
          var result = education.filter(function (obj) {
            return obj.fips == d.id;
          });
          if (result[0]) {
            return result[0].bachelorsOrHigher;
          }
          //could not find a matching fips id in the data
          return 0;
        })
        .style("left", d3.event.pageX + 20 + "px")
        .style("top", d3.event.pageY + "px");
    })
    .on("mouseout", function (d) {
      tooltip.style("opacity", 0);
    });
// States
  svg
    .append("path")
    .datum(
      topojson.mesh(county, county.objects.states, function (a, b) {
        return a !== b;
      })
    )
    .attr("class", "states")
    .attr("d", path);
}
