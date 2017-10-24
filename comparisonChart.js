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
		this.startDate
		this.now = Math.round(new Date().getTime()/1000.0)
		if(ticket.subject.parent === undefined){
			// this is top level ticket
			this.startDate = ticket.subject.history[0].date
			this.createData(ticket.subject._id).then(function(){
				return that.createGraph()
			}).done()
		} else{
			api.Ticket.loadOne(ticket.subject.parent).then(function(parent){
				that.startDate = parent.subject.history[0].date
				return that.createData(ticket.subject.parent)
			}).then(function(){
				return that.createGraph()
			}).done()
		}
	}

	this.createGraph = function(){
		// epoch time day = 86,400 seconds
		// epoch time week = 604,800 seconds
		// # of weeks
		// var weeks = Math.round((this.now-this.startDate)/604800)
		var weeks
		if(Math.round((this.now-this.startDate)/604800) < 3){	// DAILY PLOT
			weeks = Math.round((this.now-this.startDate)/86400)
		} else if(Math.round((this.now-this.startDate)/604800) < 13 ){		// WEEKLY PLOT
			weeks = Math.round((this.now-this.startDate)/604800)
		} else if(Math.round((this.now-this.startDate)/604800) < 26){	// BIWEEKLY PLOT
			weeks = Math.round((this.now-this.startDate)/(604800*2))
		} else{															// MONTHLY PLOT
			weeks = Math.round((this.now-this.startDate)/(604800*4))
		}
		// xAxis.length = weeks
		var xAxis = [this.startDate]
		var y1 = [0]
		var y2 = [0]
		for(var x=1; x<weeks; x++){
			xAxis.push(this.startDate + x*((this.now-this.startDate)/(weeks-1)))
			y1.push(0)
			y2.push(0)
		}

		this.children.forEach(function(child){
			console.log('child ' , child)
			var count = 0
			while(count < weeks){
				console.log('count ' + count)
				if(child['created'] <= xAxis[count]){
					y1[count]++
					if(child['completed'] >= xAxis[count]){
						y2[count]++
					}
				}
				count++
			}
		})
		console.log('xAxis=' + xAxis)
		console.log('total y1=' + y1)
		console.log('open y2=' + y2)

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
    			size: 8
			},
    		line: {
    			color: 'rgb(23, 156, 56)',
    			width: 1
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
				width: 1
			}
		}
		var lines = [line1, line2]
		var layout = {
			xaxis: {title: 'Date'},
			yaxis: {title: 'Tickets'},
			margin: {t:23}
		}
		var options = {
			// scrollZoom: true,
			displaylogo: false,
			modeBarButtonsToRemove: ['sendDataToCloud', 'zoom2d','hoverClosestCartesian', 'lasso2d']
		}
		plotly.newPlot(this.chart, lines, layout, options)
	}

	this.createData = function(id){
		var that = this
		return this.api.Ticket.search({parent: id}).then(function(childTickets){
			childTickets.forEach(function(child){
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
					data['completed'] = that.now + 100
				}
				that.children.push(data)
			})
		})
	}

	this.getStyle = function(){
		return Style({
			Block: {
				width: '100%',
				minHeight: 250,
				paddingTop: 10
			}
		})
	}
}))

// Total tickets vs Open tickets
	// total - # of children tickets created by that date

// Linux TimeStamp 
// https://www.epochconverter.com/
// var myDate = new Date( your epoch date *1000);
