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
			this.startDate = ticket.subject.history[0].date
			api.Ticket.search({parent: ticket.subject._id}).then(function(childTickets){
				// that.kids = childTickets
				childTickets.forEach(function(child){
					data = {}
					data['created'] = child.subject.history[0].date
					// console.log(child.subject.history)
					if(child.subject.done === true || child.subject.archived === true){
						// console.log('completed')
						// checks most recent first
						for(var i=child.subject.history.length-1; i>=0; i--){
							// code runs but I don't know if fields are labeled correctly
							if(child.subject.history[i].field === 'done' || child.subject.history[i].field === 'archived'){
								data['completed'] = child.subject.history[i].date
								// stop loop if field = done or archived
								break
							}
						}
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

		// hard code some data to see how this works
		this.startDate = 1
		var now = 50
		children = [{'created': 1}, {'created': 9}, {'created': 13}, {'created': 18}, {'created': 22}, {'created': 26}, {'created': 35}, {'created': 41}, {'created': 49}, {'created': 50}]
		var a = 0
		var b = 0
		var c = 0
		var d = 0
		var e = 0
		// var e = d = c = b = a = 0
		// var now = 	Math.round(new Date().getTime()/1000.0)
		console.log('now=' + now)
		console.log(children)
		children.forEach(function(child){
			console.log('for each ', child)
			if(child['created'] <= that.startDate){
				a++
			}
			if(child['created'] <= (that.startDate + (now-that.startDate)/4)){
				b++
			}
			 // (1 + 2*((50-1)/4))
			if(child['created'] <= (that.startDate + 2*((now-that.startDate)/4))){
				c++
			}
			if(child['created'] <= (that.startDate + 3*((now-that.startDate)/4))){
				d++
			}
			if(child['created'] <= now){
				e++
			}
		})
		console.log('a=' + a)
		console.log('b=' + b)
		console.log('c=' + c)
		console.log('d=' + d)
		console.log('e=' + e)

		var line1 = {
			x: [1, 2, 3, 4, 5],
			y: [1, 3, 5, 7, 9],
			type: 'scatter',
			name: 'Open Tickets'
		}
		var line2 = {
			x: [this.startDate, (this.startDate + (now-this.startDate)/4), (this.startDate + 2*((now-that.startDate)/4)), (this.startDate + 3*((now-that.startDate)/4)), now],
			y: [a, b, c, d, e],
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
