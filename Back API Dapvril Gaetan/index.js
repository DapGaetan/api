const http = require('http');
const fs = require('fs');
const csv = require('csv-parser');
const basicAuth = require('basic-auth');
const cors = require('cors')();
const path = require('path');
const YAML = require('yaml')

const port = 3000;

let studentsData = [];
let classesData = [];

// Charger les données depuis les fichiers CSV au démarrage
loadCSVData('./CSV/students.csv', studentsData);
loadCSVData('./CSV/class.csv', classesData);

// Fonction pour charger les données CSV depuis un fichier
function loadCSVData(filename, data) {
  fs.createReadStream(filename)
    .pipe(csv())
    .on('data', (row) => {
      data.push(row);
    })
    .on('end', () => {
      console.log(`${filename} CSV loaded`);
    });
}

// Fonction pour sauvegarder les données dans un fichier CSV
function saveDataToCSV(filename, data) {
  const csvData = data.map((item) => Object.values(item).join(',')).join('\n');
  fs.writeFileSync(filename, Object.keys(data[0]).join(',') + '\n' + csvData);
}

// Fonction pour obtenir le prochain ID de manière automatique
function getNextId(data) {
  const ids = data.map((item) => parseInt(item.id));
  const nextId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
  return nextId.toString();
}

// Middleware HTTP Basic Authentication
const authenticate = (req, res, next) => {
  const credentials = basicAuth(req);

  if (!credentials || !authenticateUser(credentials.name, credentials.pass)) {
    res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Authentication required"' });
    res.end('Authentication failed');
  } else {
    next();
  }
};

const authenticateUser = (username, password) => {
  const validUser = username === 'IDENTIFIANT' && password === 'MDP123';
  return validUser;
};

// Création du serveur HTTP
const server = http.createServer((req, res) => {
  cors(req, res, () => {
    // Appliquer l'authentification sur toutes les routes
    authenticate(req, res, () => {
      const { method, url } = req;

      if (url === "/api-docs") {
        const swaggerPath = path.join(__dirname, "./Doc/swagger.yaml");
        const swaggerContents = fs.readFileSync(swaggerPath, "utf-8");
        const swaggerSpec = YAML.parse(swaggerContents);

        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>API MDS Docs</title>
            <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@3.52.1/swagger-ui.css">
          </head>
          <body>
            <div id="swagger-ui"></div>
            <script src="https://unpkg.com/swagger-ui-dist@3.52.1/swagger-ui-bundle.js"></script>
            <script>
              const spec = ${JSON.stringify(swaggerSpec)};
              SwaggerUIBundle({
                spec: spec,
                dom_id: '#swagger-ui',
              });
            </script>
          </body>
          </html>
        `;

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(html);
        return;
      }

      if (method === 'GET' && url === '/api/students') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(studentsData));
      } else if (method === 'GET' && url.startsWith('/api/students/')) {
        const studentId = url.split('/').pop();
        const student = studentsData.find((s) => s.id === studentId);
        if (student) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(student));
        } else {
          res.writeHead(404);
          res.end('Student not found');
        }
      } else if (method === 'POST' && url === '/api/students') {
        handlePostRequest(req, res, studentsData, './CSV/students.csv');
      } else if (method === 'PATCH' && url.startsWith('/api/students/')) {
        handlePatchRequest(req, res, studentsData, './CSV/students.csv');
      } else if (method === 'PUT' && url.startsWith('/api/students/')) {
        handlePutRequest(req, res, studentsData, './CSV/students.csv');
      } else if (method === 'DELETE' && url.startsWith('/api/students/')) {
        handleDeleteRequest(req, res, studentsData, './CSV/students.csv');
      } else if (method === 'GET' && url === '/api/classes') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(classesData));
      } else if (method === 'GET' && url.startsWith('/api/classes/')) {
        const classId = url.split('/').pop();
        const cls = classesData.find((c) => c.id === classId);
        if (cls) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(cls));
        } else {
          res.writeHead(404);
          res.end('Class not found');
        }
      } else if (method === 'POST' && url === '/api/classes') {
        handlePostRequest(req, res, classesData, './CSV/class.csv');
      } else if (method === 'PATCH' && url.startsWith('/api/classes/')) {
        handlePatchRequest(req, res, classesData, './CSV/class.csv');
      } else if (method === 'PUT' && url.startsWith('/api/classes/')) {
        handlePutRequest(req, res, classesData, './CSV/class.csv');
      } else if (method === 'DELETE' && url.startsWith('/api/classes/')) {
        handleDeleteRequest(req, res, classesData, './CSV/class.csv');
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });
  });
});

// Fonction pour gérer les requêtes POST
function handlePostRequest(req, res, data, filename) {
  let body = [];
  req.on('data', (chunk) => {
    body.push(chunk);
  }).on('end', () => {
    body = Buffer.concat(body).toString();
    const newItem = {
      id: getNextId(data),
      ...JSON.parse(body),
    };
    data.push(newItem);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(newItem));
    saveDataToCSV(filename, data);
  });
}

// Fonction pour gérer les requêtes PATCH
function handlePatchRequest(req, res, data, filename) {
  const itemId = req.url.split('/').pop();
  const itemIndex = data.findIndex((item) => item.id === itemId);
  if (itemIndex !== -1) {
    let body = [];
    req.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      body = Buffer.concat(body).toString();
      data[itemIndex] = { ...data[itemIndex], ...JSON.parse(body) };
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data[itemIndex]));
      saveDataToCSV(filename, data);
    });
  } else {
    res.writeHead(404);
    res.end('Item not found');
  }
}

// Fonction pour gérer les requêtes PUT
function handlePutRequest(req, res, data, filename) {
  const itemId = req.url.split('/').pop();
  const itemIndex = data.findIndex((item) => item.id === itemId);
  if (itemIndex !== -1) {
    let body = [];
    req.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      body = Buffer.concat(body).toString();
      data[itemIndex] = JSON.parse(body);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data[itemIndex]));
      saveDataToCSV(filename, data);
    });
  } else {
    res.writeHead(404);
    res.end('Item not found');
  }
}

// Fonction pour gérer les requêtes DELETE
function handleDeleteRequest(req, res, data, filename) {
  const itemId = req.url.split('/').pop();
  const itemIndex = data.findIndex((item) => item.id === itemId);
  if (itemIndex !== -1) {
    const deletedItem = data.splice(itemIndex, 1)[0];
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(deletedItem));
    saveDataToCSV(filename, data);
  } else {
    res.writeHead(404);
    res.end('Item not found');
  }
}

// Lancer le serveur sur le port choisi
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

//   ▄▄▄▄▄ ████▄ ▀▄    ▄ ▄███▄     ▄       ▄        ▄   ████▄ ▄███▄   █     
// ▄▀  █   █   █   █  █  █▀   ▀     █  ▀▄   █        █  █   █ █▀   ▀  █     
//     █   █   █    ▀█   ██▄▄    █   █   █ ▀     ██   █ █   █ ██▄▄    █     
//  ▄ █    ▀████    █    █▄   ▄▀ █   █  ▄ █      █ █  █ ▀████ █▄   ▄▀ ███▄  
//   ▀            ▄▀     ▀███▀   █▄ ▄█ █   ▀▄    █  █ █       ▀███▀       ▀ 
//                                ▀▀▀   ▀        █   ██                     
