/**
 * 게임 로직 및 상태 관리
 */

/**
 * 게임 클래스 - 전체 게임 로직 통합
 */
class Game {
    constructor() {
        // 게임 시스템들
        this.world = null;
        this.player = null;
        this.renderer = null;
        this.inputHandler = null;
        this.ui = null;
        
        // 게임 상태
        this.isRunning = false;
        this.isPaused = false;
        this.currentScreen = 'main-menu';
        
        // 게임 루프 관련
        this.lastTime = 0;
        this.frameCount = 0;
        this.fpsTime = 0;
        this.fps = 0;
        
        // 설정
        this.settings = {
            renderDistance: 8,
            fov: 70,
            mouseSensitivity: 5,
            soundVolume: 50,
            showCoords: true,
            showFps: true,
            fullscreen: false,
            vsync: true
        };
        
        // 게임 통계
        this.statistics = {
            startTime: Date.now(),
            playTime: 0,
            blocksMined: 0,
            blocksPlaced: 0,
            distanceWalked: 0,
            deaths: 0
        };
        
        // 이벤트 시스템
        this.eventListeners = new Map();
        
        // 초기화
        this.initialize();
    }
    
    /**
     * 게임 초기화
     */
    initialize() {
        console.log('🎮 게임 시스템 초기화 시작...');
        
        // 설정 로드
        this.loadSettings();
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        console.log('✅ 게임 시스템 초기화 완료');
    }
    
    /**
     * 새 게임 시작
     */
    async startNewGame() {
        console.log('🌍 새 게임 시작...');
        
        try {
            // 게임 시스템들 초기화
            await this.initializeGameSystems();
            
            // 월드 생성
            this.world = new World();
            await this.world.generate();
            
            // 플레이어 생성
            this.player = new Player();
            const spawnHeight = this.world.getHeightAt(0, 0) + 2;
            this.player.setPosition(0, spawnHeight, 0);
            
            // 초기 아이템 지급 (크리에이티브 모드가 아닐 때)
            if (this.player.gameMode === 'survival') {
                this.giveStarterItems();
            }
            
            // 렌더러 초기화
            const canvas = document.getElementById('world-canvas');
            this.renderer = new Renderer(canvas);
            
            // 입력 핸들러 초기화
            this.inputHandler = new InputHandler();
            
            // UI 초기화
            this.ui = new UI();
            
            // 게임 상태 업데이트
            this.isRunning = true;
            this.isPaused = false;
            this.currentScreen = 'game';
            
            // GameState 전역 객체 업데이트
            if (window.GameState) {
                window.GameState.world = this.world;
                window.GameState.player = this.player;
                window.GameState.renderer = this.renderer;
                window.GameState.inputHandler = this.inputHandler;
                window.GameState.ui = this.ui;
                window.GameState.isRunning = this.isRunning;
                window.GameState.isPaused = this.isPaused;
                window.GameState.settings = this.settings;
            }
            
            // 게임 루프 시작
            this.startGameLoop();
            
            console.log('✅ 새 게임 시작 완료');
            return true;
            
        } catch (error) {
            console.error('❌ 새 게임 시작 실패:', error);
            return false;
        }
    }
    
    /**
     * 게임 시스템들 초기화
     */
    async initializeGameSystems() {
        // 캔버스 설정
        const canvas = document.getElementById('world-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
        }
        
        // 추가 시스템 초기화 작업들...
        await new Promise(resolve => setTimeout(resolve, 100)); // 비동기 작업 시뮬레이션
    }
    
    /**
     * 시작 아이템 지급
     */
    giveStarterItems() {
        if (!this.player) return;
        
        // 기본 블록들 지급
        this.player.addToInventory(BlockType.GRASS, 64);
        this.player.addToInventory(BlockType.DIRT, 64);
        this.player.addToInventory(BlockType.STONE, 64);
        this.player.addToInventory(BlockType.WOOD, 32);
        this.player.addToInventory(BlockType.COBBLESTONE, 32);
        
        console.log('🎁 시작 아이템 지급 완료');
    }
    
