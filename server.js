const express = require('express');
const app = express();
const http = require('http').createServer(app); // Cambiado a createServer
const io = require('socket.io')(http, {
  cors: { origin: "*" } // Esto ayuda a evitar bloqueos en otras PCs
});
const easymidi = require('easymidi');
const fs = require('fs');
const path = require('path');

// ⚠️ Asegúrate de que el puerto se llame así en LoopMIDI
const output = new easymidi.Output('WebMIDI'); 




// ESTA ES LA FORMA CORRECTA PARA PKG
// Esto obliga al EXE a buscar la carpeta real que está a su lado en la carpeta física
app.use(express.static(path.join(process.cwd(), 'public')));

const SAVE_FILE = path.join(process.cwd(), 'mezcla_guardada.json');

// --- MEMORIA ---
let ccState = {};    
let noteState = {};  
let channelConfig = {}; // <--- NUEVO: Aquí guardaremos nombres e iconos

// --- CARGA DE DATOS ---
function loadSettings() {
    if (fs.existsSync(SAVE_FILE)) {
        try {
            const rawData = fs.readFileSync(SAVE_FILE);
            const data = JSON.parse(rawData);
            ccState = data.cc || {};
            noteState = data.notes || {};
            channelConfig = data.config || {}; // <--- NUEVO: Cargar config
            console.log('💾 Memoria cargada correctamente.');
        } catch (e) {
            console.error('⚠️ Archivo corrupto, iniciando limpio.');
        }
    } else {
        console.log('✨ Iniciando nueva configuración.');
    }
}
loadSettings();

// --- GUARDADO AUTOMÁTICO ---
let saveTimeout;
function saveSettings() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        // Guardamos también la config
        const dataToSave = JSON.stringify({ 
            cc: ccState, 
            notes: noteState, 
            config: channelConfig 
        }, null, 2);
        
        fs.writeFile(SAVE_FILE, dataToSave, (err) => {
            if (err) console.error('Error guardando:', err);
            else console.log('💾 Guardado en disco.');
        });
    }, 1000);
}

io.on('connection', (socket) => {
    console.log('📱 Teléfono conectado');

    // Enviamos TODO al conectar (incluida la config)
    socket.emit('init-state', { 
        cc: ccState, 
        notes: noteState,
        config: channelConfig 
    });

    // --- NUEVO: Recibir cambio de nombre/icono ---
    socket.on('update-channel-config', (data) => {
        // data = { channelId: 1, name: "Bajo", icon: "bass" }
        console.log(`📝 Config Canal ${data.channelId}: ${data.name} (${data.icon})`);
        
        // Guardar en memoria del canal específico
        channelConfig[data.channelId] = {
            name: data.name,
            icon: data.icon
        };
        
        saveSettings();

        // IMPORTANTE: Avisar a TODOS los móviles conectados para que se actualicen
        io.emit('config-updated', data);
    });

    // --- A. DEPURACIÓN DE FADERS Y KNOBS (CC) ---
    socket.on('midi-ctrl', (data) => {
        ccState[data.cc] = data.value;
        saveSettings();
        try {
            output.send('cc', { controller: data.cc, value: data.value, channel: 0 });
        } catch (err) { console.error("❌ Error CC:", err.message); }
    });

    // --- B. DEPURACIÓN DE BOTONES (NOTAS) ---
    socket.on('midi-note', (data) => {
        if (data.hasOwnProperty('visualState')) {
            noteState[data.note] = data.visualState;
        } else {
             if (data.type === 'noteon') noteState[data.note] = true;
             if (data.type === 'noteoff') noteState[data.note] = false;
        }
        saveSettings();
        try {
            output.send(data.type, { note: data.note, velocity: data.velocity, channel: 0 });
        } catch (err) { console.error("❌ Error Nota:", err.message); }
    });
});

const os = require('os'); // Librería nativa para obtener info del sistema

// ... (todo tu código anterior de socket.io y easymidi)

const PORT = 5050;

http.listen(PORT, '0.0.0.0', () => {
    // Obtenemos la IP local de la computadora
    const networkInterfaces = os.networkInterfaces();
    let localIp = '127.0.0.1';

    for (const interfaceName in networkInterfaces) {
        for (const iface of networkInterfaces[interfaceName]) {
            // Buscamos la IPv4 que no sea interna (loopback)
            if (iface.family === 'IPv4' && !iface.internal) {
                localIp = iface.address;
            }
        }
    }

    console.log("-------------------------------------------------");
    console.log("🚀 SERVIDOR MIDI INICIADO CON ÉXITO");
    console.log(`📡 CONECTA TU MÓVIL A: http://${localIp}:${PORT}`);
    console.log(`🏠 O DESDE ESTA PC EN: http://localhost:${PORT}`);
    console.log("-------------------------------------------------");
    console.log("⚠️  Recuerda tener loopMIDI abierto con el puerto: WebMIDI");
    console.log("⚠️  No cierres esta ventana para mantener la conexión.");
});