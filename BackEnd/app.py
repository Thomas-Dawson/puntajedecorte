import pandas as pd
from ftfy import fix_text
import logging
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS

# --- CONFIGURACIÓN BÁSICA ---
app = Flask(__name__)
# Habilitamos CORS para que tu frontend (Vite) pueda comunicarse sin bloqueos
CORS(app) 

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Asegúrate de que la carpeta 'datos' esté en el mismo directorio que este archivo app.py
BASE_DATA_DIR = Path(__file__).parent / "datos"

# Cache simple en memoria para no leer el Excel de códigos cada vez
CACHE_CODIGOS = {}

# --- FUNCIONES DE TU SCRIPT ORIGINAL (ADAPTADAS) ---

def fix_text_if_str(text):
    if pd.isnull(text):
        return text
    return fix_text(str(text))

def load_codes(year: int):
    # Revisar cache primero
    if year in CACHE_CODIGOS:
        return CACHE_CODIGOS[year]

    if year <= 2017:
        sheet = 'Anexo - OfertaAcadémica_RegBEA'
        rename_cols = {'UNIVERSIDAD': 'NOMBRE_UNIVERSIDAD', 'CARRERA': 'NOMBRE_CARRERA', 'CODIGO': 'CODIGO_CARRERA'}
    elif year in [2018, 2019]:
        sheet = 'Anexo - OfertaAcadémica_RegBEA'
        rename_cols = {}
    elif year in [2020, 2021, 2022]:
        sheet = 'Anexo - OfertaAcadémica_RegBEA'
        rename_cols = {'UNIVERSIDAD': 'NOMBRE_UNIVERSIDAD', 'CARRERA': 'NOMBRE_CARRERA', 'CODIGO': 'CODIGO_CARRERA'}
    elif year == 2023:
        sheet = 'Anexo - Oferta académica'
        rename_cols = {'UNIVERSIDAD': 'NOMBRE_UNIVERSIDAD', 'CARRERA': 'NOMBRE_CARRERA', 'CODIGO': 'CODIGO_CARRERA'}
    else:
        # Asumimos estructura 2024+ o default
        sheet = 'Anexo - Oferta académica'
        rename_cols = {'NOMBRE_UNIVERSIDAD': 'NOMBRE_UNIVERSIDAD', 'NOMBRE_CARRERA': 'NOMBRE_CARRERA', 'CODIGO_CARRERA': 'CODIGO_CARRERA'}

    ruta_archivo = BASE_DATA_DIR / str(year) / f"Libro_CódigosADM{year}_ArchivoMatricula.xlsx"
    
    if not ruta_archivo.is_file():
        logger.warning(f"Archivo de códigos no encontrado: {ruta_archivo}")
        return None

    logger.info(f"Cargando códigos desde: {ruta_archivo.name} ...")
    try:
        df_codes = pd.read_excel(ruta_archivo, sheet_name=sheet, engine='openpyxl')
        df_codes.columns = df_codes.columns.str.strip()
        df_codes = df_codes.applymap(lambda x: fix_text_if_str(x) if isinstance(x, str) else x)
        
        # Si rename_cols no está vacío, renombramos. Si las columnas ya vienen bien (2018-2019), esto no rompe nada.
        if rename_cols:
            # Solo renombramos si las columnas existen para evitar errores
            df_codes = df_codes.rename(columns=rename_cols)
        
        # Guardar en cache para la próxima
        CACHE_CODIGOS[year] = df_codes
        return df_codes
    except Exception as e:
        logger.error(f"Error al leer Excel: {e}")
        return None

def load_enrollment(year: int):
    # Nota: No cacheamos matrículas porque son archivos grandes y la consulta es puntual
    ruta_matricula = BASE_DATA_DIR / str(year) / f"ArchivoMat_Adm{year}.csv"
    
    if not ruta_matricula.is_file():
        logger.warning(f"Archivo de matrícula no encontrado: {ruta_matricula}")
        return None

    logger.info(f"Cargando matrículas desde: {ruta_matricula.name} ...")
    try:
        # Usamos low_memory=False para evitar warnings en archivos grandes, o especificamos dtypes si fuera necesario
        df_enroll = pd.read_csv(ruta_matricula, sep=';', encoding='latin1', low_memory=False)
        df_enroll.columns = df_enroll.columns.str.strip()
        return df_enroll
    except Exception as e:
        logger.error(f"Error al leer CSV: {e}")
        return None

