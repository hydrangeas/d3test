function StackedBarChart(data, element, dataFilter) {
  // Specify the chart’s dimensions.
  const marginTop = 20;
  const marginRight = 80;
  const marginBottom = 30;
  const marginLeft = 40;

  const svg = d3.select(element);
  const svgNode = svg.node();
  const width = svgNode.getBoundingClientRect().width;
  const height = svgNode.getBoundingClientRect().height; // Uncomment this line

  // Create the horizontal time scale.
  const x = d3
    .scaleUtc()
    .domain(d3.extent(data, (d) => d3.isoParse(d.Date)))
    .range([marginLeft, width - marginRight])
    .clamp(true);

  // Normalize the series with respect to the value on the first date. Note that normalizing
  // the whole series with respect to a different date amounts to a simple vertical translation,
  // thanks to the logarithmic scale! See also https://observablehq.com/@d3/change-line-chart
  const filteredData = data.filter((d) => d.division.startsWith(dataFilter));
  const series = d3
    .stack()
    .keys(d3.union(filteredData.map((d) => d.division)))
    .value(([, group], key) => group.get(key).Value)(
    d3.index(
      filteredData,
      (d) => d3.isoParse(d.Date),
      (d) => d.division
    )
  );

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(series, (d) => d3.max(d, (d) => d[1]))])
    .rangeRound([height - marginBottom, marginTop])
    .clamp(true);

  // Create a color scale to identify series.
  const z = d3
    .scaleOrdinal(d3.schemeCategory10)
    .domain(series.map((d) => d.division));

  // For each given series, the update function needs to identify the date—closest to the current
  // date—that actually contains a value. To do this efficiently, it uses a bisector:
  const bisect = d3.bisector((d) => d.Date).left;

  // Create the SVG container.
  const svg1 = d3
    //.create("svg")
    .selectAll(element)
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr(
      "style",
      "max-width: 100%; height: auto; -webkit-tap-highlight-color: transparent;"
    );

  // Create the axes and central rule.
  svg1
    .append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(width / 80)
        .tickSizeOuter(0)
    );

  const rule = svg1
    .append("g")
    .append("line")
    .attr("y1", height)
    .attr("y2", 0)
    .attr("stroke", "black");

  // Create a line and a label for each series.
  const serie = svg1
    .append("g")
    .style("font", "bold 10px sans-serif")
    .selectAll("g")
    .data(series)
    .join("g");

  const line = d3
    .line()
    .x((d) => x(d3.utcDay.round(d3.isoParse(d.Date)))) // ここを修正
    .y((d) => y(d.value));

  svg
    .append("g")
    .selectAll("g")
    .data(series)
    .join("g")
    .attr("fill", (d) => z(d.key))
    .selectAll("rect")
    .data((D) => D)
    .join("rect")
    .attr("x", (d) => x(d3.utcDay.round(d3.isoParse(d.data[0]))))
    .attr("y", (d) => y(d[1]))
    .attr("height", (d) => y(d[0]) - y(d[1]))
    .attr("width", 5);

  // Define the update function, that translates each of the series vertically depending on the
  // ratio between its value at the current date and the value at date 0. Thanks to the log
  // scale, this gives the same result as a normalization by the value at the current date.
  function update(date) {
    date = d3.utcDay.round(date);
    rule.attr("transform", `translate(${x(date)},0)`);
    // serie.attr("transform", ({ values }) => {
    //   const i = bisect(values, date, 0, values.length - 1);
    //   return `translate(0,${
    //     y(1) - y(values[i].value / values[0].value)
    //   })`;
    // });
    svg1.property("value", date).dispatch("input"); // for viewof compatibility
  }

  // Create the introductory animation. It repeatedly calls the update function for dates ranging
  // from the last to the first date of the x scale.
  svg1
    .transition()
    .ease(d3.easeCubicOut)
    .duration(1500)
    .tween("date", () => {
      const i = d3.interpolateDate(x.domain()[1], x.domain()[0]);
      return (t) => update(i(t));
    });

  // When the user mouses over the chart, update it according to the date that is
  // referenced by the horizontal position of the pointer.
  // svg1.on("mousemove touchmove", function (event) {
  //   update(x.invert(d3.pointer(event, this)[0]));
  //   //d3.event.preventDefault();
  // });

  return [x, update];
}
