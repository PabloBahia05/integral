#!/usr/bin/env python3
"""
ocr_worker.py  —  Flask OCR worker para facturas argentinas
Corre en localhost:5001
"""

import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image, ImageOps
import pytesseract

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

app = Flask(__name__)
CORS(app)

# ── Patrones cabecera ─────────────────────────────────────────────────────────
PATRONES = {
    "numero":         r"(?i)nro\.?\s*:?\s*(\d{4}-\d{5,8})",
    "fecha":          r"\b(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})\b",
    "tipo_factura":   r"(?i)factura\s+([ABCME])\b",
    "condicion_pago": r"(?i)(contado|30\s*d[ií]as?|60\s*d[ií]as?|90\s*d[ií]as?|cuenta\s+corriente|1\s*d[ií]a\s*ff)",
    "subtotal":       r"(?i)subtotal\s*:?\s*\$?\s*([\d\.,]+)",
    "iva_pct":        r"(?i)iva\s+(?:insc\.?\s+)?(10[,\.]?5|21|27)\s*%",
    "iva":            r"(?i)iva\s+(?:insc\.?\s+)?(?:10[,\.]?5|21|27)[,\.]?0*\s*%\s*:?\s*([\d\.,]+)",
    "total":          r"(?i)total\s*:?\s*\$?\s*([\d\.,]+)",
    "moneda":         r"(?i)\b(USD|ARS|EUR)\b",
}

# ── Patrón ítems ──────────────────────────────────────────────────────────────
# Formato: CODIGO  CANT  DESCRIPCION  PRECIO_UNIT  (DESC%)  SUBTOTAL
PATRON_ITEM = re.compile(
    r'^(?P<codigo>[A-Za-z0-9]{3,16})\s+'
    r'(?P<cant>\d+[,.]\d{1,3})\s+'
    r'(?P<desc>.+?)\s+'
    r'(?P<precio>\d{1,3}(?:[.]\d{3})*[,]\d{1,2})\s+'
    r'(?:[(]\d+[,.]\d+%[)]\s+)?'
    r'(?P<subtotal>\d{1,3}(?:[.]\d{3})*[,]\d{1,2})'
    r'\s*$',
    re.MULTILINE
)

# ── Helpers ───────────────────────────────────────────────────────────────────
def limpiar_numero(s):
    if not s:
        return None
    s = s.strip().replace(" ", "")
    if re.search(r"\d[.]\d{3}", s) or (s.count(",") == 1 and "." not in s):
        s = s.replace(".", "").replace(",", ".")
    else:
        s = s.replace(",", "")
    try:
        return float(s)
    except ValueError:
        return None

def normalizar_fecha(s):
    if not s:
        return None
    partes = re.split(r"[/\-\.]", s)
    if len(partes) != 3:
        return s
    d, m, a = partes
    if len(a) == 2:
        a = "20" + a
    try:
        return f"{int(a):04d}-{int(m):02d}-{int(d):02d}"
    except ValueError:
        return s

def extraer_campo(texto, patron):
    m = re.search(patron, texto)
    if not m:
        return None
    return m.group(m.lastindex).strip() if m.lastindex else m.group(0).strip()

def limpiar_texto_items(texto):
    """Limpia caracteres espurios al inicio de cada linea."""
    espurios = {chr(92), chr(36), chr(39), chr(96), chr(34)}  # \ $ ' ` "
    lineas = []
    for linea in texto.split("\n"):
        i = 0
        while i < len(linea) and linea[i] in espurios:
            i += 1
        lineas.append(linea[i:])
    return "\n".join(lineas)

def extraer_items(texto):
    texto_limpio = limpiar_texto_items(texto)
    items = []
    for m in PATRON_ITEM.finditer(texto_limpio):
        descripcion = m.group("desc").strip()
        # Quitar porcentaje de descuento si quedó pegado a la descripción
        descripcion = re.sub(r'\s*[(]\d+[,.]\d+%[)]\s*$', '', descripcion).strip()
        items.append({
            "codigo":       m.group("codigo").strip(),
            "descripcion":  descripcion,
            "cantidad":     limpiar_numero(m.group("cant")),
            "precio_unit":  limpiar_numero(m.group("precio")),
            "subtotalprod": limpiar_numero(m.group("subtotal")),
        })
    return items

# ── Preprocesamiento imagen ───────────────────────────────────────────────────
def preparar_imagen(file_obj):
    img = Image.open(file_obj).convert("RGB")
    w, h = img.size
    if w < 2400:
        factor = 2400 / w
        img = img.resize((int(w * factor), int(h * factor)), Image.LANCZOS)
    img = ImageOps.grayscale(img)
    img = ImageOps.autocontrast(img, cutoff=2)
    return img

# ── Endpoints ─────────────────────────────────────────────────────────────────
@app.post("/ocr")
def ocr():
    if "imagen" not in request.files:
        return jsonify({"error": "No se recibió imagen"}), 400

    img   = preparar_imagen(request.files["imagen"])
    texto = pytesseract.image_to_string(img, config="--psm 6 -l spa+eng")

    # Cabecera
    m_tipo = re.search(PATRONES["tipo_factura"], texto)
    tipo_factura = m_tipo.group(1).upper() if m_tipo else None

    m_iva_pct = re.search(PATRONES["iva_pct"], texto)
    iva_pct = float(m_iva_pct.group(1).replace(",", ".")) if m_iva_pct else None

    factura = {
        "numero":         extraer_campo(texto, PATRONES["numero"]),
        "fecha":          normalizar_fecha(extraer_campo(texto, PATRONES["fecha"])),
        "tipo_factura":   tipo_factura,
        "condicion_pago": extraer_campo(texto, PATRONES["condicion_pago"]),
        "subtotal":       limpiar_numero(extraer_campo(texto, PATRONES["subtotal"])),
        "iva_pct":        iva_pct,
        "iva":            limpiar_numero(extraer_campo(texto, PATRONES["iva"])),
        "total":          limpiar_numero(extraer_campo(texto, PATRONES["total"])),
        "moneda":         extraer_campo(texto, PATRONES["moneda"]) or "ARS",
        "texto_raw":      texto,
    }

    items = extraer_items(texto)
    return jsonify({"factura": factura, "items": items})


@app.get("/ping")
def ping():
    return jsonify({"ok": True})


if __name__ == "__main__":
    app.run(port=5001, debug=False)
