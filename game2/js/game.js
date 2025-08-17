/**
 * Game 클래스 - 뱀게임의 메인 게임 로직
 */

class Game {
    constructor() {
        // 캔버스 설정
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 게임 설정
        this.gridSize = 25;
        this.canvasWidth = this.canvas.width;
        this.canvasHeight = this.canvas.height;
        
        // 게임 상태
        this.state = GAME_STATES.MENU;
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // 게임 객체들
        this.snake = null;
        this.food = null;
        
        // 점수 및 레벨
        this.score = 0;
        this.highScore = Utils.loadFromStorage('snake-high-score', 0);
        this.level = 1;
        this.scoreMultiplier = 1;
        
        // 난이도 설정
        this.difficulty = 'medium';
        this.difficultySettings = DIFFICULTY_SETTINGS[this.difficulty];
        
        // 게임 설정
        this.settings = {
            gridSize: 25,
            gameSpeed: 120,
            soundEffects: true,
            wallCollision: true,
            snakeColor: '#4CAF50',
            foodColor: '#FF5722'
        };
        
        // 효과 시스템
        this.effects = {
            speedBoost: {
                active: false,
                duration: 5000,
                timer: 0,
                originalSpeed: 0
            },
            invincible: {
                active: false,
                duration: 3000,
                timer: 0
            }
        };
        
        // 파티클 시스템
        this.particles = [];
        
        // 통계
        this.stats = {
            foodEaten: 0,
            totalTime: 0,
            maxLength: 3,
            gamesPlayed: 0,
            totalScore: 0
        };
        
        // 이벤트 리스너
        this.boundHandleKeyPress = this.handleKeyPress.bind(this);
        this.boundGameLoop = this.gameLoop.bind(this);
        
        this.initialize();
    }
    
    /**
     * 게임 초기화
     */
    initialize() {
        // 설정 로드
        this.loadSettings();
        this.loadStats();
        
        // 캔버스 설정
        this.setupCanvas();
        
        // 이벤트 리스너 추가
        this.setupEventListeners();
        
        // 게임 객체 생성
        this.createGameObjects();
        
        console.log('🐍 Snake Game 초기화 완료');
    }
    
