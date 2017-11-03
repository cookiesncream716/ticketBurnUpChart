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

		// Ticket and it's immediate children
		this.startDate = ticket.subject.history[0].date
		this.title = ticket.subject.title
		this.createData(ticket.subject._id).then(function(){
			return that.createGraph()
		}).done()


		// if(ticket.subject.parent === undefined){
		// 	// this is top level ticket
		// 	this.startDate = ticket.subject.history[0].date
		// 	this.title = ticket.subject.title
		// 	console.log('parent = ', ticket)
		// 	this.createData(ticket.subject._id).then(function(){
		// 		return that.createGraph()
		// 	}).done()
		// } else{
		// 	api.Ticket.loadOne(ticket.subject.parent).then(function(parent){
		// 		that.startDate = parent.subject.history[0].date
		// 		that.title = parent.subject.title
		// 		console.log('parent = ', parent)
		// 		return that.createData(ticket.subject.parent)
		// 	}).then(function(){
		// 		return that.createGraph()
		// 	}).done()
		// }
	}

	this.createData = function(id){
		var that = this
		return this.api.Ticket.search({parent: id}).then(function(childTickets){
			console.log('child tickets ', childTickets)
			childTickets.forEach(function(child){
				var data = {}
				data['created'] = child.subject.history[0].date
				if(child.subject.done === true || child.subject.archived === true){
					if(child.subject.history.length === 1){
						data['completed'] = child.subject.history[0].date
					}else {
						for(var i=child.subject.history.length-1; i>=0; i--){
							if(child.subject.history[i].field === 'done' || child.subject.history[i].field === 'archived'){
								data['completed'] = child.subject.history[i].date
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
		console.log('createGraph ', this.children)
		// epoch time day = 86,400 seconds
		// epoch time week = 604,800 seconds
		var timeDiff = this.now-this.startDate
		var week = 604800
		// don't think this works to see chart same day that ticket has been createdß
		if(Math.round(timeDiff/week) < 3){			// DAILY PLOT
			var plots = Math.round(timeDiff/86400)
		} else if(Math.round(timeDiff/week) < 13 ){ // WEEKLY PLOT
			var plots = Math.round(timeDiff/week)
		} else if(Math.round(timeDiff/week) < 26){	// BIWEEKLY PLOT
			var plots = Math.round(timeDiff/(week*2))
		} else{										// MONTHLY PLOT
			var plots = Math.round(timeDiff/(week*4))
		}
		console.log('plots = ', plots)
		// Create x and y axis for Markers
		// xAxis.length = plots
		var xAxis = [this.startDate]
		var y1 = [0]
		var y2 = [0]
		// put dates in xAxis and make y axis the right length
		for(var x=1; x<plots; x++){
			xAxis.push(this.startDate + x*((this.now-this.startDate)/(plots-1)))
			y1.push(0)
			y2.push(0)
		}
		// find number of tickets and wether they are open or closed
		this.children.forEach(function(child){
			var count = 0
			while(count <= plots){
				if(child['created'] <= xAxis[count]){
					y1[count]++
					if(child['completed'] >= xAxis[count]){
						y2[count]++
					}
				}
				count++
			}
		})

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

	// this.getStyle = function(){
	// 	return Style({
	// 		Block: {
	// 			width: '100%',
	// 			minHeight: 250,
	// 			paddingTop: 10
	// 		}
	// 	})
	// }
}))
