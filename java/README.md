# Kata TDD y BDD en Java — referencia pedagógica

Esta carpeta reproduce **solo la kata base** (`mad` y `debeGenerarAlerta`) en Java con JUnit 5 y Cucumber-JVM. No es parte del sistema: el stack real del proyecto es JavaScript (ver `../javascript/`). La hicimos para que cualquiera del equipo pueda comprobar que TDD y BDD no dependen del framework: el ciclo es el mismo, solo cambian las herramientas.

## Requisitos e instalación

Validamos con Java **25.0.4** (Amazon Corretto) y Apache Maven **3.9.16**. El `pom.xml` compila con `release 21`, así que sirve cualquier JDK 21 o superior. (También tenemos Gradle 9.7.0 en el equipo, pero usamos Maven porque es lo que pedía el ejercicio.)

```bash
cd java
mvn test
```

Dos versiones del `pom.xml` conviene explicarlas:

- **Surefire 3.6.1.** Con Surefire 3.5.3 los escenarios de Cucumber sí se ejecutaban, pero el resumen decía `Tests run: 0` para `RunCucumberTest`: un verde que no cuenta nada. Con 3.6.1 los tres escenarios se cuentan como tres pruebas.
- **JUnit 5.13.4 y Cucumber 7.23.0**, importados con sus BOM para que las librerías de cada familia sean compatibles entre sí.

## TDD y BDD, como lo entendemos nosotros

**TDD** es escribir la prueba antes que el código. Tiene tres pasos que se repiten:

1. **Rojo**: escribimos la prueba y la corremos. Tiene que fallar. Si no falla, la prueba no está comprobando nada nuevo.
2. **Verde**: escribimos lo mínimo que hace pasar la prueba, aunque quede feo.
3. **Refactor**: con las pruebas en verde mejoramos la forma del código sin cambiar lo que hace. Las mismas pruebas, sin tocarlas, demuestran que no rompimos nada.

**BDD** es describir el comportamiento con frases que también entiende alguien de Producción. Cada escenario se redacta como **Dado** (el contexto), **Cuando** (lo que ocurre) y **Entonces** (lo que esperamos), y cada frase se conecta con código. Lo usamos para las reglas de negocio que conviene acordar con el área usuaria, como cuándo se dispara una alerta.

## Estructura

```
java/
├── src/main/java/pruebas/
│   ├── Mad.java
│   └── Alertas.java
├── src/test/java/pruebas/
│   ├── MadTest.java
│   ├── AlertasStepDefinitions.java
│   └── RunCucumberTest.java
├── src/test/resources/features/alertas.feature
├── pom.xml
└── README.md
```

| Función | Qué calcula | Valor de referencia que verifica |
|---|---|---|
| `Mad.mad(real, pronostico)` | Error absoluto medio | 11,00 (`assertEquals(11.00, resultado, 0.01)`) |
| `Alertas.debeGenerarAlerta(errorPorcentual, umbralPorcentual)` | `true` si `error >= umbral` | 12 vs 10 → alerta · 7 vs 10 → no · 10 vs 10 → alerta |

Los datos son los mismos del kit de JavaScript: la demanda real de los períodos 4 a 6 (141, 138, 150) frente al pronóstico de promedio móvil de 3 períodos (126,67 · 133,67 · 135,67).

---

## Parte 1 — `Mad` con TDD

El MAD (desviación absoluta media) es el promedio de cuánto nos equivocamos, sin importar si fue por arriba o por abajo.

### Rojo

Escribimos `MadTest.java` antes de que existiera la clase `Mad`. Cuatro pruebas: el valor de referencia, que un pronóstico exacto da 0, y las dos validaciones (series de distinta longitud y series vacías).

```java
package pruebas;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class MadTest {

    @Test
    @DisplayName("calcula el error absoluto medio de una serie de pronosticos")
    void calculaElErrorAbsolutoMedio() {
        double[] real = {141, 138, 150};
        double[] pronostico = {126.67, 133.67, 135.67};

        assertEquals(11.00, Mad.mad(real, pronostico), 0.01);
    }

    @Test
    @DisplayName("devuelve 0 cuando el pronostico es exacto")
    void devuelveCeroCuandoElPronosticoEsExacto() {
        assertEquals(0, Mad.mad(new double[] {100, 100}, new double[] {100, 100}));
    }

    @Test
    @DisplayName("lanza un error si las series no tienen la misma longitud")
    void lanzaUnErrorSiLasSeriesNoTienenLaMismaLongitud() {
        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> Mad.mad(new double[] {100, 110}, new double[] {100}));

        assertEquals("Las series deben tener el mismo numero de periodos", error.getMessage());
    }

    @Test
    @DisplayName("lanza un error si alguna de las series esta vacia")
    void lanzaUnErrorSiAlgunaDeLasSeriesEstaVacia() {
        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> Mad.mad(new double[] {}, new double[] {}));

        assertEquals("Se necesita al menos un periodo para calcular el MAD", error.getMessage());
    }
}
```