def obtener_datos_consulta(df_codigos, year, universidad, carrera):
    """
    Versión adaptada de consultar_datos para devolver una lista de diccionarios en lugar de imprimir.
    """
    resultados = []

    filtro_codigo = df_codigos[
        (df_codigos['NOMBRE_UNIVERSIDAD'].str.upper() == universidad.upper()) &
        (df_codigos['NOMBRE_CARRERA'].str.upper() == carrera.upper())
    ]

    if filtro_codigo.empty:
        return {"error": "No se encontraron registros para la combinación universidad/carrera."}

    codigos_encontrados = filtro_codigo['CODIGO_CARRERA'].unique().tolist()
    
    df_matricula = load_enrollment(year)
    if df_matricula is None: 
        return {"error": f"No se encontró el archivo de matrícula para el año {year}"}

    for codigo in codigos_encontrados:
        df_filtrado = df_matricula[
            (df_matricula['CODIGO'] == codigo) & (df_matricula['TIPO_MATRICULA'] == 1)
        ]

        item_res = {
            "codigo_carrera": int(codigo),
            "encontrado": False
        }

        if df_filtrado.empty:
            item_res["mensaje"] = "Sin registros de matrícula tipo 1"
        else:
            posibles_nombres = [col for col in df_filtrado.columns if 'POND' in col.upper()]
            if posibles_nombres:
                col_ponderado = posibles_nombres[0]
                df_ordenado = df_filtrado.sort_values(by=col_ponderado)
                    
                item_res["encontrado"] = True
                    
                # --- CAMBIO AQUÍ: Función auxiliar para limpiar el número ---
                def limpiar_numero(valor):
                    if isinstance(valor, str):
                        # Reemplazamos la coma por punto y quitamos espacios
                        valor = valor.replace(',', '.').strip()
                    try:
                        return float(valor)
                    except ValueError:
                        return 0.0 # O maneja el error como prefieras

                # Usamos la nueva función para convertir
                item_res["puntaje_min"] = limpiar_numero(df_ordenado.iloc[0][col_ponderado])
                item_res["puntaje_max"] = limpiar_numero(df_ordenado.iloc[-1][col_ponderado])
                # ------------------------------------------------------------
                    
                item_res["columna_usada"] = col_ponderado
            else:
                item_res["mensaje"] = "Columna de ponderado no encontrada"
        

        resultados.append(item_res)

    return {"resultados": resultados}

# --- ENDPOINTS (RUTAS) DE LA API ---

@app.route('/api/opciones/<int:year>', methods=['GET'])
def api_get_opciones(year):
    """
    Retorna la lista de universidades y un mapa de sus carreras para el año dado.
    """
    df_codigos = load_codes(year)
    
    if df_codigos is None:
        return jsonify({"error": f"No hay datos disponibles para el año {year}"}), 404
        
    # Verificar que existan las columnas necesarias antes de procesar
    if 'NOMBRE_UNIVERSIDAD' not in df_codigos.columns or 'NOMBRE_CARRERA' not in df_codigos.columns:
         return jsonify({"error": "El archivo de datos no tiene las columnas esperadas (NOMBRE_UNIVERSIDAD, NOMBRE_CARRERA)"}), 500

    try:
        # Obtenemos universidades únicas ordenadas
        universidades = sorted(df_codigos['NOMBRE_UNIVERSIDAD'].dropna().unique().tolist())
        
        # Creamos un diccionario: { "U. de Chile": ["Derecho", "Medicina"...], ... }
        # Esto optimiza el frontend para no tener que hacer una petición por cada universidad seleccionada
        carreras_por_uni = {}
        
        # Agrupamos para hacerlo eficiente
        grouped = df_codigos.groupby('NOMBRE_UNIVERSIDAD')['NOMBRE_CARRERA'].unique()
        
        for uni, carreras in grouped.items():
            carreras_por_uni[uni] = sorted(carreras.tolist())

        return jsonify({
            "universidades": universidades,
            "carreras_por_universidad": carreras_por_uni
        })
    except Exception as e:
        logger.error(f"Error procesando opciones: {e}")
        return jsonify({"error": "Error interno procesando datos"}), 500

@app.route('/api/consultar', methods=['POST'])
def api_consultar():
    """
    Recibe JSON: { "year": 2024, "universidad": "...", "carrera": "..." }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No se enviaron datos JSON"}), 400
        
    year = data.get('year')
    universidad = data.get('universidad')
    carrera = data.get('carrera')
    
    if not all([year, universidad, carrera]):
        return jsonify({"error": "Faltan campos obligatorios (year, universidad, carrera)"}), 400
    
    try:
        year = int(year)
        df_codigos = load_codes(year)
        
        if df_codigos is None:
             return jsonify({"error": f"No se pudieron cargar códigos para {year}"}), 404
             
        respuesta = obtener_datos_consulta(df_codigos, year, universidad, carrera)
        return jsonify(respuesta)
        
    except Exception as e:
        logger.error(f"Error en consulta: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Servidor Backend corriendo en http://127.0.0.1:5000")
    app.run(debug=True, port=5000)