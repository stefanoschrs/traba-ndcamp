var system = require('system');
var casper = require('casper').create();

if(!casper.cli.has(0)){
	casper.echo('Missing band name..');
	casper.exit();
}

var band = casper.cli.get(0);
var API_URL = system.env.API_URL || 'http://localhost:3000';

var sanitize = function(val){
	return val
		.replace(/[^a-z0-9 '\(\)\.\-\_]/gi, '')
		.replace(/\s/g,'\\ ')
		.replace(/'/g,'\\\'')
		.replace(/\(/g,'\\\(')
		.replace(/\)/g,'\\\)');
}

var postHelper = function(data){
	return {
		method: 'post',
		data: JSON.stringify(data),
		encoding: 'utf-8',
		headers: {
			'Accept':'application/json',
			'Content-Type':'application/json; charset=utf-8'
		}
	};
};

casper.start();

casper.echo('Starting '+band+' analysis!');

casper.userAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.82 Safari/537.36');

casper.thenOpen('https://'+band+'.bandcamp.com/music', function() {
	if(!this.getPageContent().match(band)){
		casper.echo('Band not found, sorry.. Did you copy the correct name? e.g For https://kostispoutakazia.bandcamp.com you need to run ./download kostispoutakazia');
		return casper.exit();
	}

	var albums = this.evaluate(function(){
		var tmp = document.querySelectorAll('a[href*="/album"]');
		var albums = [];
		for (var i = 0; i < tmp.length; i++) {
			var href = tmp[i].getAttribute('href');
			if(albums.indexOf(href) === -1) albums.push(href);
		}
		return albums;
	});	
	this.each(albums, function(self, album){
		this.thenOpen('https://'+band+'.bandcamp.com'+album, function(){
			var tmpTracks = (casper.getGlobal('TralbumData') || {}).trackinfo;
			var tmpTrackSet = [];
			var tracks = [];
			for (var i = 0; i < tmpTracks.length; i++) {
				var track = {
					band: band,
					album: sanitize(album.split('/').pop()),
					title: sanitize(tmpTracks[i].title),
					url: tmpTracks[i].file['mp3-128'].replace(/^\/\//, 'http://')
				};
				if(tmpTrackSet.indexOf(track.title) !== -1) continue;
				tracks.push(track);
				tmpTrackSet.push(track.title);
			}
			if(tracks.length){
				casper.open(API_URL+'/download', postHelper(tracks));
				casper.echo('Album '+album.split('/').pop()+' extracted! ('+tracks.length+' tracks)');
			}
		});
	});	
});

// casper.on('remote.message', function(message) {
//     this.echo(message);
// });

casper.run();