    /**
     * 캔버스 설정
     */
    setupCanvas() {
        // 캔버스 크기 조정
        const container = this.canvas.parentElement;
        const size = Math.min(container.clientWidth, container.clientHeight, 400);
        
        this.canvas.width = size;
        this.canvas.height = size;
        this.canvasWidth = size;
        this.canvasHeight = size;
        
        // 캔버스 스타일 설정
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        document.addEventListener('keydown', this.boundHandleKeyPress);
        
        // 윈도우 리사이즈 이벤트
        window.addEventListener('resize', () => {
            this.setupCanvas();
            if (this.snake) {
                this.snake.canvasWidth = this.canvasWidth;
                this.snake.canvasHeight = this.canvasHeight;
                this.snake.tileSize = this.canvasWidth / this.snake.gridSize;
            }
            if (this.food) {
                this.food.canvasWidth = this.canvasWidth;
                this.food.canvasHeight = this.canvasHeight;
                this.food.tileSize = this.canvasWidth / this.food.gridSize;
            }
        });
        
        // 페이지 가시성 변경 시 자동 일시정지
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.state === GAME_STATES.PLAYING) {
                this.pauseGame();
            }
        });
    }
    
    /**
     * 게임 객체 생성
     */
    createGameObjects() {
        this.snake = new Snake(this.gridSize, this.canvasWidth, this.canvasHeight);
        this.food = new Food(this.gridSize, this.canvasWidth, this.canvasHeight);
        
        // 설정 적용
        this.applySettings();
    }
    
    /**
     * 새 게임 시작
     */
    startGame() {
        console.log('🎮 새 게임 시작');
        
        // 게임 상태 초기화
        this.state = GAME_STATES.PLAYING;
        this.score = 0;
        this.level = 1;
        this.scoreMultiplier = this.difficultySettings.scoreMultiplier;
        
        // 게임 객체 초기화
        this.snake.reset();
        this.snake.setSpeed(this.difficultySettings.speed);
        this.food.generateFood(this.snake);
        
        // 효과 초기화
        this.resetEffects();
        this.particles = [];
        
        // 통계 업데이트
        this.stats.gamesPlayed++;
        
        // UI 업데이트
        this.updateUI();
        
        // 게임 루프 시작
        this.lastTime = performance.now();
        requestAnimationFrame(this.boundGameLoop);
    }
    
    /**
     * 게임 일시정지
     */
    pauseGame() {
        if (this.state === GAME_STATES.PLAYING) {
            console.log('⏸️ 게임 일시정지');
            this.state = GAME_STATES.PAUSED;
        }
    }
    
    /**
     * 게임 재개
     */
    resumeGame() {
        if (this.state === GAME_STATES.PAUSED) {
            console.log('▶️ 게임 재개');
            this.state = GAME_STATES.PLAYING;
            this.lastTime = performance.now();
            requestAnimationFrame(this.boundGameLoop);
        }
    }
    
    /**
     * 게임 오버
     */
    gameOver() {
        console.log('💀 게임 오버 - 점수:', this.score);
        
        this.state = GAME_STATES.GAME_OVER;
        
        // 최고 점수 업데이트
        if (this.score > this.highScore) {
            this.highScore = this.score;
            Utils.saveToStorage('snake-high-score', this.highScore);
            console.log('🏆 새 최고점수!', this.highScore);
        }
        
        // 통계 업데이트
        this.stats.totalScore += this.score;
        this.stats.maxLength = Math.max(this.stats.maxLength, this.snake.getLength());
        this.saveStats();
        
        // 사운드 효과
        if (this.settings.soundEffects) {
            Utils.playGameOverSound();
        }
        
        // 게임 오버 파티클 효과
        this.createGameOverParticles();
        
        // UI 업데이트
        this.updateUI();
        
        // 게임 오버 화면 표시
        this.showGameOverScreen();
    }
    
    /**
     * 게임 리셋
     */
    resetGame() {
        console.log('🔄 게임 리셋');
        
        this.state = GAME_STATES.MENU;
        this.score = 0;
        this.level = 1;
        
        // 게임 객체 리셋
        if (this.snake) this.snake.reset();
        if (this.food) this.food.generateFood(this.snake);
        
        // 효과 리셋
        this.resetEffects();
        this.particles = [];
        
        // UI 업데이트
        this.updateUI();
    }
    
    /**
     * 게임 루프
     */
    gameLoop(currentTime) {
        if (this.state !== GAME_STATES.PLAYING) {
            return;
        }
        
        // 델타 타임 계산
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // 통계 업데이트
        this.stats.totalTime += this.deltaTime;
        
        // 게임 업데이트
        this.update(this.deltaTime);
        
        // 렌더링
        this.render();
        
        // 다음 프레임 요청
        requestAnimationFrame(this.boundGameLoop);
    }
    
    /**
     * 게임 업데이트
     */
    update(deltaTime) {
        // 효과 업데이트
        this.updateEffects(deltaTime);
        
        // 뱀 업데이트
        this.snake.update(deltaTime);
        
        // 음식 업데이트
        this.food.update(deltaTime);
        
        // 파티클 업데이트
        this.updateParticles(deltaTime);
        
        // 충돌 검사
        this.checkCollisions();
        
        // 레벨 업데이트
        this.updateLevel();
    }
    
    /**
     * 충돌 검사
     */
    checkCollisions() {
        // 음식과의 충돌
        if (this.food.checkCollision(this.snake)) {
            this.eatFood();
        }
        
        // 벽과의 충돌
        if (this.settings.wallCollision && this.snake.checkWallCollision()) {
            if (!this.effects.invincible.active) {
                this.gameOver();
                return;
            }
        }
        
        // 자기 자신과의 충돌
        if (this.snake.checkSelfCollision()) {
            if (!this.effects.invincible.active) {
                this.gameOver();
                return;
            }
        }
    }
    
    /**
     * 음식을 먹었을 때 처리
     */
    eatFood() {
        const foodEffect = this.food.getEatenEffect();
        
        // 점수 추가
        const points = foodEffect.points * this.scoreMultiplier;
        this.score += points;
        
        // 통계 업데이트
        this.stats.foodEaten++;
        
        // 뱀 성장
        this.snake.grow();
        
        // 특수 효과 처리
        this.applyFoodEffect(foodEffect);
        
        // 파티클 생성
        this.createEatParticles(this.food.getPosition());
        
        // 사운드 효과
        if (this.settings.soundEffects) {
            Utils.playEatSound();
        }
        
        // 새 음식 생성
        this.food.generateFood(this.snake);
        
        // UI 업데이트
        this.updateUI();
        
        console.log(`🍎 음식 획득! +${points}점 (타입: ${foodEffect.type})`);
    }
    
    /**
     * 음식 효과 적용
     */
    applyFoodEffect(effect) {
        switch (effect.effect) {
            case 'speed':
                this.activateSpeedBoost();
                break;
            case 'bonus':
                // 보너스 점수는 이미 적용됨
                break;
            case 'mega':
                this.activateInvincible();
                this.score += 50; // 추가 보너스
                break;
        }
    }
    
    /**
     * 속도 부스트 활성화
     */
    activateSpeedBoost() {
        this.effects.speedBoost.active = true;
        this.effects.speedBoost.timer = this.effects.speedBoost.duration;
        this.effects.speedBoost.originalSpeed = this.snake.speed;
        
        this.snake.setSpeed(this.snake.speed * 0.7); // 30% 빨라짐
        console.log('⚡ 속도 부스트 활성화!');
    }
    
    /**
     * 무적 효과 활성화
     */
    activateInvincible() {
        this.effects.invincible.active = true;
        this.effects.invincible.timer = this.effects.invincible.duration;
        console.log('💎 무적 효과 활성화!');
    }
    
    /**
     * 효과 업데이트
     */
    updateEffects(deltaTime) {
        // 속도 부스트 효과
        if (this.effects.speedBoost.active) {
            this.effects.speedBoost.timer -= deltaTime;
            if (this.effects.speedBoost.timer <= 0) {
                this.effects.speedBoost.active = false;
                this.snake.setSpeed(this.effects.speedBoost.originalSpeed);
                console.log('⚡ 속도 부스트 종료');
            }
        }
        
        // 무적 효과
        if (this.effects.invincible.active) {
            this.effects.invincible.timer -= deltaTime;
            if (this.effects.invincible.timer <= 0) {
                this.effects.invincible.active = false;
                console.log('💎 무적 효과 종료');
            }
        }
    }
    
    /**
     * 레벨 업데이트
     */
    updateLevel() {
        const newLevel = Utils.calculateLevel(this.score);
        if (newLevel > this.level) {
            this.level = newLevel;
            
            // 레벨업에 따른 속도 증가
            const newSpeed = Utils.calculateSpeed(this.difficultySettings.speed, this.level);
            this.snake.setSpeed(newSpeed);
            
            // 사운드 효과
            if (this.settings.soundEffects) {
                Utils.playLevelUpSound();
            }
            
            console.log(`🎉 레벨 업! 레벨 ${this.level}`);
        }
    }
    
    /**
     * 파티클 업데이트
     */
    updateParticles(deltaTime) {
        this.particles = this.particles.filter(particle => {
            particle.life -= deltaTime;
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vy += 0.0001 * deltaTime; // 중력
            particle.alpha = particle.life / particle.maxLife;
            
            return particle.life > 0;
        });
    }
    
    /**
     * 먹기 파티클 생성
     */
    createEatParticles(position) {
        const centerX = (position.x + 0.5) * (this.canvasWidth / this.gridSize);
        const centerY = (position.y + 0.5) * (this.canvasHeight / this.gridSize);
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const speed = Utils.randomFloat(0.05, 0.15);
            
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 500,
                maxLife: 500,
                alpha: 1,
                color: this.food.color,
                size: Utils.randomFloat(2, 5)
            });
        }
    }
    
    /**
     * 게임 오버 파티클 생성
     */
    createGameOverParticles() {
        const head = this.snake.getHead();
        const centerX = (head.x + 0.5) * (this.canvasWidth / this.gridSize);
        const centerY = (head.y + 0.5) * (this.canvasHeight / this.gridSize);
        
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Utils.randomFloat(0.02, 0.08);
            
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1000,
                maxLife: 1000,
                alpha: 1,
                color: '#FF5722',
                size: Utils.randomFloat(3, 8)
            });
        }
    }
    
    /**
     * 렌더링
     */
    render() {
        // 배경 클리어
        this.clearCanvas();
        
        // 배경 렌더링
        this.renderBackground();
        
        // 게임 객체 렌더링
        this.food.render(this.ctx);
        this.snake.render(this.ctx);
        
        // 효과 렌더링
        this.renderEffects();
        
        // 파티클 렌더링
        this.renderParticles();
        
        // UI 요소 렌더링
        this.renderGameUI();
    }
    
    /**
     * 캔버스 클리어
     */
    clearCanvas() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
    
    /**
     * 배경 렌더링
     */
    renderBackground() {
        // 그리드 패턴
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        const tileSize = this.canvasWidth / this.gridSize;
        
        for (let x = 0; x <= this.gridSize; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * tileSize, 0);
            this.ctx.lineTo(x * tileSize, this.canvasHeight);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.gridSize; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * tileSize);
            this.ctx.lineTo(this.canvasWidth, y * tileSize);
            this.ctx.stroke();
        }
    }
    
    /**
     * 효과 렌더링
     */
    renderEffects() {
        // 무적 효과
        if (this.effects.invincible.active) {
            const alpha = Math.sin(Date.now() * 0.01) * 0.3 + 0.3;
            this.ctx.fillStyle = `rgba(147, 39, 176, ${alpha})`;
            this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        }
        
        // 속도 부스트 효과
        if (this.effects.speedBoost.active) {
            const alpha = Math.sin(Date.now() * 0.02) * 0.2 + 0.2;
            this.ctx.fillStyle = `rgba(33, 150, 243, ${alpha})`;
            this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        }
    }
    
    /**
     * 파티클 렌더링
     */
    renderParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
    
    /**
     * 게임 UI 렌더링
     */
    renderGameUI() {
        // 일시정지 상태 표시
        if (this.state === GAME_STATES.PAUSED) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
            
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '24px "Press Start 2P"';
            this.ctx.fillText('일시정지', this.canvasWidth / 2, this.canvasHeight / 2);
            
            this.ctx.font = '12px "Press Start 2P"';
            this.ctx.fillText('SPACE로 재개', this.canvasWidth / 2, this.canvasHeight / 2 + 40);
        }
    }
    
    /**
     * 키 입력 처리
     */
    handleKeyPress(event) {
        if (this.state === GAME_STATES.PLAYING) {
            // 방향키 입력
            const direction = Utils.keyToDirection(event.code);
            if (direction) {
                this.snake.setDirection(direction);
                event.preventDefault();
            }
            
            // 일시정지
            if (event.code === 'Space') {
                this.pauseGame();
                event.preventDefault();
            }
        } else if (this.state === GAME_STATES.PAUSED) {
            // 게임 재개
            if (event.code === 'Space') {
                this.resumeGame();
                event.preventDefault();
            }
        }
        
        // ESC키로 메뉴 이동
        if (event.code === 'Escape') {
            this.showMainMenu();
            event.preventDefault();
        }
    }
    
    /**
     * 설정 적용
     */
    applySettings() {
        if (this.snake) {
            this.snake.setColors(this.settings.snakeColor, Utils.adjustBrightness(this.settings.snakeColor, 0.8));
            this.snake.setSpeed(this.settings.gameSpeed);
        }
        
        if (this.food) {
            this.food.color = this.settings.foodColor;
        }
        
        this.gridSize = this.settings.gridSize;
        
        // 그리드 크기 변경 시 게임 객체 재생성
        if (this.snake && this.snake.gridSize !== this.gridSize) {
            this.createGameObjects();
        }
    }
    
    /**
     * 난이도 설정
     */
    setDifficulty(difficulty) {
        if (DIFFICULTY_SETTINGS[difficulty]) {
            this.difficulty = difficulty;
            this.difficultySettings = DIFFICULTY_SETTINGS[difficulty];
            
            // 그리드 크기 업데이트
            this.gridSize = this.difficultySettings.gridSize;
            this.settings.gameSpeed = this.difficultySettings.speed;
            
            // 게임 객체 재생성
            this.createGameObjects();
            
            console.log(`난이도 설정: ${difficulty}`);
        }
    }
    
    /**
     * 효과 리셋
     */
    resetEffects() {
        this.effects.speedBoost.active = false;
        this.effects.invincible.active = false;
    }
    
    /**
     * UI 업데이트
     */
    updateUI() {
        // 점수 업데이트
        const scoreElement = document.getElementById('current-score');
        if (scoreElement) {
            scoreElement.textContent = Utils.formatScore(this.score);
        }
        
        // 최고 점수 업데이트
        const highScoreElement = document.getElementById('high-score');
        if (highScoreElement) {
            highScoreElement.textContent = Utils.formatScore(this.highScore);
        }
        
        // 레벨 업데이트
        const levelElement = document.getElementById('current-level');
        if (levelElement) {
            levelElement.textContent = this.level;
        }
    }
    
    /**
     * 메인 메뉴 표시
     */
    showMainMenu() {
        this.state = GAME_STATES.MENU;
        
        const gameScreen = document.getElementById('game-screen');
        const mainMenu = document.getElementById('main-menu');
        
        if (gameScreen) gameScreen.classList.add('hidden');
        if (mainMenu) mainMenu.classList.remove('hidden');
    }
    
    /**
     * 게임 오버 화면 표시
     */
    showGameOverScreen() {
        const overlay = document.getElementById('game-overlay');
        const finalScore = document.getElementById('final-score');
        
        if (overlay) {
            overlay.classList.remove('hidden');
        }
        
        if (finalScore) {
            finalScore.textContent = Utils.formatScore(this.score);
        }
    }
    
    /**
     * 설정 로드
     */
    loadSettings() {
        const savedSettings = Utils.loadFromStorage('snake-settings', {});
        this.settings = { ...this.settings, ...savedSettings };
    }
    
    /**
     * 설정 저장
     */
    saveSettings() {
        Utils.saveToStorage('snake-settings', this.settings);
    }
    
    /**
     * 통계 로드
     */
    loadStats() {
        const savedStats = Utils.loadFromStorage('snake-stats', {});
        this.stats = { ...this.stats, ...savedStats };
    }
    
    /**
     * 통계 저장
     */
    saveStats() {
        Utils.saveToStorage('snake-stats', this.stats);
    }
    
    /**
     * 게임 상태 반환
     */
    getGameInfo() {
        return {
            score: this.score,
            highScore: this.highScore,
            level: this.level,
            snakeLength: this.snake ? this.snake.getLength() : 0,
            foodEaten: this.stats.foodEaten,
            state: this.state,
            difficulty: this.difficulty
        };
    }
    
    /**
     * 정리
     */
    dispose() {
        document.removeEventListener('keydown', this.boundHandleKeyPress);
        this.saveSettings();
        this.saveStats();
    }
}

// 전역으로 내보내기
window.Game = Game;