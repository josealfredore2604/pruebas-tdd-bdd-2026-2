# Kit de pruebas en JavaScript — Semana 4

Este es el kit real de nuestro proyecto "Sistema web para la predicción de la demanda en producción industrial". Aquí cubrimos con pruebas los cálculos de pronóstico y de error (promedio móvil, suavización exponencial, MAD, MSE, MAPE y regresión lineal), la regla de alertas, un endpoint de Express y una pantalla de carga de datos.

Cada función la construimos con TDD (rojo, verde, refactor) y la regla de alertas con BDD (Given-When-Then, en español). Este README no solo lista comandos: cuenta el camino de cada función, con la salida real de la consola en cada paso, para que sirva de apoyo en clase.

## Requisitos e instalación

- Node.js: validamos todo con **v24.19.0** y npm **11.17.0**. El README anterior pedía Node 20.x; no vimos ningún problema con 24, así que ahora declaramos `engines: node >=20` y la CI usa Node 24.
- npm

```bash
npm install
npx playwright install chromium   # solo si vamos a correr la prueba E2E
```

## TDD y BDD, como lo entendemos nosotros

**TDD** es escribir la prueba antes que el código. Tiene tres pasos que se repiten:

1. **Rojo**: escribimos la prueba y la corremos. Tiene que fallar. Si no falla, la prueba no está comprobando nada nuevo.
2. **Verde**: escribimos lo mínimo que hace pasar la prueba, aunque quede feo.
3. **Refactor**: con las pruebas en verde mejoramos la forma del código (nombres, funciones pequeñas, menos repetición) sin cambiar lo que hace. Las mismas pruebas, sin tocarlas, son las que demuestran que no rompimos nada.

**BDD** es describir el comportamiento con frases que también entiende alguien de Producción, no solo quien programa. Cada escenario se redacta como **Dado** (el contexto de partida), **Cuando** (lo que ocurre) y **Entonces** (lo que esperamos). La frase se conecta con código, así que la especificación y la prueba son el mismo archivo. Lo usamos donde hay una regla de negocio que conviene acordar con el área usuaria, como cuándo se dispara una alerta.

## Datos de referencia

Todas las pruebas usan la misma serie de demanda real de seis períodos:

```
120, 132, 128, 141, 138, 150
```

Con promedio móvil de 3 períodos, los pronósticos de los períodos 4, 5 y 6 son 126,67 · 133,67 · 135,67 frente a una demanda real de 141 · 138 · 150. Las demás métricas de error salen de esa comparación.

Antes de fijar cualquier valor en una prueba lo recalculamos con un script independiente (sin usar `src/`). Los resultados coincidieron con los esperados:

| Cálculo | Valor recalculado |
|---|---|
| Promedio móvil (ventana 3), períodos 4 a 7 | 126,6667 · 133,6667 · 135,6667 · 143 |
| Suavización exponencial, alpha 0,3, F7 | 137,5546 |
| MAD | 11,0000 |
| MSE | 143,2222 |
| MAPE | 7,6204 % |
| Regresión lineal | pendiente 5,1714 · intercepto 116,7333 · período 7: 152,9333 |

Las pruebas comparan con `toBeCloseTo(valor, 2)`, que exige una diferencia menor a 0,005. Es más estricto que la tolerancia de 0,01 que nos pidieron.

## Tabla de funciones

| Función | Qué calcula | Valor de referencia que verifica | Prueba |
|---|---|---|---|
| `mad(real, pronostico)` | Error absoluto medio | 11,00 | `tests/unit/mad.test.js` |
| `debeGenerarAlerta(error, umbral)` | `true` si `error >= umbral` | 12 vs 10 → alerta · 7 vs 10 → no · 10 vs 10 → alerta | `tests/unit/alertas.steps.js` + `alertas.feature` |
| `promedioMovil(serie, ventana)` | Pronósticos de los períodos `ventana + 1` hasta el último | 126,67 · 133,67 · 135,67 (ventana 3) | `tests/unit/promedioMovil.test.js` |
| `suavizacionExponencial(serie, alpha)` | Un pronóstico por período, del 2 al n + 1 | F7 = 137,5546 (alpha 0,3); alpha 0 → todo 120; alpha 1 → la propia serie | `tests/unit/suavizacionExponencial.test.js` |
| `mse(real, pronostico)` | Error cuadrático medio | 143,22 | `tests/unit/mse.test.js` |
| `mape(real, pronostico)` | Error porcentual absoluto medio (en %) | 7,62 · períodos con real 0 excluidos | `tests/unit/mape.test.js` |
| `regresionLineal(serie)` | `{ pendiente, intercepto, pronosticoSiguiente }` con x = 1..n | 5,17 · 116,73 · 152,93 | `tests/unit/regresionLineal.test.js` |
| `POST /api/pronosticos` | Devuelve el resultado de `promedioMovil` | tres pronósticos de la serie de referencia | `tests/integration/pronosticos.test.js` |
| Pantalla de carga de datos | Confirma la carga de la serie | "Datos cargados correctamente: 6 períodos" | `tests/e2e/carga-datos.spec.js` |

## Cómo correr cada tipo de prueba por separado

| Qué | Comando |
|---|---|
| Unitarias y BDD | `npm run test:unit` |
| Integración (Supertest) | `npm run test:integration` |
| E2E (Playwright, levanta el servidor solo) | `npm run test:e2e` |
| Unitarias + integración | `npm test` |
| Unitarias + integración con cobertura | `npm test -- --coverage` (el reporte queda en `coverage/`) |
| Una sola función | `npx jest tests/unit/mape.test.js` |
| Análisis estático (ESLint) | `npm run lint` |

`npm test` no incluye la E2E: necesita un navegador instalado y es más lenta, así que la corremos aparte.

---

## Parte 1 — `mad()` con TDD

El MAD (desviación absoluta media) es el promedio de cuánto nos equivocamos, sin importar si fue por arriba o por abajo.

### Rojo

Escribimos `tests/unit/mad.test.js` antes de que existiera `src/mad.js`:

```
FAIL tests/unit/mad.test.js
  ● Test suite failed to run

    Cannot find module '../../src/mad' from 'tests/unit/mad.test.js'

Test Suites: 1 failed, 1 total
Tests:       0 total
```

La suite entera falla antes de ejecutar nada: Jest no encuentra el módulo `../../src/mad`. Por eso el resumen dice `Tests: 0 total`: ni siquiera llegó a registrar una prueba. Es el rojo correcto, porque confirma que la prueba se está ejecutando de verdad y que no puede pasar por accidente.

### Verde

Escribimos lo mínimo que hace pasar las cuatro pruebas, con un `for` y las validaciones al principio:

