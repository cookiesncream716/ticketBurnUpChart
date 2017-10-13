registerPlugin(proto(Gem, function(){
	this.name = 'ticketGraph'

	this.build = function(ticket, optionsObservee, api){
		var that = this
		var graph = Block()
		this.add(graph)

		var test = graph.domNode

		var children = []
		// children = [{created: date, completed: date or 0 for open}]
		// created date - history[0].date
		// completed date - if archived true or if done true (date in history that done went from false to true)

		if(ticket.subject.parent === undefined){
			// this is top level ticket
			this.parentId = ticket.subject._id
			console.log('parentId = ' + this.parentId)
			this.startDate = ticket.subject.history[0].date
			api.Ticket.search({parent: ticket.subject._id}).then(function(childTickets){
				that.kids = childTickets
				childTickets.forEach(function(child){
					data = {}
					data['created'] = child.subject.history[0].date
					if(child.subject.done === true || child.subject.archived === true){
						data['completed'] = 
					} else{
						data['completed'] = 0
					}
					children.push(data)
				})	
			}).done()
		} else{
			this.parentId = ticket.subject.parent
			console.log('parentId ' + this.parentId)
			api.Ticket.search({parent: ticket.subject.parent}).then(function(childTickets){
				that.kids = childTickets
			}).done()
		}


		var line1 = {
			x: [1, 2, 3, 4, 5],
			y: [1, 3, 5, 7, 9],
			type: 'scatter',
			name: 'Open Tickets'
		}
		var line2 = {
			x: [this.startDate],
			y: [this.kids.length],
			type: 'scatter',
			name: 'Total Tickets'
		}
		var data = [line2]

		var layout = {
			xaxis: {title: 'Date'},
			yaxis: {title: 'Tickets'},
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

// Total tickets vs Open tickets
	// total - # of children tickets created by that date

// Steps
// 1 - get id of parent ticket
// 2 - get children tickets of that parent ticket
// 3 - get dates of when each child ticket created
// 4 - get dates of each child ticket completed

// Linux TimeStamp 
// https://www.epochconverter.com/
// var myDate = new Date( your epoch date *1000);

// this.startDate = (new Date(ticket.subject.history[0].date * 1000).getMonth()+1) + '/' + new Date(ticket.subject.history[0].date * 1000).getDate() + '/' + new Date(ticket.subject.history[0].date * 1000).getFullYear()
