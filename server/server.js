const express = require('express');
const app = express();

const cors = require('cors');
const google = require('googleapis');
const request = require('request');
const bodyParser = require('body-parser');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const FileReader = require('filereader')
const AutoMLURL = "https://alpha-vision.googleapis.com/v1/images:annotate"
const BucketURL = "https://www.googleapis.com/upload/storage/v1/b/custom-search-images/o?uploadType=media&name="
const http = require('http');
const https = require('https');
const key = require('../private/key.json');
//const key = process.env;

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
// Connection URL
const url = 'mongodb://<user>:<password>@ds117590.mlab.com:17590/tactile-graphics';
// Database Name
const dbName = 'tactile-graphics';

const spawn = require('threads').spawn;

//Socket config
const socketIO = require('socket.io')
const server = http.createServer(app)
const io = socketIO(server)


const Model1 = "projects/ml-for-tactile-graphics/models/Tactile_graphics/versions/Tactile_graphics_201802221336_base";
const Model1_1= "projects/ml-for-tactile-graphics/models/Tactile_graphics/versions/Tactile_graphics_201803091738_base";
const Model2 = "projects/ml-for-tactile-graphics/models/Tactile_graphics2/versions/Tactile_graphics2_201803091747_base";
const Model2_2 = "projects/ml-for-tactile-graphics/models/Tactile_graphics2/versions/Tactile_graphics2_201804061022_base";
const Model2_2_1 = "projects/ml-for-tactile-graphics/models/Tactile_graphics2/versions/Tactile_graphics2_201805101227_base";
const Model2_2_2 = "projects/ml-for-tactile-graphics/models/Tactile_graphics2/versions/Tactile_graphics2_201805111257_base";
const Model2_3 = "projects/ml-for-tactile-graphics/models/Tactile_graphics2/versions/Tactile_graphics2_Version_2_3";
//const currentModel = Model2_2;
const currentModel = Model2_3;

const storage = require('@google-cloud/storage');
const fs = require('fs')

const stream = require('stream');

//Hashmap
var map = {};
//Boolean hashmap already loaded?
var hashMapLoaded = false;
app.use(cors());


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var jwtClient = new google.google.auth.JWT(
  key.client_email,
  null,
  key.private_key,
  ['https://www.googleapis.com/auth/cloud-vision',"https://www.googleapis.com/auth/devstorage.read_write"], // an array of auth scopes
  null
);

const gcs = storage({
  projectId: 'ml-for-tactile-graphics',
  keyFilename: '../private/key.json'
});
const bucketName = 'custom-search-images'
const bucket = gcs.bucket(bucketName);
function getPublicUrl(filename) {
  return 'https://storage.googleapis.com/' + bucketName + '/' + filename;
  //return "gs://"+bucketName+"/"+filename
}



app.post('/predict', function(req, res, next) {

  //Get the image link
  var link = req.body.link;
  //Generate AutoML Token
  jwtClient.authorize(function (err, tokens) {
    if (err) {
      console.log(err);
      return;
    }
    var accessToken = tokens.access_token;
    autoMLRequest(accessToken, link, function(predictions){
      response = {"predictions":predictions}
      res.json(response);
    });
  });

  /*
  var results = {
    "url": link,
    "score": 0.9,
    "label": "Negative"
  }
  var response = {"predictions":results}
  res.json(response);*/

});

app.post('/upload', function(req, res, next) {

  //Get the image link
  console.log("Upload to bucket");
  var link = req.body.link;
  var label = req.body.label;
  var getDataPromise = getDataURLPromise(link);
  getDataPromise.then(base64Body =>{
    uploadToBucket(base64Body,label,(fileURL) => {
      console.log(fileURL);
      response = {"upload":fileURL};
      res.json(response);
    });
  });
});


app.post('/predictCustom', function(req, res, next) {

  //Get the image base64
  var base64 = req.body.base64.split(',')[1];
  var link = "No link";
  //Generate AutoML Token
  jwtClient.authorize(function (err, tokens) {
    if (err) {
      console.log(err);
      return;
    }
    var accessToken = tokens.access_token
    var autoMLrequestPromise = asyncRequest(accessToken, link, base64)
    autoMLrequestPromise.then(value =>{
      response = {"predictions":value}
      res.json(response);
    });
  });
});

//This function was used to upload images to bucket.
async function processArray(links) {
  var bucketLinks = [];
  console.log("Start processing array")
  for(const link of links) {
    await getDataURLPromise(link).then(function(result){
      bucketLinks.push(result)
    })
  }
  return bucketLinks;
}