```js
function mad(real, pronostico) {
  if (real.length !== pronostico.length) {
    throw new Error('Las series deben tener el mismo numero de periodos');
  }
  if (real.length === 0) {
    throw new Error('Se necesita al menos un periodo para calcular el MAD');
  }

  let suma = 0;
  for (let i = 0; i < real.length; i++) {
    suma += Math.abs(real[i] - pronostico[i]);
  }
  return suma / real.length;
}

module.exports = { mad };
```

```
PASS tests/unit/mad.test.js
  mad
    ✓ calcula el error absoluto medio de una serie de pronosticos (1 ms)
    ✓ devuelve 0 cuando el pronostico es exacto
    ✓ lanza un error si las series no tienen la misma longitud (3 ms)
    ✓ lanza un error si alguna de las series esta vacia

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

El primer caso usa los períodos 4 a 6 de la serie de referencia y espera 11,00 con `toBeCloseTo(11.00, 2)`: la tolerancia numérica queda dentro de la prueba y no solo en un documento. Los otros tres fijan que un pronóstico exacto da 0 y que dos series de distinta longitud o vacías lanzan un error con un mensaje claro, en vez de devolver `NaN`.

### Refactor

Con las cuatro pruebas en verde, cambiamos el `for` por `map` y `reduce`, y movimos cada validación a una función con nombre (`validarMismaLongitud`, `validarAlMenosUnPeriodo`):

```js
function mad(real, pronostico) {
  validarMismaLongitud(real, pronostico);
  validarAlMenosUnPeriodo(real);

  const erroresAbsolutos = real.map((valorReal, i) => Math.abs(valorReal - pronostico[i]));
  const sumaErrores = erroresAbsolutos.reduce((acumulado, error) => acumulado + error, 0);

  return sumaErrores / real.length;
}

function validarMismaLongitud(real, pronostico) {
  if (real.length !== pronostico.length) {
    throw new Error('Las series deben tener el mismo numero de periodos');
  }
}

function validarAlMenosUnPeriodo(real) {
  if (real.length === 0) {
    throw new Error('Se necesita al menos un periodo para calcular el MAD');
  }
}

module.exports = { mad };
```

```
PASS tests/unit/mad.test.js
  mad
    ✓ calcula el error absoluto medio de una serie de pronosticos
    ✓ devuelve 0 cuando el pronostico es exacto
    ✓ lanza un error si las series no tienen la misma longitud (3 ms)
    ✓ lanza un error si alguna de las series esta vacia

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

Las mismas cuatro pruebas, sin modificarlas, dan el mismo resultado. Cambió la forma, no el comportamiento, y las pruebas son quienes lo demuestran.

---

## Parte 2 — `debeGenerarAlerta()` con BDD

`tests/unit/alertas.feature` describe la regla en Gherkin, en español:

```gherkin
# language: es
Característica: Alertas de desviación del pronóstico
  Como planeador de producción
  Quiero que el sistema me avise cuando el error de un pronóstico sea alto
  Para poder revisar y ajustar el plan de producción a tiempo

  Escenario: El error supera el umbral configurado
    Dado un umbral de alerta configurado en 10 %
    Cuando el error del pronóstico es 12 %
    Entonces se debe generar una alerta

  Escenario: El error no supera el umbral configurado
    Dado un umbral de alerta configurado en 10 %
    Cuando el error del pronóstico es 7 %
    Entonces no se debe generar una alerta

  Escenario: El error es exactamente igual al umbral
    Dado un umbral de alerta configurado en 10 %
    Cuando el error del pronóstico es 10 %
    Entonces se debe generar una alerta
```

`tests/unit/alertas.steps.js` conecta cada línea del feature con código usando `jest-cucumber`, y `src/alertas.js` tiene la única línea de lógica:

```js
function debeGenerarAlerta(errorPorcentual, umbralPorcentual) {
  return errorPorcentual >= umbralPorcentual;
}

module.exports = { debeGenerarAlerta };
```

```
PASS tests/unit/alertas.steps.js
  Alertas de desviación del pronóstico
    ✓ El error supera el umbral configurado (1 ms)
    ✓ El error no supera el umbral configurado
    ✓ El error es exactamente igual al umbral

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```

**Por qué cada escenario está redactado así.** En los tres, el *Dado* es el mismo (un umbral de 10 %) para que lo único que cambie entre ellos sea el *Cuando*, que es el error del pronóstico. Así se ve de un vistazo qué variable estamos moviendo.

- **Escenario 1 (12 % contra 10 %)**: el caso claro de alerta. Si falla, el sistema no avisa cuando debería y el planeador se entera tarde de que el plan se desvió.
- **Escenario 2 (7 % contra 10 %)**: el caso claro de no alerta. Protege del error contrario: una función que devolviera siempre `true` pasaría el escenario 1 y se detectaría aquí. Un sistema que alerta por todo termina ignorado.
- **Escenario 3 (10 % contra 10 %)**: el caso límite. La regla que acordamos es "mayor o igual", no "mayor estricto". Es el tipo de decisión que hay que cerrar con Producción antes de escribir la prueba, no después.

**Qué pasaría sin el escenario 3.** Para comprobarlo cambiamos `>=` por `>` en `alertas.js` y corrimos la suite (después lo restauramos). Los escenarios 1 y 2 siguieron en verde; solo el tercero detectó el cambio:

```
FAIL tests/unit/alertas.steps.js
  Alertas de desviación del pronóstico
    ✓ El error supera el umbral configurado (1 ms)
    ✓ El error no supera el umbral configurado
    ✕ El error es exactamente igual al umbral (1 ms)
Tests:       1 failed, 2 passed, 3 total
```

Sin ese escenario, el error habría pasado sin que nadie lo notara y el sistema no avisaría justo cuando el error toca el umbral.

---

## Parte 3 — Las cinco funciones nuevas, paso a paso

Todas siguen el mismo patrón que `mad()`: la prueba primero, el módulo no existe y falla, una primera versión directa con `for`, y un refactor con las pruebas intactas. En los rojos Jest imprime además un fragmento de código y la traza; aquí dejamos solo las líneas que explican la falla. Quitamos también las líneas de tiempo total.

### 3.1 `promedioMovil(serie, ventana)`

Para cada período después de la primera ventana, promedia las últimas `ventana` demandas reales. Con la serie de referencia y ventana 3 devuelve los pronósticos de los períodos 4, 5 y 6.

**Rojo.** La prueba cubre el valor de referencia (126,67 · 133,67 · 135,67), que con ventana 1 el pronóstico es la demanda anterior, y los dos errores de uso: una ventana que no es un entero mayor o igual a 1, y una ventana tan grande que no queda ningún período para pronosticar.

