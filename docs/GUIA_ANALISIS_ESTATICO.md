# Guía de estudio: análisis estático y Clean Code

Esta guía junta lo que vimos en la semana 5 y lo aterriza en nuestro proyecto "Sistema web para la predicción de la demanda en producción industrial". Todo lo que aparece como salida de consola salió de correr el comando en este repositorio; cuando recortamos una ruta larga lo indicamos con `…`.

Versiones con las que corrimos los comandos: Node.js 24.19.0, ESLint 10.14.0, uv 0.12.3 y ruff 0.17.3.

## Índice

1. [Pruebas estáticas y dinámicas](#1-pruebas-estáticas-y-dinámicas)
2. [Qué se puede revisar sin ejecutar nada](#2-qué-se-puede-revisar-sin-ejecutar-nada)
3. [Revisiones: proceso, roles y tipos](#3-revisiones-proceso-roles-y-tipos)
4. [Ejemplo resuelto: un requisito ambiguo de nuestro proyecto](#4-ejemplo-resuelto-un-requisito-ambiguo-de-nuestro-proyecto)
5. [Análisis estático automatizado](#5-análisis-estático-automatizado)
6. [Complejidad ciclomática](#6-complejidad-ciclomática)
7. [Clean Code](#7-clean-code)
8. [Dónde corre cada cosa](#8-dónde-corre-cada-cosa)
9. [Los comandos de este repositorio, con su salida real](#9-los-comandos-de-este-repositorio-con-su-salida-real)
10. [Documentación oficial](#10-documentación-oficial)

---

## 1. Pruebas estáticas y dinámicas

Una prueba dinámica ejecuta el software y compara lo que hace con lo que esperábamos. Es lo que hicimos con Jest y pytest en las semanas anteriores. Una prueba estática examina el producto sin ejecutarlo: la hace una persona leyendo (una revisión) o una herramienta analizando el código (un linter).

Las dos buscan defectos y se complementan; ninguna reemplaza a la otra. Estas son las diferencias que recoge el temario de ISTQB (adaptado de CTFL v4.0, sección 3.1.3):

| | Prueba estática | Prueba dinámica |
|---|---|---|
| ¿Ejecuta el software? | No | Sí |
| Cómo llega al defecto | Lo encuentra directamente | Provoca una falla y después se analiza qué defecto lo causó |
| Qué productos puede examinar | También los que no se ejecutan (requisitos, diseños, planes de prueba) | Solo los ejecutables |
| Caminos del código difíciles de alcanzar | Los ve aunque casi nunca se ejecuten | Hay que construir el caso que llegue hasta ahí |
| Características de calidad que mide | Las que no dependen de ejecutar (por ejemplo, mantenibilidad) | Las que sí dependen (por ejemplo, eficiencia de desempeño) |

Qué encuentra mejor cada una, con ejemplos de nuestro dominio:

- Estática: un requisito contradictorio ("alerta si el error supera 10 %" y más abajo "alerta si es 10 % o más"), una variable declarada y nunca usada, código después de un `return`, una función tan enredada que nadie se atreve a tocarla, un `==` donde debía ir `===`, un nombre que no sigue el estándar del equipo.
- Dinámica: que `mad()` devuelva 11,00 con la serie de referencia, que el endpoint responda 400 con un cuerpo inválido, que la pantalla de carga muestre "Datos cargados correctamente".

Una función con complejidad 15 puede pasar todas sus pruebas y seguir siendo un problema de mantenimiento. Y una función perfectamente legible puede calcular mal. Por eso usamos las dos.

## 2. Qué se puede revisar sin ejecutar nada

Según el temario (adaptado de CTFL v4.0, sección 3.1.1), casi cualquier producto de trabajo se puede examinar con pruebas estáticas. En nuestro proyecto:

| Producto de trabajo | Cómo lo revisamos |
|---|---|
| Requisitos e historias de usuario | Revisión (¿es claro, completo, verificable?) |
| Archivos `.feature` de BDD | Revisión con Producción: ¿el escenario dice lo que la planta espera? |
| Código fuente (`src/`) | Revisión por pares y análisis estático (ESLint, ruff) |
| Código de las pruebas (`tests/`) | Igual: también se lee y se analiza |
| Plan y casos de prueba | Revisión: ¿cubren cada criterio de aceptación? |
| Configuración y pipeline (`.github/workflows/`) | Revisión por pares |
| Documentación (README, esta guía) | Revisión |

Para que una herramienta analice un producto este necesita una estructura contra la que comparar (código o texto con sintaxis formal). Una persona puede revisar cualquier cosa que se pueda leer y entender. El temario también dice qué no conviene analizar: lo que es difícil de interpretar para una persona y no debe analizarse con herramientas, por ejemplo el código ejecutable de terceros por razones legales.

## 3. Revisiones: proceso, roles y tipos

> Esta sección es una adaptación del temario ISTQB Certified Tester Foundation Level v4.0 (secciones 3.2.2 a 3.2.4). Contrastamos el contenido con el documento oficial en su versión 4.0.1 (fecha 2024-09-15). Los nombres en español son nuestros.

### 3.1 Actividades del proceso de revisión

Es un proceso flexible: cuanto más formal es la revisión, más tareas de cada actividad se necesitan. Si el producto es muy grande, el proceso se repite varias veces hasta cubrirlo.

1. Planificación. Definimos el alcance: propósito, qué producto se revisa, qué características de calidad evaluamos, en qué nos enfocamos, criterios de salida, esfuerzo y tiempos.
2. Inicio de la revisión. Nos aseguramos de que todos tienen acceso al producto, conocen su rol y tienen lo que necesitan.
3. Revisión individual. Cada revisor lo analiza por su cuenta, anota anomalías, recomendaciones y preguntas, y aplica una o más técnicas (por ejemplo, revisión con lista de comprobación o basada en escenarios).
4. Comunicación y análisis. Una anomalía no siempre es un defecto, así que cada una se discute y se decide su estado, su responsable y las acciones. Normalmente es en una reunión de revisión.
5. Corrección e informe. Por cada defecto se crea un reporte para dar seguimiento. Cuando se cumplen los criterios de salida, el producto se acepta y se informan los resultados.

### 3.2 Roles

| Rol | Qué hace |
|---|---|
| Gerente | Decide qué se revisa y da los recursos (personas, tiempo) |
| Autor | Crea el producto y corrige lo que se encuentre |
| Moderador (o facilitador) | Conduce la reunión: media, cuida el tiempo y procura un ambiente donde todos puedan hablar |
| Escriba (o registrador) | Recoge las anomalías de los revisores y anota decisiones y hallazgos nuevos de la reunión |
| Revisor | Revisa; puede ser de la obra, un experto del tema o cualquier interesado |
| Líder de la revisión | Responsable general: decide quién participa y organiza cuándo y dónde |

Una misma persona puede tener varios roles.

### 3.3 Los cuatro tipos de revisión

| Tipo | Cómo es | Objetivo principal |
|---|---|---|
| Revisión informal | Sin proceso definido y sin documento de salida obligatorio | Detectar anomalías |
| Walkthrough (recorrido) | Lo conduce el autor; la revisión individual previa es opcional | Varios: evaluar la calidad, educar a los revisores, lograr consenso, generar ideas, detectar anomalías |
| Revisión técnica | La hacen revisores técnicamente calificados y la conduce un moderador | Lograr consenso y tomar decisiones sobre un problema técnico, además de detectar anomalías |
| Inspección | El tipo más formal: sigue el proceso completo; se recogen métricas para mejorar el proceso; el autor no puede ser líder ni escriba | Encontrar el máximo número de anomalías |

El tipo adecuado depende del ciclo de vida que sigamos, la madurez del proceso, qué tan crítico y complejo es el producto, si hay exigencias legales o de auditoría y los recursos disponibles. Un mismo producto puede pasar primero por una revisión informal y más tarde por una más formal.

Qué hace exitosa una revisión (sección 3.2.5 del temario): objetivos claros y criterios de salida medibles (nunca evaluar a las personas), elegir el tipo adecuado, revisar en piezas pequeñas, devolver el resultado a autores e interesados, dar tiempo para prepararse, apoyo de la gerencia y volver las revisiones parte de la cultura del equipo.

## 4. Ejemplo resuelto: un requisito ambiguo de nuestro proyecto

Requisito tal como llegó:

> RF-10. El sistema debe generar una alerta cuando el error del pronóstico sea alto.

Hicimos una revisión individual con una lista de preguntas (qué, cuándo, quién, cuánto, cómo se comprueba) y anotamos las anomalías.

### 4.1 Anomalías encontradas

| # | Fragmento | Problema | Pregunta que hay que responder |
|---|---|---|---|
| 1 | "error del pronóstico" | No dice qué medida. En el sistema tenemos MAD, MSE y MAPE, y cada una tiene unidades distintas. | ¿Cuál usamos? ¿Por periodo o promediada sobre una serie? |
| 2 | "alto" | Es subjetivo y no se puede comprobar con una prueba. | ¿Cuál es el umbral? ¿Es el mismo para todos los productos o se configura? ¿En qué unidad? |
| 3 | "cuando… sea alto" | No dice qué pasa justo en el umbral. | Con el umbral en 10 %, ¿un error de exactamente 10 % alerta? |
| 4 | "generar una alerta" | No define qué es una alerta. | ¿Mensaje en pantalla, correo, registro? ¿Se repite o es una sola vez? |
| 5 | (falta) | No dice quién la recibe. | ¿El administrador, el planeador de producción, el supervisor de línea, el analista de datos o todos los roles? |
| 6 | (falta) | No hay criterio de aceptación. | ¿Con qué datos de ejemplo sabremos que está bien hecho? |

### 4.2 Qué decidimos en la reunión (walkthrough conducido por la autora del requisito)

- Usamos el error porcentual de cada periodo (el MAPE de un solo periodo).
- El umbral es configurable y el valor de ejemplo es 10 %.
- En el umbral sí se alerta (`>=`). Esta decisión ya está fijada en nuestras pruebas: en el `.feature` el escenario "El error es exactamente igual al umbral" espera la alerta.
- La alerta es un mensaje en pantalla para el planeador de producción.

### 4.3 Requisito reescrito

> RF-10 (versión 2). Cuando el error porcentual de un periodo sea mayor o igual al umbral de alerta configurado, el sistema debe mostrar al planeador de producción una alerta en pantalla indicando el periodo y su error.
>
> Criterios de aceptación. Con umbral de 10 %: un error de 12 % genera alerta; uno de 7 % no; uno de 10 % sí.

El requisito nuevo se puede verificar, y los tres ejemplos son exactamente los de nuestro BDD. La revisión no encontró un defecto en el código, sino uno en lo que íbamos a programar, que es el más barato de corregir. Esa es la ventaja de la prueba estática temprana.

## 5. Análisis estático automatizado

### 5.1 Qué encuentra

Una herramienta de análisis estático lee el código (sin ejecutarlo) y lo compara con un conjunto de reglas. Según el temario (sección 3.1.3) los defectos que son más fáciles o baratos de encontrar así incluyen: variables sin valor definido o no declaradas, código inalcanzable o duplicado, complejidad excesiva, desviaciones de los estándares (como las convenciones de nombres), interfaces mal especificadas y ciertas vulnerabilidades de seguridad. También sirve para evaluar mantenibilidad.

Lo que no encuentra: si el resultado es el correcto para el negocio. Una función que calcula mal pero está bien escrita pasa todos los linters.

### 5.2 Linter y formateador no son lo mismo

| | Linter | Formateador |
|---|---|---|
| Pregunta que responde | ¿Hay algo sospechoso o incorrecto? | ¿Se ve igual que el resto del código? |
| Ejemplos de lo que marca | Variable sin usar, `==`, código inalcanzable, complejidad | Espacios, saltos de línea, comillas, ancho de línea |
| Cambia el significado del código | A veces sus correcciones automáticas sí (hay que revisarlas) | Nunca debería |
| En nuestro repositorio | `eslint` y `ruff check` | `ruff format` |

Algunas reglas de linter son de estilo, como la longitud de línea (`E501` en ruff); por eso la frontera no es tajante. En el Paso de ruff de la semana pasada, el linter nos marcó una línea de 102 caracteres y la corregimos a mano.

### 5.3 Herramientas por lenguaje

| Lenguaje | Linter / análisis | Formateador | Más |
|---|---|---|---|
| JavaScript | [ESLint](https://eslint.org/docs/latest/) | [Prettier](https://prettier.io/docs/) | |
| Python | [Ruff](https://docs.astral.sh/ruff/), [Pylint](https://pylint.readthedocs.io/) | [Ruff](https://docs.astral.sh/ruff/) (`ruff format`), [Black](https://black.readthedocs.io/) | [uv](https://docs.astral.sh/uv/) para dependencias y entorno |
| Java | [Checkstyle](https://checkstyle.org/) (estilo), [PMD](https://pmd.github.io/) (malas prácticas), [SpotBugs](https://spotbugs.github.io/) (errores probables) | | |
| PHP | [PHPStan](https://phpstan.org/user-guide/getting-started), [Psalm](https://psalm.dev/docs/), [PHP_CodeSniffer](https://github.com/PHPCSStandards/PHP_CodeSniffer) (estilo) | | |
| Go | [go vet](https://pkg.go.dev/cmd/vet), [golangci-lint](https://golangci-lint.run/) (reúne varios linters) | [gofmt](https://pkg.go.dev/cmd/gofmt) | |
| C# | [Analizadores de Roslyn](https://learn.microsoft.com/en-us/dotnet/fundamentals/code-analysis/overview) | [dotnet format](https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-format) | |

En este repositorio solo usamos ESLint en `javascript/` y ruff en `python/`. Java todavía no tiene análisis estático configurado.

### 5.4 SonarQube y los quality gates

SonarQube analiza el código en un servidor y guarda el historial de problemas. Su quality gate es una puerta de calidad: un conjunto de condiciones contra las que se mide el código en cada análisis. Con base en su documentación (SonarQube Server 2026.5):

- Cada condición combina una métrica, un operador de comparación y un valor de error (por ejemplo, "incidencias bloqueantes > 0").
- Si una condición se cumple, el quality gate falla.
- En una rama se aplican condiciones sobre el código nuevo y sobre todo el código; en un pull request, solo las del código nuevo (lo que cambió respecto a la rama destino). Así un proyecto con deuda antigua puede exigirse a sí mismo no empeorar.
- El resultado (aprobado o fallido) puede usarse para bloquear el merge de un pull request o hacer fallar el pipeline; el bloqueo depende de cómo se integre.

El quality gate integrado "Sonar way" tiene cuatro condiciones sobre el código nuevo: ninguna incidencia nueva, todos los puntos críticos de seguridad nuevos revisados, cobertura de pruebas del código nuevo mayor o igual a 80,0 % y duplicación del código nuevo menor o igual a 3,0 %.

No tenemos SonarQube configurado en este proyecto; lo estudiamos para entender el concepto. La idea que sí aplicamos es la misma, a menor escala: en la CI, si el lint falla, el job se detiene antes de correr las pruebas.

### 5.5 SAST

Las herramientas SAST (*Static Application Security Testing*) son análisis estático enfocado en seguridad. OWASP las describe como herramientas que analizan el código fuente (o su versión compilada) para ayudar a encontrar fallas de seguridad. Identifican bien ciertas vulnerabilidades conocidas (desbordamientos de búfer, inyección SQL) y dan archivo, línea y fragmento afectado. Sus límites, según la misma página: encuentran automáticamente solo un porcentaje relativamente pequeño de las fallas, generan muchos falsos positivos, no ven problemas de configuración que no están en el código y es difícil demostrar con ellas que un hallazgo sea una vulnerabilidad real. Un ejemplo de herramienta de este tipo es [Semgrep](https://docs.semgrep.dev/). No usamos SAST en el proyecto; lo mencionamos como el siguiente paso natural después del linter.

## 6. Complejidad ciclomática

La complejidad ciclomática (McCabe) mide cuántos caminos independientes tiene una función. Se calcula así:

> V(G) = decisiones + 1

Cada punto donde el flujo se bifurca suma 1: un `if` o `else if`, cada rama de un `switch`, un bucle (`for`, `while`), un operador ternario y los operadores lógicos `&&` y `||` (cada uno es una decisión escondida, porque el segundo operando solo se evalúa a veces). La documentación de la regla `complexity` de ESLint lo describe como el número de caminos independientes y fija 20 como umbral por defecto; nosotros lo bajamos a 5 en la demostración.

### 6.1 Ejemplo calculado paso a paso

Usamos `clasificar` de la versión limpia de la demostración (`demo-analisis-estatico/src/reportes.limpio.js`):

```javascript
function clasificar(error, umbralAlerta) {
  if (error === null) return 'sin demanda';
  if (error >= umbralAlerta) return 'alerta';
  if (error >= UMBRAL_VIGILANCIA) return 'vigilar';
  return 'ok';
}
```

Con la fórmula de decisiones: Hay tres `if` (tres decisiones), así que V(G) = 3 + 1 = 4.

Con el grafo de flujo: Dibujamos un nodo por cada decisión y por cada salida:

| Nodo | Qué es |
|---|---|
| N1 | `if (error === null)` |
| N2 | `return 'sin demanda'` |
| N3 | `if (error >= umbralAlerta)` |
| N4 | `return 'alerta'` |
| N5 | `if (error >= UMBRAL_VIGILANCIA)` |
| N6 | `return 'vigilar'` |
| N7 | `return 'ok'` |
| N8 | salida de la función |

Aristas: N1→N2, N1→N3, N2→N8, N3→N4, N3→N5, N4→N8, N5→N6, N5→N7, N6→N8, N7→N8. Son E = 10 aristas y N = 8 nodos. La otra fórmula de McCabe da V(G) = E − N + 2 = 10 − 8 + 2 = 4. Las dos coinciden.

Comprobación con la herramienta: ESLint reportó para esta función `complexity of 4`.

### 6.2 Relación con el número de casos de prueba

V(G) es el número de caminos linealmente independientes (el "camino base"). En la práctica funciona como la cantidad mínima de casos de prueba que se necesitan para recorrer cada camino independiente (*basis path testing*). Para `clasificar` son 4, y nuestra prueba usa justamente cuatro situaciones:

| Caso | `error` | `umbralAlerta` | Camino | Resultado esperado |
|---|---|---|---|---|
| 1 | `null` | 15 | N1→N2 | `'sin demanda'` |
| 2 | 20 | 15 | N1→N3→N4 | `'alerta'` |
| 3 | 10 | 15 | N1→N3→N5→N6 | `'vigilar'` |
| 4 | 3 | 15 | N1→N3→N5→N7 | `'ok'` |

Una complejidad alta significa que hacen falta muchos casos; una función con V(G) = 8, como `proc` de la demostración, necesita al menos 8. Por eso se vuelve difícil de probar bien y por eso ponemos un tope.

> Aclaración: la complejidad ciclomática y el camino base no forman parte del temario CTFL v4.0.1. El temario solo las cita en su bibliografía (el informe del NIST sobre la métrica de complejidad ciclomática); lo que sí cubre es la cobertura de sentencias y de decisiones (sección 4.3). El resto de esta sección es material del curso.

## 7. Clean Code

*Clean Code* es el libro de Robert C. Martin que nos dio los principios de la semana. Los resumimos con lo que aplicamos en nuestro proyecto.

### 7.1 Principios

1. Nombres que explican. `erroresAbsolutos` dice lo que contiene; `e` no. Un buen nombre evita el comentario.
2. Funciones pequeñas con una sola responsabilidad. `mad()` valida y calcula; cada validación vive en su propia función.
3. Sin duplicación. Si una regla existe en dos lugares, algún día cambiará en uno solo. Nos pasó con `validarMismaLongitud`, que estaba copiada en tres archivos y la movimos a `validaciones.js`.
4. Comentarios que explican el porqué, no el qué. `// Con demanda real 0 el error porcentual no esta definido: ese periodo no cuenta` sirve porque no se deduce del código. `// suma uno a i` no sirve.

### 7.2 Code smells con ejemplos de nuestro dominio

| Olor | Cómo se ve en nuestro código | Qué hacemos |
|---|---|---|
| Nombre críptico | `function proc(d, u)` | Renombrar: `procesarPeriodos(periodos, umbralAlerta)` |
| Número mágico | `if (e >= 8)` | Constante con nombre: `UMBRAL_VIGILANCIA` |
| Función que hace de todo | Calcula el error, clasifica y arma la fila en un solo bucle | Separar: `errorPorcentual`, `clasificar`, `procesarPeriodos` |
| Duplicación | La misma comprobación y la misma fórmula en dos funciones | Extraer una función que las dos usen |
| Complejidad alta | Un `if / else if / else if` dentro de un `for` con `||` | Early return, funciones más pequeñas |
| Código muerto | Instrucciones después de un `return` | Borrarlas |
| Comentario que dice lo que el código ya dice | `// recorre la lista` | Borrarlo o mejorar el nombre |
| `==` en vez de `===` | `d[i].real == 0` | `===`, con el cambio de comportamiento pensado (`==` convierte tipos) |

### 7.3 La regla del boy scout

> Deja el campamento más limpio de como lo encontraste.

No se trata de reescribir un módulo entero. Cuando tocamos un archivo por otra razón, dejamos algo mejor: un nombre claro, una duplicación menos, un `==` corregido. Con cambios pequeños y constantes la deuda no crece.

### 7.4 Refactor seguro

Refactorizar es cambiar la forma del código sin cambiar su comportamiento. La red de seguridad son las pruebas:

1. Empezamos con las pruebas en verde. Si algo ya está rojo, no estamos en condiciones de refactorizar.
2. Hacemos un cambio pequeño.
3. Corremos las pruebas. Si siguen en verde, seguimos; si no, deshacemos.
4. No mezclamos un refactor con un cambio de comportamiento: un commit hace una cosa u otra.
5. Las pruebas no se tocan durante el refactor. Que las mismas pruebas pasen antes y después es lo que demuestra que no rompimos nada.

En `demo-analisis-estatico/` la prueba ejecuta la versión descuidada y la versión limpia con los mismos datos y comprueba que dan exactamente el mismo resultado. Es la misma idea aplicada a un refactor completo.

Para estudiar más: [refactoring.com](https://refactoring.com/) (el sitio de Martin Fowler sobre refactorización).

## 8. Dónde corre cada cosa

El análisis estático es más barato cuanto más cerca de quien escribe el código. Hay tres lugares, de más rápido a más estricto:

| Dónde | Cuándo corre | Para qué sirve | En nuestro repositorio |
|---|---|---|---|
| Editor | Mientras escribimos | Ver el subrayado al instante, antes de guardar | Las extensiones de ESLint y de Ruff para el editor usan los mismos archivos de configuración (`eslint.config.js`, `pyproject.toml`) |
| Hook de Git | Antes de cada commit | Que no entre código con problemas al historial | No lo tenemos configurado. Se puede hacer con [pre-commit](https://pre-commit.com/) o [Husky](https://typicode.github.io/husky/) |
| Pipeline (CI) | En cada push y pull request | Es la red de seguridad: lo que se saltó el editor y el hook se detiene aquí | `.github/workflows/tests.yml`: en cada job el lint corre antes de las pruebas |

Las tres capas ejecutan las mismas reglas. Lo que cambia es cuánto tardamos en enterarnos. Un hook se puede saltar con una opción de Git; el pipeline no, y por eso es el que cuenta.

Nuestro workflow tiene dos jobs, `javascript` (instala con `npm ci`, corre `npm run lint` y luego `npm test -- --coverage`) y `python` (instala con `uv sync --all-extras --dev`, corre `uv run ruff check .` y luego `uv run pytest -v`). Lo validamos como YAML y corrimos cada comando en local, pero no lo hemos visto ejecutarse en GitHub.

## 9. Los comandos de este repositorio, con su salida real

### 9.1 ESLint en `javascript/`

La configuración está en `javascript/eslint.config.js` (formato *flat config*; desde ESLint 10 el formato antiguo `.eslintrc` ya no se admite). Usa `js.configs.recommended` más `no-unused-vars` y `eqeqeq` en `error`.

```bash
cd javascript
npm run lint
```

Salida real (el código del proyecto no tiene hallazgos, así que ESLint no imprime nada más):

```
> kata-tdd-bdd-semana4@1.0.0 lint
> eslint .
```

El código termina con salida 0. Para ver el linter en acción usamos el mini proyecto de la demostración, que configura además `complexity` con máximo 5:

```bash
cd demo-analisis-estatico
npm install
npm run lint:descuidado
```

Salida real (la ruta se recortó con `…`):

```
> demo-analisis-estatico@1.0.0 lint:descuidado
> eslint src/reportes.js

…/demo-analisis-estatico/src/reportes.js
   1:1   error  Function 'proc' has a complexity of 8. Maximum allowed is 5  complexity
   3:7   error  'n' is assigned a value but never used                       no-unused-vars
   6:19  error  Expected '===' and instead saw '=='                          eqeqeq
   6:44  error  Expected '===' and instead saw '=='                          eqeqeq
   6:72  error  Expected '===' and instead saw '=='                          eqeqeq
  24:3   error  Unreachable code                                             no-unreachable
  31:19  error  Expected '===' and instead saw '=='                          eqeqeq
  31:37  error  Expected '===' and instead saw '=='                          eqeqeq

✖ 8 problems (8 errors, 0 warnings)
  1 error and 0 warnings potentially fixable with the `--fix` option.
```

Cómo se lee cada línea: `línea:columna`, gravedad, mensaje y, al final, la regla que lo produjo (con ese nombre se busca en la documentación). El resumen dice que solo 1 de los 8 problemas se puede corregir automáticamente. Sobre la versión limpia:

```bash
npm run lint:limpio
```

```
> demo-analisis-estatico@1.0.0 lint:limpio
> eslint src/reportes.limpio.js
```

Sin hallazgos y con salida 0.

### 9.2 Ruff en `python/`

La configuración está en `python/pyproject.toml`:

```toml
[tool.ruff]
line-length = 100

[tool.ruff.lint]
select = ["E", "F", "I"]
```

`E` son los errores de estilo de pycodestyle, `F` los de pyflakes (imports y variables sin usar) e `I` el orden de los imports.

```bash
cd python
uv run ruff check .
```

```
All checks passed!
```

Para mostrar hallazgos, copiamos temporalmente un archivo de ejemplo a `python/src/` y lo analizamos (después lo borramos). El archivo tenía dos imports sin usar y desordenados y una línea de más de 100 caracteres:

```
$ uv run ruff check src/ejemplo_tmp.py
I001 [*] Import block is un-sorted or un-formatted
 --> src/ejemplo_tmp.py:1:1
  |
1 | / import sys
2 | | import os
  | |_________^
help: Organize imports
  |
1 + import os
2 | import sys
  - import os
3 |
  |

F401 [*] `sys` imported but unused
 --> src/ejemplo_tmp.py:1:8
  |
1 | import sys
  |        ^^^
2 | import os
  |
help: Remove unused import: `sys`
  |
  - import sys
1 | import os
  |

F401 [*] `os` imported but unused
 --> src/ejemplo_tmp.py:2:8
  |
1 | import sys
2 | import os
  |        ^^
help: Remove unused import: `os`
  |
1 | import sys
  - import os
2 |
  |

E501 Line too long (106 > 100)
 --> src/ejemplo_tmp.py:5:101
  |
5 | def calcular_error_porcentual(real, pronostico, umbral_de_alerta_para_la_planta_de_produccion_industrial):
  |                                                                                                     ^^^^^^
6 |     return abs(real - pronostico) / real * 100
  |

Found 4 errors.
[*] 3 fixable with `--fix`.
```

Con `--fix` ruff corrigió lo que podía y dejó lo demás:

```
$ uv run ruff check src/ejemplo_tmp.py --fix
E501 Line too long (106 > 100)
 --> src/ejemplo_tmp.py:3:101
  |
3 | def calcular_error_porcentual(real, pronostico, umbral_de_alerta_para_la_planta_de_produccion_industrial):
  |                                                                                                     ^^^^^^
4 |     return abs(real - pronostico) / real * 100
  |

Found 3 errors (2 fixed, 1 remaining).
```

Aquí se ve la idea de fondo: lo mecánico (imports) se arregla solo; lo que pide una decisión (cómo acortar un nombre) lo decide una persona.

Ruff también tiene una regla de complejidad ciclomática, `C901`, que nosotros no activamos en el proyecto. Con un umbral muy bajo (1) para ver cómo reporta:

```
$ uv run ruff check . --select C901 --config "lint.mccabe.max-complexity = 1"
C901 `_validar_misma_longitud` is too complex (2 > 1)
  --> src/mad.py:11:5
   |
11 | def _validar_misma_longitud(real, pronostico):
   |     ^^^^^^^^^^^^^^^^^^^^^^^
12 |     if len(real) != len(pronostico):
13 |         raise ValueError("Las series deben tener el mismo numero de periodos")
   |

C901 `_validar_al_menos_un_periodo` is too complex (2 > 1)
  --> src/mad.py:16:5
   |
16 | def _validar_al_menos_un_periodo(real):
   |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
17 |     if len(real) == 0:
18 |         raise ValueError("Se necesita al menos un periodo para calcular el MAD")
   |

Found 2 errors.
```

(Con el umbral de 1 cualquier función con un `if` "es compleja"; solo lo usamos para ver el formato.)

Para el formateador:

```
$ uv run ruff format --check src tests
4 files already formatted
```

## 10. Documentación oficial

| Tema | Enlace |
|---|---|
| ESLint | https://eslint.org/docs/latest/ |
| Regla `complexity` de ESLint | https://eslint.org/docs/latest/rules/complexity |
| Migración a ESLint 10 | https://eslint.org/docs/latest/use/migrate-to-10.0.0 |
| Prettier | https://prettier.io/docs/ |
| Jest | https://jestjs.io/docs/getting-started |
| Ruff | https://docs.astral.sh/ruff/ |
| uv | https://docs.astral.sh/uv/ |
| uv en GitHub Actions | https://docs.astral.sh/uv/guides/integration/github/ |
| Pylint | https://pylint.readthedocs.io/ |
| Black | https://black.readthedocs.io/ |
| Checkstyle | https://checkstyle.org/ |
| PMD | https://pmd.github.io/ |
| SpotBugs | https://spotbugs.github.io/ |
| PHPStan | https://phpstan.org/user-guide/getting-started |
| PHP_CodeSniffer | https://github.com/PHPCSStandards/PHP_CodeSniffer |
| Psalm | https://psalm.dev/docs/ |
| golangci-lint | https://golangci-lint.run/ |
| go vet | https://pkg.go.dev/cmd/vet |
| gofmt | https://pkg.go.dev/cmd/gofmt |
| Análisis de código de .NET (Roslyn) | https://learn.microsoft.com/en-us/dotnet/fundamentals/code-analysis/overview |
| dotnet format | https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-format |
| SonarQube (documentación) | https://docs.sonarsource.com/sonarqube-server/ |
| SonarQube: quality gates | https://docs.sonarsource.com/sonarqube-server/quality-standards-administration/managing-quality-gates/introduction-to-quality-gates |
| Semgrep | https://docs.semgrep.dev/ |
| OWASP: herramientas de análisis de código fuente (SAST) | https://community.owasp.org/Source_Code_Analysis_Tools |
| Sintaxis de workflows de GitHub Actions | https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax |
| pre-commit | https://pre-commit.com/ |
| Husky | https://typicode.github.io/husky/ |
| ISTQB CTFL v4.0 | https://istqb.org/certifications/certified-tester-foundation-level-ctfl-v4-0/ |
| Refactoring (Martin Fowler) | https://refactoring.com/ |
