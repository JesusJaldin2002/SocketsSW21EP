
# 🚀 Sockets para Tablero Kanban

## 🛠 Instalación

Sigue estos pasos para iniciar el servidor de sockets:

### 1. Clonar el repositorio
```bash
git clone https://github.com/JesusJaldin2002/SocketsSW21EP.git
cd tu_repositorio
```

### 2. Instalar dependencias 🚦
```bash
npm install
```

### 3. Configurar las IPs
Cambia la IP del proyecto Laravel y del servidor de sockets en:
- **server.js (o index.js)**: Ajusta la IP en la configuración de **CORS**:
```javascript
origin: "http://TUPROYECTO_LARAVEL_IP:PUERTO"
```

- **Vue.js (frontend)**: Asegúrate de que la conexión al servidor de sockets esté correctamente apuntada:
```javascript
this.socket = io("http://TU_SERVIDOR_DE_SOCKETS_IP:PUERTO");
```

### 4. Iniciar el servidor de sockets
```bash
npm run dev
```
El servidor de sockets estará corriendo en `http://localhost:4444` o en el puerto que te permita tu red.

## 🎯 Tecnologías

- **Node.js**
- **Socket.IO**