```
FAIL tests/unit/promedioMovil.test.js
  ● Test suite failed to run

    Cannot find module '../../src/promedioMovil' from 'tests/unit/promedioMovil.test.js'

Test Suites: 1 failed, 1 total
Tests:       0 total
```

Falla porque `src/promedioMovil.js` no existe todavía. No hay código que pueda estar bien o mal; solo comprobamos que la prueba corre y falla por la razón correcta.

**Verde.** Lo mínimo: dos validaciones, un `for` exterior que recorre los períodos a pronosticar y uno interior que suma la ventana.

```js
function promedioMovil(serie, ventana) {
  if (!Number.isInteger(ventana) || ventana < 1) {
    throw new Error('La ventana debe ser un entero mayor o igual a 1');
  }
  if (ventana >= serie.length) {
    throw new Error('La ventana debe ser menor que el numero de periodos de la serie');
  }

  const pronostico = [];
  for (let t = ventana; t < serie.length; t++) {
    let suma = 0;
    for (let i = t - ventana; i < t; i++) {
      suma += serie[i];
    }
    pronostico.push(suma / ventana);
  }
  return pronostico;
}

module.exports = { promedioMovil };
```

```
PASS tests/unit/promedioMovil.test.js
  promedioMovil
    ✓ pronostica los periodos 4, 5 y 6 con una ventana de 3 (1 ms)
    ✓ con ventana de 1 el pronostico repite la demanda del periodo anterior
    ✓ lanza un error si la ventana no es un entero mayor o igual a 1 (1 ms)
    ✓ lanza un error si la ventana no es menor que el numero de periodos

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

Las cuatro pasan. El valor de referencia confirma que el promedio de los tres períodos anteriores es lo que buscábamos, y la ventana 1 confirma el borde más pequeño.

**Refactor.** Reemplazamos los dos `for` y la variable mutable `suma` por `slice` y `map`, extrajimos el cálculo a `promedio()` y las validaciones a `validarVentana()`:

```js
function promedioMovil(serie, ventana) {
  validarVentana(serie, ventana);

  return serie
    .slice(ventana)
    .map((_, i) => promedio(serie.slice(i, i + ventana)));
}

function promedio(valores) {
  return valores.reduce((suma, valor) => suma + valor, 0) / valores.length;
}

function validarVentana(serie, ventana) {
  if (!Number.isInteger(ventana) || ventana < 1) {
    throw new Error('La ventana debe ser un entero mayor o igual a 1');
  }
  if (ventana >= serie.length) {
    throw new Error('La ventana debe ser menor que el numero de periodos de la serie');
  }
}

module.exports = { promedioMovil };
```

```
PASS tests/unit/promedioMovil.test.js
  promedioMovil
    ✓ pronostica los periodos 4, 5 y 6 con una ventana de 3 (1 ms)
    ✓ con ventana de 1 el pronostico repite la demanda del periodo anterior
    ✓ lanza un error si la ventana no es un entero mayor o igual a 1 (1 ms)
    ✓ lanza un error si la ventana no es menor que el numero de periodos

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

Mismas cuatro pruebas, mismos nombres, mismo resultado. Ahora la función principal se lee como la definición: "tomo cada ventana de la serie y la promedio".

### 3.2 `suavizacionExponencial(serie, alpha)`

Cada pronóstico nuevo mezcla la última demanda real con el pronóstico anterior: `F(t+1) = alpha × A(t) + (1 − alpha) × F(t)`. Arrancamos con una convención: el pronóstico del período 2 es la demanda real del período 1. Devuelve un pronóstico por cada período de la serie (del 2 al n + 1), así que el último elemento es el pronóstico del período siguiente (F7 en nuestra serie).

Esa convención de arranque es una decisión de negocio, no una obviedad: otra forma de inicializar (por ejemplo, el promedio de los primeros períodos) da otro F7. Por eso el valor 137,5546 quedó fijado en la prueba.

**Rojo.** Seis pruebas: el valor de referencia con alpha 0,3, la forma del resultado, los dos casos límite (alpha 0 y alpha 1), el rango de alpha y la serie vacía.

```
FAIL tests/unit/suavizacionExponencial.test.js
  ● Test suite failed to run

    Cannot find module '../../src/suavizacionExponencial' from 'tests/unit/suavizacionExponencial.test.js'

Test Suites: 1 failed, 1 total
Tests:       0 total
```

Falla por la misma razón que antes: el módulo no existe.

**Verde.** Un `for` que va aplicando la fórmula sobre el pronóstico anterior, con las validaciones arriba:

```js
function suavizacionExponencial(serie, alpha) {
  if (typeof alpha !== 'number' || !(alpha >= 0 && alpha <= 1)) {
    throw new Error('El alpha debe estar entre 0 y 1');
  }
  if (serie.length === 0) {
    throw new Error('Se necesita al menos un periodo para suavizar la serie');
  }

  const pronostico = [serie[0]];
  for (let i = 1; i < serie.length; i++) {
    pronostico.push(alpha * serie[i] + (1 - alpha) * pronostico[i - 1]);
  }
  return pronostico;
}

module.exports = { suavizacionExponencial };
```

```
PASS tests/unit/suavizacionExponencial.test.js
  suavizacionExponencial
    ✓ con alpha 0.3 el pronostico del periodo 7 es 137.5546
    ✓ devuelve un pronostico por periodo y el del periodo 2 es la demanda del periodo 1
    ✓ con alpha 0 el pronostico nunca se corrige y queda en la primera demanda
    ✓ con alpha 1 el pronostico es la demanda real del periodo anterior
    ✓ lanza un error si alpha esta fuera del rango de 0 a 1 (2 ms)
    ✓ lanza un error si la serie esta vacia

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
```

El valor de referencia (137,5546) confirma que la fórmula y la convención de arranque coinciden con el cálculo que hicimos aparte, y las otras cinco pruebas cierran los bordes.

**Refactor.** Mantuvimos el `for`, que aquí es la forma más clara de leer una recurrencia, y sacamos la fórmula a `corregir()` y las validaciones a `validarAlpha()` y `validarAlMenosUnPeriodo()`. Aprovechamos para dejar escrito el porqué del arranque:

```js
function suavizacionExponencial(serie, alpha) {
  validarAlpha(alpha);
  validarAlMenosUnPeriodo(serie);

  // El pronostico del periodo 2 arranca con la demanda real del periodo 1
  const pronostico = [serie[0]];
  for (let i = 1; i < serie.length; i++) {
    pronostico.push(corregir(serie[i], pronostico[i - 1], alpha));
  }
  return pronostico;
}

function corregir(demanda, pronosticoAnterior, alpha) {
  return alpha * demanda + (1 - alpha) * pronosticoAnterior;
}

function validarAlpha(alpha) {
  if (typeof alpha !== 'number' || !(alpha >= 0 && alpha <= 1)) {
    throw new Error('El alpha debe estar entre 0 y 1');
  }
}

function validarAlMenosUnPeriodo(serie) {
  if (serie.length === 0) {
    throw new Error('Se necesita al menos un periodo para suavizar la serie');
  }
}

module.exports = { suavizacionExponencial };
```