El tercer argumento de `assertEquals(11.00, resultado, 0.01)` es el margen de tolerancia: es el equivalente de `toBeCloseTo` en Jest o `pytest.approx` en Python. Salida de `mvn test` (omitimos las líneas de descarga y de tiempo, y las rutas de nuestro equipo):

```
[INFO] 
[INFO] ---------------------< pruebas:kata-tdd-bdd-java >----------------------
[INFO] --------------------------------[ jar ]---------------------------------
[INFO] 
[INFO] --- clean:3.2.0:clean (default-clean) @ kata-tdd-bdd-java ---
[INFO] 
[INFO] --- compiler:3.14.0:compile (default-compile) @ kata-tdd-bdd-java ---
[INFO] 
[INFO] --- compiler:3.14.0:testCompile (default-testCompile) @ kata-tdd-bdd-java ---
[INFO] Recompiling the module because of changed source code.
[INFO] Compiling 1 source file with javac [debug release 21] to target/test-classes
[INFO] -------------------------------------------------------------
[ERROR] COMPILATION ERROR : 
[INFO] -------------------------------------------------------------
[ERROR] src/test/java/pruebas/MadTest.java:[17,29] cannot find symbol
  symbol:   variable Mad
  location: class pruebas.MadTest
[ERROR] src/test/java/pruebas/MadTest.java:[23,25] cannot find symbol
  symbol:   variable Mad
  location: class pruebas.MadTest
[ERROR] src/test/java/pruebas/MadTest.java:[30,23] cannot find symbol
  symbol:   variable Mad
  location: class pruebas.MadTest
[ERROR] src/test/java/pruebas/MadTest.java:[39,23] cannot find symbol
  symbol:   variable Mad
  location: class pruebas.MadTest
[INFO] 4 errors 
[INFO] -------------------------------------------------------------
[INFO] ------------------------------------------------------------------------
[INFO] BUILD FAILURE
```

En Java el rojo es un error de compilación: `cannot find symbol ... variable Mad`, una vez por cada uso de `Mad` en la prueba (4 errores). Es un rojo más temprano que en JavaScript o Python, porque el compilador ni siquiera deja llegar a ejecutar las pruebas; en el log no aparece la fase de Surefire. Sigue siendo el rojo correcto: confirma que la prueba existe, que está conectada a lo que vamos a escribir y que no puede pasar por accidente.

### Verde

Escribimos lo mínimo que hace pasar las cuatro pruebas: las dos validaciones al principio, lanzando `IllegalArgumentException`, y un `for` que acumula el error absoluto de cada período.

```java
package pruebas;

public class Mad {

    public static double mad(double[] real, double[] pronostico) {
        if (real.length != pronostico.length) {
            throw new IllegalArgumentException("Las series deben tener el mismo numero de periodos");
        }
        if (real.length == 0) {
            throw new IllegalArgumentException("Se necesita al menos un periodo para calcular el MAD");
        }

        double suma = 0;
        for (int i = 0; i < real.length; i++) {
            suma += Math.abs(real[i] - pronostico[i]);
        }
        return suma / real.length;
    }
}
```

```
[INFO] 
[INFO] ---------------------< pruebas:kata-tdd-bdd-java >----------------------
[INFO] --------------------------------[ jar ]---------------------------------
[INFO] 
[INFO] --- clean:3.2.0:clean (default-clean) @ kata-tdd-bdd-java ---
[INFO] Deleting target
[INFO] 
[INFO] --- compiler:3.14.0:compile (default-compile) @ kata-tdd-bdd-java ---
[INFO] Recompiling the module because of changed source code.
[INFO] Compiling 1 source file with javac [debug release 21] to target/classes
[INFO] 
[INFO] --- compiler:3.14.0:testCompile (default-testCompile) @ kata-tdd-bdd-java ---
[INFO] Recompiling the module because of changed dependency.
[INFO] Compiling 1 source file with javac [debug release 21] to target/test-classes
[INFO] 
[INFO] --- surefire:3.6.1:test (default-test) @ kata-tdd-bdd-java ---
[INFO] 
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running pruebas.MadTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.033 s -- in pruebas.MadTest
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
```

