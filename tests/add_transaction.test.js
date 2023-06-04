const request = require('supertest');
const app = require('../index.js'); // Importuj aplikację Express

describe('POST /add_transaction', () => {
  it('should add a transaction', async () => {
    const response = await request(app)
      .post('/add_transaction')
      .set('Authorization', 'Bearer yourAccessToken')
      .send({ username: 'john', id_auta: 1, status: 'completed', cena: 100 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Transakcja dodana' });
  });

  it('should return an error if the server encounters an error', async () => {
    const response = await request(app)
      .post('/add_transaction')
      .set('Authorization', 'Bearer yourAccessToken')
      .send({ username: 'john', id_auta: 1, status: 'completed', cena: 100 });

    expect(response.status).toBe(500);
    expect(response.text).toBe('Wystąpił błąd serwera podczas dodawania transakcji.');
  });

  it('should return an error if the user is not authenticated', async () => {
    const response = await request(app)
      .post('/add_transaction')
      .send({ username: 'john', id_auta: 1, status: 'completed', cena: 100 });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Brak uwierzytelnienia. Token nie został dostarczony.' });
  });
});
