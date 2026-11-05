const descuidada = require('../src/reportes');
const limpia = require('../src/reportes.limpio');

const periodos = [
  { periodo: 'ene', real: 100, pron: 95 },
  { periodo: 'feb', real: 120, pron: 100 },
  { periodo: 'mar', real: 0, pron: 10 },
  { periodo: 'abr', real: 80, pron: 78 },
  { periodo: 'may', real: 90 },
  { periodo: 'jun', real: 150, pron: 110 },
  { periodo: 'jul', real: 100, pron: 91 },
];

const versiones = [
  ['descuidada', { procesar: descuidada.proc, mayorError: descuidada.peor }],
  ['limpia', { procesar: limpia.procesarPeriodos, mayorError: limpia.periodoConMayorError }],
];

describe.each(versiones)('versión %s', (_nombre, version) => {
  test('clasifica cada periodo según el umbral de alerta', () => {
    const estados = version.procesar(periodos, 15).map(({ periodo, estado }) => [periodo, estado]);

    expect(estados).toEqual([
      ['ene', 'ok'],
      ['feb', 'alerta'],
      ['mar', 'sin demanda'],
      ['abr', 'ok'],
      ['may', 'sin demanda'],
      ['jun', 'alerta'],
      ['jul', 'vigilar'],
    ]);
  });

  test('calcula el error porcentual de cada periodo', () => {
    const [ene, feb] = version.procesar(periodos, 15);

    expect(ene.error).toBeCloseTo(5, 5);
    expect(feb.error).toBeCloseTo(16.6667, 4);
  });

  test('un umbral más alto deja menos periodos en alerta', () => {
    const alertas = version.procesar(periodos, 20).filter(({ estado }) => estado === 'alerta');

    expect(alertas.map(({ periodo }) => periodo)).toEqual(['jun']);
  });

  test('con el error exactamente igual al umbral hay alerta', () => {
    const [resultado] = version.procesar([{ periodo: 'ene', real: 100, pron: 90 }], 10);

    expect(resultado.estado).toBe('alerta');
  });

  test('devuelve el periodo con mayor error', () => {
    expect(version.mayorError(periodos)).toBe('jun');
  });

  test('sin periodos con demanda no hay periodo con mayor error', () => {
    expect(version.mayorError([{ periodo: 'ene', real: 0, pron: 5 }])).toBeNull();
  });
});

test('las dos versiones dan exactamente el mismo resultado con los mismos datos', () => {
  expect(limpia.procesarPeriodos(periodos, 15)).toEqual(descuidada.proc(periodos, 15));
  expect(limpia.procesarPeriodos(periodos, 8)).toEqual(descuidada.proc(periodos, 8));
  expect(limpia.periodoConMayorError(periodos)).toBe(descuidada.peor(periodos));
});
