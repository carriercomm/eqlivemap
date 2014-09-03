if (Meteor.isServer){
	Router.map(function () {
	  this.route('setLoc', {
	    where: 'server',
	    path: '/player/setloc',

	    action: function () {
	      // console.log(this.request)
	      data = this.request.body
	      if(!data.player)
	      	data = this.request.query
	      result = false
	      if(!(data.player && data.x && data.y && data.z))
	      {
	      	this.response.writeHead(400);
	      	this.response.end("Request must supply {player: id, x:x', y:y', z:y'}");
	      	return
	      }
	      var player = Players.findOne({_id: data.player})
	      if(!player){
	      	this.response.writeHead(400);
	      	this.response.end("Player id not found.  Visit http://eqlivemap.meteor.com to get your player id.");
	      	return;	
	      }
	      if(!data.name)
	      	data.name = "a_player_03"	      
	      update = {x:parseFloat(-1*data.x), y:parseFloat(-1*data.y), z:parseFloat(data.z), loc_map: player.map, name: data.name, updated: new Date()}


	      Players.update({_id:data.player}, {$set: update})
	      this.response.writeHead(200, {'Content-Type': 'text/html'});
	      this.response.end(data.name + " location set to " + data.x + ", " + data.y + ", " + data.z + ".");
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
		// console.log(data)
		if(!(data.player && data.map))
		{
			this.response.writeHead(400);
			this.response.end("Request must supply {player: id, map: Ocean of Tears}");
			// console.log("asdf")
			return;
		}

		var player = Players.findOne({_id: data.player})
		if(!player){
			this.response.writeHead(400);
			this.response.end("Player Id not found.  Visit http://eqlivemap.meteor.com to get your player id");
			// console.log("123")
			return;	
		}
		//have to use regex for case insentive due to some inconsitencies with eq Blackburrow vs BlackBurrow
		var mapSearch = new RegExp(["^",data.map,"$"].join(""),"i");
		map  = Maps.findOne({long_name: mapSearch})
		if(!map){
			this.response.writeHead(400);
			this.response.end(data.map + " not found.  Where are you?");
			// console.log("1111111")
			return;		
		}

		if(!data.name)
			data.name = "a_player_03"	    	
		update = {map: map.name, name: data.name, updated: new Date()}	
		Players.update({_id:data.player}, {$set: update})
		this.response.writeHead(200, {'Content-Type': 'text/html'});
		this.response.end(data.name + " map set to " + data.map  + ".");
	    }

	  });
	});
}