/**
 * UI 관리 클래스
 */

class UIManager {
    constructor() {
        this.screens = {
            mainMenu: document.getElementById('main-menu'),
            gameScreen: document.getElementById('game-screen'),
            settingsScreen: document.getElementById('settings-screen'),
            controlsScreen: document.getElementById('controls-screen'),
            aboutScreen: document.getElementById('about-screen'),
            loadingScreen: document.getElementById('loading-screen')
        };
        
        this.elements = {
            // 점수 관련
            currentScore: document.getElementById('current-score'),
            highScore: document.getElementById('high-score'),
            currentLevel: document.getElementById('current-level'),
            finalScore: document.getElementById('final-score'),
            
            // 버튼들
            startGameBtn: document.getElementById('start-game-btn'),
            settingsBtn: document.getElementById('settings-btn'),
            controlsBtn: document.getElementById('controls-btn'),
            aboutBtn: document.getElementById('about-btn'),
            
            // 게임 컨트롤
            pauseBtn: document.getElementById('pause-btn'),
            resetBtn: document.getElementById('reset-btn'),
            exitBtn: document.getElementById('exit-btn'),
            
            // 오버레이
            gameOverlay: document.getElementById('game-overlay'),
            restartBtn: document.getElementById('restart-btn'),
            menuBtn: document.getElementById('menu-btn'),
            
            // 난이도 버튼들
            difficultyBtns: document.querySelectorAll('.difficulty-btn'),
            
            // 모바일 컨트롤
            mobileControls: document.querySelector('.mobile-controls'),
            directionBtns: document.querySelectorAll('.dir-btn')
        };
        
        this.currentScreen = 'main-menu';
        this.mobileControlsVisible = false;
        
        this.initialize();
    }
    
