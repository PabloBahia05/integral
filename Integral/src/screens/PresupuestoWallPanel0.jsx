import React, { useState, useEffect, useRef } from "react";

const API = "http://localhost:3001";
const WALLPANEL_IMG = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAPEhUQDw8PDxUVFRUVFRUPEBUPEA8QFRYYFxUVFRUYHSggGBolGxUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDQ0OGA8NFS4dFRktKysrKys3KystLSsrKystKy0tKysrNysrLSstLS0tKysrKysrKysrKysrKysrKysrK//AABEIAL4BCQMBIgACEQEDEQH/xAAaAAACAwEBAAAAAAAAAAAAAAAEBQEDBgIA/8QAPxAAAQICBQoDBAkEAwEAAAAAAQACAwURM3KxsgQGEiEiIzEyccJzgsETYZGzNEFDUWKBg5LRFFKh4UJj8KL/xAAaAQEBAQEBAQEAAAAAAAAAAAAAAQUDAgQG/8QAGhEBAQEAAwEAAAAAAAAAAAAAAAExAgQyEf/aAAwDAQACEQMRAD8AXZvN3Z69oTqGxKs3G7s9RhCdMC+l87oBJ5YN+63FvKdgJLLa91uLeUDpQpK9Qgz07r2WB8xP3BIZ0N+ywPmLQO4oOUtnvIzxBgemaWz0bDPEGB6C7IBumdPVXkKqX1TOnqiKEAU1G5iWHXFCyEbDrfYxFzWpiWHXFDSLkdb7GID6F4hdUKCgSyAc3Rncm1CVyDg7ozuTZRVbln5eN8+1FxNWhes/L659qLiapVh/IxvXWRjatDkg2Dacs/I611kY2rRZIN2bTrgsrt+60ev4Mcm9PVDT0bvzs9UVk/p6lCzw7vzNXLhj3y0Lm+NcXrDwome1Y8Rvqh83+MXqzCiZ6d0LbbirC6Fzb+1tswBFTrlFpvchs3ftbTPlhEzkbIttucpC6Gze4xbTcAVs9q22xhcq83xW2m4FZPhsC2MLlIXQ+brdmL4zrgu56Nllv0KjNvli+M64KyejUy36FONLoTN1u5d4kW8pnoH7j8EBm4Ny7xYt5TGkpMS6webY3Z69oTloSjNsbs9RhCctC3WU6SSW17rcW8p2kktr3W4t5QOl4KV4IM/Oxv2WB8xP3JFO69lgfMT5yDlLZ7ys8QYHpoEtno2GeIMD0F8vG6ZZ9VeVTLxumWfVXoA5qNzEsOuKFkQ3brfYxGTUbmJYdcULIqt1vsYoD1BXSgqhNIODujO5NkqkHB3Rncmq8vSt6QS+ufai4mrQOCQy4b59qLjapVh9I611kY2rRZMd2bTvRZ6SVrrPe1P8mOwbTrll9v3Wh1/Jlk/En3C8oee1XmaiclHpeUNPKvzNXLhke+Whc3+MW0zCiJ8N3523FD5v/bWmYSr57Vi224pxLqjNw1tpnywiZzyi23CUNm4dcW0z5aKnHKLYo/a5SF0LIjW2m4FZPuQWxc5VyH7S0MAVs+qx4no9IXVObh2YvjOuCsn/AAh2/QqrNzlieM+4K2f8GWjcpFuqs3G7o+LEvcmNA+8oHNuqcP8AsiYijPzKTEusPm4N2bXaE4CU5uVZtdoTdbrJeSWW17rcW8p0k0sr3W4t5RTpeUryqEE7r2WB8xPnDWkU6r2WB8wp+7ig5oS2ejYZ4gwPTNLZ7ys8QYHoL5fVMs+qvVEvG6ZZ9UQgEmo3MSw64oWRVbrfYxFzWpiWHXIWRVbrZwMUUwXJXS5KBPIODujO5NUqkHB3RncmqiuHJDLa59qLjanzkhltc+1FxtUqn0krXWe5q0GTclP4nf5oWek1abPcxaLJRuz1deFldv20ev5M8m1D4XlCTur8zbkZBGo9PVBzyrFtvquXHHq6Gzf4xR74eFXz7VD87LnKiQ8YtpmFXz87vzsuKRbofNwa4ttmBFzobDbYuP8AKFzb4xbbcCKnQ2W2vjqKQuhpAK2038jorufVYti5y4zf4xbTMK7n1W22MLlIXQ+bfLF8V9zVbnBwZavCqzc4RPGdcFZP+Vlq4KQuozaO6PiRcSP1+5A5s1R8SLiTLV/4pMLrCZuVZtdoTZKs3Ks2u0Jqt5kJSWWV7rUW8p0k0sr3Wot5RYdKV4KUCCdV7LA+YnzuKQzqvZYb8wp+7ighLZ7yM8QYHpkl095GeJ2OVF+QVTLKvVEvqmWVeoBJrUxLDrkNIat1s4GIqa1MSw65CyGrdbOBiBgoIXSgoEub/B3RncmpSvN/g7ozuTRRXDkiltc+1FxtT1yRS2ufai42qVTyTjfGycbFosnq/M70Wdk9abJxsWhyUbHmdcFk9z3Wj1/MNIPD8vVBz2rFtvqUbAF3qgZ5VC2y4rlxx7uhpAdcXqzCURPzuxaZ6ofN/jF6swFE5wVYtN7lYXVGbf2tpmAImc06DbfoUNm3xi224ETODsNtC4qQuhpBxi2mYV1PqttsYXLmQ/a9WYV1nAd2PEFxUhdD5t8sXxXXBW5wcrLRwlU5smlsXxTcFdnBystdpSLdRm3VHxIuJNPMEszZG6d4sQf/AEE00FIXWEzdqza7QmqVZu1ZtDC1NVvshKSSyvdai3lO0klle61FvKB4pChSECCdV7LDfmFP3JDOfpDLDfmFP3IIS2e8jPE7HpkEtn3IzxOx6C+X1TLIRCol9UyyFegEmtTEsOuQ0hq3WzgYiprUxLDrkLIat1s4GIGKgqVCKS5vcHdGdyapXm9wd0Z3JovIrekUtrn2ouNqfPSGW1z7UXG1R6PJPWmz3sWhySr8zvRZ+T1ps97Fosl5KPxOWV3PdaHX8mmT/f7igp4N15m+qNyc8Oh9EHPRuxab6rlx8x7uhM3xtRfcYeH/AGiZ/V+dvqh83uMbrDwomf1f6je5It0Nm4dcW0z5aJnI2BbGEoXN3jFP4mfLRc5OwLYwqQuhJBxi9W4VM/qxbFxUyHjF6twqZ+N2LbcJSF0Pm1RoxfF7Wqye8sOn6ndpXGbXCKP+3tarJ8dllsD/AOSoXUZs1R8WJiCZ+1SzNirPjRMQTWn3BIXWEzdqza7Wpqleb1WbXa1NFvshKSSyvdai3lOwksrr3Wot5QO1IUKQgQzn6Qyw35hT93FIJx9IZYb8wp+5FeCWz7kZ4nY9MQl095WeJ2ORBGQVTLIV6ol9UyyFegEmtTEsOuQ0hq3WzhYiZrUxLDrkNIat3iHCxRTBQVKgqhNm9wd0Z3JqUqzf4O6M9U2K8qqekMtrn2ouNqfPSGXVz+sXG1RT2TVp6d7VoslOwT+I3LOyatPTvatFktX5jcsrue60Ov5Nck+r/wB9yDnx3Qtt9UXkx+rqhJ9rheYeq5cfL3dCSDjG6w8JRM9q/wBRvqh5ANcXqy4oifcnnb6qRboTNs1tqH8tGzobAti538IXNv7S1D+WipwNgW23OSF0LIuaL1bhK6n1WLQucuJHxi9W3Fdz6rFttzlIXQ+bnCL4va1dz/lh2u1y4zcp0Y3i9rVZP+Vh/EMBSF1zmvqhOH/dExJjoFL82ap3jRL03o96kW6web1WbXa1NAlebtUbXa1NVvsd4JJK691qLiKdpJK691qLiRYeKVClEIZx9IZYZ8wp+5Z+cfSGWGfMKflFeCXT3lZ4nY5MQl095WW+xyAiX1TLIRCoyCqZZCvQCTWpiWHXIWQ1bvEOFiKmtTEsOuQshq3eIcLEDAqCuiuSgT5vcHdGeqalKs3uV3RlxTUqKqekMtrn2ouNqfPSGW1z+sXG1SqeyYb02e5q0WT8htOuWek1Y6z3tWhgHYNo+qyu37rQ6/kyyb0Qs8buvMEVkwuQ0+qvM1ceOOl0JIOMX9O4oqe1fmZ6oTN/mijw7ii57VeZtxSF0Nm5xi2oeBFzg7Ap/ubc5B5ucYtpmAoudDYFttxUmF0HIzrjeXCVbPqsWx3/AMKuSjajdWYSrJ9yecXv/lJhdD5t/beL2BWz3lbaGEqnNnhG8XtarZ4NhloYXKRbrnNiqd4sS8JvqSjNmrd4sS8J1QpC6wObtUbXa1NEqzdqja7Wpqv0DIeSSVV7rUXEnaSSmvd1i4kDxeXl5AhnH0hlhnzCn54pBOPpLLLPmFPyg8EunvKy32OTEJbPeVlvscgJl9UyyEQqMgqmWQr0Ak1qYlhyGkNW7xDhYiJtUxLDkPIat3iHC1AwXJXSgopNm8Nl3Rlzk1cleb3K7oy5yaFeRU9IJbXP6xsbVoHpBLK59qLjalU+kx3ps9zVocnqzaJvWdlFb+XexaPJas9Ssrt+60Ov5Msn+v8AO5DT+p8zb/8AaKybgT7jcENPqnzsv/0uPHHS6BkA2ovVnqip7Vfm31Q2b524vWHcUVPKr823qRboXNw64vWHgRc65RabcUJm2NqNah4Ai51yAfiFxSF0LIRtRurLipnw3YtN7v5USE7cXqy4hdzyqFplxSF0Nm1wjeKMDVbOhsMtDCVTmyNUbxRhCIn1W212n+FC6qzaG7f40S8JtT7ylWbPJE8Z96cafuSF1gc3ao2u1qbJRm7Vm0bmpuFvsh5JJTXO6xcadpLKK53WLjQO15eXkCCb/SWWYfzCtAVn5v8ASWWYfzSn6CUtnvKy32OTFLp7yst9jkBOQVTLIV6oyCqZZCvQCTapiWHIaQ1ZtnC1ETapiWCqJDVnxHYWopgoKlcuUCjN7ld0Zc5NCleb3K7oy4poVFVPSGWVz+sXG1P3rPyyuf1i4wgfyetPTvYtDklV5is7J609BjatFktWbTlldz20Ov5NMl4fH47Konw3Xmb6ojJOHxuahp7VdXN9Vx4+XS6BkA2ov6VzkVPDu/OENIOaL0h3ORE7G7Ntt6kW6Gzb5o1plyMnA2G2hd/tB5vHXF6w8KNnHILQuSF0HIOaJ1h+q7nw3Ytw7lXIzQ6L7gz1V09qvNDSYXQmbZrvEbgCIno3bbX19HIbNwa43iNwBFT0bAtC4qQuqs2eSJ4zv8n/AGmmifvKV5tcsTxim2kkLrAZvHdeY3BN2pNm8d15jcE3aVvsh2kknrndYuNPEkk9a79TGpVO15eUKoQzb6SyzD+YU/Wfmv0llmH8xy0BRXktn3Ky32OTJLZ9yst9jkQTkNUywLleqMhqmWG3K5FCzapiWCh5DVm27C1XzY7mJYKokNWbbsLVAxXLl0uHIFOb3K7yXFNClWb/ACu6MucmpUVU9IJXXP6xcYT96QSuuf1i4wgfyWtdZGNi0GSVZtOWdlB3v5d7FosjO7daN6yu36aHX8muS8PjcFRPqrzNRGRcPjcELPjuvM29cePl0ugZDzxf0u5FTyqNP97b0Jm/rfG/S7kZO6o2m3qRboXN4a436eEo6cVfnZ6IDN/mi/p4UfOTu/OxIXQMi5o3RtzlfPjuvzbcqJENuN0bc5Xz4bo2m/5UhdCZt80a23AETOqsWvQ/yhM2+Me2zAEZOqsHVzC4/wAJC6GzaOxE8U+hTfTSfNs7MTxjcExoKQusHm+d35jcE4YUikLx7Lj/AMj6JxDf71vMkSCk0mrXfqY01Dgk8kePau1j7TGiHq8vUqKUCGafSmWYXzHJ+Vnpo4f1TNY4QvmOT+lFdpZPuVls4HJiHJZPnDRZbOByAzIaplhtyuQ+Qu3UOw25XU+9ALNqmJZKokNWbbsLVdN3D2MTX/xKHkLh7M6/+brmqBmuXr1K5cVVKs3uV3Rlzk0KU5vOGi7WODLimpKg4ekErrn9YuMJ69wWfljh7Z+scYuNqitBKa38u5q0ORDYNs/BZ6TuHtTr+ruatDkh2HWjeVldv0+/r+TXI+A/Mf4CHn1V+bcQV+RnV8bmqifHdU/ibjC48cdLpfm/WRR4fcjp4N0bTL0BIKyLr+qHicjp3VeZnokW6EkOp0b9P40I+c8nnal+b7tqN0hnV0KYTnk8wvISF0FIqyL0Z3oie1fmbeUNITvInRnciZ3R7M2mKQugM3OaPbZgCMnNX5m3FBZtEUx9dO3DPxYEZODu/O31SF0Jm27ZieKcLUx0ylWbTtmJ4t7Wprp9PihW3GSwxwhs/aFP9ND/ALGftCtXlsM5V/Ts/sZ+0KBksMcIbB5R/CuXkFf9Oz+xn7Qo/p2f2M/aFavIKTksPj7Nn7Qp/p2f2M/aFavIKv6dn9jP2hQ7JoZ+zYfKFcoKBQ+aZI17Wbuh2mNLRGgHscxpbTR97+PDUVGVzfI4VBOi6lpePZw9PYDS+k0DVSAaF2ZFBJeSYh09OnaAADywuAAFA5G6+PGmlcszeginaimkaNBeKPZ6LmaHDloeffw1oOjMsj+t0IamkhzKDtaIAoo47bNXHaH3qDM8jaQNigiIdIQ92BC0dMl1FAo0hrXocgghxftkl0N5J0aXPhlhDiQ2nX7NtIpo46ta86QQTpUuiHSMQnaA1RA0OGoahsMNI10tppNJpCI81yRopHs3mlooDQC3SfoUupGzQdLUaOU/cinR8nAYT7Oh/Jsjb+ukauFH1oQ5uQDpBxiOEQgxQ5wLY7g4uBeKPeRQKBRqo1CggylhDBpxd2C1pLgT7NwAcwkjWDotpp16uKCgTTIRRQ+Br4UNFJ5aNVHA6bKPv0hRxCNhOgPDS32TtNum2gNpezVtAfWNY+IQUDN6A0h1MRxGgAXPpOjDdDexvDgDBZ/mmkmlMMkyRkJrWMHINFpOtwB46/yHwQK3zaAA4nJoo0CNKmEzZY7WHnXw/DzfhXo8ygMERzMldFEN2i4w2QhSdXLpubpazo6vrBVjZE0UD2+Uaohi6/ZGmJ97qWbXuppooFFFAVsCR5PDNMOGGDSY7RZqYTDBDNn7hTSB94B+pANlE3yaG4t9nSfaNhAgQobXvIcdlz3NBA0HDjxFApXJzgyUCMdB25JDgGNLnEF4OiAeO7eaDQaBTRQQUQ6QZPQ5rGmE14DXthENa9g0hoEUagdM8KCqn5r5K4OD2F+k1zBpGn2LH6RcIZ+rW92s0nXxo1J8F0SaQW+03UTdxGwjRC4udo0OH4NrmNA1fXqpZGE08WtP5BL4soa72g9tGAiFpIb7OhuhRohtLOFAHGngmTRq+/3niVPkHAgMHBjR0aF4wWni1p/IKxeT5D6rbAYODWjo0KTCaeLW/ALteT5D6rEBg4NaOjQvGC08WtPUBWLyfIfVbYDBwY0dGheMFp/4t+AVi8nyCpuTsHBjR0aFPsWf2t/aFYvJ8h9f/9k=";

