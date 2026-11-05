# Kata TDD y BDD — Semana 4

Este repositorio es el ejercicio de pruebas de software de la semana 4 del proyecto **"Sistema web para la predicción de la demanda en producción industrial"**. Trabajamos dos técnicas sobre cálculos reales del sistema (el error de un pronóstico y las alertas de desviación):

- **TDD** (desarrollo guiado por pruebas), con el ciclo rojo-verde-refactor.
- **BDD** (desarrollo guiado por comportamiento), con escenarios Dado-Cuando-Entonces en español.

Este archivo explica el ejercicio completo. Para entenderlo no hace falta abrir ninguna de las tres carpetas; las carpetas guardan el detalle paso a paso, con la salida real de la consola.

## Por qué hay tres carpetas

| Carpeta | Qué es | Alcance |
|---|---|---|
| [`javascript/`](javascript/README.md) | **El kit real del proyecto.** Es el stack en el que se construye el sistema. | Kit completo: promedio móvil, suavización exponencial, MAD, MSE, MAPE, regresión lineal, alertas, un endpoint con prueba de integración, una prueba E2E y CI |
| [`python/`](python/README.md) | Material de referencia | Solo la kata base: `mad` y `debe_generar_alerta` |
| [`java/`](java/README.md) | Material de referencia | Solo la kata base: `Mad` y `debeGenerarAlerta` |

`python/` y `java/` **no implican que el proyecto cambie de lenguaje.** Existen para que cualquier estudiante vea el mismo ejercicio en otro stack y entienda que TDD y BDD son una forma de trabajar, no una característica de un framework. Por eso no duplican el kit: reproducen solo las dos funciones de la kata base.

## TDD y BDD, como lo entendemos nosotros

### TDD: rojo, verde, refactor

TDD es escribir la prueba antes que el código, en tres pasos que se repiten:

1. **Rojo.** Escribimos la prueba y la corremos. Tiene que fallar. Si pasara sin que exista el código, la prueba no estaría comprobando nada.
2. **Verde.** Escribimos lo mínimo que hace pasar la prueba, aunque quede feo.
3. **Refactor.** Con todo en verde, mejoramos la forma del código (nombres, funciones pequeñas, menos repetición) sin cambiar lo que hace. Las mismas pruebas, sin tocarlas, son las que demuestran que no rompimos nada.

El ejemplo del ejercicio es el **MAD** (desviación absoluta media): el promedio de cuánto nos equivocamos con el pronóstico, sin importar si fue por arriba o por abajo. Con la demanda real de tres períodos (141, 138, 150) y un pronóstico de promedio móvil (126,67 · 133,67 · 135,67), los errores absolutos son 14,33 · 4,33 · 14,33 y el MAD da **11,00**. Ese número es la prueba: primero la escribimos, la vemos fallar porque la función no existe, luego escribimos el cálculo más directo (un `for`) y por último lo reescribimos más legible (`map`/`reduce` en JavaScript, comprensión de lista en Python, `IntStream` en Java) con las mismas pruebas en verde.

### BDD: Dado, Cuando, Entonces

BDD es describir el comportamiento con frases que también entiende alguien de Producción, no solo quien programa. Cada escenario tiene tres partes: **Dado** (el contexto de partida), **Cuando** (lo que ocurre) y **Entonces** (lo que esperamos). Cada frase se conecta con código, así la especificación y la prueba son el mismo archivo.

El ejemplo del ejercicio es la regla de alertas: el sistema avisa al planeador cuando el error del pronóstico llega a un umbral. Los tres escenarios son:

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

El tercer escenario es el que más importa: fija que un error **exactamente igual** al umbral sí genera alerta (`>=` y no `>`). Es una decisión de negocio que hay que acordar con Producción antes de programar. Y la prueba la protege: en cada carpeta cambiamos `>=` por `>` para comprobarlo, y los escenarios 1 y 2 siguieron en verde mientras que el 3 fue el único que se puso rojo. Sin él, el cambio habría pasado sin que nadie lo notara.

### Cómo se complementan

BDD sirve para acordar la regla de negocio (cuándo se alerta) en un lenguaje común; TDD sirve para construir con rigor los cálculos que esa regla usa (el error que se compara con el umbral). En el ejercicio, el `.feature` de las alertas es **el mismo archivo, byte a byte**, en las tres carpetas: la especificación no depende del lenguaje.

## Tabla comparativa

