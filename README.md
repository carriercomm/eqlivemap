Everquest Live Map
=========

A reactive mapping website for classic everquest servers done in meteor js.

When passed a player id that matches the current session a maps of the entire Everquest world can be drawn and player position annotated semi-automatically.

This website makes use of an AutoIt helper program to monitor log files and make the http requests on windows and can easily be made to work on mac/linux with a small shell script.


###Getting Started###
Visit http://eqlivemap.meteor.com

Copy the unique player id that will be generated for you

Download the helper app http://eqlivemap.meteor.com/eqlivemap.zip and run it.  Paste in your player id and choose your Everquest log folder.  Hit GO.

In game in Everquest ensure logging is enabled by typing /log on.  

Now watch the page http://eqlivemap.meteor.com as you zone, type /who and type /loc in game in everquest.
