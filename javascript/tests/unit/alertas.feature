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
