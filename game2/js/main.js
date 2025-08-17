/**
 * Snake Game - 메인 진입점
 */

// 전역 변수들
window.gameInstance = null;
window.uiManager = null;
window.settingsManager = null;

// 디버그 모드
window.DEBUG_MODE = false;

/**
 * 게임 초기화
 */
function initializeGame() {
    console.log('🐍 Snake Game 초기화 시작...');
    
    try {
        // 게임 인스턴스 생성
        window.gameInstance = new Game();
        
        // UI 관리자 생성
        window.uiManager = new UIManager();
        
        // 설정 관리자 생성
        window.settingsManager = new SettingsManager();
        
        // 전역 이벤트 리스너 설정
        setupGlobalEventListeners();
        
        // 초기 설정 적용
        applyInitialSettings();
        
        console.log('✅ Snake Game 초기화 완료!');
        
        // 로딩 화면 숨기기
        hideLoadingScreen();
        
    } catch (error) {
        console.error('❌ 게임 초기화 실패:', error);
        showErrorMessage('게임을 초기화할 수 없습니다. 페이지를 새로고침해주세요.');
    }
}

/**
 * 전역 이벤트 리스너 설정
 */
function setupGlobalEventListeners() {
    // 페이지 언로드 시 정리
    window.addEventListener('beforeunload', () => {
        cleanupGame();
    });
    
    // 에러 처리
    window.addEventListener('error', (event) => {
        console.error('전역 에러:', event.error);
        showErrorMessage('예상치 못한 오류가 발생했습니다.');
    });
    
    // 리사이즈 이벤트
    window.addEventListener('resize', Utils.debounce(() => {
        if (window.gameInstance) {
            window.gameInstance.setupCanvas();
        }
        if (window.uiManager) {
            window.uiManager.adjustLayout();
        }
    }, 250));
    
    // 키보드 단축키
    document.addEventListener('keydown', (e) => {
        // F12: 디버그 모드 토글
        if (e.key === 'F12') {
            e.preventDefault();
            toggleDebugMode();
        }
        
        // F1: 도움말
        if (e.key === 'F1') {
            e.preventDefault();
            if (window.uiManager) {
                window.uiManager.showScreen('controls');
            }
        }
        
        // Ctrl+R: 게임 리셋
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            if (window.gameInstance) {
                if (confirm('게임을 다시 시작하시겠습니까?')) {
                    window.gameInstance.startGame();
                }
            }
        }
    });
    
    // 마우스 우클릭 방지 (선택사항)
    document.addEventListener('contextmenu', (e) => {
        if (e.target.tagName === 'CANVAS') {
            e.preventDefault();
        }
    });
    
    // 터치 이벤트 처리 (모바일)
    if (Utils.isTouchDevice()) {
        setupTouchEvents();
    }
}

/**
 * 터치 이벤트 설정
 */
function setupTouchEvents() {
    let touchStartPos = { x: 0, y: 0 };
    
    document.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            touchStartPos.x = e.touches[0].clientX;
            touchStartPos.y = e.touches[0].clientY;
        }
    });
    
    document.addEventListener('touchend', (e) => {
        if (e.changedTouches.length === 1 && window.gameInstance && 
            window.gameInstance.state === GAME_STATES.PLAYING) {
            
            const touchEndPos = {
                x: e.changedTouches[0].clientX,
                y: e.changedTouches[0].clientY
            };
            
            const deltaX = touchEndPos.x - touchStartPos.x;
            const deltaY = touchEndPos.y - touchStartPos.y;
            const minSwipeDistance = 30;
            
            // 스와이프 방향 감지
            if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
                let direction;
                
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    // 수평 스와이프
                    direction = deltaX > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
                } else {
                    // 수직 스와이프
                    direction = deltaY > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;
                }
                
                window.gameInstance.snake.setDirection(direction);
            }
        }
    });
    
    // 스크롤 방지
    document.addEventListener('touchmove', (e) => {
        if (e.target.closest('#game-screen')) {
            e.preventDefault();
        }
    }, { passive: false });
}

/**
 * 초기 설정 적용
 */
function applyInitialSettings() {
    if (window.gameInstance && window.settingsManager) {
        const settings = window.settingsManager.getCurrentSettings();
        window.gameInstance.settings = { ...settings };
        window.gameInstance.applySettings();
    }
    
    // 다크/라이트 모드 감지 및 적용
    applyTheme();
}