```
PASS tests/unit/suavizacionExponencial.test.js
  suavizacionExponencial
    ✓ con alpha 0.3 el pronostico del periodo 7 es 137.5546 (1 ms)
    ✓ devuelve un pronostico por periodo y el del periodo 2 es la demanda del periodo 1
    ✓ con alpha 0 el pronostico nunca se corrige y queda en la primera demanda
    ✓ con alpha 1 el pronostico es la demanda real del periodo anterior (1 ms)
    ✓ lanza un error si alpha esta fuera del rango de 0 a 1 (1 ms)
    ✓ lanza un error si la serie esta vacia

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
```

Las seis pruebas siguen igual. Lo que ganamos es que `corregir()` tiene nombre y es la fórmula completa, visible de un vistazo.

**Casos límite: alpha = 0 y alpha = 1.** Los dos son valores legítimos y los probamos de forma explícita; no hay ningún `if` especial para ellos, la misma fórmula los resuelve. Con la serie de referencia, estos son los pronósticos reales:

```
alpha 0.3: 120, 123.6, 124.92, 129.744, 132.2208, 137.5546
alpha 0: 120, 120, 120, 120, 120, 120
alpha 1: 120, 132, 128, 141, 138, 150
```

- **alpha = 0**: la fórmula queda `0 × A + 1 × F`, es decir, el pronóstico nunca incorpora la demanda real y se queda para siempre en la primera demanda (120). Es "confianza total en el pasado". Es poco útil en la práctica, pero es el extremo que define el comportamiento del método.
- **alpha = 1**: queda `1 × A + 0 × F`, y cada pronóstico es exactamente la demanda del período anterior. Es el pronóstico ingenuo: "mañana será igual que hoy". La prueba compara contra la serie misma con `toEqual`, sin tolerancia, porque multiplicar por 0 y por 1 es exacto en coma flotante.
- **Fuera de [0, 1]**: lo rechazamos con un error. Un alpha mayor que 1 le da a la demanda más peso del 100 % y uno negativo la resta; ninguno es un promedio ponderado. Por eso el rango es cerrado: aceptar 0 y 1 es parte de lo que probamos.

### 3.3 `mse(real, pronostico)`

Igual que `mad()`, pero eleva el error al cuadrado antes de promediar. Eso castiga mucho más los errores grandes. Para la serie de referencia da 143,22.

**Rojo.** Cinco pruebas: el valor de referencia, que un pronóstico exacto da 0, una que muestra por qué existe el MSE (el mismo error total de 10 unidades da 25 si se reparte en dos períodos y 50 si se concentra en uno) y las dos validaciones de `mad()`.

```
FAIL tests/unit/mse.test.js
  ● Test suite failed to run

    Cannot find module '../../src/mse' from 'tests/unit/mse.test.js'

Test Suites: 1 failed, 1 total
Tests:       0 total
```

Falla porque `src/mse.js` no existe.

**Verde.** Copiamos el patrón de `mad()`, con las validaciones arriba y el cuadrado en el `for`:

```js
function mse(real, pronostico) {
  if (real.length !== pronostico.length) {
    throw new Error('Las series deben tener el mismo numero de periodos');
  }
  if (real.length === 0) {
    throw new Error('Se necesita al menos un periodo para calcular el MSE');
  }

  let suma = 0;
  for (let i = 0; i < real.length; i++) {
    suma += (real[i] - pronostico[i]) ** 2;
  }
  return suma / real.length;
}

module.exports = { mse };
```

```
PASS tests/unit/mse.test.js
  mse
    ✓ calcula el error cuadratico medio de una serie de pronosticos (1 ms)
    ✓ devuelve 0 cuando el pronostico es exacto
    ✓ penaliza mas los errores grandes que los pequenos
    ✓ lanza un error si las series no tienen la misma longitud (1 ms)
    ✓ lanza un error si alguna de las series esta vacia

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
```

**Un detalle que la prueba de referencia nos enseñó.** Con los pronósticos redondeados a dos decimales (126,67 · 133,67 · 135,67) el MSE da 143,15, no 143,22. Para llegar a 143,22 hay que usar los pronósticos sin redondear. Por eso la prueba usa fracciones exactas (`380 / 3`, `401 / 3`, `407 / 3`) y lo deja anotado en un comentario. Salida real de comparar las dos entradas:

```
MSE con pronosticos redondeados a 2 decimales: 143.14890000000014
MSE con pronosticos sin redondear            : 143.22222222222229
```

**Refactor.** Igual que en `mad()`: `map` y `reduce` en lugar del `for`, y las validaciones en funciones con nombre:

```js
function mse(real, pronostico) {
  validarMismaLongitud(real, pronostico);
  validarAlMenosUnPeriodo(real);

  const erroresCuadrados = real.map((valorReal, i) => (valorReal - pronostico[i]) ** 2);
  const sumaErrores = erroresCuadrados.reduce((acumulado, error) => acumulado + error, 0);

  return sumaErrores / real.length;
}

function validarMismaLongitud(real, pronostico) {
  if (real.length !== pronostico.length) {
    throw new Error('Las series deben tener el mismo numero de periodos');
  }
}

function validarAlMenosUnPeriodo(real) {
  if (real.length === 0) {
    throw new Error('Se necesita al menos un periodo para calcular el MSE');
  }
}

module.exports = { mse };
```

```
PASS tests/unit/mse.test.js
  mse
    ✓ calcula el error cuadratico medio de una serie de pronosticos
    ✓ devuelve 0 cuando el pronostico es exacto
    ✓ penaliza mas los errores grandes que los pequenos
    ✓ lanza un error si las series no tienen la misma longitud (1 ms)
    ✓ lanza un error si alguna de las series esta vacia

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
```

Cinco pruebas, mismo resultado. Es el mismo refactor que `mad()`, y eso es intencional: dos métricas de error con la misma estructura son más fáciles de mantener.

### 3.4 `mape(real, pronostico)`

El error porcentual absoluto medio: cuánto nos equivocamos *en relación con la demanda real*, en porcentaje. Sirve para comparar entre productos con volúmenes muy distintos. Para la serie de referencia da 7,62 %.

