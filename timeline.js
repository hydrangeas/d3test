function TimeLine(data, element, dataFilter) {
  const marginRight = 80;
  const marginLeft = 40;

  const svg = d3.select(element);
  const svgNode = svg.node();
  const width = svgNode.getBoundingClientRect().width;
  const height = svgNode.getBoundingClientRect().height; // Uncomment this line

  const x = d3
    .scaleUtc()
    .domain(d3.extent(data, (d) => d3.isoParse(d.Date)))
    .range([marginLeft, width - marginRight])
    .clamp(true);

  const series = d3
    .groups(data, (d) => d.division)
    .map(([key, values]) => {
      return {
        key,
        values: values.map(({ Date, Value }) => ({
          Date: d3.isoParse(Date),
          value: Value,
        })),
      };
    })
    .filter((d) => d.key.startsWith(dataFilter));

  svg
    .selectAll("#svgArea")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr(
      "style",
      "max-width: 100%; height: auto; -webkit-tap-highlight-color: transparent;"
    );

  svg
    .append("g")
    .attr("transform", `translate(0,${height / 2})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(width / 80)
        .tickSizeOuter(0)
    );

  svg
    .selectAll("circle")
    .data(series[0].values.filter((d) => d.value))
    .enter()
    .append("circle")
    .attr("cx", (d) => x(d3.utcDay.round(d3.isoParse(d.Date)))) // ここを修正
    .attr("cy", height / 2)
    .attr("r", 2)
    .attr("fill", "black")
    .attr("stroke", "black");

  // --
  const uniqueId = Math.random().toString(36).slice(2, 18);
  d3.transition(uniqueId)
    .ease(d3.easeCubicOut)
    .duration(1500)
    .tween("date", () => {
      const i = d3.interpolateDate(x.domain()[1], x.domain()[0]);
      return (t) => update(i(t));
    });
  // --
  const rule = svg
    .append("g")
    .append("line")
    .attr("y1", height)
    .attr("y2", 0)
    .attr("stroke", "black");

  function update(date) {
    date = d3.utcDay.round(date);
    rule.attr("transform", `translate(${x(date)},0)`);
    svg.property("value", date).dispatch("input"); // for viewof compatibility
  }

  return [x, update];
}
