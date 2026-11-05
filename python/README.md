# Kata TDD y BDD en Python — referencia pedagógica

Esta carpeta reproduce **solo la kata base** (`mad` y `debe_generar_alerta`) en Python con pytest. No es parte del sistema: el stack real del proyecto es JavaScript (ver `../javascript/`). La hicimos para que cualquiera del equipo pueda comprobar que TDD y BDD no dependen del framework: el ciclo es el mismo, solo cambian las herramientas.

## Requisitos e instalación

Validamos con Python **3.13.5**, **uv 0.12.3** y **ruff 0.17.3**. Usamos [uv](https://docs.astral.sh/uv/) como gestor de paquetes: en una sola herramienta reemplaza a pip, venv y requirements.txt.

```bash
cd python
uv sync                 # crea .venv e instala las dependencias de uv.lock
uv run pytest -v        # pruebas
uv run ruff check .     # análisis estático
```

Para sumar una dependencia de desarrollo usamos `uv add --dev <paquete>`; actualiza `pyproject.toml` y `uv.lock`. Todos los comandos corren con `uv run`, así que no hace falta activar el entorno a mano.

Versionamos `pyproject.toml` y `uv.lock` (el segundo fija las versiones exactas para que todo el equipo y la CI instalen lo mismo). No versionamos `.venv/`: el `.gitignore` de la raíz ya lo excluye.

`pyproject.toml` fija `pytest==9.1.1` y `pytest-bdd==9.0.0`. No usamos pytest 9.2 porque `pytest-bdd` 9.0.0 todavía depende de una API interna de pytest que cambió en esa versión: con 9.2 las tres pruebas BDD fallan con un `AttributeError` dentro de la librería, sin que tenga que ver con nuestro código. Por eso, al agregar las dependencias con `uv add --dev`, fijamos la versión de pytest en lugar de dejar que uv tome la más reciente. `pytest.ini` solo indica que la carpeta `python/` va en el path de importación, para poder escribir `from src.mad import mad`.

## TDD y BDD, como lo entendemos nosotros

**TDD** es escribir la prueba antes que el código. Tiene tres pasos que se repiten:

1. **Rojo**: escribimos la prueba y la corremos. Tiene que fallar. Si no falla, la prueba no está comprobando nada nuevo.
2. **Verde**: escribimos lo mínimo que hace pasar la prueba, aunque quede feo.
3. **Refactor**: con las pruebas en verde mejoramos la forma del código sin cambiar lo que hace. Las mismas pruebas, sin tocarlas, demuestran que no rompimos nada.

**BDD** es describir el comportamiento con frases que también entiende alguien de Producción. Cada escenario se redacta como **Dado** (el contexto), **Cuando** (lo que ocurre) y **Entonces** (lo que esperamos), y cada frase se conecta con código. Lo usamos para las reglas de negocio que conviene acordar con el área usuaria, como cuándo se dispara una alerta.

## Estructura

```
python/
├── src/
│   ├── mad.py
│   └── alertas.py
├── tests/
│   ├── test_mad.py
│   ├── alertas.feature
│   └── test_alertas_steps.py
├── .python-version
├── pyproject.toml     ← dependencias y configuración de ruff
├── uv.lock
├── pytest.ini
└── README.md
```

| Función | Qué calcula | Valor de referencia que verifica |
|---|---|---|
| `mad(real, pronostico)` | Error absoluto medio | 11,00 (`pytest.approx(11.00, abs=0.01)`) |
| `debe_generar_alerta(error_porcentual, umbral_porcentual)` | `True` si `error >= umbral` | 12 vs 10 → alerta · 7 vs 10 → no · 10 vs 10 → alerta |

Los datos son los mismos del kit de JavaScript: la demanda real de los períodos 4 a 6 (141, 138, 150) frente al pronóstico de promedio móvil de 3 períodos (126,67 · 133,67 · 135,67).

---

## Parte 1 — `mad()` con TDD

El MAD (desviación absoluta media) es el promedio de cuánto nos equivocamos, sin importar si fue por arriba o por abajo.

### Rojo

Escribimos `tests/test_mad.py` antes de que existiera `src/mad.py`. Cuatro pruebas: el valor de referencia, que un pronóstico exacto da 0, y las dos validaciones (series de distinta longitud y series vacías).

```python
import pytest

from src.mad import mad


def test_calcula_el_error_absoluto_medio_de_una_serie_de_pronosticos():
    real = [141, 138, 150]
    pronostico = [126.67, 133.67, 135.67]

    assert mad(real, pronostico) == pytest.approx(11.00, abs=0.01)


def test_devuelve_0_cuando_el_pronostico_es_exacto():
    assert mad([100, 100], [100, 100]) == 0


def test_lanza_un_error_si_las_series_no_tienen_la_misma_longitud():
    with pytest.raises(ValueError, match="mismo numero de periodos"):
        mad([100, 110], [100])


def test_lanza_un_error_si_alguna_de_las_series_esta_vacia():
    with pytest.raises(ValueError, match="al menos un periodo"):
        mad([], [])
```

Salida de `pytest -v` (omitimos las líneas con rutas de nuestro equipo y el fragmento interno del import):

```
============================= test session starts ==============================
platform darwin -- Python 3.13.5, pytest-9.1.1, pluggy-1.7.0
plugins: bdd-9.0.0
collecting ... collected 0 items / 1 error

==================================== ERRORS ====================================
______________________ ERROR collecting tests/test_mad.py ______________________
tests/test_mad.py:3: in <module>
    from src.mad import mad
E   ModuleNotFoundError: No module named 'src.mad'
=========================== short test summary info ============================
ERROR tests/test_mad.py
!!!!!!!!!!!!!!!!!!!! Interrupted: 1 error during collection !!!!!!!!!!!!!!!!!!!!
=============================== 1 error in 0.04s ===============================
```

No se ejecuta ninguna prueba: pytest ni siquiera puede importar el módulo (`collected 0 items / 1 error`). Es el rojo correcto, porque confirma que la prueba corre de verdad y que no puede pasar por accidente: todavía no hay nada que pueda estar bien.

### Verde

Escribimos lo mínimo que hace pasar las cuatro pruebas: las dos validaciones al principio y un `for` que acumula el error absoluto de cada período.

```python
def mad(real, pronostico):
    if len(real) != len(pronostico):
        raise ValueError("Las series deben tener el mismo numero de periodos")
    if len(real) == 0:
        raise ValueError("Se necesita al menos un periodo para calcular el MAD")

    suma = 0
    for i in range(len(real)):
        suma += abs(real[i] - pronostico[i])
    return suma / len(real)
```

```
============================= test session starts ==============================
platform darwin -- Python 3.13.5, pytest-9.1.1, pluggy-1.7.0
plugins: bdd-9.0.0
collecting ... collected 4 items

tests/test_mad.py::test_calcula_el_error_absoluto_medio_de_una_serie_de_pronosticos PASSED [ 25%]
tests/test_mad.py::test_devuelve_0_cuando_el_pronostico_es_exacto PASSED [ 50%]
tests/test_mad.py::test_lanza_un_error_si_las_series_no_tienen_la_misma_longitud PASSED [ 75%]
tests/test_mad.py::test_lanza_un_error_si_alguna_de_las_series_esta_vacia PASSED [100%]

============================== 4 passed in 0.00s ===============================
```

Las cuatro pasan. El primer caso usa `pytest.approx(11.00, abs=0.01)`: la tolerancia de 0,01 vive dentro de la prueba, así que no depende de que alguien recuerde que el 11 es aproximado (los pronósticos de entrada están redondeados a dos decimales, y el MAD exacto con ellos es 10,9967). Los otros tres fijan que un pronóstico exacto da 0 y que series de distinta longitud o vacías lanzan un `ValueError` con un mensaje claro, en lugar de devolver un número sin sentido o fallar con una división entre cero.

### Refactor

Con las pruebas en verde, cambiamos el `for` por una comprensión de lista con `zip`, usamos `sum()` y movimos cada validación a una función con nombre (`_validar_misma_longitud`, `_validar_al_menos_un_periodo`; el guion bajo inicial es la convención de Python para funciones de uso interno del módulo):

```python
def mad(real, pronostico):
    _validar_misma_longitud(real, pronostico)
    _validar_al_menos_un_periodo(real)

    errores_absolutos = [abs(real_i - pronostico_i) for real_i, pronostico_i in zip(real, pronostico)]
    return sum(errores_absolutos) / len(real)


def _validar_misma_longitud(real, pronostico):
    if len(real) != len(pronostico):
        raise ValueError("Las series deben tener el mismo numero de periodos")


def _validar_al_menos_un_periodo(real):
    if len(real) == 0:
        raise ValueError("Se necesita al menos un periodo para calcular el MAD")
```

```
============================= test session starts ==============================
platform darwin -- Python 3.13.5, pytest-9.1.1, pluggy-1.7.0
plugins: bdd-9.0.0
collecting ... collected 4 items

tests/test_mad.py::test_calcula_el_error_absoluto_medio_de_una_serie_de_pronosticos PASSED [ 25%]
tests/test_mad.py::test_devuelve_0_cuando_el_pronostico_es_exacto PASSED [ 50%]
tests/test_mad.py::test_lanza_un_error_si_las_series_no_tienen_la_misma_longitud PASSED [ 75%]
tests/test_mad.py::test_lanza_un_error_si_alguna_de_las_series_esta_vacia PASSED [100%]

============================== 4 passed in 0.00s ===============================
```

Las mismas cuatro pruebas, sin tocarlas, dan el mismo resultado. Cambió la forma, no el comportamiento, y las pruebas son quienes lo demuestran.

---

## Parte 2 — `debe_generar_alerta()` con BDD

`tests/alertas.feature` es el **mismo archivo, byte a byte**, que usan el kit de JavaScript y el de Java. La especificación no cambia aunque cambie el lenguaje:

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

`tests/test_alertas_steps.py` conecta cada frase con código usando `pytest-bdd`:

```python
from pytest_bdd import given, parsers, scenarios, then, when

from src.alertas import debe_generar_alerta

scenarios("alertas.feature")


@given(parsers.parse("un umbral de alerta configurado en {umbral:d} %"), target_fixture="umbral")
def umbral_configurado(umbral):
    return umbral


@when(parsers.parse("el error del pronóstico es {error:d} %"), target_fixture="resultado")
def error_del_pronostico(umbral, error):
    return debe_generar_alerta(error, umbral)


@then("se debe generar una alerta")
def se_genera_alerta(resultado):
    assert resultado is True


@then("no se debe generar una alerta")
def no_se_genera_alerta(resultado):
    assert resultado is False
```

- `scenarios("alertas.feature")` crea una prueba de pytest por cada *Escenario* del archivo.
- `parsers.parse("... {umbral:d} %")` extrae el número de la frase, así que el mismo paso sirve para cualquier umbral.
- `target_fixture` es la forma en que el valor viaja de un paso al siguiente: lo que devuelve el *Dado* (`umbral`) llega como argumento al *Cuando*, y lo que devuelve el *Cuando* (`resultado`) llega al *Entonces*.

La lógica es una sola línea, en `snake_case`:

```python
def debe_generar_alerta(error_porcentual, umbral_porcentual):
    return error_porcentual >= umbral_porcentual
```

```
============================= test session starts ==============================
platform darwin -- Python 3.13.5, pytest-9.1.1, pluggy-1.7.0
plugins: bdd-9.0.0
collecting ... collected 3 items

tests/test_alertas_steps.py::test_el_error_supera_el_umbral_configurado PASSED [ 33%]
tests/test_alertas_steps.py::test_el_error_no_supera_el_umbral_configurado PASSED [ 66%]
tests/test_alertas_steps.py::test_el_error_es_exactamente_igual_al_umbral PASSED [100%]

============================== 3 passed in 0.01s ===============================
```

**Por qué cada escenario está redactado así.** En los tres, el *Dado* es el mismo (un umbral de 10 %) para que lo único que cambie entre ellos sea el *Cuando*, que es el error del pronóstico. Así se ve de un vistazo qué variable estamos moviendo.

- **Escenario 1 (12 % contra 10 %)**: el caso claro de alerta. Si falla, el sistema no avisa cuando debería y el planeador se entera tarde de que el plan se desvió.
- **Escenario 2 (7 % contra 10 %)**: el caso claro de no alerta. Protege del error contrario: una función que devolviera siempre `True` pasaría el escenario 1 y se detectaría aquí. Un sistema que alerta por todo termina ignorado.
- **Escenario 3 (10 % contra 10 %)**: el caso límite. La regla que acordamos es "mayor o igual", no "mayor estricto". Es el tipo de decisión que hay que cerrar con Producción antes de escribir la prueba, no después.

**Qué pasaría sin el escenario 3.** Para comprobarlo cambiamos `>=` por `>` en `alertas.py` y corrimos la suite (después lo restauramos). Los escenarios 1 y 2 siguieron en verde; solo el tercero detectó el cambio:

```
============================= test session starts ==============================
collecting ... collected 3 items
tests/test_alertas_steps.py::test_el_error_supera_el_umbral_configurado PASSED [ 33%]
tests/test_alertas_steps.py::test_el_error_no_supera_el_umbral_configurado PASSED [ 66%]
tests/test_alertas_steps.py::test_el_error_es_exactamente_igual_al_umbral FAILED [100%]
FAILED tests/test_alertas_steps.py::test_el_error_es_exactamente_igual_al_umbral
========================= 1 failed, 2 passed in 0.02s ==========================
```

Sin ese escenario, el error habría pasado sin que nadie lo notara y el sistema no avisaría justo cuando el error toca el umbral.

---

## Parte 3 — Análisis estático con ruff

ruff revisa el código sin ejecutarlo. Lo agregamos como dependencia de desarrollo y lo configuramos en `pyproject.toml`:

```toml
[tool.ruff]
line-length = 100

[tool.ruff.lint]
select = ["E", "F", "I"]
```

`E` son los errores de estilo de pycodestyle (entre ellos, la longitud de línea), `F` los de pyflakes (imports y variables sin usar, nombres sin definir) e `I` el orden de los imports.

La primera corrida de `uv run ruff check .` encontró un problema real, en `src/mad.py`:

```
src/mad.py:5:101: E501 Line too long (102 > 100)
Found 1 error.
```

Era la comprensión de lista de `mad()`, que se pasaba por dos caracteres. La partimos en varias líneas, sin cambiar lo que hace:

```python
# antes
    errores_absolutos = [abs(real_i - pronostico_i) for real_i, pronostico_i in zip(real, pronostico)]

# después
    errores_absolutos = [
        abs(real_i - pronostico_i) for real_i, pronostico_i in zip(real, pronostico)
    ]
```

`alertas.py` y los archivos de `tests/` no tenían hallazgos. No hizo falta `--fix`: lo único que había lo corregimos a mano. Al terminar:

```
$ uv run ruff check .
All checks passed!
```

Las siete pruebas siguen en verde (salida abajo).

---

## Resultado final

Salida real de `uv run pytest -v` con todo junto:

```
============================= test session starts ==============================
platform darwin -- Python 3.13.5, pytest-9.1.1, pluggy-1.7.0 -- …/python/.venv/bin/python3
cachedir: .pytest_cache
rootdir: …/python
configfile: pytest.ini
plugins: bdd-9.0.0
collecting ... collected 7 items

tests/test_alertas_steps.py::test_el_error_supera_el_umbral_configurado PASSED [ 14%]
tests/test_alertas_steps.py::test_el_error_no_supera_el_umbral_configurado PASSED [ 28%]
tests/test_alertas_steps.py::test_el_error_es_exactamente_igual_al_umbral PASSED [ 42%]
tests/test_mad.py::test_calcula_el_error_absoluto_medio_de_una_serie_de_pronosticos PASSED [ 57%]
tests/test_mad.py::test_devuelve_0_cuando_el_pronostico_es_exacto PASSED [ 71%]
tests/test_mad.py::test_lanza_un_error_si_las_series_no_tienen_la_misma_longitud PASSED [ 85%]
tests/test_mad.py::test_lanza_un_error_si_alguna_de_las_series_esta_vacia PASSED [100%]

============================== 7 passed in 0.01s ===============================
```

## Qué nos llevamos de este ejercicio

El ciclo rojo-verde-refactor se vio igual que en JavaScript: lo que cambió fueron las herramientas (`pytest.approx` en lugar de `toBeCloseTo`, `ValueError` en lugar de `Error`, `snake_case` en lugar de `camelCase`), no el método. La disciplina vive en el orden de los pasos, no en el lenguaje.

Con el `.feature` compartido vimos que la regla de negocio se escribe una sola vez en un lenguaje que entiende Producción, y cada stack solo aporta el código que la hace verificable. Por eso el caso límite del umbral (`>=` y no `>`) quedó fijado igual en los tres.
