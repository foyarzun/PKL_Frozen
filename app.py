import streamlit as st
import pandas as pd
import io
import streamlit.components.v1 as components
import os

st.set_page_config(page_title="Sistema PKL Pro - Frozen Service", layout="wide")

# --- SONIDOS ---
def emitir_sonido(tipo):
    url = "https://raw.githubusercontent.com/rafael-rodriguez-v/sounds/main/success.mp3" if tipo == "success" else "https://raw.githubusercontent.com/rafael-rodriguez-v/sounds/main/error.mp3"
    components.html(f'<audio autoplay><source src="{url}" type="audio/mp3"></audio>', height=0)

# --- LOGO ---
# Asegúrate de que el archivo descargado se llame 'logo.jpg' o cambia el nombre aquí
nombre_logo = "image_5f7cbe.jpg" 
if os.path.exists(nombre_logo):
    st.logo(nombre_logo, icon_image=nombre_logo)

# --- INICIALIZACIÓN DE MEMORIA ---
if 'lista_escaneada' not in st.session_state:
    st.session_state.lista_escaneada = []

st.title("📦 Sistema PKL - Frozen Service Ltda.")

# --- 1. MAESTRO (Sidebar) ---
st.sidebar.header("📁 1. Archivo Maestro")
file_cliente = st.sidebar.file_uploader("Subir Maestro Cliente", type=["xlsx"])

df_cliente = pd.DataFrame()
id_maestro = None

if file_cliente:
    df_cliente = pd.read_excel(file_cliente)
    id_maestro = st.sidebar.selectbox("Columna Código", df_cliente.columns.tolist())
    df_cliente[id_maestro] = df_cliente[id_maestro].astype(str).str.strip()

# --- 2. PISTOLEO (Optimizado con Fragment) ---
@st.fragment
def seccion_pistoleo(df_maestro, col_id):
    st.subheader("2. Registro de Cajas y Generación")
    
    c1, c2 = st.columns([1, 2])
    with c1:
        pallet_actual = st.text_input("📦 Pallet Actual", value="PAL-001")
        
        # Esta es la función que procesa el escaneo
        def procesar_escaneo():
            val = st.session_state.input_scanner.strip()
            if val and not df_maestro.empty:
                val_norm = val.lstrip('0')
                # Normalizamos el maestro para comparar
                maestro_norm = df_maestro[col_id].str.lstrip('0').values
                
                if val_norm not in maestro_norm:
                    st.error(f"❌ No existe: {val}")
                    emitir_sonido("error")
                elif any(str(d['Caja']).lstrip('0') == val_norm for d in st.session_state.lista_escaneada):
                    st.warning(f"⚠️ Duplicado: {val}")
                    emitir_sonido("error")
                else:
                    st.session_state.lista_escaneada.append({"Caja": val, "Pallet": pallet_actual})
                    st.toast(f"✅ Registrado {val}")
                    emitir_sonido("success")
            # Limpiar el campo para el siguiente
            st.session_state.input_scanner = ""

        # IMPORTANTE: on_change debe llamar a la función definida arriba
        st.text_input("🔫 Escanea aquí", key="input_scanner", on_change=procesar_escaneo)
        
        # Auto-focus automático
        components.html("<script>var inputs = window.parent.document.querySelectorAll('input'); inputs[inputs.length-1].focus();</script>", height=0)

        if st.button("🗑️ Limpiar Lecturas"):
            st.session_state.lista_escaneada = []
            st.rerun()

    with c2:
        if st.session_state.lista_escaneada:
            df_l = pd.DataFrame(st.session_state.lista_escaneada)
            st.write(f"**Leídas: {len(df_l)}**")
            st.dataframe(df_l, use_container_width=True, height=250)
            
            # BOTÓN DE GENERACIÓN DENTRO DEL FRAGMENTO
            if st.button("🚀 Generar y Descargar PKL"):
                df_c_final = df_maestro.copy()
                df_l_final = df_l.copy()
                
                # Llaves de cruce
                df_c_final['_key'] = df_c_final[col_id].str.lstrip('0')
                df_l_final['_key'] = df_l_final['Caja'].astype(str).str.lstrip('0')
                
                merged = pd.merge(df_c_final, df_l_final[['_key', 'Pallet']], on='_key', how='left').drop(columns=['_key'])
                
                # Reordenar columna Pallet
                columnas_finales = list(merged.columns)
                if 'Pallet' in columnas_finales:
                    idx_m = columnas_finales.index(col_id)
                    # Movemos 'Pallet' a la derecha del código
                    columnas_finales.insert(idx_m + 1, columnas_finales.pop(columnas_finales.index('Pallet')))
                    merged = merged[columnas_finales]
                
                st.write("### Vista Previa Final")
                st.dataframe(merged)
                
                output = io.BytesIO()
                with pd.ExcelWriter(output, engine='openpyxl') as writer:
                    merged.to_excel(writer, index=False)
                st.download_button("💾 Bajar Excel Final", output.getvalue(), "PKL_Final.xlsx")

# Lógica de visualización principal
modo = st.radio("Selecciona método:", ["Pistoleo en Tiempo Real", "Cargar Excel de Lecturas"])

if modo == "Pistoleo en Tiempo Real":
    if not df_cliente.empty:
        seccion_pistoleo(df_cliente, id_maestro)
    else:
        st.info("Sube el archivo maestro en la barra lateral para empezar.")
else:
    # Modo carga de archivo manual
    f_lectura = st.file_uploader("Subir Archivo de Lecturas", type=["xlsx"])
    if f_lectura and not df_cliente.empty:
        df_sub = pd.read_excel(f_lectura)
        c_c = st.selectbox("Columna Código", df_sub.columns)
        c_p = st.selectbox("Columna Pallet", df_sub.columns)
        if st.button("Procesar Archivo"):
            # Lógica de cruce simplificada para archivo cargado
            df_cliente['_key'] = df_cliente[id_maestro].str.lstrip('0')
            df_sub['_key'] = df_sub[c_c].astype(str).str.lstrip('0')
            final = pd.merge(df_cliente, df_sub[['_key', c_p]], on='_key', how='left').drop(columns=['_key'])
            st.dataframe(final)
            out = io.BytesIO()
            with pd.ExcelWriter(out, engine='openpyxl') as w:
                final.to_excel(w, index=False)
            st.download_button("💾 Bajar Cruce", out.getvalue(), "PKL_Cruce.xlsx")