Ahora sí aparece la fase de Surefire y las cuatro pasan: `Tests run: 4, Failures: 0, Errors: 0`. Un detalle importante del valor de referencia: los pronósticos de entrada están redondeados a dos decimales, así que el MAD exacto con ellos es 10,9967, no 11. La tolerancia de 0,01 dentro de la prueba es lo que lo hace pasar de forma honesta. Los otros tres casos fijan que un pronóstico exacto da 0 y que series de distinta longitud o vacías lanzan un error con un mensaje claro, en lugar de devolver un número sin sentido o fallar con una división entre cero.

### Refactor

Con las pruebas en verde, cambiamos el `for` por un `IntStream` y movimos cada validación a un método privado con nombre (`validarMismaLongitud`, `validarAlMenosUnPeriodo`):

```java
package pruebas;

import java.util.stream.IntStream;

public class Mad {

    public static double mad(double[] real, double[] pronostico) {
        validarMismaLongitud(real, pronostico);
        validarAlMenosUnPeriodo(real);

        double sumaErrores = IntStream.range(0, real.length)
                .mapToDouble(i -> Math.abs(real[i] - pronostico[i]))
                .sum();
        return sumaErrores / real.length;
    }

    private static void validarMismaLongitud(double[] real, double[] pronostico) {
        if (real.length != pronostico.length) {
            throw new IllegalArgumentException("Las series deben tener el mismo numero de periodos");
        }
    }

    private static void validarAlMenosUnPeriodo(double[] real) {
        if (real.length == 0) {
            throw new IllegalArgumentException("Se necesita al menos un periodo para calcular el MAD");
        }
    }
}
```

```
[INFO] 
[INFO] ---------------------< pruebas:kata-tdd-bdd-java >----------------------
[INFO] --------------------------------[ jar ]---------------------------------
[INFO] 
[INFO] --- clean:3.2.0:clean (default-clean) @ kata-tdd-bdd-java ---
[INFO] Deleting target
[INFO] 
[INFO] --- compiler:3.14.0:compile (default-compile) @ kata-tdd-bdd-java ---
[INFO] Recompiling the module because of changed source code.
[INFO] Compiling 1 source file with javac [debug release 21] to target/classes
[INFO] 
[INFO] --- compiler:3.14.0:testCompile (default-testCompile) @ kata-tdd-bdd-java ---
[INFO] Recompiling the module because of changed dependency.
[INFO] Compiling 1 source file with javac [debug release 21] to target/test-classes
[INFO] 
[INFO] --- surefire:3.6.1:test (default-test) @ kata-tdd-bdd-java ---
[INFO] 
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running pruebas.MadTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.073 s -- in pruebas.MadTest
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
```

Las mismas cuatro pruebas, sin tocarlas, dan el mismo resultado. Cambió la forma, no el comportamiento, y las pruebas son quienes lo demuestran.

---

## Parte 2 — `Alertas.debeGenerarAlerta()` con BDD

`alertas.feature` es el **mismo archivo, byte a byte**, que usan el kit de JavaScript y el de Python. La especificación no cambia aunque cambie el lenguaje:

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

`AlertasStepDefinitions.java` conecta cada frase con código usando las anotaciones en español de Cucumber (`@Dado`, `@Cuando`, `@Entonces`):

```java
package pruebas;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import io.cucumber.java.es.Cuando;
import io.cucumber.java.es.Dado;
import io.cucumber.java.es.Entonces;

public class AlertasStepDefinitions {

    private int umbral;
    private boolean resultado;

    @Dado("un umbral de alerta configurado en {int} %")
    public void unUmbralDeAlertaConfiguradoEn(int umbral) {
        this.umbral = umbral;
    }

    @Cuando("el error del pronóstico es {int} %")
    public void elErrorDelPronosticoEs(int error) {
        resultado = Alertas.debeGenerarAlerta(error, umbral);
    }

    @Entonces("se debe generar una alerta")
    public void seDebeGenerarUnaAlerta() {
        assertTrue(resultado);
    }

    @Entonces("no se debe generar una alerta")
    public void noSeDebeGenerarUnaAlerta() {
        assertFalse(resultado);
    }
}
```

- `{int}` extrae el número de la frase, así que el mismo paso sirve para cualquier umbral.
- Los campos `umbral` y `resultado` son la forma en que el valor viaja de un paso al siguiente. Cucumber crea una instancia nueva de la clase por cada escenario, así que ninguno hereda el estado del anterior.

