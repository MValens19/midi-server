const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const easymidi = require('easymidi');
const fs = require('fs');
const path = require('path');

// ⚠️ Asegúrate de que el puerto se llame así en LoopMIDI
const output = new easymidi.Output('WebMIDI'); 

app.use(express.static('public')); 

const SAVE_FILE = path.join(__dirname, 'mezcla_guardada.json');
let ccState = {};    
let noteState = {};  

// --- CARGA DE DATOS ---
function loadSettings() {
    if (fs.existsSync(SAVE_FILE)) {
        try {
            const rawData = fs.readFileSync(SAVE_FILE);
            const data = JSON.parse(rawData);
            ccState = data.cc || {};
            noteState = data.notes || {};
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
        const dataToSave = JSON.stringify({ cc: ccState, notes: noteState }, null, 2);
        fs.writeFile(SAVE_FILE, dataToSave, (err) => {
            if (err) console.error('Error guardando:', err);
            else console.log('💾 Guardado en disco.');
        });
    }, 1000);
}

io.on('connection', (socket) => {
    console.log('📱 Teléfono conectado');

    socket.emit('init-state', { cc: ccState, notes: noteState });

    // --- A. DEPURACIÓN DE FADERS Y KNOBS (CC) ---
    socket.on('midi-ctrl', (data) => {
        // Log para ver si llega la señal del Gain
        console.log(`🎚️ CC: ${data.cc} | Val: ${data.value}`); 
        
        ccState[data.cc] = data.value;
        saveSettings();

        try {
            output.send('cc', {
                controller: data.cc,
                value: data.value,
                channel: 0 
            });
        } catch (err) {
            console.error("❌ Error enviando CC:", err.message);
        }
    });

    // --- B. DEPURACIÓN DE BOTONES (NOTAS) ---
    socket.on('midi-note', (data) => {
        // Log para ver si llega la señal de FX2
        console.log(`🎹 Nota: ${data.note} | Tipo: ${data.type}`);

        if (data.hasOwnProperty('visualState')) {
            noteState[data.note] = data.visualState;
        } else {
             if (data.type === 'noteon') noteState[data.note] = true;
             if (data.type === 'noteoff') noteState[data.note] = false;
        }
        saveSettings();

        try {
            output.send(data.type, {
                note: data.note,
                velocity: data.velocity,
                channel: 0 
            });
        } catch (err) {
            console.error("❌ Error enviando Nota:", err.message);
        }
    });

    socket.on('disconnect', () => {
        console.log('❌ Desconectado');
    });
});

const PORT = 3000;
http.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor listo en puerto ${PORT}`);
    const networkInterfaces = require('os').networkInterfaces();
    Object.keys(networkInterfaces).forEach((ifname) => {
        networkInterfaces[ifname].forEach((iface) => {
            if ('IPv4' === iface.family && !iface.internal) {
                console.log(`🔗 http://${iface.address}:${PORT}`);
            }
        });
    });
});