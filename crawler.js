var casper = require('casper').create();

if(!casper.cli.has(0)){
	casper.echo('Missing band name..');
	casper.exit();
}

var band = casper.cli.get(0);
var API_URL = 'http://localhost:3000';

var sanitize = function(val){
	return val.replace(/[^a-z0-9 '\(\)\.\-\_]/gi, '').replace(/\s/g,'\\ ').replace(/\(/g,'\\\(').replace(/\)/g,'\\\)');
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

casper.userAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.82 Safari/537.36');

casper.thenOpen('https://'+band+'.bandcamp.com/music', function() {
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
			var tmpTracks = casper.getGlobal('TralbumData').trackinfo;
			var tracks = [];
			for (var i = 0; i < tmpTracks.length; i++) {
				tracks.push({
					band: band,
					album: sanitize(album.split('/').pop()),
					title: sanitize(tmpTracks[i].title),
					url: tmpTracks[i].file['mp3-128'].replace(/^\/\//, 'http://')
				});
			}
			casper.open(API_URL+'/download', postHelper(tracks));
		});
	});	
});

// casper.on('remote.message', function(message) {
//     this.echo(message);
// });

casper.run();