    /**
     * 게임 로드
     */
    async loadGame(saveData) {
        console.log('💾 게임 로드 시작...');
        
        try {
            // 월드 복원
            this.world = World.deserialize(saveData.world);
            
            // 플레이어 복원
            this.player = Player.deserialize(saveData.player);
            
            // 통계 복원
            if (saveData.statistics) {
                this.statistics = { ...this.statistics, ...saveData.statistics };
            }
            
            // 렌더러 및 다른 시스템들 초기화
            await this.initializeGameSystems();
            
            const canvas = document.getElementById('world-canvas');
            this.renderer = new Renderer(canvas);
            this.inputHandler = new InputHandler();
            this.ui = new UI();
            
            // 게임 상태 업데이트
            this.isRunning = true;
            this.isPaused = false;
            this.currentScreen = 'game';
            
            // GameState 업데이트
            if (window.GameState) {
                window.GameState.world = this.world;
                window.GameState.player = this.player;
                window.GameState.renderer = this.renderer;
                window.GameState.inputHandler = this.inputHandler;
                window.GameState.ui = this.ui;
                window.GameState.isRunning = this.isRunning;
                window.GameState.isPaused = this.isPaused;
            }
            
            // 게임 루프 시작
            this.startGameLoop();
            
            console.log('✅ 게임 로드 완료');
            return true;
            
        } catch (error) {
            console.error('❌ 게임 로드 실패:', error);
            return false;
        }
    }
    
    /**
     * 게임 저장
     */
    saveGame() {
        if (!this.world || !this.player) {
            console.warn('⚠️ 저장할 게임 데이터가 없습니다');
            return false;
        }
        
        try {
            const saveData = {
                version: '1.0.0',
                timestamp: Date.now(),
                world: this.world.serialize(),
                player: this.player.serialize(),
                statistics: this.statistics,
                settings: this.settings
            };
            
            // 로컬 스토리지에 저장
            const success = StorageUtils.save('minecraft-save', saveData);
            
            if (success) {
                console.log('💾 게임 저장 완료');
                if (this.ui) {
                    this.ui.showNotification('게임이 저장되었습니다!', 'success');
                }
                return true;
            } else {
                console.error('❌ 게임 저장 실패');
                if (this.ui) {
                    this.ui.showNotification('게임 저장에 실패했습니다.', 'error');
                }
                return false;
            }
            
        } catch (error) {
            console.error('❌ 게임 저장 중 오류:', error);
            return false;
        }
    }
    
    /**
     * 게임 일시정지
     */
    pause() {
        if (!this.isRunning || this.isPaused) return;
        
        this.isPaused = true;
        document.exitPointerLock();
        
        if (window.GameState) {
            window.GameState.isPaused = this.isPaused;
        }
        
        console.log('⏸️ 게임 일시정지');
        this.triggerEvent('game:pause');
    }
    
    /**
     * 게임 재개
     */
    resume() {
        if (!this.isRunning || !this.isPaused) return;
        
        this.isPaused = false;
        
        if (window.GameState) {
            window.GameState.isPaused = this.isPaused;
        }
        
        // 포인터 락 재요청
        setTimeout(() => {
            const canvas = document.getElementById('world-canvas');
            if (canvas) {
                canvas.requestPointerLock();
            }
        }, 100);
        
        console.log('▶️ 게임 재개');
        this.triggerEvent('game:resume');
    }
    
    /**
     * 게임 종료
     */
    quit() {
        console.log('🚪 게임 종료');
        
        // 게임 상태 정리
        this.isRunning = false;
        this.isPaused = false;
        
        // 포인터 락 해제
        document.exitPointerLock();
        
        // 시스템들 정리
        if (this.inputHandler) {
            this.inputHandler.destroy();
        }
        if (this.ui) {
            this.ui.stopUpdates();
        }
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // 참조 정리
        this.world = null;
        this.player = null;
        this.renderer = null;
        this.inputHandler = null;
        this.ui = null;
        
        // GameState 정리
        if (window.GameState) {
            window.GameState.world = null;
            window.GameState.player = null;
            window.GameState.renderer = null;
            window.GameState.inputHandler = null;
            window.GameState.ui = null;
            window.GameState.isRunning = false;
            window.GameState.isPaused = false;
        }
        
        this.triggerEvent('game:quit');
    }
    
