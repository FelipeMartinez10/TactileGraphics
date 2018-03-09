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


async function getBucketElements(links,callback) {
  var bucketLinks = []
  for(const link of links) {
    await getDataURL(link, function(url){
      console.log("proccessing")
      bucketLinks.push(url)
    })
  }
  callback(bucketLinks)
}

autoMLRequest = function(token, links, callback) {

  //JUST FOR TESTING:
  //links = "http://moziru.com/images/hosue-clipart-line-drawing-20.jpg"

  var bucketLinks = getBucketElements(links, function(bucketLinks){
    console.log(bucketLinks)
  })



/*

  var requests = []
  for (i = 0; i < links.length; i++) {
    requests.push(
      {
      "image": {
        "source": {
          "imageUri": links[i]
        }
      },
      "features": [
        {"type": "CUSTOM_LABEL_DETECTION", "maxResults": 10 }
      ],
      "customLabelDetectionModels":
          "projects/ml-for-tactile-graphics/models/Tactile_graphics/versions/Tactile_graphics_201802221336_base"
    });
  }

  var requestsJSON = JSON.stringify(requests);
  let options = {
    url: AutoMLURL,
    method: "POST",
    headers: {
      "Authorization": 'Bearer '+token
    },
    json: {
      "requests": requests
    }
  };
  request(options,
    function(err, res, data) {
      console.log("AutoML Called")
      console.log("===========================================")
      console.log(options)
      console.log("===========================================")
      if(err) {
        console.log('err', err)
      }
        if (!err && res.statusCode == 200) {
          console.log(data.responses)
          if (data.responses) {
            var results = []
            for(i = 0; i < data.responses.length; i++) {
              var customLabels = data.responses[i].customLabelAnnotations
              if (customLabels) {
                var score = customLabels[0].score
                results.push({
            			"url": links[i],
            			"score": score
            		})
              } else {
                console.log("AutoML Error")
              }
            }
            callback(results)
          } else {
            console.log("No responses")
          }
        }else {
          console.log(res)
        }
    }
  )
*/
}



getDataURL = function(url,callback) {
  var client = http;
  // You can use url.protocol as well
  //console.log(url)
  if (url.indexOf("https") === 0){
    client = https;
  }
  client.get(url, (resp) => {
    resp.setEncoding('base64');
    body = ""
    resp.on('data', (data) => { body += data});
    resp.on('end', () => {
          uploadToBucket(body, function(url){
          callback(url)
        })
    });
  }).on('error', (e) => {
      console.log(`Got error: ${e.message}`);
  });
}

uploadToBucket = function(data, callback){
  var bufferStream = new stream.PassThrough();
  bufferStream.end(new Buffer(data, 'base64'));

  var date = Date.now()
  var fileName = date+"_custom_search.jpg"
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
  .on('error', function(err) {})
  .on('finish', function() {
    // The file upload is complete.
    bufferStream = null
    var fileURL = getPublicUrl(fileName)
    callback(fileURL)
  });
}




app.listen(3333);
console.log('Listening on localhost:3333');