**Rojo.** Seis pruebas: el valor de referencia, el pronóstico exacto, el caso límite de demanda real 0, el caso en que *toda* la demanda real es 0, y las dos validaciones de siempre.

```
FAIL tests/unit/mape.test.js
  ● Test suite failed to run

    Cannot find module '../../src/mape' from 'tests/unit/mape.test.js'

Test Suites: 1 failed, 1 total
Tests:       0 total
```

**Verde.** Un `for` que se salta los períodos con demanda real 0 y cuenta solo los que sí entran en el promedio:

```js
function mape(real, pronostico) {
  if (real.length !== pronostico.length) {
    throw new Error('Las series deben tener el mismo numero de periodos');
  }
  if (real.length === 0) {
    throw new Error('Se necesita al menos un periodo para calcular el MAPE');
  }

  let suma = 0;
  let periodosValidos = 0;
  for (let i = 0; i < real.length; i++) {
    if (real[i] === 0) {
      continue;
    }
    suma += Math.abs(real[i] - pronostico[i]) / real[i];
    periodosValidos++;
  }

  if (periodosValidos === 0) {
    throw new Error('Se necesita al menos un periodo con demanda real distinta de cero para calcular el MAPE');
  }
  return (suma / periodosValidos) * 100;
}

module.exports = { mape };
```

```
PASS tests/unit/mape.test.js
  mape
    ✓ calcula el error porcentual absoluto medio de una serie de pronosticos
    ✓ devuelve 0 cuando el pronostico es exacto
    ✓ excluye los periodos con demanda real 0 en vez de dividir entre cero
    ✓ lanza un error si toda la demanda real es 0 (1 ms)
    ✓ lanza un error si las series no tienen la misma longitud
    ✓ lanza un error si alguna de las series esta vacia

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
```

**Refactor.** Primero se construye la lista de errores porcentuales de los períodos válidos con `map`, `filter`, `map`, y luego se promedia. Además extrajimos las tres validaciones a funciones con nombre:

```js
function mape(real, pronostico) {
  validarMismaLongitud(real, pronostico);
  validarAlMenosUnPeriodo(real);

  // Con demanda real 0 el error porcentual no esta definido: ese periodo no cuenta
  const erroresPorcentuales = real
    .map((valorReal, i) => ({ valorReal, error: Math.abs(valorReal - pronostico[i]) }))
    .filter(({ valorReal }) => valorReal !== 0)
    .map(({ valorReal, error }) => error / valorReal);

  validarHayDemandaReal(erroresPorcentuales);

  const sumaErrores = erroresPorcentuales.reduce((acumulado, error) => acumulado + error, 0);
  return (sumaErrores / erroresPorcentuales.length) * 100;
}

function validarMismaLongitud(real, pronostico) {
  if (real.length !== pronostico.length) {
    throw new Error('Las series deben tener el mismo numero de periodos');
  }
}

function validarAlMenosUnPeriodo(real) {
  if (real.length === 0) {
    throw new Error('Se necesita al menos un periodo para calcular el MAPE');
  }
}

function validarHayDemandaReal(erroresPorcentuales) {
  if (erroresPorcentuales.length === 0) {
    throw new Error('Se necesita al menos un periodo con demanda real distinta de cero para calcular el MAPE');
  }
}

module.exports = { mape };
```

```
PASS tests/unit/mape.test.js
  mape
    ✓ calcula el error porcentual absoluto medio de una serie de pronosticos
    ✓ devuelve 0 cuando el pronostico es exacto (1 ms)
    ✓ excluye los periodos con demanda real 0 en vez de dividir entre cero
    ✓ lanza un error si toda la demanda real es 0 (1 ms)
    ✓ lanza un error si las series no tienen la misma longitud
    ✓ lanza un error si alguna de las series esta vacia

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
```

Seis pruebas, mismo resultado. El comentario sobre la demanda real 0 queda justo donde está el `filter`, que es donde alguien se preguntaría el porqué.

**Caso límite: demanda real = 0.** El error porcentual es `|real − pronóstico| / real`. Cuando `real` es 0 esa división no tiene sentido y JavaScript no lanza ningún error: devuelve `Infinity`, que contamina el promedio entero. Esto es lo que da la fórmula sin proteger, comparada con `src/mape.js`, en la misma serie `real = [0, 100, 200]`, `pronostico = [50, 90, 210]` (salida real):

```
MAPE sin excluir ceros: Infinity
MAPE de src/mape.js   : 7.500000000000001
```

Nuestra decisión es **excluir esos períodos del cálculo**: no cuentan ni en la suma ni en el divisor. En el ejemplo, el promedio queda sobre dos períodos, (10 % + 5 %) / 2 = 7,5 %. (El `7.500000000000001` es el redondeo habitual de coma flotante; por eso la prueba usa `toBeCloseTo` y no `toBe`.)

Dos consecuencias que conviene tener claras, porque son decisiones y no detalles:

- Un período con demanda real 0 y un pronóstico de 50 unidades no penaliza el MAPE, aunque fue un error. Ese error sí lo ven el MAD y el MSE, por eso conviene mirar las métricas juntas.
- Si **toda** la demanda real es 0, no queda ningún período con el que promediar. Lanzamos un error claro en lugar de devolver `NaN`, para que el problema se vea y no se propague en silencio al resto del sistema.

### 3.5 `regresionLineal(serie)`

Ajusta una recta por mínimos cuadrados a la serie, con el período como variable x (1, 2, ..., n), y devuelve `{ pendiente, intercepto, pronosticoSiguiente }`. La pendiente de 5,17 se lee como "la demanda sube unas 5,17 unidades por período".

**Rojo.** Cuatro pruebas: el valor de referencia (pendiente 5,17 · intercepto 116,73 · período 7 = 152,93), una serie perfectamente lineal (10, 20, 30, 40 debe dar pendiente 10 exacta, intercepto 0 y siguiente 50), una serie constante (pendiente 0) y el error con menos de dos períodos.

```
FAIL tests/unit/regresionLineal.test.js
  ● Test suite failed to run

    Cannot find module '../../src/regresionLineal' from 'tests/unit/regresionLineal.test.js'

Test Suites: 1 failed, 1 total
Tests:       0 total
```

**Verde.** La versión con sumas acumuladas (Σx, Σy, Σxy, Σx²) y la fórmula directa de mínimos cuadrados:

