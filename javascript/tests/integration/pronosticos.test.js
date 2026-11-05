const request = require('supertest');
const { app } = require('../../src/app');

describe('POST /api/pronosticos', () => {
  test('devuelve el promedio movil de la serie enviada', async () => {
    const respuesta = await request(app)
      .post('/api/pronosticos')
      .send({ serie: [120, 132, 128, 141, 138, 150], ventana: 3 });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.metodo).toBe('promedioMovil');
    expect(respuesta.body.ventana).toBe(3);
    expect(respuesta.body.pronosticos).toHaveLength(3);
    [126.67, 133.67, 135.67].forEach((esperado, i) => {
      expect(respuesta.body.pronosticos[i]).toBeCloseTo(esperado, 2);
    });
  });

  test('responde 400 con el motivo si la ventana es mayor que la serie', async () => {
    const respuesta = await request(app)
      .post('/api/pronosticos')
      .send({ serie: [100, 110, 120], ventana: 3 });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error).toMatch('menor que el numero de periodos');
  });

  test('responde 400 si la serie no es un arreglo de numeros', async () => {
    const respuesta = await request(app)
      .post('/api/pronosticos')
      .send({ serie: [100, 'abc', 120], ventana: 2 });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error).toMatch('arreglo de numeros');
  });

  test('responde 400 si el cuerpo no es un JSON valido', async () => {
    const respuesta = await request(app)
      .post('/api/pronosticos')
      .set('Content-Type', 'application/json')
      .send('{"serie": [1, 2');

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error).toMatch('JSON valido');
  });

  test('responde 400 si la peticion no trae cuerpo', async () => {
    const respuesta = await request(app).post('/api/pronosticos');

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error).toMatch('arreglo de numeros');
  });
});
