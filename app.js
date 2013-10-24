var express = require("express"),
	formidable = require("formidable"),
	passport = require("passport"),
	checksum = require("checksum"),
	util = require("util"),
	path = require("path"),
	fs = require("fs");

var app = express();

require("./app/auth");

app.configure(function(){
	app.use(passport.initialize());
	app.use(passport.session());
});

//unprotected path
app.all("/", function(req, res, next){
	res.send("ok");
});

//protected path - accepts get and post
app.all("/protected", passport.authenticate('token', { session: false }), function(req, res, next){
	res.send("ok");
})

//handle upload - using checksum to validate the files
app.post("/upload", passport.authenticate('token', { session: false }), function(req, res, next){
	
	var form = new formidable.IncomingForm();
	form.uploadDir = path.join(__dirname, "tmp");
	form.keepExtensions = true;
	
	//we want a check sum on each file received - using SHA1
	form.hash = "sha1";
	
	//FORMIDABLE parse the upload
	form.parse(req, function(err, fields, files) {
		//NOTE - ignoring fields, not useful in this example
		
		//iterate through the files and check the sum
		var arrFiles = [];
		//convert to array - but note the original id
		for(var id in files){files[id].id = id;arrFiles.push(files[id]);}
		var i = 0;
		var valid = true;
		
		//now start the validation phase, checking all the files
		(function checkNextFile(){
			if(i < arrFiles.length){
				var file = arrFiles[i++];
				var fileChecksum = req.query["checksum_files:"+file.id]
				
				checksum.file(file.path, function(err, sum){
					if(!(sum == file.hash && sum == fileChecksum)){
						//abort the upload
						abortUpload("Invalid checksum on file '"+id+"'");
					}else{
						checkNextFile();
					}
				});
			}else{
				completeUpload();
			}
		})();
		
		//After Validation
		
		//Upload completed successfully
		function completeUpload(cb){
			//so something useful with the images before we delete them - e.g. upload to S3 using knox
			deleteTempFiles(function(){
				res.send({status:"ok"});
			});
		}
		
		//Error - abort the upload
		function abortUpload(err){
			deleteTempFiles(function(){
				next("Aborted upload" + ((err) ? ": "+ err : ""));
			});
		}
		
		//Success or failure - we still need to clean up
		function deleteTempFiles(cb){
			var i = 0;
			(function deleteNextFile(){
				if(i < arrFiles.length){
					var file = arrFiles[i++];
					fs.unlink(file.path, function(err){
						//ignore errors - just log it
						if(err){console.error("error during clean up: ", err);}
						//next!
						deleteNextFile();
					});
				}else{
					cb();
				}
			})();
		}
    });
});

app.listen(4000);