```js
function regresionLineal(serie) {
  if (serie.length < 2) {
    throw new Error('Se necesitan al menos dos periodos para ajustar la regresion');
  }

  const n = serie.length;
  let sumaX = 0;
  let sumaY = 0;
  let sumaXY = 0;
  let sumaXX = 0;
  for (let i = 0; i < n; i++) {
    const x = i + 1;
    sumaX += x;
    sumaY += serie[i];
    sumaXY += x * serie[i];
    sumaXX += x * x;
  }

  const pendiente = (n * sumaXY - sumaX * sumaY) / (n * sumaXX - sumaX * sumaX);
  const intercepto = (sumaY - pendiente * sumaX) / n;
  const pronosticoSiguiente = intercepto + pendiente * (n + 1);

  return { pendiente, intercepto, pronosticoSiguiente };
}

module.exports = { regresionLineal };
```

```
PASS tests/unit/regresionLineal.test.js
  regresionLineal
    ✓ ajusta la recta de la serie y pronostica el periodo 7 (1 ms)
    ✓ una serie perfectamente lineal da su pendiente exacta
    ✓ una serie constante tiene pendiente 0 y pronostica ese mismo valor
    ✓ lanza un error si la serie tiene menos de dos periodos (1 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

**Refactor.** Pasamos a la forma con desviaciones respecto de los promedios, `pendiente = Σ(x − x̄)(y − ȳ) / Σ(x − x̄)²`, que es la que aparece en los libros de texto y evita restar sumas muy grandes entre sí. Extrajimos `suma()`, `promedio()` y la validación:

```js
function regresionLineal(serie) {
  validarAlMenosDosPeriodos(serie);

  const n = serie.length;
  const periodos = serie.map((_, i) => i + 1);
  const promedioX = promedio(periodos);
  const promedioY = promedio(serie);

  const covarianza = suma(periodos.map((x, i) => (x - promedioX) * (serie[i] - promedioY)));
  const varianzaX = suma(periodos.map((x) => (x - promedioX) ** 2));

  const pendiente = covarianza / varianzaX;
  const intercepto = promedioY - pendiente * promedioX;

  return { pendiente, intercepto, pronosticoSiguiente: intercepto + pendiente * (n + 1) };
}

function suma(valores) {
  return valores.reduce((acumulado, valor) => acumulado + valor, 0);
}

function promedio(valores) {
  return suma(valores) / valores.length;
}

function validarAlMenosDosPeriodos(serie) {
  if (serie.length < 2) {
    throw new Error('Se necesitan al menos dos periodos para ajustar la regresion');
  }
}

