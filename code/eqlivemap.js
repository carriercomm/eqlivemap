if (Meteor.isClient) {
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
  // Function that redraws the entire canvas from shapes in Meteor.Collection
  drawMap = function() {
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

      var scaleX = canvas.width / width,
          scaleY = canvas.height / height
      
          scaleX = _.min([scaleX, scaleY])
          scaleY = scaleX

      var context = canvas.getContext('2d');
      context.save()
      context.clearRect(0, 0, canvas.width, canvas.height);

          context.font = '10pt Calibri';
          context.fillStyle = "rgba(0,0,0,1)"
          context.fillText("Dimensions: " + width + " x " + height,10,40);
          context.fillText("Aspect: " + aspect.toFixed(2),10,60);
          context.fillText("Scale: " + scaleX.toFixed(2) + " x " + scaleY.toFixed(2),10,80);
          
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

  })
}

if (Meteor.isServer) {
  
  Meteor.publish("maps", function () {
    return Maps.find({});
  });

  Meteor.publish("figures", function (mapName) {
    return Figures.find({map:mapName});
  });

  Meteor.publish("players", function (mapName) {
    return Players.find({map:mapName});
  });

  Meteor.publish("mapAndFigures", function(mapName){
    return [
      Maps.find({name: mapName}),
      Figures.find({map: mapName})
    ]
  })

  Meteor.startup(function () {
    Players.remove({})
    Players.insert({map: "timorous", name:"jrox", x:-1390, y:3256, z:280})

    if(!Maps.findOne()){
      //clean up old records
      Maps.remove({})
      Figures.remove({})

      // code to run on server at startup
      var mapList = ["airplane_1.txt", "airplane_2.txt", "akanon_1.txt", "akanon_2.txt", "apprentice_2.txt", "arena_1.txt", "arena_2.txt", "arttest_2.txt", "aviak_2.txt", "befallen_1.txt", "befallen_2.txt", "beholder_1.txt", "beholder_2.txt", "blackburrow_1.txt", "blackburrow_2.txt", "burningwood_1.txt", "burningwood_2.txt", "butcher_1.txt", "butcher_2.txt", "cabeast_1.txt", "cabeast_2.txt", "cabwest_1.txt", "cabwest_2.txt", "cauldron_1.txt", "cauldron_2.txt", "cazicthule_1.txt", "cazicthule_2.txt", "charasis_1.txt", "charasis_2.txt", "chardok_1.txt", "chardok_2.txt", "citymist_1.txt", "citymist_2.txt", "cobaltscar_1.txt", "cobaltscar_2.txt", "crushbone_1.txt", "crushbone_2.txt", "crystal_1.txt", "crystal_2.txt", "dalnir_1.txt", "dalnir_2.txt", "dreadlands_1.txt", "dreadlands_2.txt", "droga_1.txt", "droga_2.txt", "eastkarana_1.txt", "eastkarana_2.txt", "eastwastes_1.txt", "eastwastes_2.txt", "emeraldjungle_1.txt", "emeraldjungle_2.txt", "erudnext_1.txt", "erudnext_2.txt", "erudnint_1.txt", "erudnint_2.txt", "erudsxing2_2.txt", "erudsxing_1.txt", "erudsxing_2.txt", "everfrost_1.txt", "everfrost_2.txt", "fearplane_1.txt", "fearplane_2.txt", "feerrott_1.txt", "feerrott_2.txt", "felwithea_1.txt", "felwithea_2.txt", "felwitheb_1.txt", "felwitheb_2.txt", "fieldofbone_1.txt", "fieldofbone_2.txt", "firiona_1.txt", "firiona_2.txt", "frontiermtns_1.txt", "frontiermtns_2.txt", "frozenshadow_1.txt", "frozenshadow_2.txt", "gfaydark_1.txt", "gfaydark_2.txt", "greatdivide_1.txt", "greatdivide_2.txt", "grobb_1.txt", "grobb_2.txt", "growthplane_1.txt", "growthplane_2.txt", "gukbottom_1.txt", "gukbottom_2.txt", "guktop_1.txt", "guktop_2.txt", "halas_1.txt", "halas_2.txt", "hateplane_1.txt", "hateplane_2.txt", "hateplaneb_1.txt", "hateplaneb_2.txt", "highkeep_1.txt", "highkeep_2.txt", "highpass_1.txt", "highpass_2.txt", "hole_1.txt", "hole_2.txt", "iceclad_1.txt", "iceclad_2.txt", "innothule_1.txt", "innothule_2.txt", "innothuleb_1.txt", "innothuleb_2.txt", "kael_1.txt", "kael_2.txt", "kaesora_1.txt", "kaesora_2.txt", "kaladima_1.txt", "kaladima_2.txt", "kaladimb_1.txt", "kaladimb_2.txt", "karnor_1.txt", "karnor_2.txt", "kedge_1.txt", "kedge_2.txt", "kerraridge_1.txt", "kerraridge_2.txt", "kithicor_1.txt", "kithicor_2.txt", "kurn_1.txt", "kurn_2.txt", "lakeofillomen_1.txt", "lakeofillomen_2.txt", "lakerathe_1.txt", "lakerathe_2.txt", "lavastorm_1.txt", "lavastorm_2.txt", "lfaydark_1.txt", "lfaydark_2.txt", "mischiefplane_1.txt", "mischiefplane_2.txt", "mistmoore_1.txt", "mistmoore_2.txt", "misty_1.txt", "misty_2.txt", "najena_1.txt", "najena_2.txt", "necropolis_1.txt", "necropolis_2.txt", "nedaria_1.txt", "nedaria_2.txt", "nektropos_2.txt", "nektulos_1.txt", "nektulos_2.txt", "neriaka_1.txt", "neriaka_2.txt", "neriakb_1.txt", "neriakb_2.txt", "neriakc_1.txt", "neriakc_2.txt", "neriakd_2.txt", "northkarana_1.txt", "northkarana_2.txt", "nurga_1.txt", "nurga_2.txt", "oggok_1.txt", "oggok_2.txt", "oot_1.txt", "oot_2.txt", "overthere_1.txt", "overthere_2.txt", "paineel_1.txt", "paineel_2.txt", "paw_1.txt", "paw_2.txt", "permafrost_1.txt", "permafrost_2.txt", "qcat_1.txt", "qcat_2.txt", "qey2hh1_1.txt", "qey2hh1_2.txt", "qeynos2_1.txt", "qeynos2_2.txt", "qeynos_2.txt", "qeytoqrg_1.txt", "qeytoqrg_2.txt", "qrg_1.txt", "qrg_2.txt", "rathemtn_1.txt", "rathemtn_2.txt", "rivervale_1.txt", "rivervale_2.txt", "runnyeye_1.txt", "runnyeye_2.txt", "sebilis_1.txt", "sebilis_2.txt", "shadowrest_1.txt", "shadowrest_2.txt", "sirens_1.txt", "sirens_2.txt", "skyfire_1.txt", "skyfire_2.txt", "skyshrine_1.txt", "skyshrine_2.txt", "sleeper_1.txt", "sleeper_2.txt", "soldunga_1.txt", "soldunga_2.txt", "soldungb_1.txt", "soldungb_2.txt", "soltemple_1.txt", "soltemple_2.txt", "southkarana_1.txt", "southkarana_2.txt", "steamfont_1.txt", "steamfont_2.txt", "stonebrunt_1.txt", "stonebrunt_2.txt", "swampofnohope_1.txt", "swampofnohope_2.txt", "templeveeshan_1.txt", "templeveeshan_2.txt", "thurgadina_1.txt", "thurgadina_2.txt", "thurgadinb_1.txt", "thurgadinb_2.txt", "timorous_1.txt", "timorous_2.txt", "tox_1.txt", "tox_2.txt", "trakanon_1.txt", "trakanon_2.txt", "tutoriala_1.txt", "tutoriala_2.txt", "tutorialb_1.txt", "tutorialb_2.txt", "unrest_1.txt", "unrest_2.txt", "veeshan_1.txt", "veeshan_2.txt", "veksar_1.txt", "veksar_2.txt", "velketor_1.txt", "velketor_2.txt", "wakening_1.txt", "wakening_2.txt", "warrens_1.txt", "warrens_2.txt", "warslikswood_1.txt", "warslikswood_2.txt", "westwastes_1.txt", "westwastes_2.txt"]
      
      _.each(mapList, function(mapName){
        var realMapName = mapName.replace(/_\d\.txt/, "")
        var mapId = Maps.findOne({name: realMapName}) ? Maps.findOne({name: realMapName})._id : Maps.insert({name: realMapName})
        console.log(realMapName + ' :: ' + mapId + ' :: ' + mapName )
        var mapData = Assets.getText("maps/"+mapName)
        _.each(mapData.split("\n"), function(data){
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
      })
    }
  });
}
