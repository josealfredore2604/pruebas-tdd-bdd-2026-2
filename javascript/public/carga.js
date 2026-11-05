const formulario = document.getElementById('form-carga');
const mensaje = document.getElementById('mensaje');
const listaPronosticos = document.getElementById('pronosticos');

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const serie = document.getElementById('serie').value.split(',').map((valor) => Number(valor.trim()));
  const ventana = Number(document.getElementById('ventana').value);

  const respuesta = await fetch('/api/pronosticos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ serie, ventana }),
  });
  const datos = await respuesta.json();

  listaPronosticos.replaceChildren();
  if (!respuesta.ok) {
    mensaje.textContent = datos.error;
    return;
  }

  mensaje.textContent = `Datos cargados correctamente: ${serie.length} períodos`;
  datos.pronosticos.forEach((pronostico) => {
    const item = document.createElement('li');
    item.textContent = pronostico.toFixed(2);
    listaPronosticos.appendChild(item);
  });
});