`RunCucumberTest.java` es el puente entre Maven y Cucumber: le dice al motor de JUnit dónde están los escenarios (`features`) y dónde están las definiciones de pasos (el paquete `pruebas`). No contiene lógica:

```java
package pruebas;

import static io.cucumber.junit.platform.engine.Constants.GLUE_PROPERTY_NAME;

import org.junit.platform.suite.api.ConfigurationParameter;
import org.junit.platform.suite.api.IncludeEngines;
import org.junit.platform.suite.api.SelectClasspathResource;
import org.junit.platform.suite.api.Suite;

@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("features")
@ConfigurationParameter(key = GLUE_PROPERTY_NAME, value = "pruebas")
public class RunCucumberTest {
}
```

La lógica es una sola línea, en `camelCase`:

```java
package pruebas;

public class Alertas {

    public static boolean debeGenerarAlerta(double errorPorcentual, double umbralPorcentual) {
        return errorPorcentual >= umbralPorcentual;
    }
}
```

Salida de `mvn test` con los dos bloques juntos (los 3 escenarios cuentan dentro de `RunCucumberTest`):

```
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running pruebas.MadTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.052 s -- in pruebas.MadTest
[INFO] Running pruebas.RunCucumberTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.104 s -- in pruebas.RunCucumberTest
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
```

**Por qué cada escenario está redactado así.** En los tres, el *Dado* es el mismo (un umbral de 10 %) para que lo único que cambie entre ellos sea el *Cuando*, que es el error del pronóstico. Así se ve de un vistazo qué variable estamos moviendo.

- **Escenario 1 (12 % contra 10 %)**: el caso claro de alerta. Si falla, el sistema no avisa cuando debería y el planeador se entera tarde de que el plan se desvió.
- **Escenario 2 (7 % contra 10 %)**: el caso claro de no alerta. Protege del error contrario: una función que devolviera siempre `true` pasaría el escenario 1 y se detectaría aquí. Un sistema que alerta por todo termina ignorado.
- **Escenario 3 (10 % contra 10 %)**: el caso límite. La regla que acordamos es "mayor o igual", no "mayor estricto". Es el tipo de decisión que hay que cerrar con Producción antes de escribir la prueba, no después.

**Qué pasaría sin el escenario 3.** Para comprobarlo cambiamos `>=` por `>` en `Alertas.java` y corrimos `mvn test` (después lo restauramos). Los escenarios 1 y 2 siguieron en verde; solo el tercero detectó el cambio, y Maven lo nombra:

```
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running pruebas.MadTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.018 s -- in pruebas.MadTest
[INFO] Running pruebas.RunCucumberTest
[ERROR] Tests run: 3, Failures: 1, Errors: 0, Skipped: 0, Time elapsed: 0.041 s <<< FAILURE! -- in pruebas.RunCucumberTest
[ERROR] pruebas.RunCucumberTest.El error es exactamente igual al umbral -- Time elapsed: 0.003 s <<< FAILURE!
org.opentest4j.AssertionFailedError: expected: <true> but was: <false>

[INFO] 
[INFO] Results:
[INFO] 
[ERROR] Failures: 
[ERROR]   RunCucumberTest.El error es exactamente igual al umbral expected: <true> but was: <false>
[INFO] 
[ERROR] Tests run: 7, Failures: 1, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD FAILURE
```

Sin ese escenario, el error habría pasado sin que nadie lo notara y el sistema no avisaría justo cuando el error toca el umbral.

---

## Resultado final

Salida real de `mvn test` con todo junto: 4 pruebas de JUnit más 3 escenarios de Cucumber, 7 en total.

```
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running pruebas.MadTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.019 s -- in pruebas.MadTest
[INFO] Running pruebas.RunCucumberTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.043 s -- in pruebas.RunCucumberTest
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
```

## Qué nos llevamos de este ejercicio

El ciclo rojo-verde-refactor se vio igual que en JavaScript y Python; lo que cambió fue cómo se manifiesta cada paso. En Java el rojo llegó antes, como error de compilación, porque el compilador exige que la clase exista, y el verde y el refactor fueron los mismos movimientos (un `for` primero, un `IntStream` y métodos con nombre después). La disciplina vive en el orden de los pasos, no en el lenguaje.

Con el `.feature` compartido vimos que la regla de negocio se escribe una sola vez en un lenguaje que entiende Producción, y cada stack solo aporta el código que la hace verificable. Por eso el caso límite del umbral (`>=` y no `>`) quedó fijado igual en los tres.
