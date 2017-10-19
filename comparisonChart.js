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
		console.log('now = ', this.now)

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
// this.startDate = (new Date(ticket.subject.history[0].date * 1000).getMonth()+1) + '/' + new Date(ticket.subject.history[0].date * 1000).getDate() + '/' + new Date(ticket.subject.history[0].date * 1000).getFullYear()
	this.createGraph = function(){
		// will need to figure out how to decide how many points to plot
		var xAxis = [
			this.startDate,
			(this.startDate + (this.now-this.startDate)/4),
			(this.startDate + 2*((this.now-this.startDate)/4)),
			(this.startDate + 3*((this.now-this.startDate)/4)),
			this.now
			]
		var y1 = [0, 0, 0, 0, 0]
		var y2 = [0, 0, 0, 0, 0]
		console.log('children ' , this.children)
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
		var today = this.startDate * 1000
		xAxis = [
			(new Date(today).getMonth()+1) + '/' + new Date(today).getDate() + '/' + new Date(today).getFullYear(),
			(new Date(today+(this.now-this.startDate)/4).getMonth()+1) + '/' + new Date(today+(this.now-this.startDate)/4).getDate() + '/' + new Date(today+(this.now-this.startDate)/4).getFullYear(),
			(new Date(today+2*((this.now-this.startDate)/4)).getMonth()+1) + '/' + new Date(today+2*((this.now-this.startDate)/4)).getDate() + '/' + new Date(today+2*((this.now-this.startDate)/4)).getFullYear(),
			(new Date(today+3*((this.now-this.startDate)/4)).getMonth()+1) + '/' + new Date(today+3*((this.now-this.startDate)/4)).getDate() + '/' + new Date(today+3*((this.now-this.startDate)/4)).getFullYear(),
			(new Date(this.now*1000).getMonth()+1) + '/' + new Date(this.now*1000).getDate() + '/' + new Date(this.now*1000).getFullYear()
			]
		console.log('xAxis=' + xAxis)
		console.log('total y1=' + y1)
		console.log('open y2=' + y2)

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
		plotly.newPlot(this.chart, lines, layout)
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
					data['completed'] = that.now + 10
				}
				that.children.push(data)
			})
		})
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

// Linux TimeStamp 
// https://www.epochconverter.com/
// var myDate = new Date( your epoch date *1000);

// this.startDate = (new Date(ticket.subject.history[0].date * 1000).getMonth()+1) + '/' + new Date(ticket.subject.history[0].date * 1000).getDate() + '/' + new Date(ticket.subject.history[0].date * 1000).getFullYear()