const normalizar = p => ({
  ...p,
  articulo: p.articulo ?? p.ARTICULO ?? "",
  codart:   p.codartint ?? p.CODARTINT ?? p.codart ?? "",
  precio:   parseFloat(p.precio ?? p.PRECIO ?? 0) || 0,
});

const fmt = v => `$${Number(v).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PresupuestoWallPanel({ onVolver }) {
  const [form, setForm] = useState({
    ancho:               "",
    alto:                "",
    anchoVarilla:        "",
    espacioEntreVarillas:"",
    materialBase:        "",
    materialBasePrecio:  0,
    precio_un:           0,
    materialVarilla:     "",
    materialVarillaPrecio: 0,
    valorBase:           "",
    valorCanto:          "",
    valorMO:             "",
  });

  const [materiales,            setMateriales]            = useState([]);
  const [asociados,             setAsociados]             = useState([]);
  const [margenBD,              setMargenBD]              = useState(null);
  const [margenInput,           setMargenInput]           = useState("");
  const [cargando,              setCargando]              = useState(false);
  const [baseSearch,            setBaseSearch]            = useState("");
  const [baseDropdown,          setBaseDropdown]          = useState(false);
  const [varillaSearch,         setVarillaSearch]         = useState("");
  const [varillaDropdown,       setVarillaDropdown]       = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Cache de precios traídos de BD (precio_XXXX)
  const preciosBD = useRef({});

  useEffect(() => {
    setCargando(true);

    const extraerCodarts = (expr) => {
      if (!expr) return [];
      return [...expr.matchAll(/precio_([A-Z0-9]+)/gi)].map(m => m[1]);
    };

    Promise.all([
      fetch(`${API}/productos/wall-panel`).then(r => r.json()).catch(() => []),
      fetch(`${API}/asociaciones-form`).then(r => r.json()).catch(() => []),
    ]).then(async ([mats, asocs]) => {
      setMateriales((Array.isArray(mats) ? mats : []).map(normalizar));

      const todos = Array.isArray(asocs) ? asocs : [];
      const fila = todos.find(a => (a.codart ?? a.CODART ?? "").toUpperCase() === "WALLPANEL");

      // Expandir la fila en un array de fórmulas individuales
      const expandir = (f) => {
        if (!f) return [];
        const slots = [];
        for (let i = 1; i <= 10; i++) {
          const t  = f[`titulo${i}`] ?? f[`TITULO${i}`];
          const c  = f[`codf${i}`]  ?? f[`CODF${i}`];
          const fm = f[`form${i}`]  ?? f[`FORM${i}`];
          if (fm) slots.push({ titulo: t ?? `Fórmula ${i}`, codform: c, formula: fm });
        }
        return slots;
      };

      const slots = expandir(fila);

      // Extraer todos los precio_XXXX de las expresiones y buscar en BD
      const todasExpresiones = slots.map(s => s.formula).join(" ");
      const codartsBD = [...new Set(extraerCodarts(todasExpresiones))];

      const nuevosPrecios = {};
      await Promise.all(
        codartsBD.map(async (cod) => {
          try {
            const res  = await fetch(`${API}/articulos/${encodeURIComponent(cod)}`);
            const data = await res.json();
            const row  = Array.isArray(data) ? data[0] : data;
            const campos = ["PRECIO1","precio1","PRECIO","precio","PREC1","prec1","P1","p1","COSTO","costo","VALOR","valor"];
            let precio = NaN;
            for (const campo of campos) {
              const v = parseFloat(row?.[campo]);
              if (!isNaN(v) && v > 0) { precio = v; break; }
            }
            if (isNaN(precio) && row) {
              for (const k of Object.keys(row)) {
                if (/prec|price|cost|valor/i.test(k)) {
                  const v = parseFloat(row[k]);
                  if (!isNaN(v) && v > 0) { precio = v; break; }
                }
              }
            }
            if (!isNaN(precio)) nuevosPrecios[`precio_${cod}`] = precio;
          } catch { /* artículo no encontrado */ }
        })
      );

      preciosBD.current = nuevosPrecios;
      setAsociados(slots);
    }).finally(() => setCargando(false));
  }, []);

  // Cargar margen de WALLPANEL desde BD
  useEffect(() => {
    fetch(`${API}/margen/por-codart?codart=WALLPANEL`)
      .then(r => r.json())
      .then(d => {
        const row = Array.isArray(d) ? d[0] : d;
        if (!row) return;
        for (const k of Object.keys(row)) {
          if (/margen|margin/i.test(k)) {
            const v = parseFloat(row[k]);
            if (!isNaN(v)) {
              // BD guarda multiplicador (1.30) o porcentaje (30)
              const pct = v > 10 ? Math.round(v * 100) / 100 : Math.round((v - 1) * 10000) / 100;
              setMargenBD(pct);
              setMargenInput(String(pct));
              return;
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  // Cálculo de varillas
  const calcVarillas = () => {
    const ancho = parseFloat(form.ancho);
    const alto  = parseFloat(form.alto);
    const av    = parseFloat(form.anchoVarilla);
    const esp   = parseFloat(form.espacioEntreVarillas);
    if (!ancho || !alto || !av || !esp) return null;
    const cantVarillas = Math.floor((ancho + esp) / (av + esp));
    const anchoTotal   = cantVarillas * av + (cantVarillas - 1) * esp;
    return { cantVarillas, anchoTotal, alto };
  };

  const varillas   = calcVarillas();
  const valorBase  = parseFloat(form.valorBase)  || 0;
  const valorVarillas = varillas ? varillas.cantVarillas * (parseFloat(form.materialVarillaPrecio) || 0) : 0;
  const valorCanto = parseFloat(form.valorCanto) || 0;
  const valorMO    = parseFloat(form.valorMO)    || 0;

  // Contexto de variables para evaluar fórmulas de asociados
  const ctxVars = {
    ancho:              parseFloat(form.ancho)              || 0,
    alto:               parseFloat(form.alto)               || 0,
    anchoVarilla:       parseFloat(form.anchoVarilla)       || 0,
    espacioEntreVarillas: parseFloat(form.espacioEntreVarillas) || 0,
    materialBasePrecio: parseFloat(form.materialBasePrecio) || 0,
    precio_un:          parseFloat(form.materialBasePrecio) || 0,
    materialVarillaPrecio: parseFloat(form.materialVarillaPrecio) || 0,
    cantVarillas:       varillas?.cantVarillas ?? 0,
    anchoTotal:         varillas?.anchoTotal   ?? 0,
    valorBase,
    valorVarillas,
    valorCanto,
    valorMO,
  };

  const evalFormula = (formula) => {
    if (!formula) return 0;
    try {
      const allVars = { ...ctxVars, ...preciosBD.current };
      const expr = formula.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, match =>
        Object.prototype.hasOwnProperty.call(allVars, match)
          ? allVars[match]
          : match
      );
      // eslint-disable-next-line no-new-func
      const result = new Function(`"use strict"; return (${expr});`)();
      return isFinite(result) ? result : 0;
    } catch {
      return 0;
    }
  };

  const asociadosConValor = asociados.map(a => ({
    ...a,
    valorCalculado: evalFormula(a.formula ?? a.FORMULA ?? ""),
  }));

  const totalAsociados = asociadosConValor.reduce((s, a) => s + a.valorCalculado, 0);
  const totalFinal = totalAsociados || (valorBase + valorVarillas + valorCanto + valorMO);

  const margenPct     = parseFloat(margenInput) || 0;
  const totalConMargen = margenPct > 0 ? totalFinal * (1 + margenPct / 100) : totalFinal;

  const hayResultado = asociadosConValor.some(a => a.valorCalculado > 0) || valorBase || valorVarillas || valorCanto || valorMO;

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #b8d6ef",
    borderRadius: 6,
    fontFamily: "'Space Mono', monospace",
    fontSize: 13,
    color: "#0a3a5c",
    background: "#fafdff",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontFamily: "'Space Mono', monospace",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1.5,
    color: "#5a8aaa",
    marginBottom: 6,
    textTransform: "uppercase",
  };

  const sectionTitle = {
    fontSize: 10, fontWeight: 700, letterSpacing: 2,
    color: "#7aaac8", textTransform: "uppercase", marginBottom: 16,
  };

  const bkRow = {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "9px 16px", borderBottom: "1px solid #e8f0f7",
    fontFamily: "'Space Mono', monospace", fontSize: 13,
  };

  const baseFiltrados = materiales.filter(p =>
    !baseSearch ||
    (p.articulo ?? "").toLowerCase().includes(baseSearch.toLowerCase()) ||
    (p.codart   ?? "").toLowerCase().includes(baseSearch.toLowerCase())
  );
  const varillaFiltrados = materiales.filter(p =>
    !varillaSearch ||
    (p.articulo ?? "").toLowerCase().includes(varillaSearch.toLowerCase()) ||
    (p.codart   ?? "").toLowerCase().includes(varillaSearch.toLowerCase())
  );

  return (
    <div style={{
      background: "#fff", borderRadius: 10, border: "1px solid #ddeefa",
      padding: "32px 36px", maxWidth: 700, margin: "0 auto",
      fontFamily: "'Space Mono', monospace",
    }}>

      {/* ── Header ── */}
      <div style={{ display:"flex", alignItems:"center", gap:18, marginBottom:28, paddingBottom:20, borderBottom:"1px solid #e8f2fa" }}>
        <img src={WALLPANEL_IMG} alt="Wall Panel" style={{ width:64, height:64, objectFit:"cover", borderRadius:8, border:"1px solid #b8d6ef", flexShrink:0 }} />
        <div>
          <div style={{ fontSize:11, color:"#7aaac8", letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>Especiales</div>
          <h2 style={{ margin:0, fontSize:20, color:"#0a3a5c", fontWeight:700, letterSpacing:1 }}>CÁLCULO WALL PANEL</h2>
        </div>
        <button onClick={onVolver} style={{ marginLeft:"auto", padding:"8px 18px", background:"#fff", border:"1px solid #b8cfe0", borderRadius:6, fontFamily:"'Space Mono', monospace", fontSize:11, color:"#0a3a5c", cursor:"pointer" }}>← Volver</button>
      </div>

      {/* ── Dimensiones ── */}
      <div style={{ marginBottom:28 }}>
        <div style={sectionTitle}>Dimensiones (cm)</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div>
            <label style={labelStyle}>Ancho *</label>
            <input style={inputStyle} type="number" placeholder="ej: 240" value={form.ancho} onChange={e => set("ancho", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Alto *</label>
            <input style={inputStyle} type="number" placeholder="ej: 240" value={form.alto} onChange={e => set("alto", e.target.value)} />
          </div>
        </div>
      </div>

      {/* ── Varillas ── */}
      <div style={{ marginBottom:28 }}>
        <div style={sectionTitle}>Varillas (cm)</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div>
            <label style={labelStyle}>Ancho Varilla *</label>
            <input style={inputStyle} type="number" placeholder="ej: 4" value={form.anchoVarilla} onChange={e => set("anchoVarilla", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Espacio entre Varillas *</label>
            <input style={inputStyle} type="number" placeholder="ej: 2" value={form.espacioEntreVarillas} onChange={e => set("espacioEntreVarillas", e.target.value)} />
          </div>
        </div>
        {varillas && (
          <div style={{ marginTop:12, padding:"10px 14px", background:"#f0f8ff", borderRadius:6, border:"1px solid #cce4f7", fontSize:12, color:"#0a3a5c", display:"flex", gap:24 }}>
            <span>🔢 <strong>{varillas.cantVarillas}</strong> varillas</span>
            <span>↔ Ancho total: <strong>{varillas.anchoTotal.toFixed(1)} cm</strong></span>
            <span>↕ Alto: <strong>{varillas.alto} cm</strong></span>
          </div>
        )}
      </div>

      {/* ── Material ── */}
      <div style={{ marginBottom:28 }}>
        <div style={sectionTitle}>Material</div>
        {cargando ? (
          <div style={{ fontSize:12, color:"#4a8ab5", fontStyle:"italic", padding:"10px 0" }}>⏳ Cargando...</div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

            {/* Placa de Base */}
            <div style={{ position:"relative" }}>
              <label style={labelStyle}>Placa de Base</label>
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <input style={{ ...inputStyle, flex:1 }} placeholder="Tipear para filtrar..."
                  value={baseSearch !== "" || baseDropdown ? baseSearch : form.materialBase}
                  onFocus={() => { setBaseSearch(""); setBaseDropdown(true); }}
                  onChange={e => { setBaseSearch(e.target.value); setBaseDropdown(true); }}
                  onBlur={() => setTimeout(() => setBaseDropdown(false), 150)} />
                {form.materialBase && (
                  <button type="button" onClick={() => { set("materialBase",""); set("materialBasePrecio",0); set("precio_un",0); setBaseSearch(""); }}
                    style={{ padding:"0 10px", height:38, borderRadius:4, border:"1px solid #d0dde8", background:"#f5f8fa", color:"#c0392b", cursor:"pointer", fontSize:14, fontWeight:700 }}>✕</button>
                )}
              </div>
              {baseDropdown && (
                <div style={{ position:"absolute", zIndex:999, left:0, right:0, background:"#fff", border:"1px solid #b8d6ef", borderRadius:6, boxShadow:"0 4px 18px rgba(0,40,80,0.13)", maxHeight:220, overflowY:"auto", marginTop:2 }}>
                  <div style={{ padding:"9px 14px", fontSize:12, color:"#6a8aa0", cursor:"pointer", borderBottom:"1px solid #e8f0f7" }}
                    onMouseDown={() => { set("materialBase",""); set("materialBasePrecio",0); set("precio_un",0); setBaseSearch(""); setBaseDropdown(false); }}>— Sin material —</div>
                  {baseFiltrados.slice(0,60).map((p,i) => (
                    <div key={p.id ?? p.codart ?? i}
                      style={{ padding:"9px 14px", fontSize:13, cursor:"pointer", background: form.materialBase===p.articulo?"#e8f4fb":"transparent", borderBottom:"1px solid #f0f5fa", display:"flex", justifyContent:"space-between", alignItems:"center" }}
                      onMouseDown={async () => {
                        set("materialBase", p.articulo);
                        setBaseSearch(""); setBaseDropdown(false);
                        try {
                          const r = await fetch(`${API}/articulos/${encodeURIComponent(p.codartint ?? p.codart ?? "")}`);
                          const d = await r.json();
                          const row = Array.isArray(d) ? d[0] : d;
                          const pu = parseFloat(row?.precio_un ?? row?.PRECIO_UN ?? p.precio ?? 0);
                          set("materialBasePrecio", pu);
                          set("precio_un", pu);
                        } catch {
                          set("materialBasePrecio", parseFloat(p.precio)||0);
                          set("precio_un", parseFloat(p.precio)||0);
                        }
                      }}>
                      <span>{p.codart?<span style={{color:"#4a8ab5",fontFamily:"monospace",marginRight:6}}>[{p.codart}]</span>:null}{p.articulo}</span>
                      {p.precio!=null && <span style={{color:"#2d7fc1",fontWeight:700,fontSize:12,marginLeft:8}}>${parseFloat(p.precio).toLocaleString("es-AR")}</span>}
                    </div>
                  ))}
                  {baseFiltrados.length===0 && <div style={{padding:"12px 14px",fontSize:12,color:"#b0c0d0",fontStyle:"italic"}}>Sin resultados</div>}
                </div>
              )}
            </div>

            {/* Placa de Varillas */}
            <div style={{ position:"relative" }}>
              <label style={labelStyle}>Placa de Varillas</label>
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <input style={{ ...inputStyle, flex:1 }} placeholder="Tipear para filtrar..."
                  value={varillaSearch !== "" || varillaDropdown ? varillaSearch : form.materialVarilla}
                  onFocus={() => { setVarillaSearch(""); setVarillaDropdown(true); }}
                  onChange={e => { setVarillaSearch(e.target.value); setVarillaDropdown(true); }}
                  onBlur={() => setTimeout(() => setVarillaDropdown(false), 150)} />
                {form.materialVarilla && (
                  <button type="button" onClick={() => { set("materialVarilla",""); set("materialVarillaPrecio",0); setVarillaSearch(""); }}
                    style={{ padding:"0 10px", height:38, borderRadius:4, border:"1px solid #d0dde8", background:"#f5f8fa", color:"#c0392b", cursor:"pointer", fontSize:14, fontWeight:700 }}>✕</button>
                )}
              </div>
              {varillaDropdown && (
                <div style={{ position:"absolute", zIndex:999, left:0, right:0, background:"#fff", border:"1px solid #b8d6ef", borderRadius:6, boxShadow:"0 4px 18px rgba(0,40,80,0.13)", maxHeight:220, overflowY:"auto", marginTop:2 }}>
                  <div style={{ padding:"9px 14px", fontSize:12, color:"#6a8aa0", cursor:"pointer", borderBottom:"1px solid #e8f0f7" }}
                    onMouseDown={() => { set("materialVarilla",""); set("materialVarillaPrecio",0); setVarillaSearch(""); setVarillaDropdown(false); }}>— Sin material —</div>
                  {varillaFiltrados.slice(0,60).map((p,i) => (
                    <div key={p.id ?? p.codart ?? i}
                      style={{ padding:"9px 14px", fontSize:13, cursor:"pointer", background: form.materialVarilla===p.articulo?"#e8f4fb":"transparent", borderBottom:"1px solid #f0f5fa", display:"flex", justifyContent:"space-between", alignItems:"center" }}
                      onMouseDown={() => { set("materialVarilla", p.articulo); set("materialVarillaPrecio", parseFloat(p.precio)||0); setVarillaSearch(""); setVarillaDropdown(false); }}>
                      <span>{p.codart?<span style={{color:"#4a8ab5",fontFamily:"monospace",marginRight:6}}>[{p.codart}]</span>:null}{p.articulo}</span>
                      {p.precio!=null && <span style={{color:"#2d7fc1",fontWeight:700,fontSize:12,marginLeft:8}}>${parseFloat(p.precio).toLocaleString("es-AR")}</span>}
                    </div>
                  ))}
                  {varillaFiltrados.length===0 && <div style={{padding:"12px 14px",fontSize:12,color:"#b0c0d0",fontStyle:"italic"}}>Sin resultados</div>}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* ── Valores (asociados_form) — estilo Vanitory ── */}
      <div style={{ background:"#f4f8fb", borderRadius:10, padding:"14px 16px", marginBottom:28, border:"1px solid #e0eaf2" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"#0a3a5c", borderRadius:7, padding:"9px 14px", marginBottom:12 }}>
          <span style={{ fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:13, letterSpacing:"0.12em", textTransform:"uppercase", color:"#fff" }}>
            🧮 Fórmulas asociadas
          </span>
          {asociados.length > 0 && (
            <span style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:"#7ab2d4", letterSpacing:"0.08em" }}>
              {asociadosConValor.length} ítem{asociadosConValor.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Sin datos */}
        {asociados.length === 0 && (
          <p style={{ fontSize:12, color:"#8aabb8", fontStyle:"italic", padding:"6px 2px", margin:0 }}>
            Sin fórmulas asociadas para este artículo.
          </p>
        )}

        {/* Filas de slots */}
        {asociadosConValor.map((a, i) => {
          const nombre   = a.titulo ?? a.TITULO ?? a.nombre ?? a.NOMBRE ?? `Fórmula ${i+1}`;
          const codform  = a.codform ?? a.CODFORM ?? a.id ?? null;
          const expresion = a.formula ?? a.FORMULA ?? a.expresion ?? "";
          return (
            <div key={codform ?? i} style={{ background:"#fff", borderRadius:7, border:"1px solid #e0eaf2", marginBottom:7, padding:"10px 12px" }}>
              {/* Nombre + resultado */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:"#0a3a5c", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                    {nombre}
                  </div>
                  {codform && (
                    <div style={{ fontSize:10, color:"#4a8ab5", fontFamily:"monospace", marginTop:2, letterSpacing:"0.04em" }}>
                      #{codform}
                    </div>
                  )}
                </div>
                <div style={{ fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:16, color: a.valorCalculado > 0 ? "#0a3a5c" : "#b0c8d8", minWidth:100, textAlign:"right", flexShrink:0 }}>
                  {fmt(a.valorCalculado)}
                </div>
              </div>
              {/* Expresión */}
              {expresion && (
                <div style={{ marginTop:7, padding:"4px 8px", background:"#eaf3fb", border:"1px solid #b8d6ef", borderRadius:5, fontSize:11, fontFamily:"monospace", color:"#1a4a70", wordBreak:"break-all", lineHeight:1.5 }}>
                  <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.1em", color:"#4a8ab5", textTransform:"uppercase", fontFamily:"'Space Mono',monospace", marginRight:4 }}>expr ·</span>
                  {expresion}
                </div>
              )}
            </div>
          );
        })}

        {/* Subtotal fórmulas */}
        {asociadosConValor.length > 0 && (
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8, padding:"10px 14px", background:"linear-gradient(90deg,#1a3a5c,#0a3a5c)", borderRadius:7 }}>
            <span style={{ fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:11, letterSpacing:"0.14em", color:"#7ab2d4", textTransform:"uppercase" }}>Subtotal fórmulas</span>
            <span style={{ fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:20, color:"#60b4f0" }}>{fmt(totalAsociados)}</span>
          </div>
        )}
      </div>

      {/* ── Resultado Final ── */}
      {hayResultado && (
        <div style={{ border:"1px solid #b8d6ef", borderRadius:8, overflow:"hidden", marginBottom:24 }}>
          {/* Subtotal */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 16px", background:"#e8f3fb", fontFamily:"'Space Mono', monospace", borderBottom:"1px solid #b8d6ef" }}>
            <span style={{ color:"#0a3a5c", fontWeight:600, fontSize:12, letterSpacing:1 }}>SUBTOTAL</span>
            <span style={{ color:"#0a3a5c", fontWeight:700, fontSize:15 }}>{fmt(totalFinal)}</span>
          </div>
          {/* Margen editable */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 16px", background:"#f4f9fd", borderBottom:"1px solid #b8d6ef", fontFamily:"'Space Mono', monospace" }}>
            <span style={{ color:"#0a3a5c", fontSize:12, letterSpacing:1 }}>
              MARGEN {margenBD !== null && <span style={{ color:"#6699bb", fontSize:10 }}>(BD: {margenBD}%)</span>}
            </span>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <input
                type="number"
                value={margenInput}
                onChange={e => setMargenInput(e.target.value)}
                style={{ width:70, padding:"4px 8px", border:"1px solid #b8d6ef", borderRadius:4, fontFamily:"'Space Mono', monospace", fontSize:13, textAlign:"right" }}
              />
              <span style={{ color:"#0a3a5c", fontSize:13 }}>%</span>
            </div>
          </div>
          {/* Total con margen */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px", background:"#0a3a5c", fontFamily:"'Space Mono', monospace" }}>
            <span style={{ color:"#fff", fontWeight:700, fontSize:13, letterSpacing:1 }}>RESULTADO</span>
            <span style={{ color:"#7dd3fc", fontWeight:700, fontSize:18 }}>{fmt(totalConMargen)}</span>
          </div>
        </div>
      )}

      <p style={{ fontSize:10, color:"#e05a5a", margin:0 }}>* Ancho, Alto, Ancho Varilla y Espacio entre Varillas son obligatorios</p>
    </div>
  );
}