| | JavaScript (`javascript/`) | Python (`python/`) | Java (`java/`) |
|---|---|---|---|
| Rol | Kit real del proyecto | Referencia pedagógica | Referencia pedagógica |
| Versión con la que validamos | Node 24.19.0 · npm 11.17.0 | Python 3.13.5 · pip 25.1.1 | Java 25.0.4 · Maven 3.9.16 |
| Pruebas unitarias | Jest 30 | pytest 9.1.1 | JUnit 5.13.4 |
| BDD | jest-cucumber | pytest-bdd 9.0.0 | Cucumber-JVM 7.23.0 |
| Función del MAD | `mad(real, pronostico)` | `mad(real, pronostico)` | `Mad.mad(real, pronostico)` |
| Función de alertas | `debeGenerarAlerta` | `debe_generar_alerta` | `debeGenerarAlerta` |
| Convención de nombres | `camelCase` | `snake_case` | `camelCase` |
| Error de validación | `Error` | `ValueError` | `IllegalArgumentException` |
| Tolerancia del valor 11,00 | `toBeCloseTo(11.00, 2)` | `pytest.approx(11.00, abs=0.01)` | `assertEquals(11.00, resultado, 0.01)` |
| Cómo se manifiesta el rojo | Jest: `Cannot find module` | pytest: `ModuleNotFoundError` al recolectar | Maven: error de compilación `cannot find symbol` |
| Comando | `npm test` | `pytest -v` | `mvn test` |
| Resultado de la última corrida | 37 pruebas en verde (8 suites) | 7 pruebas en verde | 7 pruebas en verde (4 JUnit + 3 escenarios) |
| Más pruebas | Integración (Supertest): 5 · E2E (Playwright): 2 | — | — |

Las funciones de la kata base se prueban con los mismos datos en las tres carpetas, y los tres rojos fallan por la misma razón de fondo: el código que la prueba pide todavía no existe.

## Material de la semana 5

- [`demo-analisis-estatico/`](demo-analisis-estatico/): mini proyecto independiente para la demostración en vivo de análisis estático. Tiene un archivo descuidado a propósito, su versión limpia y una prueba que comprueba que las dos se comportan igual. No forma parte del pipeline.
- [`docs/semana5/`](docs/semana5/): la guía de estudio, el guion de la demostración, la actividad individual y su solucionario (este último es solo para el docente).

## Dónde está cada detalle

Cada README de lenguaje cuenta el camino completo, con la salida real de la consola en cada paso y una explicación de qué significa.

- **[`javascript/README.md`](javascript/README.md)**: el ciclo rojo-verde-refactor de `mad` y de las cinco funciones nuevas (`promedioMovil`, `suavizacionExponencial`, `mse`, `mape`, `regresionLineal`), los casos límite (alpha = 0 y alpha = 1, demanda real = 0 en el MAPE), el BDD de las alertas, la prueba de integración, la E2E, el análisis estático con ESLint, un refactor de Clean Code, la CI y cómo correr cada tipo de prueba por separado.
- **[`python/README.md`](python/README.md)**: el ciclo completo de `mad` con `pytest -v` en cada paso, el porqué de cada escenario BDD y la migración a uv con el análisis estático de ruff.
- **[`java/README.md`](java/README.md)**: lo mismo con `mvn test`.

## Cómo correr todo

```bash
# JavaScript
cd javascript && npm install && npm run lint && npm test

# Python
cd python && uv sync && uv run ruff check . && uv run pytest -v

# Java
cd java && mvn test
```

La E2E de JavaScript se corre aparte (`npm run test:e2e`) y necesita `npx playwright install chromium`. La CI está en `.github/workflows/tests.yml`, en la raíz, que es donde GitHub la ejecuta. Tiene un job por lenguaje: lint y pruebas en JavaScript, ruff y pytest en Python. En ambos el lint corre antes de las pruebas.

## Qué nos llevamos de este ejercicio

El rojo no es un trámite: nos obliga a decidir antes de programar qué significa "bien" (el valor de referencia, el caso límite, el mensaje de error). Casi todos los hallazgos salieron de ahí: el `>=` del umbral, el MSE que da 143,15 o 143,22 según se redondee el pronóstico, el `Infinity` del MAPE con demanda real 0.

Ver el mismo ciclo en tres lenguajes confirma que la disciplina vive en el orden de los pasos y no en las herramientas. Y el `.feature` compartido muestra que la regla de negocio se escribe una sola vez, en español, y cada stack solo aporta el código que la hace verificable.
