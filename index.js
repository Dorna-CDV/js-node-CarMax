const express = require('express'); //serwer http
const axios = require('axios'); // polaczenie sie do zewnetrzego api w naszym przypadku CEPIK
const sqlite3 = require('sqlite3'); // baza danych, w naszym przypadku SQLite
const bcrypt = require('bcrypt'); // do hashowania haseł
const path = require('path');
const cors = require('cors'); 
const jwt = require('jsonwebtoken');
const PasswordValidator = require('password-validator'); // walidacja hasła


// Tworzenie nowego schematu walidacji hasła
let schema = new PasswordValidator();

schema
.is().min(8)                                      // Minimalna długość: 8
.is().max(100)                                    // Maksymalna długość: 100
.has().uppercase()                                // Musi zawierać jedną dużą literę
.has().lowercase()                                // Musi zawierać jedną małą literę
.has().digits(2)                                  // Musi zawierać co najmniej dwie cyfry
.has().not().spaces()                             // Nie może zawierać spacji
.is().not().oneOf(['Passw0rd', 'Password123']);   // Czarne listowanie tych haseł


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
  db.run('CREATE TABLE IF NOT EXISTS Users (id_user INTEGER PRIMARY KEY AUTOINCREMENT, id_karty INTEGER, username TEXT, password TEXT, imie TEXT, nazwisko TEXT, email TEXT, numer_telefonu TEXT)');
  db.run(`CREATE TABLE IF NOT EXISTS Auto (id_auta INTEGER PRIMARY KEY AUTOINCREMENT,marka TEXT,model TEXT,typ_nadwozia TEXT,rok_produkcji INTEGER,przebieg INTEGER,pojemnosc REAL,moc INTEGER,rodzaj_paliwa TEXT,cena REAL)`);
  db.run(`CREATE TABLE IF NOT EXISTS Karty (id_karty INTEGER PRIMARY KEY AUTOINCREMENT, numer_karty TEXT, kod_cvv TEXT, data_waznosci TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS Transakcje (id_transakcji INTEGER PRIMARY KEY AUTOINCREMENT, id_user INTEGER,id_auta INTEGER, status TEXT, cena REAL, data_transakcji TEXT,data_odbioru TEXT,id_leasingu INTEGER,id_ubezpieczenia INTEGER)`);
  db.run('CREATE TABLE IF NOT EXISTS Ulubione(id_ulubione INTEGER PRIMARY KEY AUTOINCREMENT, id_user INTEGER, id_auta INTEGER)');
  db.run('CREATE TABLE IF NOT EXISTS Oceny(id_ocena INTEGER PRIMARY KEY AUTOINCREMENT, id_transakcja INTEGER, ocena INTEGER, komentarz TEXT)');
  db.run('CREATE TABLE IF NOT EXISTS jazda_testowa(id_jazdy INTEGER PRIMARY KEY AUTOINCREMENT, id_user INTEGER, id_auta INTEGER, data TEXT)');
  // Dodawanie przykładowych rekordów do tabeli transakcje (jeśli tabela jest pusta)
  db.get('SELECT COUNT(*) as count FROM Transakcje', (err, result) => {
    if (err) {
      console.error(err);
      return;
    }
/*
    const recordCount = result.count;
    if (recordCount === 0) {
      const insertTransakcje = db.prepare(`
        INSERT INTO Transakcje (id_user,id_auta,status,cena,data_transakcji,data_odbioru,id_leasingu,id_ubezpieczenia)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      insertTransakcje.run(1,1,'Zapłacono',25000,'2020-01-01','2020-01-02',1,1);
      insertTransakcje.run(2,2,'Zapłacono',28000,'2020-01-01','2020-01-02',2,2);
      insertTransakcje.run(3,3,'Zapłacono',22000,'2020-01-01','2020-01-02',3,3);
      insertTransakcje.run(4,4,'Zapłacono',35000,'2020-01-01','2020-01-02',4,4);
      insertTransakcje.run(5,5,'Zapłacono',30000,'2020-01-01','2020-01-02',5,5);
      insertTransakcje.run(6,6,'Zapłacono',32000,'2020-01-01','2020-01-02',6,6);
      insertTransakcje.run(7,7,'Zapłacono',25000,'2020-01-01','2020-01-02',7,7);
      insertTransakcje.run(8,8,'Zapłacono',28000,'2020-01-01','2020-01-02',8,8);
      insertTransakcje.run(9,9,'Zapłacono',22000,'2020-01-01','2020-01-02',9,9);
      insertTransakcje.run(10,10,'Zapłacono',35000,'2020-01-01','2020-01-02',10,10);

      insertTransakcje.finalize();
    }*/
  });

  // Dodawanie przykładowych rekordów do tabeli Auto (jeśli tabela jest pusta)
