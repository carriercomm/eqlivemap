if (Meteor.isClient) {
  
  Handlebars.registerHelper('player',function(input){
    return Session.get("player");
  });
  
  Template.nav.maps = function () {
    return Maps.find({}).fetch()
  };

  Template.map.rendered = function () {
    Deps.autorun(function () {
      drawMap()
    });
  };

  Template.nav.events({
    'click [rel="map"]' : function (event, template) {
      var map = event.currentTarget.getAttribute('data-map-name')
      Session.set("map", map)
    }
  })

  switchMap = function(){
    if(Session.get("player")){
      player = Players.findOne({_id:Session.get("player")})
      if(player && player.map){
        Router.go('map', {name:player.map});  
      }
      
    }
  }

  // Function that redraws the entire canvas from shapes in Meteor.Collection
  drawMap = function(data) {
    var canvas = document.getElementById('map-canvas');
    var figures = Figures.find().fetch()
    var players = Players.find().fetch()
    if(typeof canvas == "object" && canvas && typeof canvas.getContext == "function"){
     
      var ranges = {x:{min:0,max:0}, y:{min:0,max:0}}
      _.reduce(figures, function(ranges, f){
        if(f.type != "line")
          return ranges
          ranges.x.min = _.min([ranges.x.min, f.x1, f.x2])
          ranges.y.min = _.min([ranges.y.min, f.y1, f.y2])
          ranges.x.max = _.max([ranges.x.max, f.x1, f.x2])
          ranges.y.max = _.max([ranges.y.max, f.y1, f.y2])
       return ranges 
     }, ranges);

      var width = ranges.x.max - ranges.x.min,
          height = ranges.y.max - ranges.y.min,
          aspect = width/height

        canvas.width = $('section.map').width()
        canvas.height = $('section.map').height()  

      var scaleX = canvas.width / width * 0.95,
          scaleY = canvas.height / height * 0.95
      
          scaleX = _.min([scaleX, scaleY])
          scaleY = scaleX

      var context = canvas.getContext('2d');
      context.save()
      context.clearRect(0, 0, canvas.width, canvas.height);

          context.font = '10pt Calibri';
          context.fillStyle = "rgba(0,0,0,1)"
         // context.fillText("Dimensions: " + width + " x " + height,10,40);
         // context.fillText("Aspect: " + aspect.toFixed(2),10,60);
         // context.fillText("Scale: " + scaleX.toFixed(2) + " x " + scaleY.toFixed(2),10,80);
          
          context.translate(-ranges.x.min*scaleX,-ranges.y.min*scaleY)
          
          context.scale(scaleX, scaleY)
          //ranges.x.min = ranges.x.min-1500
          //ranges.y.min = ranges.y.min-500
          var fontscale = width/3000*40
          context.font = parseInt(20*fontscale) + 'pt Calibri';
          if(scaleX < 0.1)
            context.lineWidth = 15;
          else if(scaleX < 0.2)
            context.lineWidth = 6;
          else
            context.lineWidth = 1;

      _.each(figures, function(f){
           //console.log(f)
           if(f.type == "line"){
             context.beginPath();
             context.moveTo((f.x1), (f.y1));
             context.lineTo((f.x2), (f.y2));
             context.strokeStyle = "rgba("+f.r+","+f.g+","+f.b+",1)"
             context.stroke();
           }
           else if(f.type == "label"){
              //console.log(f)
              context.font = parseInt(fontscale) + 'pt Calibri';
              context.fillStyle = "rgba("+f.r+","+f.g+","+f.b+",1)"
              context.fillStyle = "rgba(0,0,0,1)"
              context.fillText(f.label.replace(/_/g," "),f.x,f.y);
           }
         })

      _.each(players, function(p){
        context.font = parseInt(fontscale) + 'pt Calibri';
        context.fillStyle = "rgba(0,0,255,1)"
        context.fillText(p.name,p.x,p.y-parseInt(2*fontscale));
        context.font = parseInt(fontscale*1.5) + 'pt Calibri';
        context.fillText("o",p.x,p.y-fontscale);
      })

      context.restore()
    }
  }
  Meteor.startup(function() {
   if(localStorage.getItem("player")) {
    Session.set("player", localStorage.getItem("player"));
   }
   else{
    Meteor.call("readyPlayerOne", function(err,resp){
      localStorage.setItem("player", resp)
      Session.set("player", localStorage.getItem("player"));
    })
   }
    


    $(window).resize(function(e) {
      drawMap()
    });

    Deps.autorun(function () {
      switchMap()
    });
  })
}