    /**
     * UI 초기화
     */
    initialize() {
        this.setupEventListeners();
        this.setupMobileControls();
        this.showScreen('main-menu');
        
        // 모바일 디바이스 감지 및 컨트롤 표시
        if (Utils.isMobile() || Utils.isTouchDevice()) {
            this.showMobileControls();
        }
        
        console.log('🎮 UI 관리자 초기화 완료');
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 메인 메뉴 버튼들
        if (this.elements.startGameBtn) {
            this.elements.startGameBtn.addEventListener('click', () => {
                this.onStartGame();
            });
        }
        
        if (this.elements.settingsBtn) {
            this.elements.settingsBtn.addEventListener('click', () => {
                this.showScreen('settings');
            });
        }
        
        if (this.elements.controlsBtn) {
            this.elements.controlsBtn.addEventListener('click', () => {
                this.showScreen('controls');
            });
        }
        
        if (this.elements.aboutBtn) {
            this.elements.aboutBtn.addEventListener('click', () => {
                this.showScreen('about');
            });
        }
        
        // 게임 컨트롤 버튼들
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.addEventListener('click', () => {
                this.onPauseToggle();
            });
        }
        
        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener('click', () => {
                this.onResetGame();
            });
        }
        
        if (this.elements.exitBtn) {
            this.elements.exitBtn.addEventListener('click', () => {
                this.onExitGame();
            });
        }
        
        // 게임 오버레이 버튼들
        if (this.elements.restartBtn) {
            this.elements.restartBtn.addEventListener('click', () => {
                this.onRestartGame();
            });
        }
        
        if (this.elements.menuBtn) {
            this.elements.menuBtn.addEventListener('click', () => {
                this.onBackToMenu();
            });
        }
        
        // 난이도 선택 버튼들
        this.elements.difficultyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.onDifficultySelect(e.target);
            });
        });
        
        // 설정 화면 닫기 버튼들
        const closeButtons = [
            document.getElementById('close-settings-btn'),
            document.getElementById('close-controls-btn'),
            document.getElementById('close-about-btn')
        ];
        
        closeButtons.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    this.showScreen('main-menu');
                });
            }
        });
        
        // ESC 키로 메뉴 네비게이션
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') {
                this.handleEscapeKey();
            }
        });
    }
    
    /**
     * 모바일 컨트롤 설정
     */
    setupMobileControls() {
        this.elements.directionBtns.forEach(btn => {
            const direction = btn.dataset.direction;
            
            // 터치 이벤트
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.onDirectionInput(direction);
                btn.classList.add('active');
            });
            
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                btn.classList.remove('active');
            });
            
            // 클릭 이벤트 (데스크톱에서도 작동)
            btn.addEventListener('click', () => {
                this.onDirectionInput(direction);
            });
        });
    }
    
    /**
     * 화면 전환
     */
    showScreen(screenName) {
        // 모든 화면 숨기기
        Object.values(this.screens).forEach(screen => {
            if (screen) screen.classList.add('hidden');
        });
        
        // 지정된 화면 표시
        const targetScreen = this.screens[screenName];
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
            this.currentScreen = screenName;
        }
        
        // 게임 화면 전환 시 특별 처리
        if (screenName === 'gameScreen') {
            this.hideGameOverlay();
            if (this.mobileControlsVisible) {
                this.elements.mobileControls?.classList.remove('hidden');
            }
        } else {
            this.elements.mobileControls?.classList.add('hidden');
        }
    }
    
    /**
     * 로딩 화면 표시
     */
    showLoadingScreen() {
        this.screens.loadingScreen?.classList.remove('hidden');
        
        // 3초 후 게임 화면으로 전환
        setTimeout(() => {
            this.screens.loadingScreen?.classList.add('hidden');
            this.showScreen('gameScreen');
        }, 1000);
    }
    
    /**
     * 게임 오버레이 표시/숨김
     */
    showGameOverlay() {
        this.elements.gameOverlay?.classList.remove('hidden');
    }
    
    hideGameOverlay() {
        this.elements.gameOverlay?.classList.add('hidden');
    }
    
    /**
     * 모바일 컨트롤 표시/숨김
     */
    showMobileControls() {
        this.mobileControlsVisible = true;
        if (this.currentScreen === 'gameScreen') {
            this.elements.mobileControls?.classList.remove('hidden');
        }
    }
    
    hideMobileControls() {
        this.mobileControlsVisible = false;
        this.elements.mobileControls?.classList.add('hidden');
    }
    
    /**
     * 점수 업데이트
     */
    updateScore(score, highScore, level) {
        if (this.elements.currentScore) {
            this.elements.currentScore.textContent = Utils.formatScore(score);
        }
        
        if (this.elements.highScore) {
            this.elements.highScore.textContent = Utils.formatScore(highScore);
        }
        
        if (this.elements.currentLevel) {
            this.elements.currentLevel.textContent = level;
        }
    }
    
    /**
     * 최종 점수 표시
     */
    showFinalScore(score) {
        if (this.elements.finalScore) {
            this.elements.finalScore.textContent = Utils.formatScore(score);
        }
        this.showGameOverlay();
    }
    
    /**
     * 알림 메시지 표시
     */
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // 알림을 화면에 추가
        const container = document.createElement('div');
        container.className = 'notification-container';
        container.appendChild(notification);
        document.body.appendChild(container);
        
        // 자동 제거
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(container);
            }, 300);
        }, duration);
    }
    
    /**
     * 게임 시작 버튼 클릭
     */
    onStartGame() {
        console.log('🎮 게임 시작 버튼 클릭');
        this.showLoadingScreen();
        
        // 게임 인스턴스에 시작 신호 보내기
        if (window.gameInstance) {
            setTimeout(() => {
                window.gameInstance.startGame();
            }, 1000);
        }
    }
    
    /**
     * 일시정지 토글
     */
    onPauseToggle() {
        if (window.gameInstance) {
            if (window.gameInstance.state === GAME_STATES.PLAYING) {
                window.gameInstance.pauseGame();
                this.elements.pauseBtn.textContent = '▶️ 재개';
            } else if (window.gameInstance.state === GAME_STATES.PAUSED) {
                window.gameInstance.resumeGame();
                this.elements.pauseBtn.textContent = '⏸️ 일시정지';
            }
        }
    }
    
    /**
     * 게임 리셋
     */
    onResetGame() {
        if (confirm('정말로 게임을 다시 시작하시겠습니까?')) {
            if (window.gameInstance) {
                window.gameInstance.startGame();
            }
            this.hideGameOverlay();
        }
    }
    
    /**
     * 게임 종료
     */
    onExitGame() {
        if (confirm('정말로 메인 메뉴로 돌아가시겠습니까?')) {
            if (window.gameInstance) {
                window.gameInstance.resetGame();
            }
            this.showScreen('main-menu');
        }
    }
    
    /**
     * 게임 재시작
     */
    onRestartGame() {
        if (window.gameInstance) {
            window.gameInstance.startGame();
        }
        this.hideGameOverlay();
    }
    
    /**
     * 메인 메뉴로 돌아가기
     */
    onBackToMenu() {
        if (window.gameInstance) {
            window.gameInstance.resetGame();
        }
        this.showScreen('main-menu');
    }
    
    /**
     * 난이도 선택
     */
    onDifficultySelect(button) {
        // 모든 난이도 버튼에서 active 클래스 제거
        this.elements.difficultyBtns.forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 선택된 버튼에 active 클래스 추가
        button.classList.add('active');
        
        // 게임 인스턴스에 난이도 설정
        const difficulty = button.dataset.difficulty;
        if (window.gameInstance && difficulty) {
            window.gameInstance.setDifficulty(difficulty);
        }
        
        console.log(`난이도 선택: ${difficulty}`);
    }
    
    /**
     * 방향 입력 처리
     */
    onDirectionInput(direction) {
        if (window.gameInstance && window.gameInstance.state === GAME_STATES.PLAYING) {
            let gameDirection;
            
            switch (direction) {
                case 'up':
                    gameDirection = DIRECTIONS.UP;
                    break;
                case 'down':
                    gameDirection = DIRECTIONS.DOWN;
                    break;
                case 'left':
                    gameDirection = DIRECTIONS.LEFT;
                    break;
                case 'right':
                    gameDirection = DIRECTIONS.RIGHT;
                    break;
            }
            
            if (gameDirection) {
                window.gameInstance.snake.setDirection(gameDirection);
            }
        }
    }
    
    /**
     * ESC 키 처리
     */
    handleEscapeKey() {
        switch (this.currentScreen) {
            case 'gameScreen':
                this.onExitGame();
                break;
            case 'settings':
            case 'controls':
            case 'about':
                this.showScreen('main-menu');
                break;
        }
    }
    
    /**
     * 게임 상태 변경 시 UI 업데이트
     */
    onGameStateChange(newState) {
        switch (newState) {
            case GAME_STATES.PLAYING:
                if (this.elements.pauseBtn) {
                    this.elements.pauseBtn.textContent = '⏸️ 일시정지';
                }
                break;
            case GAME_STATES.PAUSED:
                if (this.elements.pauseBtn) {
                    this.elements.pauseBtn.textContent = '▶️ 재개';
                }
                break;
            case GAME_STATES.GAME_OVER:
                this.showGameOverlay();
                break;
        }
    }
    
    /**
     * 효과 표시 (레벨업, 특수 음식 등)
     */
    showEffect(effectType, message) {
        const effectElement = document.createElement('div');
        effectElement.className = `game-effect ${effectType}`;
        effectElement.textContent = message;
        
        // 캔버스 위에 표시
        const gameScreen = this.screens.gameScreen;
        if (gameScreen) {
            gameScreen.appendChild(effectElement);
            
            // 애니메이션 후 제거
            setTimeout(() => {
                effectElement.classList.add('fade-out');
                setTimeout(() => {
                    gameScreen.removeChild(effectElement);
                }, 500);
            }, 1500);
        }
    }
    
    /**
     * 통계 표시
     */
    showStats(stats) {
        const statsMessage = `
게임 플레이 횟수: ${stats.gamesPlayed}
총 점수: ${Utils.formatScore(stats.totalScore)}
먹은 음식: ${stats.foodEaten}개
최대 길이: ${stats.maxLength}
플레이 시간: ${Utils.formatTime(stats.totalTime)}
        `.trim();
        
        alert(statsMessage);
    }
    
    /**
     * 반응형 레이아웃 조정
     */
    adjustLayout() {
        const isMobile = Utils.isMobile();
        const gameHeader = document.getElementById('game-header');
        
        if (isMobile && gameHeader) {
            gameHeader.style.fontSize = '10px';
        }
    }
    
    /**
     * 애니메이션 효과
     */
    animateButton(button) {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 150);
    }
    
    /**
     * 정리
     */
    dispose() {
        // 이벤트 리스너 제거 등 정리 작업
        console.log('🗑️ UI 관리자 정리');
    }
}

// 전역으로 내보내기
window.UIManager = UIManager;