module.exports = { regresionLineal };
```

```
PASS tests/unit/regresionLineal.test.js
  regresionLineal
    ✓ ajusta la recta de la serie y pronostica el periodo 7 (1 ms)
    ✓ una serie perfectamente lineal da su pendiente exacta
    ✓ una serie constante tiene pendiente 0 y pronostica ese mismo valor
    ✓ lanza un error si la serie tiene menos de dos periodos (1 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

Cuatro pruebas, mismos valores. Las dos versiones calculan lo mismo; la segunda se parece a la definición, así que es más fácil de revisar con alguien que no escribió el código.

**Un límite que sí tiene su propia prueba.** Con una sola observación, `Σ(x − x̄)²` es 0 y la pendiente sería 0 / 0 (`NaN`). Una recta necesita al menos dos puntos, así que la función lanza un error en vez de devolver un número sin sentido.

---

## Parte 4 — Prueba de integración

`POST /api/pronosticos` recibe `{ serie, ventana }` y responde con los pronósticos de `promedioMovil`. Es un servidor Express real (`src/app.js`); Supertest lo levanta por su cuenta en un puerto libre, así que no hace falta arrancar el servidor para probarlo. Cubre el camino feliz y los casos en que el cliente se equivoca: ventana demasiado grande, serie con valores que no son números, JSON mal formado y petición sin cuerpo.

La prueba se escribió primero y falló por el mismo motivo de siempre (el módulo `src/app` no existía):

```
FAIL tests/integration/pronosticos.test.js
  ● Test suite failed to run

    Cannot find module '../../src/app' from 'tests/integration/pronosticos.test.js'

Test Suites: 1 failed, 1 total
Tests:       0 total
```

Ya con el endpoint, la prueba de la petición sin cuerpo falló por una razón distinta: en Express 5 `req.body` es `undefined` cuando no hay cuerpo, y la desestructuración devolvía un error 500 en lugar de un 400:

```
FAIL tests/integration/pronosticos.test.js
  POST /api/pronosticos
    ✓ devuelve el promedio movil de la serie enviada (13 ms)
    ✓ responde 400 con el motivo si la ventana es mayor que la serie (4 ms)
    ✓ responde 400 si la serie no es un arreglo de numeros (1 ms)
    ✓ responde 400 si el cuerpo no es un JSON valido (1 ms)
    ✕ responde 400 si la peticion no trae cuerpo (3 ms)
Tests:       1 failed, 4 passed, 5 total
```

Con `req.body ?? {}` en el endpoint quedaron las cinco en verde:

```
PASS tests/integration/pronosticos.test.js
  POST /api/pronosticos
    ✓ devuelve el promedio movil de la serie enviada (13 ms)
    ✓ responde 400 con el motivo si la ventana es mayor que la serie (3 ms)
    ✓ responde 400 si la serie no es un arreglo de numeros
    ✓ responde 400 si el cuerpo no es un JSON valido (1 ms)
    ✓ responde 400 si la peticion no trae cuerpo (1 ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
```

El servidor real se levanta con `npm start` (puerto 3000 por defecto, o el de la variable `PORT`).

## Parte 5 — Prueba E2E con Playwright

Esta prueba **sí corre contra un servidor real**, no es una plantilla. Para no depender de un frontend que todavía no existe, agregamos una pantalla mínima de carga de datos (`public/index.html` y `public/carga.js`) que sirve el mismo Express. Playwright levanta el servidor en el puerto 3100, abre Chromium, escribe la serie, pulsa "Cargar datos" y verifica el mensaje de confirmación y los pronósticos en pantalla.

Cuando exista el frontend definitivo, la prueba se reutiliza cambiando `baseURL` y los selectores; la pantalla de aquí es solo lo suficiente para ejercitarla.

```
Running 2 tests using 1 worker

  ✓  1 tests/e2e/carga-datos.spec.js:4:3 › Pantalla de carga de datos › confirma la carga y muestra los pronosticos del promedio movil (195ms)
  ✓  2 tests/e2e/carga-datos.spec.js:15:3 › Pantalla de carga de datos › muestra el motivo cuando la ventana es demasiado grande (165ms)

  2 passed (819ms)
```

## Parte 6 — Integración continua

`.github/workflows/tests.yml` tiene dos jobs. El de `javascript` instala dependencias con `npm ci`, corre `npm run lint`, después `npm test -- --coverage` y sube la carpeta `coverage/` como artefacto (con `if: always()`, para tener el reporte aunque una prueba falle). El de `python` usa `astral-sh/setup-uv`, instala con `uv sync --all-extras --dev` y corre `uv run ruff check .` y `uv run pytest -v`. Si el lint falla, el job se detiene antes de llegar a las pruebas. No hay job de Java: el análisis estático de Java todavía no lo vemos en el curso.

Dos aclaraciones honestas:

- **No lo hemos visto correr en GitHub todavía.** Validamos que el YAML es sintácticamente correcto, que `npm ci` es consistente con `package-lock.json` y que `npm run lint` y `npm test -- --coverage` funcionan en local (reporte abajo). Lo mismo con `uv run ruff check .` y `uv run pytest -v` para el job de Python.
- **Ubicación.** GitHub solo ejecuta los flujos que están en `.github/workflows/` en la **raíz del repositorio**. Por eso el archivo vive ahí (`../.github/workflows/tests.yml`) y no dentro de `javascript/`; cada job fija su `working-directory` y el filtro de rutas mira `javascript/` y `python/`. Usamos las versiones mayores vigentes de `checkout`, `setup-node` y `upload-artifact` (v7) y `astral-sh/setup-uv@v10.3.3`: desde la v8 esa acción solo publica tags exactos, no uno flotante como `@v10`.

Cobertura local, salida real de `npm test -- --coverage` (después del refactor de la Parte 8, que agregó `validaciones.js`):

```
---------------------------|---------|----------|---------|---------|-------------------
File                       | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
---------------------------|---------|----------|---------|---------|-------------------
All files                  |   99.01 |    96.87 |     100 |   98.88 |                   
 alertas.js                |     100 |      100 |     100 |     100 |                   
 app.js                    |   95.23 |       90 |     100 |      95 | 29                
 mad.js                    |     100 |      100 |     100 |     100 |                   
 mape.js                   |     100 |      100 |     100 |     100 |                   
 mse.js                    |     100 |      100 |     100 |     100 |                   
 promedioMovil.js          |     100 |      100 |     100 |     100 |                   
 regresionLineal.js        |     100 |      100 |     100 |     100 |                   
 suavizacionExponencial.js |     100 |      100 |     100 |     100 |                   
 validaciones.js           |     100 |      100 |     100 |     100 |                   
---------------------------|---------|----------|---------|---------|-------------------
Test Suites: 8 passed, 8 total
Tests:       37 passed, 37 total
```

La única línea sin cubrir de `app.js` (la 29) es el reenvío de errores desconocidos al manejador por defecto de Express.

---

## Parte 7 — Análisis estático con ESLint

El análisis estático revisa el código sin ejecutarlo. Usamos ESLint 10 con el formato de configuración plano (`eslint.config.js`); el antiguo `.eslintrc` ya no existe en esa versión.

```bash
npm run lint
```

Partimos de `js.configs.recommended` y le sumamos dos reglas en `error`: `no-unused-vars` (una variable que nadie usa casi siempre es un resto de un cambio a medias) y `eqeqeq` (`==` convierte tipos sin avisar y `===` no). Comprobamos que las reglas están vivas pasando por ESLint un archivo de prueba con una variable sin usar y un `==`: marcó las dos.

### La advertencia que corregimos: `no-undef`

Con la configuración mínima, sin decirle a ESLint en qué entorno corre cada archivo, la primera corrida dio **135 errores en todo el proyecto** (antes del refactor de la Parte 8; con `validaciones.js` serían 139). Ninguno era un defecto del código: todos eran `no-undef`, porque ESLint no sabía que `module`, `require`, `process`, `describe` o `document` existen. Salida real sobre los dos archivos de la kata original (rutas recortadas):

```
src/alertas.js
  5:1  error  'module' is not defined  no-undef

src/mad.js
  23:1  error  'module' is not defined  no-undef

✖ 2 problems (2 errors, 0 warnings)
```

Silenciar eso con `eslint-disable` habría escondido un problema real de configuración, así que declaramos los entornos en `eslint.config.js` con el paquete `globals`:

- Todo `**/*.js` es CommonJS con los globales de Node (usamos `require` y `module.exports`).
- Las carpetas `tests/unit` y `tests/integration` suman los globales de Jest.
- `public/` es un script de navegador, con los globales de `browser` (`document`, `fetch`).
- `coverage/`, `playwright-report/` y `test-results/` se ignoran: son salida de otras herramientas.

Después, sobre los mismos archivos, ESLint no imprime nada y termina con código 0.

El resto del código (`mad.js`, `alertas.js` y las cinco funciones de pronóstico) no tenía `==` ni variables sin usar, así que no hubo que cambiar una sola línea de lógica por el lint. Tampoco usamos ningún `eslint-disable`.

### Salida real al final

```
> kata-tdd-bdd-semana4@1.0.0 lint
> eslint .
```

Cero errores de lint y código de salida 0.

Una nota sobre el archivo de configuración: está escrito en CommonJS (`require` y `module.exports`) y no con `import`. Como `package.json` no declara `"type": "module"` y todo `src/` es CommonJS, escribirlo como módulo hacía que Node imprimiera en cada corrida el aviso `MODULE_TYPELESS_PACKAGE_JSON` (en nuestra primera versión sí aparecía). Con `require` ese aviso desaparece y el archivo sigue siendo `eslint.config.js`, que es el único formato que admite ESLint 10.

---

## Parte 8 — Clean Code aplicado a `mad()`

Revisamos `mad()` contra los cuatro principios que vimos en clase:

| Principio | `mad()` antes del cambio |
|---|---|
| Nombres que explican | Cumple: `erroresAbsolutos`, `sumaErrores`, `validarMismaLongitud` dicen lo que son. |
| Funciones pequeñas, una sola responsabilidad | Cumple: calcula y delega las validaciones. |
| Sin duplicación | **No cumple.** `validarMismaLongitud` estaba copiada idéntica en `mad.js`, `mse.js` y `mape.js`; `validarAlMenosUnPeriodo` también, y solo cambiaba el nombre de la métrica dentro del mensaje. |
| Comentarios que explican el porqué | Cumple: `mad.js` no tiene comentarios porque no hace falta ninguno. |

Antes, `mad.js` (y casi igual `mse.js` y `mape.js`):

```javascript
function mad(real, pronostico) {
  validarMismaLongitud(real, pronostico);
  validarAlMenosUnPeriodo(real);
  // …
}

function validarMismaLongitud(real, pronostico) {
  if (real.length !== pronostico.length) {
    throw new Error('Las series deben tener el mismo numero de periodos');
  }
}

function validarAlMenosUnPeriodo(real) {
  if (real.length === 0) {
    throw new Error('Se necesita al menos un periodo para calcular el MAD');
  }
}
```

Si mañana cambiaba el mensaje o la regla, había que acordarse de tocar tres archivos. Extrajimos las dos validaciones a `src/validaciones.js`, y la métrica pasa como parámetro para que cada mensaje siga igual que antes:

```javascript
// src/validaciones.js
function validarMismaLongitud(real, pronostico) {
  if (real.length !== pronostico.length) {
    throw new Error('Las series deben tener el mismo numero de periodos');
  }
}

function validarAlMenosUnPeriodo(real, metrica) {
  if (real.length === 0) {
    throw new Error(`Se necesita al menos un periodo para calcular el ${metrica}`);
  }
}
```

Después, `mad.js` (igual `mse.js` con `'MSE'` y `mape.js` con `'MAPE'`):

```javascript
const { validarMismaLongitud, validarAlMenosUnPeriodo } = require('./validaciones');

function mad(real, pronostico) {
  validarMismaLongitud(real, pronostico);
  validarAlMenosUnPeriodo(real, 'MAD');

  const erroresAbsolutos = real.map((valorReal, i) => Math.abs(valorReal - pronostico[i]));
  const sumaErrores = erroresAbsolutos.reduce((acumulado, error) => acumulado + error, 0);

  return sumaErrores / real.length;
}
```

No tocamos ninguna prueba. Son las mismas 37 de antes (los mensajes de error que ya comprobaban siguen intactos) y `npm run lint` sigue sin errores:

```
Test Suites: 8 passed, 8 total
Tests:       37 passed, 37 total
```

Lo que dejamos sin tocar a propósito: `suma` y `promedio` también se repiten entre `promedioMovil.js` y `regresionLineal.js`, y `validarHayDemandaReal` es propia del MAPE. Es el mismo tipo de mejora, pero no la hicimos en este paso para no mezclar varios cambios.

---

## Estructura

```
javascript/
├── src/
│   ├── mad.js
│   ├── alertas.js
│   ├── promedioMovil.js
│   ├── suavizacionExponencial.js
│   ├── mse.js
│   ├── mape.js
│   ├── regresionLineal.js
│   ├── validaciones.js   ← validaciones compartidas por mad, mse y mape
│   ├── app.js            ← endpoint de Express (para la integración y la E2E)
│   └── server.js         ← arranca el servidor
├── public/               ← pantalla mínima de carga de datos (la usa la E2E)
├── tests/
│   ├── unit/             ← *.test.js, alertas.steps.js y alertas.feature
│   ├── integration/
│   └── e2e/
├── eslint.config.js
├── playwright.config.js
├── package.json
└── README.md
```

## Resultado final de `npm test`

Salida real de `npm test` al terminar esta fase:

```
PASS tests/integration/pronosticos.test.js
  POST /api/pronosticos
    ✓ devuelve el promedio movil de la serie enviada (13 ms)
    ✓ responde 400 con el motivo si la ventana es mayor que la serie (3 ms)
    ✓ responde 400 si la serie no es un arreglo de numeros (1 ms)
    ✓ responde 400 si el cuerpo no es un JSON valido (2 ms)
    ✓ responde 400 si la peticion no trae cuerpo (1 ms)

PASS tests/unit/alertas.steps.js
  Alertas de desviación del pronóstico
    ✓ El error supera el umbral configurado
    ✓ El error no supera el umbral configurado
    ✓ El error es exactamente igual al umbral

PASS tests/unit/suavizacionExponencial.test.js
  suavizacionExponencial
    ✓ con alpha 0.3 el pronostico del periodo 7 es 137.5546 (1 ms)
    ✓ devuelve un pronostico por periodo y el del periodo 2 es la demanda del periodo 1
    ✓ con alpha 0 el pronostico nunca se corrige y queda en la primera demanda
    ✓ con alpha 1 el pronostico es la demanda real del periodo anterior
    ✓ lanza un error si alpha esta fuera del rango de 0 a 1 (4 ms)
    ✓ lanza un error si la serie esta vacia

PASS tests/unit/regresionLineal.test.js
  regresionLineal
    ✓ ajusta la recta de la serie y pronostica el periodo 7
    ✓ una serie perfectamente lineal da su pendiente exacta (1 ms)
    ✓ una serie constante tiene pendiente 0 y pronostica ese mismo valor
    ✓ lanza un error si la serie tiene menos de dos periodos (1 ms)

PASS tests/unit/promedioMovil.test.js
  promedioMovil
    ✓ pronostica los periodos 4, 5 y 6 con una ventana de 3
    ✓ con ventana de 1 el pronostico repite la demanda del periodo anterior
    ✓ lanza un error si la ventana no es un entero mayor o igual a 1 (1 ms)
    ✓ lanza un error si la ventana no es menor que el numero de periodos

PASS tests/unit/mse.test.js
  mse
    ✓ calcula el error cuadratico medio de una serie de pronosticos (1 ms)
    ✓ devuelve 0 cuando el pronostico es exacto
    ✓ penaliza mas los errores grandes que los pequenos
    ✓ lanza un error si las series no tienen la misma longitud (1 ms)
    ✓ lanza un error si alguna de las series esta vacia

PASS tests/unit/mape.test.js
  mape
    ✓ calcula el error porcentual absoluto medio de una serie de pronosticos
    ✓ devuelve 0 cuando el pronostico es exacto
    ✓ excluye los periodos con demanda real 0 en vez de dividir entre cero
    ✓ lanza un error si toda la demanda real es 0 (1 ms)
    ✓ lanza un error si las series no tienen la misma longitud
    ✓ lanza un error si alguna de las series esta vacia

PASS tests/unit/mad.test.js
  mad
    ✓ calcula el error absoluto medio de una serie de pronosticos
    ✓ devuelve 0 cuando el pronostico es exacto
    ✓ lanza un error si las series no tienen la misma longitud (1 ms)
    ✓ lanza un error si alguna de las series esta vacia

Test Suites: 8 passed, 8 total
Tests:       37 passed, 37 total
```

La prueba E2E se corre aparte con `npm run test:e2e` (2 pruebas, ver la Parte 5).

## Qué nos llevamos de este ejercicio

El rojo no es un trámite: nos obligó a decidir antes de programar qué significaba "bien" en cada función (el valor de referencia, el caso límite, el mensaje de error). Casi todos los hallazgos del ejercicio salieron de ahí: el MSE que da 143,15 o 143,22 según se redondee, el `Infinity` del MAPE con demanda 0, el alpha en 0 y en 1 y el `>=` del umbral.

El refactor solo se puede hacer con confianza porque las pruebas no cambian mientras el código sí. Y BDD y TDD no compiten: BDD sirve para acordar con Producción la regla de negocio (cuándo se alerta), TDD para construir con rigor los cálculos que esa regla usa.