/**
 * 테마 적용
 */
function applyTheme() {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDarkMode ? 'dark' : 'light');
    
    // 테마 변경 감지
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    });
}

/**
 * 디버그 모드 토글
 */
function toggleDebugMode() {
    window.DEBUG_MODE = !window.DEBUG_MODE;
    
    console.log(`🐛 디버그 모드: ${window.DEBUG_MODE ? '활성화' : '비활성화'}`);
    
    if (window.DEBUG_MODE) {
        showDebugPanel();
    } else {
        hideDebugPanel();
    }
}

/**
 * 디버그 패널 표시
 */
function showDebugPanel() {
    let debugPanel = document.getElementById('debug-panel');
    
    if (!debugPanel) {
        debugPanel = document.createElement('div');
        debugPanel.id = 'debug-panel';
        debugPanel.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            font-family: 'Courier New', monospace;
            font-size: 10px;
            border-radius: 5px;
            z-index: 10000;
            min-width: 200px;
        `;
        document.body.appendChild(debugPanel);
    }
    
    // 디버그 정보 업데이트 함수
    const updateDebugInfo = () => {
        if (!window.DEBUG_MODE || !debugPanel) return;
        
        let debugInfo = '<h4>🐛 Debug Info</h4>';
        
        if (window.gameInstance) {
            const gameInfo = window.gameInstance.getGameInfo();
            debugInfo += `
                <div>상태: ${gameInfo.state}</div>
                <div>점수: ${gameInfo.score}</div>
                <div>레벨: ${gameInfo.level}</div>
                <div>뱀 길이: ${gameInfo.snakeLength}</div>
                <div>난이도: ${gameInfo.difficulty}</div>
                <div>FPS: ${Math.round(1000 / (performance.now() - (window.lastFrameTime || performance.now())))}</div>
            `;
            
            if (window.gameInstance.snake) {
                const head = window.gameInstance.snake.getHead();
                debugInfo += `<div>머리 위치: (${head.x}, ${head.y})</div>`;
            }
        }
        
        debugPanel.innerHTML = debugInfo;
        window.lastFrameTime = performance.now();
    };
    
    // 디버그 정보 주기적 업데이트
    window.debugInterval = setInterval(updateDebugInfo, 100);
    updateDebugInfo();
}

/**
 * 디버그 패널 숨기기
 */
function hideDebugPanel() {
    const debugPanel = document.getElementById('debug-panel');
    if (debugPanel) {
        document.body.removeChild(debugPanel);
    }
    
    if (window.debugInterval) {
        clearInterval(window.debugInterval);
        window.debugInterval = null;
    }
}

/**
 * 로딩 화면 숨기기
 */
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        Utils.fadeOut(loadingScreen, 500);
    }
}

/**
 * 에러 메시지 표시
 */
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #F44336;
        color: white;
        padding: 20px;
        border-radius: 8px;
        font-family: 'Press Start 2P', monospace;
        font-size: 12px;
        text-align: center;
        z-index: 10000;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        max-width: 400px;
        word-wrap: break-word;
    `;
    
    errorDiv.innerHTML = `
        <div style="margin-bottom: 15px;">⚠️ 오류</div>
        <div style="font-size: 10px; margin-bottom: 15px;">${message}</div>
        <button onclick="location.reload()" style="
            background: #D32F2F;
            border: none;
            color: white;
            padding: 8px 16px;
            font-family: inherit;
            font-size: 8px;
            cursor: pointer;
            border-radius: 4px;
        ">새로고침</button>
    `;
    
    document.body.appendChild(errorDiv);
}

/**
 * 성능 모니터링
 */
function startPerformanceMonitoring() {
    if (!window.DEBUG_MODE) return;
    
    let frameCount = 0;
    let lastTime = performance.now();
    
    function measureFPS() {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - lastTime >= 1000) {
            const fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
            console.log(`📊 FPS: ${fps}`);
            frameCount = 0;
            lastTime = currentTime;
        }
        
        requestAnimationFrame(measureFPS);
    }
    
    requestAnimationFrame(measureFPS);
}

/**
 * 게임 정리
 */
