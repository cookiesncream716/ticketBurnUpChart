'use strict'
var plotly = require('./plotly-latest.min.js')

registerPlugin(proto(Gem, function(){
	this.name = 'ticketGraph'

	this.build = function(ticket, optionsObservee, api){
		var that = this
		var graph = Block()
		this.add(graph)

		var test = graph.domNode

		this.children = []
		// children = [{created: date, completed: date or now+1 for open}]
		// created date - history[0].date
		// completed date - if archived true or if done true (date in history that done went from false to true)
		var startDate
		this.now = 	Math.round(new Date().getTime()/1000.0)

		if(ticket.subject.parent === undefined){
			// this is top level ticket
			var parentId = ticket.subject._id
			startDate = ticket.subject.history[0].date
			api.Ticket.search({parent: ticket.subject._id}).then(function(childTickets){
				childTickets.forEach(function(child){
					that.createData(child)
					// var data = {}
					// data['created'] = child.subject.history[0].date
					// // console.log(child.subject.history)
					// if(child.subject.done === true || child.subject.archived === true){
					// 	// console.log('completed')
					// 	// checks most recent first
					// 	for(var i=child.subject.history.length-1; i>=0; i--){
					// 		// code runs but I don't know if fields are labeled correctly
					// 		if(child.subject.history[i].field === 'done' || child.subject.history[i].field === 'archived'){
					// 			data['completed'] = child.subject.history[i].date
					// 			// stop loop if field = done or archived
					// 			break
					// 		}
					// 	}
					// } else{
					// 	data['completed'] = now + 1
					// }
					// this.children.push(data)
				})	
			}).done()
		} else{
			var parentId = ticket.subject.parent
			console.log('parentId ' + parentId)
			api.Ticket.findOne(parentId).then(function(parent){
				startDate = parent.subject.history[0].date
			}).done()
			api.Ticket.search({parent: ticket.subject.parent}).then(function(childTickets){
				childTickets.forEach(function(child){
					that.createData(child)
				})
			}).done()
		}

		// hard code some data to see how this works
		// startDate = 1
		// this.now = 50
		// this.children = [{'created': 1, 'completed': 18}, {'created': 9, 'completed': 14}, {'created': 13, 'completed': 60}, {'created': 18, 'completed': 33}, {'created': 22, 'completed': 60}, {'created': 26, 'completed': 45}, {'created': 35,'completed': 48}, {'created': 41, 'completed': 42}, {'created': 49, 'completed': 60}, {'created': 50, 'completed': 60}]
		// children = [{'created': 1, 'completed': 3}, {'created': 3, 'completed': 8}, {'created': 12, 'completed': 60}, {'created': 18, 'completed': 28}, {'created': 41, 'completed': 60}]
		// console.log(children)
		var xAxis = [startDate, (startDate + (this.now-startDate)/4), (startDate + 2*((this.now-startDate)/4)), (startDate + 3*((this.now-startDate)/4)), this.now]
		// var xAxis = [1, 10, 20, 30,50]
		var y1 = [0, 0, 0, 0, 0]
		var y2 = [0, 0, 0, 0, 0]
		this.children.forEach(function(child){
			if(child['created'] <= xAxis[0]){
				y1[0]++
				if(child['completed'] >= xAxis[0]){
					y2[0]++
				}
			}
			if(child['created'] <= xAxis[1]){
				y1[1]++
				if(child['completed'] >= xAxis[1]){
					y2[1]++
				}
			}
			if(child['created'] <= xAxis[2]){
				y1[2]++
				if(child['completed'] >= xAxis[2]){
					y2[2]++
				}
			}
			if(child['created'] <= xAxis[3]){
				y1[3]++
				if(child['completed'] >= xAxis[3]){
					y2[3]++
				}
			}
			if(child['created'] <= xAxis[4]){
				y1[4]++
				if(child['completed'] >= xAxis[4]){
					y2[4]++
				}
			}
		})
		console.log('xAxis=' + xAxis)
		console.log('open y2=' + y2)
		console.log('total y1=' + y1)
		var line1 = {
			x: xAxis,
			y: y1,
			type: 'scatter',
			name: 'Total Tickets'
		}

		var line2 = {
			x: xAxis,
			y: y2,
			type: 'scatter',
			name: 'Open Tickets'
		}

		var lines = [line1, line2]

		var layout = {
			xaxis: {title: 'Date'},
			yaxis: {title: 'Tickets'},
			margin: {t:23}
		}
		plotly.newPlot(test, lines, layout)
	}

	this.createData = function(child){
		var data = {}
		data['created'] = child.subject.history[0].date
		if(child.subject.done === true || child.subject.archived === true){
			for(var i=child.subject.history.length-1; i>=0; i--){
				if(child.subject.history[i].field === 'done' || child.subject.history[i].field === 'archived'){
					data['completed'] = child.subject.history[i].date
					break
				}
			}
		} else{
			data['completed'] = this.now + 1
		}
		this.children.push(data)
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
