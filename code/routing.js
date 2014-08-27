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
	  this.route('setLoc', {
	    where: 'server',
	    path: '/player/setloc',

	    action: function () {
	      //console.log(this.request)
	      data = this.request.body
	      if(!data.player)
	      	data = this.request.query
	      result = false
	      if(data.player && data.x && data.y && data.z)
	      {
	      	update = {x:-1*data.x, y:-1*data.y, z:data.z}
	      	if(data.name)
	      		update.name = data.name

	      	Players.update({_id:data.player}, {$set: update})
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

	  this.route('setMap', {
	    where: 'server',
	    path: '/player/setmap',

	    action: function () {
	      //console.log(this.request)
	      data = this.request.body
	      if(!data.player)
	      	data = this.request.query
	      result = false
	      if(data.player && data.map)
	      {
	      	map  = Maps.findOne({long_name: data.map})
	      	if(map){
	      		update = {map: map.name}
	      		if(data.name)
	      			update.name = data.name
	      		Players.update({_id:data.player}, {$set: update})
	      	}
	      	result = true
	      }
	      if(result){
	      	this.response.writeHead(200, {'Content-Type': 'text/html'});
	      	this.response.end("ok");
	      }
	      else
	      {
	      	this.response.writeHead(400);
	      	this.response.end("Request must supply {player: id, map: Ocean of Tears}");
	      }

	    }
	  });	  
	});
}