function cleanupGame() {
    console.log('🗑️ 게임 정리 시작...');
    
    try {
        if (window.gameInstance) {
            window.gameInstance.dispose();
        }
        
        if (window.uiManager) {
            window.uiManager.dispose();
        }
        
        if (window.settingsManager) {
            window.settingsManager.dispose();
        }
        
        if (window.debugInterval) {
            clearInterval(window.debugInterval);
        }
        
        console.log('✅ 게임 정리 완료');
        
    } catch (error) {
        console.error('❌ 게임 정리 중 오류:', error);
    }
}

/**
 * 게임 상태 저장
 */
function saveGameState() {
    if (window.gameInstance) {
        const gameState = {
            score: window.gameInstance.score,
            level: window.gameInstance.level,
            snake: window.gameInstance.snake ? window.gameInstance.snake.serialize() : null,
            food: window.gameInstance.food ? window.gameInstance.food.serialize() : null,
            timestamp: Date.now()
        };
        
        Utils.saveToStorage('snake-game-state', gameState);
        console.log('💾 게임 상태 저장');
    }
}

/**
 * 게임 상태 복원
 */
function loadGameState() {
    const savedState = Utils.loadFromStorage('snake-game-state', null);
    
    if (savedState && window.gameInstance) {
        try {
            // 저장된 시간이 24시간 이내인지 확인
            const hoursSinceLastSave = (Date.now() - savedState.timestamp) / (1000 * 60 * 60);
            
            if (hoursSinceLastSave < 24) {
                window.gameInstance.score = savedState.score;
                window.gameInstance.level = savedState.level;
                
                if (savedState.snake && window.gameInstance.snake) {
                    window.gameInstance.snake.deserialize(savedState.snake);
                }
                
                if (savedState.food && window.gameInstance.food) {
                    window.gameInstance.food.deserialize(savedState.food);
                }
                
                console.log('📂 게임 상태 복원');
                return true;
            }
        } catch (error) {
            console.error('게임 상태 복원 실패:', error);
        }
    }
    
    return false;
}

/**
 * 게임 통계 업데이트
 */
function updateGameStats() {
    if (window.gameInstance) {
        const stats = Utils.loadFromStorage('snake-game-stats', {
            totalGames: 0,
            totalScore: 0,
            highestScore: 0,
            totalPlayTime: 0,
            averageScore: 0
        });
        
        stats.totalGames++;
        stats.totalScore += window.gameInstance.score;
        stats.highestScore = Math.max(stats.highestScore, window.gameInstance.score);
        stats.averageScore = Math.round(stats.totalScore / stats.totalGames);
        
        Utils.saveToStorage('snake-game-stats', stats);
    }
}

/**
 * 단축키 도움말 표시
 */
function showKeyboardHelp() {
    const helpMessage = `
🎮 키보드 단축키:

게임 조작:
• W, A, S, D 또는 방향키 - 뱀 이동
• Space - 일시정지/재개
• Esc - 메인 메뉴

기타:
• F1 - 조작법 보기
• F12 - 디버그 모드
• Ctrl+R - 게임 재시작
• Ctrl+S - 설정 저장 (설정 화면에서)
    `.trim();
    
    alert(helpMessage);
}

/**
 * 브라우저 호환성 확인
 */
function checkBrowserCompatibility() {
    const requiredFeatures = [
        'localStorage',
        'requestAnimationFrame',
        'addEventListener',
        'JSON'
    ];
    
    const missingFeatures = requiredFeatures.filter(feature => {
        return !(feature in window) && !(feature in window.localStorage);
    });
    
    if (missingFeatures.length > 0) {
        showErrorMessage(`브라우저가 일부 기능을 지원하지 않습니다: ${missingFeatures.join(', ')}`);
        return false;
    }
    
    return true;
}

// DOM이 로드되면 게임 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 브라우저 호환성 확인
    if (!checkBrowserCompatibility()) {
        return;
    }
    
    // 게임 초기화
    initializeGame();
    
    // 성능 모니터링 시작 (디버그 모드)
    if (window.DEBUG_MODE) {
        startPerformanceMonitoring();
    }
});

// 페이지 언로드 시 게임 상태 저장
window.addEventListener('beforeunload', () => {
    saveGameState();
    updateGameStats();
});

// 전역 함수들을 window 객체에 등록 (디버깅용)
window.showKeyboardHelp = showKeyboardHelp;
window.toggleDebugMode = toggleDebugMode;
window.saveGameState = saveGameState;
window.loadGameState = loadGameState;

console.log('🐍 Snake Game HTML Edition - Ready to play!');