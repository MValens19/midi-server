const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const easymidi = require('easymidi');

// Asegúrate de que este nombre coincida EXACTAMENTE con el de loopMIDI
const output = new easymidi.Output('WebMIDI'); 

app.use(express.static('public')); 

io.on('connection', (socket) => {
    console.log('📱 Teléfono conectado');

    // 1. Recibir señales de Faders y Perillas (Control Change)
// 1. Recibir señales de Faders y Perillas (CC)
socket.on('midi-ctrl', (data) => {
    try {
        // En muchas versiones de easymidi, se usa 'cc' en lugar de 'controlchange'
        output.send('cc', {
            controller: data.cc,
            value: data.value,
            channel: 0
        });
        console.log(`Control CC: ${data.cc} | Valor: ${data.value}`);
    } catch (err) {
        console.error("Error enviando CC:", err.message);
    }
});

    // 2. Recibir señales de Botones (Note On / Note Off)
    socket.on('midi-note', (data) => {
        output.send(data.type, {
            note: data.note,
            velocity: data.velocity,
            channel: 0
        });
        console.log(`Botón - Tipo: ${data.type} | Nota: ${data.note}`);
    });

    socket.on('disconnect', () => {
        console.log('❌ Teléfono desconectado');
    });
});

const PORT = 3000;
// Usamos '0.0.0.0' para que sea visible en toda tu red WiFi
http.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor activo en el puerto ${PORT}`);
    // Esto imprimirá tu IP automáticamente para que no tengas que buscarla
    const networkInterfaces = require('os').networkInterfaces();
    const ip = Object.values(networkInterfaces).flat().find(i => i.family === 'IPv4' && !i.internal).address;
    console.log(`🔗 Abre en tu móvil: http://${ip}:${PORT}`);
});