var express = require('express');

var app = express();
var mongo = require('mongoskin');
var ObjectID = require('mongoskin').ObjectID;
var db = mongo.db('localhost:27017/dataHub?auto_reconnect', {safe: true});
var async = require('async');

var MetaData = db.collection('MetaData');
var Users = db.collection('Users');

var http = require('http');
var server = http.createServer(app);
var sio = require('socket.io');
var io = sio.listen(server);


app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use(express.static(__dirname + '/public'));
app.use(express.bodyParser());


var validateFile = function(file, metadata){
    //TODO: Implement actual file validation based on the format. Or maybe just validate on the client side?
    return true;
}

var doInsert = function(toInsert){
    MetaData.insert(toInsert, function(err, data){
        if (err){
           throw(err);
        } 
        var result = data[0];
        result['_id'] = result['_id'].toString();
        res.send('status': 'ok', 'dataId': result['_id']);
    });
}

var doInsertIfValid = function(metadata, file){
    
    isValidFile = validateFile(file, metadata);
    if(isValidFile){
        doInsert(toInsert, location);
    }
    else{
        res.send({'status': 'error', 'msg': 'invalid file at location' + req.body.link });
    }
}

var getFileThenInsertIfValid = function(hotlink, metadata){
    //TODO: Actually fetch the file for validation. The following two lines should happen in the callback to that file fetch.
    metadata['location'] = hotlink;
    doInsertIfValid(metadata, file);
}

var constructMetadataFromReq = function(req, isHotlinked){
    var tableTitle = req.body.tableTitle;
    var columnNames = req.body.columnNames;
    var uploaderId = req.body.userId;
    var rss = req.body.rss;
    var format = req.body.format;
    var tags = req.body.tags;
    var metadata =  {
                        'tableTitle': tableTitle,
                        'columnNames': columnNames,
                        'uploaderId': uploaderId,
                        'rss': rss,
                        'isHotLinked': isHotLinked,
                        'format': format,
                        'tags': tags
                    };
    return metadata
}


app.post('/uploadDataSetToStorage', function(req, res){
    
    var metadata = constructMetadataFromReq(req, false)
    //check if the user has permissions to use our s3 bucket, then upload the actual file to s3 after validating
    Users.findById(uploaderId, function(err, result){
        if(err){
            throw err;
        }
        user = result
        if (user.hasHostedUploadPermissions){            
            //TODO: asynchronously write the file to s3 in a streaming fashion
            //TODO: set the location to be a link to the s3 file
            toInsert['location'] = null
            doInsertIfValid(toInsert, file)
        }
        else{
            res.send({'status': 'error', 'msg' :'permission denied, hotlink instead'});
        }

    });
});



app.post('/addDataSetFromHotlink', function(req, res){
    var metadata = constructMetadataFromReq(req, true)
    //go to the location, check that there is an actual file of the specified format there
    getFileThenInsertIfValid(req.body.fileLocation , metadata)

});

app.post('/modifyMetaData', function(req, res){}

});


app.post('/findDataSets', function(req, res){
    
});

app.post('/getDataSet', function(req, res){
    
});