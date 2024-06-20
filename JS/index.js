'use strict';

const http = require('http');
const fs = require('fs');
const url = require('url');
const path = require('path');

///////////////////////////////////////
// Data And Reading Files

const overviewTemp = fs.readFileSync(`${__dirname}/../index.html`, 'utf-8');

const carTemp = fs.readFileSync(
  `${__dirname}/../templates/car_template.html`,
  'utf-8'
);

const carStyle = fs.readFileSync(`${__dirname}/../styles/style.css`, 'utf-8');
const modelStyle = fs.readFileSync(
  `${__dirname}/../styles/car-page.css`,
  'utf-8'
);

const modelTemp = fs.readFileSync(
  `${__dirname}/../templates/about_car_template.html`,
  'utf-8'
);

const data = fs.readFileSync(`${__dirname}/../data/data.json`, 'utf-8');
const dataObj = JSON.parse(data);

const htmlHeaders = { 'Content-type': 'text/html' };
const jsonHeaders = { 'Content-type': 'application/json' };

///////////////////////////////////////
// Handler Functions

// Creating ID For all objects in data
const createID = function (objs) {
  objs.forEach((obj, i) => {
    obj.id = i;
  });
};
createID(dataObj);

// Replacing Templates In HTML
const replaceTemps = function (temp, car) {
  let output = temp.replaceAll(/{%CARNAME%}/g, car.name);
  output = output.replace(/{%CARPRICE%}/g, car.price);
  output = output.replace(/{%CARMODEL%}/g, car.model);
  output = output.replace(/{%DESCRIPTION%}/g, car.description);
  output = output.replace(/{%CARLOGO%}/g, car.imgLogo);
  output = output.replace(/{%CARIMAGE%}/g, car.imgCar);
  output = output.replace(/{%ID%}/g, car.id);
  return output;
};

// Loading CSS
const loadCSS = function (req, res, path, style) {
  if (req.url === path) {
    res.writeHead(200, { 'Content-Type': 'text/css' });
    res.end(style);
    return true; // End the function after serving CSS
  }
  return false;
};

// Loading Images
const loadImages = (imgPath, res) => {
  fs.readFile(imgPath, (err, data) => {
    if (err) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end("<h1>Couldn't load images</h1>");
    } else {
      const ext = path.extname(imgPath);
      const contentType =
        {
          '.svg': 'image/svg+xml',
          '.jpeg': 'image/jpeg',
          '.jpg': 'image/jpeg', // Adding .jpg extension support
          '.png': 'image/png',
          '.avif': 'image/avif',
        }[ext] || 'image/jpeg';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data, 'binary');
    }
  });
};

///////////////////////////////////////
// Server And Handling the Requests
const server = http.createServer((req, res) => {
  const { query, pathname } = url.parse(req.url, true);
  ///////////////////////////////////////
  // Loading CSS
  if (loadCSS(req, res, '/styles/style.css', carStyle)) return;
  if (loadCSS(req, res, '/styles/car-page.css', modelStyle)) return;

  ///////////////////////////////////////
  // Main Route/Home Route
  if (pathname === '/' || pathname === '/index.html') {
    const fullTemp = dataObj.map(data => replaceTemps(carTemp, data)).join('');
    const output = overviewTemp.replace('{%OVERVIEW%}', fullTemp);
    res.writeHead(200, htmlHeaders);
    res.end(output);
  } else if (pathname.startsWith('/imgs/')) {
    ///////////////////////////////////////
    // Loading Images
    const imgPath = path.join(__dirname, '..', pathname);
    loadImages(imgPath, res);
  } else if (pathname === '/cars') {
    // const car = dataObj.find(obj => Number(obj.id) === Number(query.id));
    const car = dataObj[query.id];
    const modelRes = replaceTemps(modelTemp, car);
    res.writeHead(200, htmlHeaders);
    res.end(modelRes);
  } else {
    res.writeHead(200, htmlHeaders);
    res.end("<h1>Couldn't find the route</h1>");
  }
});

///////////////////////////////////////
// Listening For Requests
server.listen(8000, '127.0.0.1', () => {
  console.log('Listening to requests...');
});
