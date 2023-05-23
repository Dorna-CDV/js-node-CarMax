const express = require('express'); // to jest zeby postawic serwer http
const axios = require('axios'); // to jest zeby polaczyc sie do zewnetrzego api w naszym przypadku CEPIK
const sqlite3 = require('sqlite3'); // to jest do bazy danych w naszym przypadku SQLite


// Tworzenie instancji aplikacji Express
const app = express();
const port = 80;
const dbPath = 'database/database.db'; // Ścieżka do pliku bazy danych SQLite


// Tworzenie obiektu bazy danych SQLite
const db = new sqlite3.Database(dbPath); // Tworzy bazę danych w  pliku na dysku

db.on('open', () => {
  console.log('Połączono z bazą danych SQLite');

  app.listen(port, () => {
    console.log('Serwer Express nasłuchuje na porcie ${port}');
  });
});
db.on('error', (err) => {
  console.error('Błąd połączenia z bazą danych:', err);
});

// Tworzenie tabeli Users
db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS Users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)');

  // Dodawanie przykładowych użytkowników do tabeli
  const insertUser = db.prepare('INSERT INTO Users (name, email) VALUES (?, ?)');
  insertUser.run('John Doe', 'john@example.com');
  insertUser.run('Jane Smith', 'jane@example.com');
  insertUser.finalize();

});




// Endpoint obsługujący żądanie GET
app.get('/', (req, res) => {
  // Tworzenie odpowiedzi 
  const response = 'WITAMY W API';

  // Wysyłanie odpowiedzi
  res.send(response);
});




// Endpoint GET, pobierający wszystkie rekordy z tabeli Users
app.get('/users', (req, res) => {
  db.all('SELECT * FROM Users', (err, rows) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.send(rows);
    }
  });
});






// pobranie z cepika
app.get('/cepik', async (req, res) => {
  try {
    const response = await axios.get('https://api.cepik.gov.pl/pojazdy?wojewodztwo=30&data-od=20221212&data-do=20230505&typ-daty=1&tylko-zarejestrowane=true&pokaz-wszystkie-pola=false&limit=100&page=1');
    const data = response.data;
    res.send(data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Wystąpił błąd podczas komunikacji z CEPIK API.');
  }
});








/*
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


*/


//TRZEBA URUCHOMIĆ KOMENDĘ npm install express
//POTEM 127.0.0.1 w przegladarce



//node index.js