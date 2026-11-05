function proc(d, u) {
  const r = [];
  let n = 0;
  for (let i = 0; i < d.length; i++) {
    let e;
    if (d[i].real == 0 || typeof d[i].pron == 'undefined' || d[i].pron == null) {
      e = null;
    } else {
      e = Math.abs(d[i].real - d[i].pron) / d[i].real * 100;
    }
    let s;
    if (e === null) {
      s = 'sin demanda';
    } else if (e >= u) {
      s = 'alerta';
    } else if (e >= 8) {
      s = 'vigilar';
    } else {
      s = 'ok';
    }
    r.push({ periodo: d[i].periodo, error: e, estado: s });
  }
  return r;
  console.log('periodos procesados: ' + r.length);
}

function peor(d) {
  let r = null;
  let m = -1;
  for (let i = 0; i < d.length; i++) {
    if (d[i].real == 0 || d[i].pron == null) {
      continue;
    }
    const e = Math.abs(d[i].real - d[i].pron) / d[i].real * 100;
    if (e > m) {
      m = e;
      r = d[i].periodo;
    }
  }
  return r;
}

module.exports = { proc, peor };
