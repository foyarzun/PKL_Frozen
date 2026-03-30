# 📦 Sistema PKL Pro - Frozen Service Ltda.

Sistema de gestión de Packing List (PKL) para control de estibas y pallets.

## 🌐 Demo en Vivo

Accede al sistema desde cualquier lugar del mundo:
**[https://pkl-frozen-service.web.app](https://pkl-frozen-service.web.app)**

## 🚀 Funcionalidades

- **Carga de Maestro**: Sube archivos Excel (.xlsx) con el maestro del cliente
- **Pistoleo en Tiempo Real**: Escanea códigos de barras y asigna pallets automáticamente
- **Carga de Lecturas por Excel**: Sube un archivo de lecturas predefinido
- **Cruce Automático**: Empareja códigos del maestro con las lecturas escaneadas
- **Validación**: Detecta duplicados y códigos no existentes con feedback sonoro
- **Exportación Excel**: Genera y descarga el PKL final en formato Excel

## 📁 Estructura del Proyecto

```
Project_Frozen_PKL/
├── public/             # Archivos web (Firebase Hosting)
│   ├── index.html      # Página principal
│   ├── styles.css      # Estilos (Dark theme)
│   ├── app.js          # Lógica de la aplicación
│   └── logo.png        # Logo Frozen Service
├── app.py              # Versión Python (Streamlit)
├── requirements.txt    # Dependencias Python
├── firebase.json       # Configuración Firebase
└── .firebaserc         # Proyecto Firebase
```

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Excel**: SheetJS (xlsx.js)
- **Hosting**: Firebase Hosting
- **Python (alt)**: Streamlit + Pandas

## 📋 Uso

1. Sube el archivo maestro del cliente (.xlsx)
2. Selecciona la columna que contiene los códigos
3. Elige el modo: Pistoleo en tiempo real o Carga de Excel
4. Escanea o carga las lecturas
5. Genera y descarga el PKL final

---
*Frozen Service Ltda. © 2026*
