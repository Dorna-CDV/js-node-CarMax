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
    console.log(`Serwer Express nasłuchuje na porcie ${port} Teraz uruchom login.html`);
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
  db.run(`CREATE TABLE IF NOT EXISTS Auto (id_auta INTEGER PRIMARY KEY AUTOINCREMENT,marka TEXT,model TEXT,typ_nadwozia TEXT,rok_produkcji INTEGER,przebieg INTEGER,pojemnosc REAL,moc INTEGER,rodzaj_paliwa TEXT,cena REAL)`);
  
  // Dodawanie przykładowych rekordów do tabeli Auto
  const insertAuto = db.prepare(`
    INSERT INTO Auto (marka, model, typ_nadwozia, rok_produkcji, przebieg, pojemnosc, moc, rodzaj_paliwa, cena)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAuto.run('Ford', 'Focus', 'Sedan', 2018, 50000, 1.6, 120, 'Benzyna', 25000);
  insertAuto.run('Toyota', 'Corolla', 'Sedan', 2017, 60000, 1.8, 140, 'Benzyna', 28000);
  insertAuto.run('Volkswagen', 'Golf', 'Hatchback', 2019, 40000, 1.4, 110, 'Benzyna', 22000);
  insertAuto.run('BMW', '3 Series', 'Sedan', 2016, 80000, 2.0, 180, 'Diesel', 35000);
  insertAuto.run('Audi', 'A4', 'Sedan', 2017, 70000, 2.0, 160, 'Benzyna', 30000);
  insertAuto.run('Mercedes-Benz', 'C-Class', 'Sedan', 2018, 55000, 2.0, 170, 'Diesel', 32000);
  insertAuto.run('Honda', 'Civic', 'Sedan', 2019, 35000, 1.5, 130, 'Benzyna', 23000);
  insertAuto.run('Hyundai', 'Elantra', 'Sedan', 2017, 60000, 1.6, 120, 'Benzyna', 20000);
  insertAuto.run('Kia', 'Optima', 'Sedan', 2018, 55000, 2.0, 160, 'Benzyna', 25000);
  insertAuto.run('Mazda', 'Mazda3', 'Hatchback', 2019, 40000, 2.0, 155, 'Benzyna', 27000);

  insertAuto.finalize();
  



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

/*
// Endpoint chroniony tokenem JWT
app.get('/protected', authenticateToken, (req, res) => {
  res.send(`Witaj, ${req.user.username}! Dostęp do chronionego zasobu.`);
});
*/
// Endpoint obsługujący żądanie GET
app.get('/', (req, res) => {
  // Tworzenie odpowiedzi 
  const response = 'HELLO API';

  // Wysyłanie odpowiedzi
  res.send(response);
});



// Endpoint pobierający listę aut
app.get('/cars', authenticateToken, (req, res) => {
  db.all('SELECT * FROM Auto', (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Wystąpił błąd serwera' });
    } else {
      res.json(rows);
    }
  });
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
//



//node index.js


