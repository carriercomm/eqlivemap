if (Meteor.isClient) {

	Router.configure({
		layoutTemplate: 'content',
		//loadingTemplate: 'loading',
		before: function(){
			NProgress.start()
		},
		after: function(){
			NProgress.done()
			//GAnalytics.pageview()
		}
	});
	
	Router.onBeforeAction('loading')
	
	Router.map(function() {
	  	this.route('home', {path: '/', waitOn: function(){ return [Meteor.subscribe("maps"), Meteor.subscribe("allplayers")]}})

	  	this.route('auctions', 
	  		{
	  			path: '/auction', waitOn: function(){ 
	  				return [Meteor.subscribe("auctions"), Meteor.subscribe("items")]
	  			},
	  			data: function() { return {auctions: Auctions.find().fetch()} }
	  		}
	  	)

		this.route('map', { 
		  path: '/map/:name',
		  waitOn: function() { return [ Meteor.subscribe("maps"), Meteor.subscribe("figures", this.params.name), Meteor.subscribe("players", this.params.name, Session.get('player')) ] },
		  data: function() { return {map: this.params.name} }
		});
	})
	
}