db.get('SELECT COUNT(*) as count FROM Auto', (err, result) => {
  if (err) {
    console.error(err);
    return;
  }

  const recordCount = result.count;
  if (recordCount === 0) {
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
  }
});



  /*
  // Dodawanie przykładowych użytkowników do tabeli
  const insertUser = db.prepare('INSERT INTO Users (name, email) VALUES (?, ?)');
  insertUser.run('John Doe', 'john@example.com');
  insertUser.run('Jane Smith', 'jane@example.com');
  insertUser.finalize();
*/
});


app.get('/loggedUserDataIDOnly', authenticateToken, (req, res) => {
  const username = req.user.username; // Pobierz nazwę użytkownika

  db.get('SELECT id_user FROM Users WHERE username = ?', username, (err, row) => {
    if (err) {
      console.error(err);
      res.status(500).send('Wystąpił błąd podczas pobierania danych użytkownika backend.');
    } else {
      if (row) {
        const userId_user = row.id_user; // Pobierz identyfikator użytkownika z wyniku zapytania
        res.send({ userId_user }); // Zwróć identyfikator użytkownika w odpowiedzi
      } else {
        res.status(404).send('Użytkownik o podanej nazwie nie został znaleziony.');
      }
    }
  });
});



app.get('/loggedUserData', authenticateToken, (req, res) => {
  const username = req.user.username; // Pobierz nazwę użytkownika

  db.get('SELECT * FROM Users WHERE username = ?', username, (err, row) => {
    if (err) {
      console.error(err);
      res.status(500).send('Wystąpił błąd podczas pobierania danych użytkownika.');
    } else {
      if (row) {
        res.send(row); // Zwróć cały wiersz danych użytkownika w odpowiedzi
      } else {
        res.status(404).send('Użytkownik o podanej nazwie nie został znaleziony.');
      }
    }
  });
});


app.post('/updateUserData', authenticateToken, (req, res) => {
  const { username, imie, nazwisko, email, numer_telefonu, id_karty } = req.body;
  const userId_user = req.user.id_user; // Pobieramy id_user z payloadu tokenu
  //console.log(req.body);
  db.run(
    'UPDATE Users SET username = ?, imie = ?, nazwisko = ?, email = ?, numer_telefonu = ?, id_karty = ? WHERE id_user = ?',
    [username, imie, nazwisko, email, numer_telefonu, id_karty, userId_user],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Wystąpił błąd serwera podczas aktualizacji danych użytkownika.');
      }
      res.status(200).json({ message: 'Dane użytkownika zostały zaktualizowane.' });
    }
  );
});

 

// Endpoint dodawania transakcji
app.post('/add_transaction', authenticateToken, (req, res) => {
  // Odbierz dane z formularza
  const { username, id_auta, status, cena } = req.body;
  const userId_user = req.user.id_user; // Pobieramy id_user z payloadu tokenu
  // Wykonaj logikę dodawania karty do bazy danych


  db.run('INSERT INTO Transakcje (id_user,id_auta,status,cena,data_transakcji,data_odbioru,id_leasingu,id_ubezpieczenia) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [userId_user,id_auta,status,cena,'2020-01-01','2020-01-02',11,11], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Wystąpił błąd serwera podczas dodawania transakcji.');
    }

    res.status(200).json({messange:"Transakcja dodana"
    });
  });

  });




