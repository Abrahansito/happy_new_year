const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Ajustar el canvas al tamaño de la pantalla
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Variables globales
let fireworks = [];
let particles = [];

// Clase para el cohete que sube
class Firework {
    constructor(sx, sy, tx, ty) {
        this.x = sx; 
        this.y = sy;
        this.sx = sx; // CORRECCIÓN: Guardamos la posición inicial X
        this.sy = sy; // CORRECCIÓN: Guardamos la posición inicial Y
        this.tx = tx; 
        this.ty = ty; 
        
        this.distanceToTarget = calculateDistance(sx, sy, tx, ty);
        this.distanceTraveled = 0;
        
        // Inicializar coordenadas para evitar errores de dibujo
        this.coordinates = [];
        this.coordinateCount = 3;
        while(this.coordinateCount--) {
            this.coordinates.push([this.x, this.y]);
        }
        
        this.angle = Math.atan2(ty - sy, tx - sx);
        this.speed = 2;
        this.acceleration = 1.05;
        this.brightness = Math.random() * 50 + 50;
        this.hue = Math.random() * 360; 
        this.targetRadius = 1;
    }

    update(index) {
        // Eliminar última coordenada
        this.coordinates.pop();
        // Agregar coordenada actual al inicio
        this.coordinates.unshift([this.x, this.y]);

        // Acelerar
        this.speed *= this.acceleration;

        // Calcular velocidades
        const vx = Math.cos(this.angle) * this.speed;
        const vy = Math.sin(this.angle) * this.speed;

        // Calcular distancia recorrida desde el punto de origen (this.sx, this.sy)
        this.distanceTraveled = calculateDistance(this.sx, this.sy, this.x + vx, this.y + vy);

        // Si llegamos al destino, explotar
        if (this.distanceTraveled >= this.distanceToTarget) {
            createParticles(this.tx, this.ty, this.hue);
            playExplosionSound(); // Reproducir sonido de explosión
            fireworks.splice(index, 1);
        } else {
            this.x += vx;
            this.y += vy;
        }
    }

    draw() {
        ctx.beginPath();
        // Moverse a la última coordenada registrada (la cola del cohete)
        ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = `hsl(${this.hue}, 100%, ${this.brightness}%)`;
        ctx.stroke();
    }
}

// Clase para las partículas de la explosión
class Particle {
    constructor(x, y, hue) {
        this.x = x;
        this.y = y;
        this.coordinates = [];
        this.coordinateCount = 5;
        
        while (this.coordinateCount--) {
            this.coordinates.push([this.x, this.y]);
        }
        
        this.angle = Math.random() * Math.PI * 2;
        this.speed = Math.random() * 10 + 1;
        this.friction = 0.95; 
        this.gravity = 1; 
        this.hue = Math.random() * 20 + hue - 10;
        this.brightness = Math.random() * 50 + 50;
        this.alpha = 1; 
        this.decay = Math.random() * 0.015 + 0.015; 
    }

    update(index) {
        this.coordinates.pop();
        this.coordinates.unshift([this.x, this.y]);
        
        this.speed *= this.friction;
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed + this.gravity;
        
        this.alpha -= this.decay;

        if (this.alpha <= this.decay) {
            particles.splice(index, 1);
        }
    }

    draw() {
        ctx.beginPath();
        ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.alpha})`;
        ctx.stroke();
    }
}

function calculateDistance(p1x, p1y, p2x, p2y) {
    let xDistance = p2x - p1x;
    let yDistance = p2y - p1y;
    return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
}

function createParticles(x, y, hue) {
    let particleCount = 30; 
    while (particleCount--) {
        particles.push(new Particle(x, y, hue));
    }
}

function loop() {
    requestAnimationFrame(loop);
    
    // Crear rastro
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.globalCompositeOperation = 'lighter';

    // Lanzar fuegos artificiales automáticamente
    if (Math.random() < 0.05) { 
        fireworks.push(new Firework(
            canvas.width / 2, 
            canvas.height, 
            Math.random() * canvas.width, 
            Math.random() * canvas.height / 2
        ));
    }

    let i = fireworks.length;
    while (i--) {
        fireworks[i].draw();
        fireworks[i].update(i);
    }

    let j = particles.length;
    while (j--) {
        particles[j].draw();
        particles[j].update(j);
    }
}

// Función de inicio controlada
window.onload = function() {
    // 1. Seleccionamos el contenedor del texto
    const textContainer = document.querySelector('.container');
    
    // 2. Le agregamos la clase 'visible' para que empiece a aparecer (fade-in)
    // Usamos un pequeño timeout de 100ms para asegurar que el navegador note el cambio
    setTimeout(() => {
        textContainer.classList.add('visible');
    }, 100);

    // 3. Esperamos a que termine la aparición del texto para iniciar los cohetes
    // 3000ms = 3 segundos (el mismo tiempo que pusimos en el CSS)
    setTimeout(() => {
        loop(); // Inicia la animación de los fuegos artificiales
    }, 7000);
};


// Cargar el audio una sola vez en memoria
const explosionSound = new Audio('miusic/explosion.mp3');
explosionSound.volume = 0.5; // Volumen al 50% para no aturdir

function playExplosionSound() {
    // Clonamos el nodo de audio para poder reproducir varios a la vez
    // Si no hacemos esto, el sonido se cortaría cada vez que explota otro cohete
    const soundClone = explosionSound.cloneNode();
    soundClone.play().catch(error => {
        // Esto captura el error si el usuario aún no ha interactuado con la página
        console.log("El navegador bloqueó el sonido esperando interacción del usuario.");
    });
}

// Desbloqueo de audio para navegadores modernos
document.body.addEventListener('click', function() {
    // Intentamos reproducir y pausar inmediatamente solo para desbloquear el motor de audio
    explosionSound.play().then(() => {
        explosionSound.pause();
        explosionSound.currentTime = 0;
    }).catch(() => {});
}, { once: true }); // { once: true } hace que este evento se elimine solo después del primer clic