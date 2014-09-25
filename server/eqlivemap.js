
if (Meteor.isServer) {

  Meteor.publish("items", function () {
    return Items.find({});
  });
  
  Meteor.publish("auctions", function () {
    return Auctions.find({});
  });

  Meteor.publish("maps", function () {
    return Maps.find({});
  });

  Meteor.publish("figures", function (mapName) {
    return Figures.find({map:mapName});
  });
  
  Meteor.publish("players", function (mapName, player) {
    if(player){
      return Players.find( { $or: [ {map: mapName}, {_id: player} ] });
    }
    else{
      return Players.find({map: mapName});
    }
    
  });

  Meteor.publish("allplayers", function () {
    return Players.find();
  });

  Meteor.methods({
    readyPlayerOne: function () {
      id = Players.insert({})
      return id;
    },
    parseAunction: function(line){
      var parts = line.replace(/,|\|\/\\/ig, "").trim().split(/\s+/)
      var sell = true;
      var matches = [];
      for(var i=0; i<parts.length; i++){
        var match="";
        var lookup = false;
        var itemMatch = false;
        var matchPosition = 0;
        
        if(parts[i].match(/^(wtb|buy|buying)$/i))
          sell = false
        else if(parts[i].match(/^(wts|sell|selling)$/i))
          sell = true

        for(var j=i; j<parts.length && sell; j++){ 
          match += " " + parts[j];
          if(lookup = Items.findOne({name: match.trim()})){
              itemMatch = item
              matchPosition = j
          }
        }
        
        if(itemMatch){
          i=matchPosition
          var link = "http://wiki.project1999.com/" + itemMatch.replace(/'/g, "%27").replace(/ /,"_")
          var cost = false;
          if(parts[i+1].match(/\d+/)){
            cost = parts[i+1].match(/\d+\.*\d*/)[0]
            if(parts[i+1].match(/k$/i))
              cost = cost * 1000
          }

          matches.push({name: itemMatch, link: link, cost: cost})
          
        }
      }
      return matches
    }
  });

  Meteor.startup(function () {

    //import item db
    if(!Items.findOne()){
        _.each(Assets.getText("items.txt").split("\n"), function(item){
          Items.insert({name: item})
      })
    }

    if(!Maps.findOne()){
      //clean up old records
      Maps.remove({})
      Figures.remove({})

       var mapData = {}

      
      _.each(Assets.getText("zone_name_map.csv").split("\n"), function(l){
        var m = l.split("::");
        if(m.length==3)
          mapData[m[0].toLowerCase()] = {long_name: m[1], p99: parseInt(m[2])}
      })

      _.each(Assets.getText("zone_name_map_alt.csv").split("\n"), function(l){
        var m = l.split("::");
        if(m.length==2 && typeof mapData[m[0].toLowerCase()] == "object"){
          console.log('Alt name:' + m[1])
          mapData[m[0].toLowerCase()].long_name_alt = m[1]
        }
      })

      var mapFiles = Assets.getText("map_file_list.txt").split("\n")  

      _.each(mapFiles, function(mapName){
        var realMapName = mapName.replace(/_\d\.txt/, "").toLowerCase()
        var map = typeof mapData[realMapName] == "object" ? mapData[realMapName] : {long_name: realMapName, long_name_alt: realMapName, p99: 0}

        var mapId = Maps.findOne({name: realMapName}) ? Maps.findOne({name: realMapName})._id : Maps.insert({name: realMapName, long_name: map.long_name, long_name_alt: map.long_name_alt, p99: map.p99})
        console.log(realMapName + ' :: ' + mapId + ' :: ' + mapName )
        var mapFigures = Assets.getText("maps/"+mapName)
        _.each(mapFigures.split("\n"), function(data){
          if(data.match(/L /)){
           // console.log("line")
            var points = data.replace("L ", "").replace(/\s/,"").split(",")
            var figure = {map: realMapName, type: "line", x1: parseInt(points[0]), y1: parseInt(points[1]), z1: parseInt(points[2]), x2: parseInt(points[3]), y2: parseInt(points[4]), z2: parseInt(points[5]), r: parseInt(points[6]), g: parseInt(points[7]), b: parseInt(points[8])}
            Figures.insert(figure, function(){})
            //console.log(figure)
          }
          else if(data.match(/P /)){
            //console.log("point")
            var points = data.replace("P ", "").replace(/\s/,"").split(",")
            var figure = {map: realMapName, type: "label", x: parseInt(points[0]), y: parseInt(points[1]), z: parseInt(points[2]), r: parseInt(points[3]), g: parseInt(points[4]), b: parseInt(points[5]), font_size: parseInt(points[6]), label: points[7] }
            Figures.insert(figure, function(){})
          }
        })
        if(!Figures.findOne({map: realMapName})){
          Maps.remove({name: realMapName})
        }
      })
    }
  });
}
