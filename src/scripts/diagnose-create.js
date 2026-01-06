
const http = require('http');

const data = JSON.stringify({
    patientData: {
        name: "Test User",
        email: "test@example.com",
        price: "150.00"
    },
    templateName: "standard-template.pdf"
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/webhooks/init-contract',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('Sending request to', options.path);

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', (d) => {
        process.stdout.write(d);
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(data);
req.end();
