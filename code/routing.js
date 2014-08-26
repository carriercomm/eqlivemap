if (Meteor.isClient) {

	Router.configure({
		layoutTemplate: 'content',
		//loadingTemplate: 'loading',
		before: function(){
			//NProgress.start()
		},
		after: function(){
			//NProgress.done()
			//GAnalytics.pageview()
		}
	});

	Router.map(function() {
	  	this.route('home', {path: '/', waitOn: function(){ return Meteor.subscribe("maps")}})
		this.route('map', { 
		  path: '/map/:name',
		  waitOn: function() { return [ Meteor.subscribe("maps"), Meteor.subscribe("figures", this.params.name), Meteor.subscribe("players", this.params.name) ] },
		  data: function() { return this.params.name }
		});
	})
	
}

if (Meteor.isServer){
	Router.map(function () {
	  this.route('updatePlayer', {
	    where: 'server',
	    path: '/player',

	    action: function () {
	      data = this.request.body
	      result = false
	      if(data.player && data.x && data.y && data.z)
	      {
	      	Players.update({_id:data.player}, {$set: {x:-1*data.x, y:-1*data.y, z:data.z}})
	      	result = true
	      }
	      if(result){
	      	this.response.writeHead(200, {'Content-Type': 'text/html'});
	      	this.response.end("ok");
	      }
	      else
	      {
	      	this.response.writeHead(400);
	      	this.response.end("Request must supply {player: id, x:x', y:y', z:y'}");
	      }

	    }
	  });
	});
}