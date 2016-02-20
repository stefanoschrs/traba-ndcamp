const exec 		= require('child_process').exec;
const express 	= require('express')
const fs 		= require('fs');
const app 		= express()

var port = process.env.PORT || 3000;

app.use(require('body-parser').json())

app.post('/download', function (req, res) {
	req.body.forEach((el)=>{
		download(el)
		.then(()=>{
			console.log(`${el.title} Downloaded Successfully!`);
		}, (err)=>{
			console.log(err);
		});
	});
	res.sendStatus(200);
})
 
app.listen(port, ()=>{	
	mkdirForce('data', (err)=>{
		console.log(`Server listening on port ${port}`)
	});
})

function mkdirForce(path, done) {
    fs.mkdir(path, (err)=>{
        if(err && err.code !== 'EEXIST') return done(err);

    	done(null);
    });
}

function download(track){
	return new Promise((resolve, reject)=>{
		mkdirForce(`data/${track.band}`, (err)=>{
			if(err) return reject(err);

			mkdirForce(`data/${track.band}/${track.album}`, (err)=>{
				if(err) return reject(err);

				fs.stat(`data/${track.band}/${track.album}/${track.title}.mp3`, (err, file)=>{
					if(file) return console.log(`${track.title} already downloaded`);

					console.log(`Downloading ${track.title}`)
					exec(`wget --output-document data/${track.band}/${track.album}/${track.title}.mp3 '${track.url}'`, (error, stdout, stderr) => {
						return error ? reject(error) : resolve();
					});
				});				
			});
		});		
	});
}