    /**
     * 게임 루프
     */
    gameLoop(currentTime) {
        if (!this.isRunning) {
            return;
        }
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // FPS 계산
        this.frameCount++;
        this.fpsTime += deltaTime;
        
        if (this.fpsTime >= 1000) {
            this.fps = Math.round(this.frameCount * 1000 / this.fpsTime);
            
            // GameState에 FPS 정보 업데이트
            if (window.GameState) {
                window.GameState.fps = this.fps;
            }
            
            this.frameCount = 0;
            this.fpsTime = 0;
        }
        
        if (!this.isPaused) {
            // 게임 로직 업데이트
            this.update(deltaTime);
            
            // 렌더링
            this.render();
            
            // 통계 업데이트
            this.updateStatistics(deltaTime);
        }
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    /**
     * 게임 루프 시작
     */
    startGameLoop() {
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    /**
     * 게임 로직 업데이트
     */
    update(deltaTime) {
        // 입력 처리
        if (this.inputHandler) {
            this.inputHandler.update();
        }
        
        // 플레이어 업데이트
        if (this.player && this.world) {
            const oldPos = { ...this.player.position };
            this.player.update(deltaTime, this.world);
            
            // 이동 거리 계산
            const dx = this.player.position.x - oldPos.x;
            const dz = this.player.position.z - oldPos.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            this.statistics.distanceWalked += distance;
        }
        
        // 월드 업데이트
        if (this.world) {
            this.world.update(deltaTime);
        }
        
        // UI 업데이트
        if (this.ui) {
            this.ui.update(deltaTime);
        }
        
        // 게임 이벤트 처리
        this.handleGameEvents();
    }
    
    /**
     * 렌더링
     */
    render() {
        if (this.renderer && this.world && this.player) {
            this.renderer.render(this.world, this.player);
        }
    }
    
    /**
     * 게임 이벤트 처리
     */
    handleGameEvents() {
        // 플레이어 사망 체크
        if (this.player && this.player.health <= 0) {
            this.handlePlayerDeath();
        }
        
        // 자동 저장 (5분마다)
        const now = Date.now();
        if (now - this.lastAutoSave > 300000) { // 5분 = 300000ms
            this.autoSave();
            this.lastAutoSave = now;
        }
    }
    
    /**
     * 플레이어 사망 처리
     */
    handlePlayerDeath() {
        console.log('💀 플레이어 사망');
        
        this.statistics.deaths++;
        this.triggerEvent('player:death', { player: this.player });
        
        // 사망 화면 표시 또는 리스폰 처리
        if (this.ui) {
            this.ui.showNotification('당신은 죽었습니다!', 'error', 5000);
        }
        
        // 리스폰
        setTimeout(() => {
            if (this.player) {
                this.player.respawn();
            }
        }, 2000);
    }
    
    /**
     * 자동 저장
     */
    autoSave() {
        console.log('💾 자동 저장 실행');
        this.saveGame();
    }
    
    /**
     * 통계 업데이트
     */
    updateStatistics(deltaTime) {
        this.statistics.playTime += deltaTime;
    }
    
    /**
     * 설정 로드
     */
    loadSettings() {
        const savedSettings = StorageUtils.load('minecraft-settings', {});
        this.settings = { ...this.settings, ...savedSettings };
        
        console.log('⚙️ 설정 로드 완료');
    }
    
    /**
     * 설정 저장
     */
    saveSettings() {
        const success = StorageUtils.save('minecraft-settings', this.settings);
        if (success) {
            console.log('⚙️ 설정 저장 완료');
        }
        return success;
    }
    
    /**
     * 설정 변경
     */
    updateSetting(key, value) {
        this.settings[key] = value;
        
        // 실시간 설정 적용
        this.applySettings();
        
        // 설정 저장
        this.saveSettings();
    }
    
    /**
     * 설정 적용
     */
    applySettings() {
        if (this.renderer) {
            this.renderer.updateSettings(this.settings);
        }
        if (this.player) {
            this.player.updateSettings(this.settings);
        }
        
        // GameState 설정 업데이트
        if (window.GameState) {
            window.GameState.settings = this.settings;
        }
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 윈도우 이벤트
        window.addEventListener('beforeunload', () => {
            if (this.isRunning) {
                this.saveGame();
            }
        });
        
        // 포커스 잃을 때 자동 일시정지
        window.addEventListener('blur', () => {
            if (this.isRunning && !this.isPaused) {
                this.pause();
            }
        });
    }
    
    /**
     * 이벤트 시스템
     */
    addEventListener(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }
    
    removeEventListener(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    triggerEvent(event, data = {}) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            for (const listener of listeners) {
                try {
                    listener(data);
                } catch (error) {
                    console.error(`이벤트 리스너 오류 (${event}):`, error);
                }
            }
        }
    }
    
    /**
     * 게임 정보 반환
     */
    getGameInfo() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            currentScreen: this.currentScreen,
            fps: this.fps,
            statistics: { ...this.statistics },
            settings: { ...this.settings }
        };
    }
}

// 전역으로 내보내기
window.Game = Game;