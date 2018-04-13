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
//const key = require('../private/key.json');
const key = procces.env;


const Model1 = "projects/ml-for-tactile-graphics/models/Tactile_graphics/versions/Tactile_graphics_201802221336_base";
const Model1_1= "projects/ml-for-tactile-graphics/models/Tactile_graphics/versions/Tactile_graphics_201803091738_base";
const Model2 = "projects/ml-for-tactile-graphics/models/Tactile_graphics2/versions/Tactile_graphics2_201803091747_base";
const Model2_2 = "projects/ml-for-tactile-graphics/models/Tactile_graphics2/versions/Tactile_graphics2_201804061022_base";
const currentModel = Model2_2;

const storage = require('@google-cloud/storage');
const fs = require('fs')

const stream = require('stream');



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

  var links = req.body.links;

  jwtClient.authorize(function (err, tokens) {
    if (err) {
      console.log(err);
      return;
    }
    var accessToken = tokens.access_token
    //console.log(accessToken)
    autoMLRequest(accessToken, links,function(predictions){
      response = {"predictions":predictions}
      res.json(response);
    })
  });
});



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

asyncRequests = function(token, link, bucketLink) {

  return new Promise(function(resolve, reject) {
    var requests = [
      {
        "image": {
          "content": bucketLink
        },
        "features": [
          {
            "type": "CUSTOM_LABEL_DETECTION"
          }
        ],
        "customLabelDetectionModels": [
          currentModel
        ],
      }
      ];
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

    request(options,
      function(err, res, data) {
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

autoMLRequest = function(token, links, callback) {

  //JUST FOR TESTING:
  //links = "http://moziru.com/images/hosue-clipart-line-drawing-20.jpg"
  var bucketPromises = [];
  for (i = 0; i < links.length; i++) {
     bucketPromises.push(getDataURLPromise(links[i]));
  }
  Promise.all(bucketPromises).then(bucketLinks =>{
    var promises = [];
    var results = [];
    for (i = 0; i < bucketLinks.length; i++) {
      promises.push(asyncRequests(token, links[i], bucketLinks[i]));
    }
    Promise.all(promises).then(values => {
      console.log("Values");
      console.log(values);
      callback(values);
    });
  });
}


getDataURLPromise = function(url) {

  return new Promise(function(resolve, reject) {
    //resolve(url);

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
          /*  uploadToBucket(body, function(url){
              console.log("getDataEnd");
              resolve(url)
          })*/
          resolve(body);
      });
    }).on('error', (e) => {
        console.log(`Got error: ${e.message}`);
        reject(Error("It broke"));
    });
  });
}


uploadToBucket = function(data, callback){
  var bufferStream = new stream.PassThrough();
  bufferStream.end(new Buffer(data, 'base64'));

  var date = Date.now()
  var fileName = date+"_custom_search"
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




const server = app.listen(3333);
console.log('Listening on localhost:3333');
server.timeout = 300000;
