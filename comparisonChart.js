'use strict'
var plotly = require('./plotly-latest.min.js')

registerPlugin(proto(Gem, function(){
	this.name = 'ticketGraph'

	this.build = function(ticket, optionsObservee, api){
		var that = this
		this.api = api

		var graph = Block()
		this.add(graph)
		this.chart = graph.domNode
		this.children = []
		// children = [{created: date, completed: date or now+10 for open}]
		// created date - history[0].date
		// completed date - (if archived true or if done true) date in history that done went from false to true
		this.now = Math.round(new Date().getTime()/1000.0)
		this.startDate = ticket.subject.history[0].date
		this.title = ticket.subject.title

		// Displays Ticket's immediate children
		// this.createData(ticket.subject._id).then(function(){
		// 	return that.createGraph()
		// }).done()

		// Display all of Ticket's descendents
		this.createDataAll(ticket.subject._id).then(function(){
			return that.createGraph()
		}).done()
	}

	// this.createData = function(id){
	// 	var that = this
	// 	return this.api.Ticket.search({parent: id}).then(function(childTickets){
	// 		console.log('child tickets ', childTickets)
	// 		childTickets.forEach(function(child){
	// 			var data = {}
	// 			data['created'] = child.subject.history[0].date
	// 			if(child.subject.done === true || child.subject.archived === true){
	// 				// not sure this is how history should work
	// 				if(child.subject.history.length === 1){
	// 					data['completed'] = child.subject.history[0].date
	// 				}else {
	// 					for(var i=child.subject.history.length-1; i>=0; i--){
	// 						if(child.subject.history[i].field === 'done' || child.subject.history[i].field === 'archived'){
	// 							data['completed'] = child.subject.history[i].date
	// 							break
	// 						}
	// 					}
	// 				}
	// 			} else{
	// 				data['completed'] = that.now + 1000
	// 			}
	// 			that.children.push(data)
	// 		})
	// 		console.log('that.children ', that.children)
	// 	})
	// }

	this.createDataAll = function(id){
		var that = this
		return this.api.Ticket.search({$or: [{parent: id},{ancestry: id}]}).then(function(allTickets){
			console.log('all descendents ', allTickets)
			allTickets.forEach(function(aTicket){
				var data = {}
				data['created'] = aTicket.subject.history[0].date
				if(aTicket.subject.done === true || aTicket.subject.archived === true){
					if(aTicket.subject.history.length === 1){
						data['completed'] = aTicket.subject.history[0].date
					} else{
						for(var i=aTicket.subject.history.length-1; i>=0; i--){
							if(aTicket.subject.history[i].field === 'done' || aTicket.subject.history[i].field === 'archived'){
								data['completed'] = aTicket.subject.history[i].date
								break
							}
						}
					}
				} else{
					data['completed'] = that.now + 1000
				}
				that.children.push(data)
			})
			console.log('that.children ', that.children)
		})
	}

	this.createGraph = function(){
		var that = this
		console.log('createGraph ', this.children)
		// epoch time day = 86,400 seconds
		// epoch time week = 604,800 seconds
		var timeDiff = this.now-this.startDate
		var week = 604800
		if(Math.round(timeDiff/week) < 3){			// DAILY PLOT
			console.log('daily')
			var plots = Math.round(timeDiff/86400)
		} else if(Math.round(timeDiff/week) < 13 ){ // WEEKLY PLOT
			console.log('weekly')
			var plots = Math.round(timeDiff/week)
		} else if(Math.round(timeDiff/week) < 26){	// BIWEEKLY PLOT
			console.log('biweekly')
			var plots = Math.round(timeDiff/(week*2))
		} else{										// MONTHLY PLOT
			console.log('monthly')
			var plots = Math.round(timeDiff/(week*4))
		}
		// xAxis.length = plots
		console.log('plots = ', plots)

		// Create x and y axis for Markers
		var xAxis = [this.startDate] // dates
		var y1 = [0]  // total tickets
		var y2 = [0]  // open tickets
		// Put dates in xAxis and make y axis the right length
		for(var x=1; x<plots; x++){
			xAxis.push(this.startDate + x*((this.now-this.startDate)/(plots-1)))
			y1.push(0)
			y2.push(0)
		}

		// Find number of tickets and wether they are open or closed
		// problem - xAxis[0] is date ticket created but any child tickets created on same day will still have a later created date and if child ticket completed on same day
		if(xAxis.length === 1){		//break case
			y1[0] = this.children.length
			this.children.forEach(function(child){
				if(child['completed'] >= xAxis[0]){
					y2[0]++
				}
			})
		} else{
			this.children.forEach(function(child){
				xAxis.forEach(function(x, index){
					if(child['created'] <= x){
						y1[index]++
						if(child['completed'] >= x){
							y2[index]++
						}
					}
				})
			})
		}

		// Make xAxis dates readable
		var xAxisDate = []
		for(var i=0; i<xAxis.length; i++){
			xAxisDate.push((new Date(xAxis[i] * 1000).getMonth() + 1) + '/' + new Date(xAxis[i] * 1000).getDate() + '/' + new Date(xAxis[i] * 1000).getFullYear()) 
		}
		var line1 = {
			x: xAxisDate,
			y: y1,
			type: 'scatter',
			name: 'Total Tickets',
			mode: 'lines+markers',
			marker: {
    			color: 'rgb(23, 156, 56)',
    			size: 15
			},
    		line: {
    			color: 'rgb(23, 156, 56)',
    			width: 4
  			}
		}
		var line2 = {
			x: xAxisDate,
			y: y2,
			type: 'scatter',
			name: 'Open Tickets',
			mode: 'lines+markers',
			marker: {
				color: 'rgb(255,140,0)',
				size: 8
			},
			line: {
				color: 'rgb(255,140,0)',
				width: 2
			}
		}
		var lines = [line1, line2]
		var layout = {
			title: this.title,
			xaxis: {title: 'Date'},
			yaxis: {title: 'Tickets'}
			// margin: {t: 43}
		}
		var options = {
			// scrollZoom: true,
			displaylogo: false,
			modeBarButtonsToRemove: ['sendDataToCloud', 'zoom2d','hoverClosestCartesian', 'lasso2d']
		}
		plotly.newPlot(this.chart, lines, layout, options)
	}
}))
