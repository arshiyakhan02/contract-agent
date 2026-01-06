
const fs = require('fs');
const path = require('path');
const http = require('http');

// create a dummy pdf
const filePath = path.join(__dirname, 'test-upload.pdf');
fs.writeFileSync(filePath, 'dummy pdf content');

const boundary = '--------------------------' + Date.now().toString(16);

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/storage/upload',
    method: 'POST',
    headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

// Construct the multipart body
const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test-upload.pdf"\r\nContent-Type: application/pdf\r\n\r\n`;
const footer = `\r\n--${boundary}--`;
const fileContent = fs.readFileSync(filePath);

req.write(header);
req.write(fileContent);
req.write(footer);
req.end();