asyncRequest = function(token, link, base64Body) {

  return new Promise(function(resolve, reject) {

    var requests = [{ "image": { "content": base64Body }, "features": [
          { "type": "CUSTOM_LABEL_DETECTION" }], "customLabelDetectionModels": [
          currentModel
        ],
      }];
    let options = {
      url: AutoMLURL,
      method: "POST",
      headers: {
        "Authorization": 'Bearer '+token,
        "Content-Type": "application/json"
      },
      json: {
        "requests": requests
      }
    };
    request(options, function(err, res, data) {
        console.log("AutoML Called")
        console.log("===========================================")
        //console.log(options)
        console.log("===========================================")
        if(err) {
          console.log('err', err)
        }
          if (!err && res.statusCode == 200) {
            console.log(res.body.responses)
            if (data.responses) {
              for(i = 0; i < data.responses.length; i++) {
                var customLabels = data.responses[i].customLabelAnnotations
                if (customLabels) {
                  var score = customLabels[0].score
                  var label = customLabels[0].label
                  var results = {
              			"url": link,
              			"score": score,
                    "label": label
              		}
                } else {
                  console.log("AutoML Error")
                }
              }
              resolve(results)
            } else {
              console.log("No responses")
            }
          }else {
            console.log(res.body)
            var empty = []
            resolve(empty)
          }
      }
    )
  });
}

autoMLRequest = function(token, link, callback) {
  var getDataPromise = getDataURLPromise(link);
  getDataPromise.then(base64Body =>{
    var autoMLrequestPromise = asyncRequest(token, link, base64Body)
    autoMLrequestPromise.then(value =>{
      console.log(value);
      callback(value);
    });
  });
}


getDataURLPromise = function(url) {
  return new Promise(function(resolve, reject) {
    console.log("getDataCalled");
    var client = http;
    if (url.indexOf("https") === 0){
      client = https;
    }
    client.get(url, (resp) => {
      resp.setEncoding('base64');
      var body = ""
      resp.on('data', (data) => { body += data});
      resp.on('end', () => {
        var byteLength = parseInt((body).replace(/=/g,"").length * 0.75);
        console.log(byteLength);
        resolve(body);
      });
    }).on('error', (e) => {
        console.log(`Got error: ${e.message}`);
        reject(Error("It broke"));
    });
  });
}

//This function was used to upload images to bucket.
uploadToBucket = function(data,label, callback){
  var bufferStream = new stream.PassThrough();
  bufferStream.end(new Buffer(data, 'base64'));

  var date = Date.now()
  var fileName = label+"/"+date+".jpg";
  var file = bucket.file(fileName);
  bufferStream.pipe(file.createWriteStream({
    metadata: {
      contentType: 'image/jpeg',
      metadata: {
        custom: 'metadata'
      }
    },
    public: true,
    validation: "md5"
  }))
  .on('error', function(err) {console.log(err)})
  .on('finish', function() {
    // The file upload is complete.
    bufferStream = null
    var fileURL = getPublicUrl(fileName)
    callback(fileURL)
  });
}


//----------------Feedback--------------------

app.post('/feedback',function(req,res,next)
{
  // Use connect method to connect to the server
  MongoClient.connect(url, function(err, client) {
    //assert.equal(null, err);
    if(err !== null){
      console.log(err)
    } else{
      console.log("Connected successfully to server");
      const db = client.db(dbName);
      insertDocuments(db, req.body.feedback, function() {
        client.close();
      });
    }
  });
  res.send('OK');
});

// ------------------- MongoDB Functions --------------------------

insertDocuments = function(db, value, callback) {
  // Get the documents collection
  const collection = db.collection('feedback');
  // Insert some documents
  collection.insert({feedback : value}, function(err, result) {
    if(err !== null){
      console.log(err);
    } else{
      console.log("Inserted feedback into the collection");
      callback(result);
    }
  });
}

insertHashMap = function(db, value, callback) {
  // Get the documents collection
  const collection = db.collection('hashMap');
  // Insert some documents
  collection.insert({hashMap : value}, function(err, result) {
    if(err !== null){
      console.log(err);
    } else{
      console.log("Inserted feedback into the collection");
      callback(result);
    }
  });
}
findHashMap = function(db, callback) {
  // Get the documents collection
  const collection = db.collection('hashMap');
  // Find some documents
  collection.find({}).toArray(function(err, docs) {
    if(err !== null){
      console.log(err);
    }
    console.log("Found map");
    callback(docs);
  });
}

updateMap = function(db, callback) {
  // Get the documents collection
  const collection = db.collection('hashMap');
  // Update document where a is 2, set b equal to 1
  collection.updateOne({ a : 2 }
    , { $set: { b : 1 } }, function(err, result) {
    if(err !== null){
      console.log(err);
    }
    //console.log(result);
    //assert.equal(1, result.result.n);
    console.log("Updated the document");
    callback(result);
  });
}

removeHashMap = function(db, callback) {
  // Get the documents collection
  const collection = db.collection('hashMap');
  // Delete document where a is 3
  collection.remove({}, function(err, result) {
    if(err !== null){
      console.log(err);
    }
    //assert.equal(1, result.result.n);
    console.log("Removed the document");
    callback(result);
  });
}


