Guía de Instalación: Web MIDI Controller
Esta guía te ayudará a configurar el controlador MIDI inalámbrico en cualquier PC con Windows.

1. Requisitos Previos
	- loopMIDI: El software para crear cables MIDI virtuales (incluido en este paquete).

	- Red Wi-Fi: Tanto la PC como el móvil deben estar en la misma red.

	- Navegador: Se recomienda Google Chrome o Microsoft Edge.

2. Configuración del Puerto MIDI
	- Antes de abrir el programa, debemos crear el puerto que recibirá las señales:

	- Descomprime e instala loopMIDI.

	- Abre loopMIDI.

	- En el campo "New port-name", escribe exactamente: WebMIDI.

	- Haz clic en el botón (+).

	Nota: Mantén loopMIDI abierto mientras uses el controlador.

3. Ejecución del Servidor
	- Entra en la carpeta del proyecto y ejecuta el archivo midi-server.exe.
	
	- Si aparece un aviso de Windows Firewall, selecciona "Permitir acceso" en redes privadas y públicas.

	- La consola se abrirá y mostrará un mensaje como este:

	📡 CONECTA TU MÓVIL A: http://192.168.1.XX:5050 o al puerto indicado en el ejecutador 

4. Conexión del Dispositivo (Móvil/Tablet)
Toma tu móvil y asegúrate de estar en el mismo Wi-Fi que la PC.

	- Abre el navegador y escribe la dirección IP que aparece en la consola de la PC.

¡Listo! Deberías ver los faders y controles en tu pantalla.

5. errores comunes:
	- problemas con puertos:
		Existen 3 opciones para diferentes puertos, indicados en el ejecutador, esto para que tengas posibilidad de ejecutar cualquier 
		sin error en caso de que aalguno te de errores