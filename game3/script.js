class MarioGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.livesElement = document.getElementById('lives');
        this.gameOverElement = document.getElementById('gameOver');
        this.finalScoreElement = document.getElementById('finalScore');
        
        this.gameState = 'menu';
        this.score = 0;
        this.lives = 3;
        
        this.mario = {
            x: 50,
            y: 300,
            width: 30,
            height: 40,
            velocityX: 0,
            velocityY: 0,
            speed: 5,
            jumpPower: 15,
            onGround: false,
            color: '#FF0000'
        };
        
        this.platforms = [
            { x: 0, y: 350, width: 800, height: 50, color: '#8B4513' },
            { x: 200, y: 280, width: 100, height: 20, color: '#00FF00' },
            { x: 400, y: 200, width: 100, height: 20, color: '#00FF00' },
            { x: 600, y: 150, width: 100, height: 20, color: '#00FF00' },
            { x: 350, y: 120, width: 150, height: 20, color: '#00FF00' }
        ];
        
        this.enemies = [
            { x: 250, y: 250, width: 25, height: 25, velocityX: -2, color: '#8B0000' },
            { x: 450, y: 170, width: 25, height: 25, velocityX: -1.5, color: '#8B0000' },
            { x: 650, y: 120, width: 25, height: 25, velocityX: -2, color: '#8B0000' }
        ];
        
        this.coins = [
            { x: 230, y: 240, width: 15, height: 15, collected: false },
            { x: 430, y: 160, width: 15, height: 15, collected: false },
            { x: 680, y: 110, width: 15, height: 15, collected: false },
            { x: 400, y: 80, width: 15, height: 15, collected: false }
        ];
        
        this.keys = {};
        this.gravity = 0.8;
        
        this.initEventListeners();
        this.gameLoop();
    }
    
    initEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetGame();
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.resetGame();
            this.startGame();
        });
    }
    
    startGame() {
        this.gameState = 'playing';
        this.gameOverElement.classList.add('hidden');
    }
    
    resetGame() {
        this.gameState = 'menu';
        this.score = 0;
        this.lives = 3;
        this.mario.x = 50;
        this.mario.y = 300;
        this.mario.velocityX = 0;
        this.mario.velocityY = 0;
        
        this.enemies.forEach((enemy, index) => {
            if (index === 0) { enemy.x = 250; enemy.y = 250; }
            if (index === 1) { enemy.x = 450; enemy.y = 170; }
            if (index === 2) { enemy.x = 650; enemy.y = 120; }
        });
        
        this.coins.forEach(coin => coin.collected = false);
        
        this.updateUI();
        this.gameOverElement.classList.add('hidden');
    }
    
    handleInput() {
        if (this.gameState !== 'playing') return;
        
        this.mario.velocityX = 0;
        
        if (this.keys['ArrowLeft']) {
            this.mario.velocityX = -this.mario.speed;
        }
        if (this.keys['ArrowRight']) {
            this.mario.velocityX = this.mario.speed;
        }
        if (this.keys['Space'] && this.mario.onGround) {
            this.mario.velocityY = -this.mario.jumpPower;
            this.mario.onGround = false;
        }
    }
    
    updateMario() {
        if (this.gameState !== 'playing') return;
        
        this.mario.velocityY += this.gravity;
        this.mario.x += this.mario.velocityX;
        this.mario.y += this.mario.velocityY;
        
        if (this.mario.x < 0) this.mario.x = 0;
        if (this.mario.x + this.mario.width > this.canvas.width) {
            this.mario.x = this.canvas.width - this.mario.width;
        }
        
        if (this.mario.y > this.canvas.height) {
            this.loseLife();
        }
    }
    
    updateEnemies() {
        if (this.gameState !== 'playing') return;
        
        this.enemies.forEach(enemy => {
            enemy.x += enemy.velocityX;
            
            let onPlatform = false;
            this.platforms.forEach(platform => {
                if (enemy.x + enemy.width > platform.x && 
                    enemy.x < platform.x + platform.width &&
                    enemy.y + enemy.height >= platform.y &&
                    enemy.y + enemy.height <= platform.y + platform.height + 10) {
                    onPlatform = true;
                }
            });
            
            if (!onPlatform || enemy.x <= 0 || enemy.x + enemy.width >= this.canvas.width) {
                enemy.velocityX *= -1;
            }
        });
    }
    
    checkCollisions() {
        if (this.gameState !== 'playing') return;
        
        this.mario.onGround = false;
        
        this.platforms.forEach(platform => {
            if (this.mario.x < platform.x + platform.width &&
                this.mario.x + this.mario.width > platform.x &&
                this.mario.y < platform.y + platform.height &&
                this.mario.y + this.mario.height > platform.y) {
                
                if (this.mario.velocityY > 0 && this.mario.y < platform.y) {
                    this.mario.y = platform.y - this.mario.height;
                    this.mario.velocityY = 0;
                    this.mario.onGround = true;
                }
            }
        });
        
        this.enemies.forEach(enemy => {
            if (this.mario.x < enemy.x + enemy.width &&
                this.mario.x + this.mario.width > enemy.x &&
                this.mario.y < enemy.y + enemy.height &&
                this.mario.y + this.mario.height > enemy.y) {
                
                if (this.mario.velocityY > 0 && this.mario.y < enemy.y - 10) {
                    this.score += 100;
                    enemy.x = -100;
                    this.mario.velocityY = -8;
                } else {
                    this.loseLife();
                }
            }
        });
        
        this.coins.forEach(coin => {
            if (!coin.collected &&
                this.mario.x < coin.x + coin.width &&
                this.mario.x + this.mario.width > coin.x &&
                this.mario.y < coin.y + coin.height &&
                this.mario.y + this.mario.height > coin.y) {
                coin.collected = true;
                this.score += 50;
            }
        });
    }
    
    loseLife() {
        this.lives--;
        this.mario.x = 50;
        this.mario.y = 300;
        this.mario.velocityX = 0;
        this.mario.velocityY = 0;
        
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.finalScoreElement.textContent = this.score;
        this.gameOverElement.classList.remove('hidden');
    }
    
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.livesElement.textContent = this.lives;
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.platforms.forEach(platform => {
            this.ctx.fillStyle = platform.color;
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            this.ctx.strokeStyle = '#654321';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        });
        
        this.coins.forEach(coin => {
            if (!coin.collected) {
                this.ctx.fillStyle = '#FFD700';
                this.ctx.beginPath();
                this.ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.strokeStyle = '#FFA500';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
        });
        
        this.enemies.forEach(enemy => {
            this.ctx.fillStyle = enemy.color;
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(enemy.x + 5, enemy.y + 5, 4, 4);
            this.ctx.fillRect(enemy.x + 16, enemy.y + 5, 4, 4);
        });
        
        this.ctx.fillStyle = this.mario.color;
        this.ctx.fillRect(this.mario.x, this.mario.y, this.mario.width, this.mario.height);
        
        this.ctx.fillStyle = '#0000FF';
        this.ctx.fillRect(this.mario.x + 5, this.mario.y + 5, this.mario.width - 10, 15);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(this.mario.x + 8, this.mario.y + 8, 4, 4);
        this.ctx.fillRect(this.mario.x + 18, this.mario.y + 8, 4, 4);
        
        if (this.gameState === 'menu') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('MARIO GAME', this.canvas.width/2, this.canvas.height/2 - 50);
            
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Press START to begin!', this.canvas.width/2, this.canvas.height/2 + 20);
        }
    }
    
    gameLoop() {
        this.handleInput();
        this.updateMario();
        this.updateEnemies();
        this.checkCollisions();
        this.updateUI();
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.addEventListener('load', () => {
    new MarioGame();
});