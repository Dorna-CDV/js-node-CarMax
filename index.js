const express = require('express');
const axios = require('axios');


const app = express();
const port = 3000;

// Domyślne powitanie
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Endpoint do odczytu wszystkich danych
app.get('/data', (req, res) => {
  // Tu umieść logikę pobierania wszystkich danych
  // Możesz użyć bazy danych lub innych źródeł danych
  // Następnie zwróć odpowiedź w formacie JSON
  const data = [
    { id: 1, name: 'Example 1' },
    { id: 2, name: 'Example 2' },
    { id: 3, name: 'Example 3' }
  ];
  res.json(data);
});

// Endpoint do tworzenia nowych danych
app.post('/data', (req, res) => {
  // Tu umieść logikę tworzenia nowych danych
  // Możesz otrzymać dane przesłane przez klienta i zapisać je w bazie danych lub innym miejscu
  // Następnie zwróć odpowiedź z potwierdzeniem utworzenia
  const newData = { id: 4, name: 'New Example' };
  res.json(newData);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

//TRZEBA URUCHOMIĆ KOMENDĘ npm install express
//POTEM http://localhost:3000/



//node index.js