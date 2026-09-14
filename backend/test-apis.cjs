const http = require('http');

const postData = JSON.stringify({ mrp: "100" });
const options = {
  hostname: '127.0.0.1',
  port: 3001,
  path: '/api/verify',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Rules Engine API Response:', data);
  });
});
req.on('error', (e) => { console.error(`Problem with request: ${e.message}`); });
req.write(postData);
req.end();

const visionData = JSON.stringify({ image: "data:image/jpeg;base64,dummyBase64Data==" });
const visionOptions = {
  ...options,
  path: '/api/extract/vision',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(visionData)
  }
};
const vreq = http.request(visionOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Vision API Response:', data);
  });
});
vreq.on('error', (e) => { console.error(`Problem with request: ${e.message}`); });
vreq.write(visionData);
vreq.end();
