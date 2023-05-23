const express = require('express'); // to jest zeby postawic serwer http
const axios = require('axios'); // to jest zeby polaczyc sie do zewnetrzego api w naszym przypadku CEPIK
const sqlite3 = require('sqlite3'); // to jest do bazy danych w naszym przypadku SQLite


// Tworzenie instancji aplikacji Express
const app = express();
const port = 3000;

// Tworzenie obiektu bazy danych SQLite
const db = new sqlite3.Database(':memory:'); // Tworzy bazę danych w pamięci, można również użyć ścieżki do pliku na dysku



// Tworzenie tabeli Users
db.serialize(() => {
  db.run('CREATE TABLE Users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)');
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


db.connect((err) => {
  if (err) {
    console.error('Błąd połączenia z bazą danych:', err.message);
  } else {
    console.log('Połączono z bazą danych SQLite');

    // Tutaj możesz dodać dodatkową logikę lub uruchomić serwer Express
    app.listen(3000, () => {
      console.log('Serwer Express nasłuchuje na porcie ${port}');
    });
  }
});



// Domyślne powitanie
app.get('/', async (req, res) => {
  try {
    const response = await axios.get('https://api.cepik.gov.pl/pojazdy?wojewodztwo=30&data-od=20221212&data-do=20230505&typ-daty=1&tylko-zarejestrowane=true&pokaz-wszystkie-pola=false&limit=100&page=1');
    const data = response.data;
    res.send(data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Wystąpił błąd podczas komunikacji z CEPIK API.');
  }
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





//TRZEBA URUCHOMIĆ KOMENDĘ npm install express
//POTEM http://localhost:3000/



//node index.js