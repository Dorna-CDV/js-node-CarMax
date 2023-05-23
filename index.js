const express = require('express'); // to jest zeby postawic serwer http
const axios = require('axios'); // to jest zeby polaczyc sie do zewnetrzego api w naszym przypadku CEPIK
const sqlite3 = require('sqlite3'); // to jest do bazy danych w naszym przypadku SQLite
const bcrypt = require('bcrypt'); // to do hashowania haseł
const path = require('path');
const cors = require('cors'); // zeby frontend i backend moglo byc z innej domeny ?
const jwt = require('jsonwebtoken');

// Tworzenie instancji aplikacji Express
const app = express();
const port = 80;
const dbPath = 'database/database.db'; // Ścieżka do pliku bazy danych SQLite


// Tworzenie obiektu bazy danych SQLite
const db = new sqlite3.Database(dbPath); // Tworzy bazę danych w  pliku na dysku

db.on('open', () => {
  console.log('Połączono z bazą danych SQLite');

  app.listen(port, () => {
    console.log(`Serwer Express nasłuchuje na porcie ${port}`);
  });
});
db.on('error', (err) => {
  console.error('Błąd połączenia z bazą danych:', err);
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cors());


const secret = 'tajny_klucz'; // Dodajemy tajny klucz używany do podpisywania i weryfikacji tokenów JWT

// Tworzenie tabeli Users
db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS Users (id INTEGER PRIMARY KEY AUTOINCREMENT, id_karty INTEGER, username TEXT, password TEXT, imie TEXT, nazwisko TEXT, email TEXT, numer_telefonu TEXT)');
/*
  // Dodawanie przykładowych użytkowników do tabeli
  const insertUser = db.prepare('INSERT INTO Users (name, email) VALUES (?, ?)');
  insertUser.run('John Doe', 'john@example.com');
  insertUser.run('Jane Smith', 'jane@example.com');
  insertUser.finalize();
*/
});




// Endpoint rejestracji użytkownika
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  // Sprawdź, czy użytkownik już istnieje w bazie danych
  db.get('SELECT * FROM users WHERE username = ?', username, (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Wystąpił błąd serwera.');
    }

    if (row) {
      return res.status(409).send('Nazwa użytkownika jest już zajęta.');
    }

    // Haszuj hasło przed zapisaniem do bazy danych
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Wystąpił błąd serwera.');
      }

      // Zapisz użytkownika do bazy danych
      db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash], (err) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Wystąpił błąd serwera.');
        }

        res.status(201).send('Użytkownik został zarejestrowany.');
      });
    });
  });
});


// Endpoint logowania użytkownika
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Pobierz użytkownika z bazy danych
  db.get('SELECT * FROM users WHERE username = ?', username, (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Wystąpił błąd serwera.');
    }

    if (!row) {
      return res.status(401).send('Nieprawidłowa nazwa użytkownika lub hasło.');
    }

    // Porównaj hasło z haszem przechowywanym w bazie danych
    bcrypt.compare(password, row.password, (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Wystąpił błąd serwera.');
      }

      if (result) {
        // Jeśli uwierzytelnienie jest prawidłowe, generujemy token JWT
        const token = jwt.sign({ username }, secret, { expiresIn: '1h' });
        return res.status(200).json({ token }); // Zwracamy token w odpowiedzi
      } else {
        return res.status(401).send('Nieprawidłowa nazwa użytkownika lub hasło.');
      }
    });
  });
});



// Middleware do weryfikacji tokena JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401); // Brak tokena, nieautoryzowany dostęp
  }

  jwt.verify(token, secret, (err, user) => {
    if (err) {
      return res.sendStatus(403); // Nieprawidłowy token, dostęp zabroniony
    }

    req.user = user;
    next();
  });
}


// Endpoint chroniony tokenem JWT
app.get('/protected', authenticateToken, (req, res) => {
  res.send(`Witaj, ${req.user.username}! Dostęp do chronionego zasobu.`);
});

// Endpoint obsługujący żądanie GET
app.get('/', (req, res) => {
  // Tworzenie odpowiedzi 
  const response = 'WITAMY W API';

  // Wysyłanie odpowiedzi
  res.send(response);
});





// Endpoint pobierający listę użytkowników
app.get('/users', authenticateToken, (req, res) => {
  db.all('SELECT * FROM Users', (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Wystąpił błąd serwera' });
    } else {
      res.json(rows);
    }
  });
});


/*
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
*/




//TRZEBA URUCHOMIĆ KOMENDĘ npm install express
//POTEM 127.0.0.1 w przegladarce



//node index.js