// Endpoint dodawania karty
app.post('/add_card', authenticateToken, (req, res) => {
  // Odbierz dane z formularza
  const { card_number, cvv_code, expiration_date } = req.body;

  // Wykonaj logikę dodawania karty do bazy danych
  db.run('INSERT INTO Karty (numer_karty, kod_cvv, data_waznosci) VALUES (?, ?, ?)', [card_number, cvv_code, expiration_date], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Wystąpił błąd serwera podczas dodawania karty.');
    }

    res.status(200).json({messange:"Dodana karta",
      card_number: card_number,
      cvv_code: cvv_code,
      expiration_date: expiration_date
    });
  });
});


app.post('/register', (req, res) => {
  const { username, password } = req.body;

  // Walidacja hasła
  const validation = schema.validate(password, { list: true });
  if (validation.length > 0) {
    return res.status(400).send('Hasło nie spełnia wymagań bezpieczeństwa.');
  }

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
        // Dodajemy id_user do payloadu
        const payload = { username, id_user: row.id_user };
        const token = jwt.sign(payload, secret, { expiresIn: '1h' });
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


app.get('/cards', authenticateToken, (req, res) => {
  const userId_user = req.user.id_user; // Pobieramy id_user z payloadu tokenu
  db.all('SELECT * FROM Karty', (err, rows) => {
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


app.get('/transactions', authenticateToken, (req, res) => {
  db.all('SELECT * FROM Transakcje', (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Wystąpił błąd serwera' });
    } else {
      res.json(rows);
    }
  });
});

// Endpoint umawiania jazdy testowej
app.post('/umow_jazde_testowa', authenticateToken, (req, res) => {
  // Odbierz dane z formularza
  const { username, id_auta, data } = req.body;
  const userId_user = req.user.id_user; // Pobieramy id_user z payloadu tokenu
  // Wykonaj logikę umawiania jazdy testowej w bazie danych
  
      

      db.run('INSERT INTO jazda_testowa (id_user, id_auta, data) VALUES (?, ?, ?)', [userId_user, id_auta, data], (err) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Wystąpił błąd serwera podczas umawiania jazdy testowej.');
        }

        res.status(200).json({ message: "Jazda testowa umówiona" });
      });
    
  });




// pobranie z cepika
app.get('/cepik', async (req, res) => {
  try {
    const response = await axios.get('https://api.cepik.gov.pl/slowniki/marka');
    const data = response.data;
    res.send(data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Wystąpił błąd podczas komunikacji z CEPIK API.');
  }
});




// Endpoint pobierający listę ulubionych
app.get('/ulubione', authenticateToken, (req, res) => {
  db.all('SELECT * FROM Ulubione', (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Wystąpił błąd serwera' });
    } else {
      res.json(rows);
    }
  });
});


// Endpoint pobierający listę ulubionych
app.get('/Oceny', authenticateToken, (req, res) => {
  db.all('SELECT * FROM Oceny', (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Wystąpił błąd serwera' });
    } else {
      res.json(rows);
    }
  });
});



//Endpoint oceniający transakcję
app.post('/transactions/:id_user,id_auta/ocena', authenticateToken, (req, res) => {
  const { id_user } = req.params;
  const { id_auta } = req.params;
  const { ocena } = req.body;

  if (!ocena) {
    return res.status(400).json({ error: 'Ocena jest wymagana' });
  }

  db.run('UPDATE Transakcje SET ocena = ? WHERE id = ?', [ocena, id_user, id_auta], function (
    err
  ) {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Wystąpił błąd serwera' });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Nie znaleziono transakcji o podanym ID' });
    } else {
      res.json({ message: 'Transakcja oceniona pomyślnie' });
    }
  });
});



app.get('/preferred_cars_offers', authenticateToken, (req, res) => {
  const { car_type } = req.body;
  db.all('SELECT * FROM Auto WHERE typ_nadwozia = ?', [car_type], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Wystąpił błąd serwera' });
    } else {
      res.json(rows);
    }
  });
});



//TRZEBA URUCHOMIĆ KOMENDĘ npm install express
//



//node index.js
//test siema

