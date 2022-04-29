// imports
const express = require("express");
const bodyParser = require("body-parser")
const fs = require("fs");
const app = express()

app.use(bodyParser.urlencoded({
  extended:true
})); 

require("dotenv").config();

var pause = false
var slowed = false

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

app.get("/video", function (req, res) {
    // Ensure there is a range given for the video
    const range = req.headers.range;
    if (!range) {
      res.status(400).send("Requires Range header");
    }
  
    // get video stats
    const videoPath = process.env.VIDEO_PATH;
    const videoSize = fs.statSync(videoPath).size;
  
    // Parse Range
    var CHUNK_SIZE = 10 ** 5 // 1MB
    if (slowed) {
      if (CHUNK_SIZE > 10) {
        CHUNK_SIZE = CHUNK_SIZE / 10 
      }
    } else {
      CHUNK_SIZE = CHUNK_SIZE * 10
    }
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
  
    // Create headers
    const contentLength = end - start + 1;
    const headers = {
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": "video/mp4",
    };
  
    // HTTP Status 206 for Partial Content
    res.writeHead(206, headers);
  
    // create video read stream for this particular chunk
    const videoStream = fs.createReadStream(videoPath, { start, end });
    videoStream.pipe(res);
    videoStream.on('data', (chunk) => {
      console.log(`Received ${chunk.length} bytes of data.`);
    });

    if (pause) {
      videoStream.pause()
      console.log("paused")
      setTimeout(() => {
        videoStream.resume()
        pause = false
        console.log("resumed")
      }, 10000);
    }
    
  });

app.post('/', (req, res) => {
  data = req.body
  if (data.name == "Pause") {
    pause = true
  } else if (data.name == "Slow") {
    slowed = true
  } else if (data.name == "Fast") {
    slowed = false
  }
});

app.listen(process.env.PORT, function() {
    console.log(`Listening on port ${process.env.PORT}...`);
});

