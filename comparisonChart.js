registerPlugin(proto(Gem, function(){
	this.name = 'ticketGraph'

	this.build = function(ticket, optionsObservee, api){
		var graph = Block()
		this.add(graph)

		var test = graph.domNode

		var line1 = {
			x: [1, 2, 3, 4, 5],
			y: [1, 3, 5, 7, 9],
			type: 'scatter'
		}
		var line2 = {
			x: [1, 2, 3, 4, 5],
			y: [4, 5, 8, 10, 14],
			type: 'scatter'
		}
		var data = [line1, line2]

		var layout = {
			xaxis: {title: 'Completed'},
			yaxis: {title: 'Open'},
			margin: {t: 5}
		}

		Plotly.newPlot(test, data, layout)

	}

	this.getStyle = function(){
		return Style({
			Block: {
				width: 700,
				height: 450,
				outline: '1px solid black'
			}
		})
	}
}))


// Steps
// 1 - get id of parent ticket
// 2 - get children tickets of that parent ticket
// 3 - get dates of when each child ticket created
// 4 - get dates of each child ticket completed

// Linux TimeStamp 
// https://www.epochconverter.com/