//--------------TEST----------------

app.post('/testTime', function(req, res, next) {

  var link = req.body.link;
  console.log("test time");
/*  var getDataPromise = getDataURLPromise(link);
  getDataPromise.then(base64Body =>{
    console.log("Done");
    res.json("Done");
  });*/
  const thread = spawn(function ([a, b]) {
    // Remember that this function will be run in another execution context.
    return new Promise(resolve => {
      console.log("Called");
      var random = Math.floor(Math.random() * (10000 - 1000 + 1)) + 1000
      setTimeout(() => resolve(a + b), random)
    })
  });
  thread
  .send([ 9, 12 ])
  // The handlers come here: (none of them is mandatory)
  .on('message', function(response) {
    console.log('9 + 12 = ', response);
    res.json("Done");
    thread.kill();
  });
});

io.on('connection', socket => {
  console.log('New client connected')

  socket.on('predict', (body) => {
    var link = body.link;
    var sourceLink = body.sourceLink;
    if(!hashMapLoaded){
      console.log('Loading hashmap on predict');
      MongoClient.connect(url, function(err, client) {
        //assert.equal(null, err);
        if(err !== null){
          console.log(err)
        } else{
          console.log("Connected successfully to server");
          const db = client.db(dbName);
          findHashMap(db, function(docs) {
            if(docs[0] != undefined){
              if(docs[0].hashMap != undefined && docs[0].hashMap != null){
                map = docs[0].hashMap;
                console.log("----------------------------------------------");
                console.log("------------------HASHMAP---------------------");
                console.log("----------------------------------------------");
                console.log(map);
                hashMapLoaded = true;
              }
            }
            client.close();
          });
        }
      });
    }
    if(map[sourceLink] != null){
      //Query is in the hashmap
      var value = map[sourceLink];
      var extendedValue = Object.assign({}, value);
      extendedValue.url = link;
      var response = {"predictions": extendedValue}
      io.sockets.emit('response', response);

    } else{
      //Query is not in the hashmap
      //Generate AutoML Token
      jwtClient.authorize(function (err, tokens) {
        if (err) {
          console.log(err);
          return;
        }
        var accessToken = tokens.access_token;
        autoMLRequest(accessToken, link, function(predictions){
          if(predictions != null && predictions != undefined){
            predictions.sourceLink = sourceLink;
          }
          var response = {"predictions":predictions}
          io.sockets.emit('response', response);
          console.log("Response sent");
          if(predictions != null && predictions != undefined){
            if(predictions.score != null && predictions.score != undefined){
              //Add response to Hashmap
              var value = {
                score: predictions.score,
                label: predictions.label,
                sourceLink: sourceLink
              };
              map[sourceLink] = value;
              map['length'] = 1;
            }
          }
        });
      });
    }
  });

  socket.on('wakeUp', () => {
    if(!hashMapLoaded){
      console.log('Loading map in wakeUp');
      //Load hashMap
      MongoClient.connect(url, function(err, client) {
        //assert.equal(null, err);
        if(err !== null){
          console.log(err)
        } else{
          console.log("Connected successfully to server");
          const db = client.db(dbName);
          findHashMap(db, function(docs) {
            if(docs[0] != undefined){
              if(docs[0].hashMap != undefined && docs[0].hashMap != null){
                map = docs[0].hashMap;
                console.log("----------------------------------------------");
                console.log("------------------HASHMAP---------------------");
                console.log("----------------------------------------------");
                console.log(map);
                hashMapLoaded = true;
              }
            }
            client.close();
          });
        }
      });

    }
  });

  // disconnect is fired when a client leaves the server
  socket.on('disconnect', () => {
    console.log('user disconnected')
    //Save hashMap to Database
    MongoClient.connect(url, function(err, client) {
      //assert.equal(null, err);
      if(err !== null){
        console.log(err)
      } else{
        console.log("Connected successfully to server");
        const db = client.db(dbName);
        findHashMap(db, function(docs) {
          if(docs[0] != undefined){
            if(docs[0].hashMap != undefined && docs[0].hashMap != null && map.length != undefined ){
              //There is hashmap in database, should update.
              console.log('Should update');
              removeHashMap(db,function(result){
                //console.log(result);
                insertHashMap(db, map, function() {
                  client.close();
                });
              });
            }
          } else if(map.length != undefined ){
            //There is not hash in db should create
            console.log('Should create');
            insertHashMap(db, map, function() {
              client.close();
            });
          } else{
            console.log('Dont do anything');
            console.log(map);
            client.close();
          }
        });
      }
    });
  });
})


server.listen(3333, () => console.log('Listening on localhost:3333'))

//const server = app.listen(3333);
//console.log('Listening on localhost:3333');
//server.timeout = 300000;
