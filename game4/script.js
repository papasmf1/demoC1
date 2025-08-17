class XeviousGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.gameState = 'start';
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.weaponLevel = 1;
        this.highScore = localStorage.getItem('xeviousHighScore') || 0;
        
        this.sounds = {
            shoot: null,
            explosion: null,
            powerup: null,
            background: null
        };
        this.isMuted = false;
        
        this.initSounds();
        
        this.player = {
            x: this.width / 2 - 20,
            y: this.height - 100,
            width: 40,
            height: 50,
            speed: 6,
            color: '#00FF00'
        };
        
        this.bullets = [];
        this.enemies = [];
        this.explosions = [];
        this.stars = [];
        this.powerUps = [];
        
        this.keys = {};
        this.lastShot = 0;
        this.shotDelay = 150;
        this.baseShootDelay = 150;
        this.enemySpawnTimer = 0;
        this.enemySpawnDelay = 1000;
        this.scrollOffset = 0;
        this.backgroundPattern = [];
        this.mountains = [];
        this.clouds = [];
        this.islands = [];
        this.waves = [];
        
        this.enemyTypes = [
            { width: 30, height: 35, speed: 2, points: 100, color: '#8B0000', type: 'bug1' },
            { width: 35, height: 40, speed: 1.5, points: 200, color: '#006400', type: 'bug2' },
            { width: 25, height: 30, speed: 3, points: 150, color: '#4B0082', type: 'bug3' }
        ];
        
        this.itemTypes = [
            { type: 'weapon', color: '#FFD700', points: 500 },
            { type: 'speed', color: '#00FFFF', points: 300 },
            { type: 'shield', color: '#FF69B4', points: 400 }
        ];
        
        this.initElements();
        this.initEventListeners();
        this.generateBackground();
        this.generateStars();
        this.gameLoop();
        
        this.updateUI();
    }
    
    initElements() {
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.pauseScreen = document.getElementById('pauseScreen');
        this.scoreElement = document.getElementById('score');
        this.livesElement = document.getElementById('lives');
        this.levelElement = document.getElementById('level');
        this.weaponLevelElement = document.getElementById('weaponLevel');
        this.highScoreElement = document.getElementById('highScore');
        this.finalScoreElement = document.getElementById('finalScore');
    }
    
    initSounds() {
        this.audioContext = null;
    }
    
    createAudioContext() {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch(e) {
                console.log('Web Audio API not supported');
            }
        }
    }
    
    playSound(frequency, duration, type = 'sine') {
        if (this.isMuted || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch(e) {
            console.log('Audio playback failed:', e);
        }
    }
    
    initEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'Enter') {
                if (this.gameState === 'start') {
                    this.startGame();
                } else if (this.gameState === 'paused') {
                    this.resumeGame();
                }
            }
            
            if (e.code === 'KeyP' && this.gameState === 'playing') {
                this.pauseGame();
            }
            
            if (e.code === 'KeyR') {
                this.resetGame();
            }
            
            if (e.code === 'KeyM') {
                this.toggleMute();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        const startBtn = document.getElementById('startBtn');
        const restartBtn = document.getElementById('restartBtn');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startGame();
            });
        }
        
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.resetGame();
                this.startGame();
            });
        }
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
    }
    
    generateBackground() {
        this.generateMountains();
        this.generateClouds();
        this.generateIslands();
        this.generateWaves();
    }
    
    generateMountains() {
        for (let i = 0; i < 8; i++) {
            this.mountains.push({
                x: (i * 150) - 100,
                y: this.height * 0.6 + Math.random() * 100,
                width: 180 + Math.random() * 60,
                height: 150 + Math.random() * 100,
                speed: 0.5 + Math.random() * 0.5,
                color: `hsl(${120 + Math.random() * 60}, 40%, ${20 + Math.random() * 15}%)`
            });
        }
    }
    
    generateClouds() {
        for (let i = 0; i < 12; i++) {
            const cloudWidth = 80 + Math.random() * 60;
            const cloudHeight = 30 + Math.random() * 20;
            const circles = [];
            
            for (let j = 0; j < 5; j++) {
                circles.push({
                    radius: cloudHeight * (0.5 + Math.random() * 0.3),
                    offsetX: (j - 2) * cloudWidth / 6,
                    offsetY: (Math.random() - 0.5) * cloudHeight * 0.3
                });
            }
            
            this.clouds.push({
                x: Math.random() * this.width * 2,
                y: Math.random() * this.height * 0.4,
                width: cloudWidth,
                height: cloudHeight,
                speedY: 0.1 + Math.random() * 0.2,
                speedX: 0.05 + Math.random() * 0.1,
                opacity: 0.6 + Math.random() * 0.4,
                circles: circles
            });
        }
    }
    
    generateIslands() {
        for (let i = 0; i < 6; i++) {
            this.islands.push({
                x: Math.random() * this.width * 2,
                y: this.height * 0.7 + Math.random() * 80,
                width: 60 + Math.random() * 40,
                height: 20 + Math.random() * 15,
                speed: 1 + Math.random() * 0.5,
                type: Math.floor(Math.random() * 3)
            });
        }
    }
    
    generateWaves() {
        for (let i = 0; i < this.width / 20; i++) {
            this.waves.push({
                x: i * 20,
                y: this.height * 0.85,
                amplitude: 5 + Math.random() * 10,
                frequency: 0.02 + Math.random() * 0.01,
                phase: Math.random() * Math.PI * 2,
                speed: 2 + Math.random()
            });
        }
    }
    
    generateStars() {
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2,
                brightness: Math.random(),
                twinkleSpeed: Math.random() * 0.05 + 0.01
            });
        }
    }
    
    startGame() {
        this.createAudioContext();
        this.gameState = 'playing';
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.pauseScreen.classList.add('hidden');
    }
    
    pauseGame() {
        this.gameState = 'paused';
        this.pauseScreen.classList.remove('hidden');
    }
    
    resumeGame() {
        this.gameState = 'playing';
        this.pauseScreen.classList.add('hidden');
    }
    
    resetGame() {
        this.gameState = 'start';
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.weaponLevel = 1;
        this.shotDelay = this.baseShootDelay;
        this.player.x = this.width / 2 - 20;
        this.player.y = this.height - 100;
        this.player.speed = 6;
        this.bullets = [];
        this.enemies = [];
        this.explosions = [];
        this.powerUps = [];
        this.enemySpawnTimer = 0;
        this.scrollOffset = 0;
        this.mountains = [];
        this.clouds = [];
        this.islands = [];
        this.waves = [];
        this.generateBackground();
        this.updateUI();
        this.startScreen.classList.remove('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.pauseScreen.classList.add('hidden');
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('xeviousHighScore', this.highScore);
        }
        this.finalScoreElement.textContent = this.score;
        this.gameOverScreen.classList.remove('hidden');
        this.updateUI();
    }
    
    handleInput() {
        if (this.gameState !== 'playing') return;
        
        if (this.keys['ArrowLeft'] && this.player.x > 0) {
            this.player.x -= this.player.speed;
        }
        if (this.keys['ArrowRight'] && this.player.x < this.width - this.player.width) {
            this.player.x += this.player.speed;
        }
        if (this.keys['ArrowUp'] && this.player.y > 0) {
            this.player.y -= this.player.speed;
        }
        if (this.keys['ArrowDown'] && this.player.y < this.height - this.player.height) {
            this.player.y += this.player.speed;
        }
        
        if (this.keys['Space']) {
            this.shoot();
        }
    }
    
    shoot() {
        const now = Date.now();
        if (now - this.lastShot > this.shotDelay) {
            this.playSound(800, 0.1, 'square');
            
            if (this.weaponLevel === 1) {
                this.bullets.push({
                    x: this.player.x + this.player.width / 2 - 2,
                    y: this.player.y,
                    width: 4,
                    height: 12,
                    speed: 10,
                    color: '#FFFF00',
                    damage: 1
                });
            } else if (this.weaponLevel === 2) {
                this.bullets.push({
                    x: this.player.x + this.player.width / 2 - 8,
                    y: this.player.y,
                    width: 4,
                    height: 12,
                    speed: 10,
                    color: '#FF4500',
                    damage: 1
                });
                this.bullets.push({
                    x: this.player.x + this.player.width / 2 + 4,
                    y: this.player.y,
                    width: 4,
                    height: 12,
                    speed: 10,
                    color: '#FF4500',
                    damage: 1
                });
            } else if (this.weaponLevel >= 3) {
                for (let i = -1; i <= 1; i++) {
                    this.bullets.push({
                        x: this.player.x + this.player.width / 2 - 2 + (i * 12),
                        y: this.player.y,
                        width: 5,
                        height: 15,
                        speed: 12,
                        color: '#00FF00',
                        damage: 2
                    });
                }
            }
            this.lastShot = now;
        }
    }
    
    spawnEnemy() {
        const now = Date.now();
        if (now - this.enemySpawnTimer > this.enemySpawnDelay) {
            const type = this.enemyTypes[Math.floor(Math.random() * this.enemyTypes.length)];
            this.enemies.push({
                x: Math.random() * (this.width - type.width),
                y: -type.height,
                width: type.width,
                height: type.height,
                speed: type.speed + (this.level - 1) * 0.5,
                points: type.points,
                color: type.color,
                type: type.type,
                pattern: Math.random() < 0.3 ? 'zigzag' : 'straight',
                direction: Math.random() < 0.5 ? -1 : 1,
                health: type.type === 'bug2' ? 2 : 1
            });
            this.enemySpawnTimer = now;
            this.enemySpawnDelay = Math.max(300, 1000 - this.level * 50);
        }
    }
    
    updateBullets() {
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= bullet.speed;
            return bullet.y > -bullet.height;
        });
    }
    
    updateEnemies() {
        this.enemies = this.enemies.filter(enemy => {
            enemy.y += enemy.speed;
            
            if (enemy.pattern === 'zigzag') {
                enemy.x += Math.sin(enemy.y * 0.02) * enemy.direction;
            }
            
            if (enemy.x < 0 || enemy.x > this.width - enemy.width) {
                enemy.direction *= -1;
            }
            
            return enemy.y < this.height + enemy.height;
        });
    }
    
    updateExplosions() {
        this.explosions = this.explosions.filter(explosion => {
            explosion.timer--;
            explosion.radius += 2;
            explosion.alpha -= 0.05;
            return explosion.timer > 0 && explosion.alpha > 0;
        });
    }
    
    updateBackground() {
        this.scrollOffset += 2;
        if (this.scrollOffset >= this.height) {
            this.scrollOffset = 0;
        }
        
        this.mountains.forEach(mountain => {
            mountain.y += mountain.speed;
            if (mountain.y > this.height + mountain.height) {
                mountain.y = -mountain.height;
                mountain.x = Math.random() * this.width - mountain.width/2;
            }
        });
        
        this.clouds.forEach(cloud => {
            cloud.y += cloud.speedY;
            cloud.x += cloud.speedX;
            if (cloud.y > this.height) {
                cloud.y = -cloud.height - Math.random() * 100;
                cloud.x = Math.random() * this.width;
            }
            if (cloud.x > this.width + cloud.width) {
                cloud.x = -cloud.width;
            }
        });
        
        this.islands.forEach(island => {
            island.y += island.speed;
            if (island.y > this.height + island.height) {
                island.y = this.height * 0.6 - island.height;
                island.x = Math.random() * this.width;
            }
        });
        
        this.waves.forEach(wave => {
            wave.phase += 0.05;
            wave.y += wave.speed;
            if (wave.y > this.height + 50) {
                wave.y = this.height * 0.8;
            }
        });
        
        this.stars.forEach(star => {
            star.brightness += star.twinkleSpeed;
            if (star.brightness > 1) {
                star.brightness = 1;
                star.twinkleSpeed *= -1;
            } else if (star.brightness < 0) {
                star.brightness = 0;
                star.twinkleSpeed *= -1;
            }
        });
    }
    
    checkCollisions() {
        this.bullets.forEach((bullet, bulletIndex) => {
            this.enemies.forEach((enemy, enemyIndex) => {
                if (bullet.x < enemy.x + enemy.width &&
                    bullet.x + bullet.width > enemy.x &&
                    bullet.y < enemy.y + enemy.height &&
                    bullet.y + bullet.height > enemy.y) {
                    
                    enemy.health -= bullet.damage || 1;
                    this.bullets.splice(bulletIndex, 1);
                    
                    if (enemy.health <= 0) {
                        this.playSound(300, 0.3, 'sawtooth');
                        
                        this.explosions.push({
                            x: enemy.x + enemy.width / 2,
                            y: enemy.y + enemy.height / 2,
                            radius: 0,
                            timer: 25,
                            alpha: 1
                        });
                        
                        this.score += enemy.points;
                        this.enemies.splice(enemyIndex, 1);
                        
                        if (Math.random() < 0.15) {
                            this.spawnPowerUp(enemy.x, enemy.y);
                        }
                    }
                }
            });
        });
        
        this.enemies.forEach(enemy => {
            if (this.player.x < enemy.x + enemy.width &&
                this.player.x + this.player.width > enemy.x &&
                this.player.y < enemy.y + enemy.height &&
                this.player.y + this.player.height > enemy.y) {
                
                this.explosions.push({
                    x: this.player.x + this.player.width / 2,
                    y: this.player.y + this.player.height / 2,
                    radius: 0,
                    timer: 30,
                    alpha: 1
                });
                
                this.playSound(150, 0.5, 'sawtooth');
                this.lives--;
                this.player.x = this.width / 2 - 20;
                this.player.y = this.height - 100;
                
                if (this.lives <= 0) {
                    this.gameOver();
                }
            }
        });
    }
    
    spawnPowerUp(x, y) {
        const itemType = this.itemTypes[Math.floor(Math.random() * this.itemTypes.length)];
        this.powerUps.push({
            x: x,
            y: y,
            width: 25,
            height: 25,
            speed: 3,
            type: itemType.type,
            color: itemType.color,
            points: itemType.points,
            rotation: 0
        });
    }
    
    updatePowerUps() {
        this.powerUps = this.powerUps.filter(powerUp => {
            powerUp.y += powerUp.speed;
            powerUp.rotation += 0.1;
            
            if (this.player.x < powerUp.x + powerUp.width &&
                this.player.x + this.player.width > powerUp.x &&
                this.player.y < powerUp.y + powerUp.height &&
                this.player.y + this.player.height > powerUp.y) {
                
                this.playSound(1000, 0.2, 'sine');
                this.score += powerUp.points;
                
                if (powerUp.type === 'weapon') {
                    this.weaponLevel = Math.min(this.weaponLevel + 1, 5);
                    this.shotDelay = Math.max(50, this.baseShootDelay - (this.weaponLevel - 1) * 20);
                } else if (powerUp.type === 'speed') {
                    this.player.speed = Math.min(this.player.speed + 1, 10);
                } else if (powerUp.type === 'shield') {
                    this.lives = Math.min(this.lives + 1, 5);
                }
                
                return false;
            }
            
            return powerUp.y < this.height + powerUp.height;
        });
    }
    
    updateLevel() {
        const newLevel = Math.floor(this.score / 5000) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
        }
    }
    
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.livesElement.textContent = this.lives;
        this.levelElement.textContent = this.level;
        this.weaponLevelElement.textContent = this.weaponLevel;
        this.highScoreElement.textContent = this.highScore;
    }
    
    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.3, '#B0E0E6');
        gradient.addColorStop(0.7, '#4682B4');
        gradient.addColorStop(1, '#191970');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#1E90FF';
        this.ctx.fillRect(0, this.height * 0.8, this.width, this.height * 0.2);
        
        this.drawMountains();
        this.drawClouds();
        this.drawIslands();
        this.drawWaves();
        this.drawStars();
    }
    
    drawMountains() {
        this.mountains.forEach(mountain => {
            this.ctx.fillStyle = mountain.color;
            this.ctx.beginPath();
            this.ctx.moveTo(mountain.x, mountain.y + mountain.height);
            this.ctx.lineTo(mountain.x + mountain.width * 0.3, mountain.y);
            this.ctx.lineTo(mountain.x + mountain.width * 0.7, mountain.y + mountain.height * 0.2);
            this.ctx.lineTo(mountain.x + mountain.width, mountain.y + mountain.height);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.fillStyle = `rgba(255, 255, 255, 0.3)`;
            this.ctx.beginPath();
            this.ctx.moveTo(mountain.x + mountain.width * 0.25, mountain.y + mountain.height * 0.1);
            this.ctx.lineTo(mountain.x + mountain.width * 0.35, mountain.y);
            this.ctx.lineTo(mountain.x + mountain.width * 0.45, mountain.y + mountain.height * 0.15);
            this.ctx.closePath();
            this.ctx.fill();
        });
    }
    
    drawClouds() {
        this.clouds.forEach(cloud => {
            this.ctx.save();
            this.ctx.globalAlpha = cloud.opacity;
            this.ctx.fillStyle = '#FFFFFF';
            
            cloud.circles.forEach(circle => {
                this.ctx.beginPath();
                this.ctx.arc(
                    cloud.x + cloud.width/2 + circle.offsetX,
                    cloud.y + cloud.height/2 + circle.offsetY,
                    circle.radius,
                    0, Math.PI * 2
                );
                this.ctx.fill();
            });
            
            this.ctx.restore();
        });
    }
    
    drawIslands() {
        this.islands.forEach(island => {
            this.ctx.fillStyle = '#228B22';
            this.ctx.fillRect(island.x, island.y, island.width, island.height);
            
            this.ctx.fillStyle = '#32CD32';
            this.ctx.fillRect(island.x + 5, island.y - 5, island.width - 10, 8);
            
            if (island.type === 0) {
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(island.x + island.width/2 - 3, island.y - 15, 6, 15);
                this.ctx.fillStyle = '#228B22';
                this.ctx.beginPath();
                this.ctx.arc(island.x + island.width/2, island.y - 15, 8, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (island.type === 1) {
                for (let i = 0; i < 3; i++) {
                    this.ctx.fillStyle = '#FFD700';
                    this.ctx.fillRect(island.x + 10 + i * 8, island.y - 3, 3, 3);
                }
            }
        });
    }
    
    drawWaves() {
        this.ctx.strokeStyle = '#87CEEB';
        this.ctx.lineWidth = 2;
        
        this.waves.forEach((wave, index) => {
            this.ctx.beginPath();
            for (let x = 0; x < this.width; x += 5) {
                const y = wave.y + Math.sin((x + wave.phase) * wave.frequency) * wave.amplitude;
                if (x === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.stroke();
        });
        
        this.ctx.fillStyle = 'rgba(135, 206, 235, 0.3)';
        this.ctx.fillRect(0, this.height * 0.85, this.width, this.height * 0.15);
    }
    
    drawStars() {
        this.stars.forEach(star => {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * 0.7})`;
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });
    }
    
    drawPlayer() {
        const p = this.player;
        const centerX = p.x + p.width / 2;
        const centerY = p.y + p.height / 2;
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        
        this.ctx.fillStyle = '#C0C0C0';
        this.ctx.fillRect(-15, -20, 30, 40);
        
        this.ctx.fillStyle = '#0066FF';
        this.ctx.fillRect(-12, -15, 24, 25);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(-20, 5, 40, 8);
        this.ctx.fillRect(-8, -25, 16, 10);
        
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(-6, 15, 4, 8);
        this.ctx.fillRect(2, 15, 4, 8);
        
        this.ctx.fillStyle = '#00FFFF';
        this.ctx.fillRect(-25, -5, 10, 15);
        this.ctx.fillRect(15, -5, 10, 15);
        
        this.ctx.restore();
    }
    
    drawBullets() {
        this.bullets.forEach(bullet => {
            this.ctx.fillStyle = bullet.color;
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            
            this.ctx.shadowColor = bullet.color;
            this.ctx.shadowBlur = 5;
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            this.ctx.shadowBlur = 0;
        });
    }
    
    drawEnemies() {
        this.enemies.forEach(enemy => {
            const centerX = enemy.x + enemy.width / 2;
            const centerY = enemy.y + enemy.height / 2;
            
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            
            if (enemy.type === 'bug1') {
                this.drawBug1(enemy.width, enemy.height, enemy.color);
            } else if (enemy.type === 'bug2') {
                this.drawBug2(enemy.width, enemy.height, enemy.color);
            } else if (enemy.type === 'bug3') {
                this.drawBug3(enemy.width, enemy.height, enemy.color);
            }
            
            this.ctx.restore();
        });
    }
    
    drawBug1(width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(-width/2, -height/2, width, height);
        
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(-6, -8, 3, 6);
        this.ctx.fillRect(3, -8, 3, 6);
        
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(-10, -height/2, 4, height/3);
        this.ctx.fillRect(6, -height/2, 4, height/3);
        this.ctx.fillRect(-8, height/4, 16, 4);
        
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillRect(-2, -4, 4, 8);
    }
    
    drawBug2(width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(-width/2, -height/2, width, height);
        
        this.ctx.fillStyle = '#FF6600';
        this.ctx.fillRect(-8, -10, 4, 8);
        this.ctx.fillRect(4, -10, 4, 8);
        
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(-12, -height/3, 6, height/2);
        this.ctx.fillRect(6, -height/3, 6, height/2);
        this.ctx.fillRect(-10, height/3, 20, 5);
        
        this.ctx.fillStyle = '#00FF00';
        this.ctx.fillRect(-3, -6, 6, 12);
    }
    
    drawBug3(width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(-width/2, -height/2, width, height);
        
        this.ctx.fillStyle = '#FF00FF';
        this.ctx.fillRect(-5, -8, 2, 6);
        this.ctx.fillRect(3, -8, 2, 6);
        
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(-8, -height/2, 3, height/2);
        this.ctx.fillRect(5, -height/2, 3, height/2);
        this.ctx.fillRect(-6, height/3, 12, 3);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(-1, -3, 2, 6);
    }
    
    drawPowerUps() {
        this.powerUps.forEach(powerUp => {
            const centerX = powerUp.x + powerUp.width / 2;
            const centerY = powerUp.y + powerUp.height / 2;
            
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(powerUp.rotation);
            
            if (powerUp.type === 'weapon') {
                this.ctx.fillStyle = powerUp.color;
                this.ctx.fillRect(-10, -10, 20, 20);
                this.ctx.fillStyle = '#FF0000';
                this.ctx.fillRect(-8, -2, 16, 4);
                this.ctx.fillRect(-2, -8, 4, 16);
            } else if (powerUp.type === 'speed') {
                this.ctx.fillStyle = powerUp.color;
                this.ctx.fillRect(-8, -8, 16, 16);
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(-6, -2, 12, 4);
                this.ctx.fillRect(-2, -6, 4, 12);
            } else if (powerUp.type === 'shield') {
                this.ctx.fillStyle = powerUp.color;
                this.ctx.fillRect(-9, -9, 18, 18);
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(-7, -7, 14, 14);
                this.ctx.fillStyle = powerUp.color;
                this.ctx.fillRect(-5, -5, 10, 10);
            }
            
            this.ctx.restore();
        });
    }
    
    drawExplosions() {
        this.explosions.forEach(explosion => {
            this.ctx.save();
            this.ctx.globalAlpha = explosion.alpha;
            
            const gradient = this.ctx.createRadialGradient(
                explosion.x, explosion.y, 0,
                explosion.x, explosion.y, explosion.radius
            );
            gradient.addColorStop(0, '#FFFF00');
            gradient.addColorStop(0.5, '#FF6600');
            gradient.addColorStop(1, '#FF0000');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.drawBackground();
        
        if (this.gameState === 'playing') {
            this.drawPlayer();
            this.drawBullets();
            this.drawEnemies();
            this.drawPowerUps();
            this.drawExplosions();
        }
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.handleInput();
        this.spawnEnemy();
        this.updateBullets();
        this.updateEnemies();
        this.updatePowerUps();
        this.updateExplosions();
        this.updateBackground();
        this.checkCollisions();
        this.updateLevel();
        this.updateUI();
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new XeviousGame();
});