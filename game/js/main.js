/**
 * Minecraft HTML Edition - 메인 진입점
 * 게임 초기화 및 전역 상태 관리
 */

// 전역 게임 상태
const GameState = {
    isRunning: false,
    isPaused: false,
    currentScreen: 'main-menu', // main-menu, game, loading, settings
    world: null,
    player: null,
    renderer: null,
    inputHandler: null,
    ui: null,
    settings: {
        renderDistance: 8,
        fov: 70,
        mouseSensitivity: 5,
        soundVolume: 50,
        showCoords: true,
        showFps: true
    }
};

// DOM 요소들
const elements = {
    gameContainer: null,
    mainMenu: null,
    gameScreen: null,
    loadingScreen: null,
    settingsMenu: null,
    worldCanvas: null
};

/**
 * 게임 초기화
 */
function initializeGame() {
    console.log('🎮 Minecraft HTML Edition 초기화 중...');
    
    // DOM 요소 참조 획득
    initializeElements();
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // 게임 시스템 초기화
    initializeGameSystems();
    
    console.log('✅ 게임 초기화 완료');
}

/**
 * DOM 요소 참조 초기화
 */
function initializeElements() {
    elements.gameContainer = document.getElementById('game-container');
    elements.mainMenu = document.getElementById('main-menu');
    elements.gameScreen = document.getElementById('game-screen');
    elements.loadingScreen = document.getElementById('loading-screen');
    elements.settingsMenu = document.getElementById('settings-menu');
    elements.worldCanvas = document.getElementById('world-canvas');
    
    // 필수 요소 검증
    const requiredElements = ['gameContainer', 'mainMenu', 'gameScreen', 'worldCanvas'];
    for (const elementKey of requiredElements) {
        if (!elements[elementKey]) {
            throw new Error(`필수 DOM 요소를 찾을 수 없습니다: ${elementKey}`);
        }
    }
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 메인 메뉴 버튼들
    const newWorldBtn = document.getElementById('new-world-btn');
    const loadWorldBtn = document.getElementById('load-world-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const aboutBtn = document.getElementById('about-btn');
    
    if (newWorldBtn) newWorldBtn.addEventListener('click', startNewWorld);
    if (loadWorldBtn) loadWorldBtn.addEventListener('click', loadWorld);
    if (settingsBtn) settingsBtn.addEventListener('click', showSettings);
    if (aboutBtn) aboutBtn.addEventListener('click', showAbout);
    
    // 설정 메뉴
    const settingsDoneBtn = document.getElementById('settings-done-btn');
    if (settingsDoneBtn) settingsDoneBtn.addEventListener('click', hideSettings);
    
    // 게임 메뉴 (ESC)
    const resumeBtn = document.getElementById('resume-btn');
    const saveWorldBtn = document.getElementById('save-world-btn');
    const quitBtn = document.getElementById('quit-btn');
    
    if (resumeBtn) resumeBtn.addEventListener('click', resumeGame);
    if (saveWorldBtn) saveWorldBtn.addEventListener('click', saveWorld);
    if (quitBtn) quitBtn.addEventListener('click', quitGame);
    
    // 도움말
    const closeHelpBtn = document.getElementById('close-help-btn');
    if (closeHelpBtn) closeHelpBtn.addEventListener('click', hideHelp);
    
    // 키보드 이벤트
    document.addEventListener('keydown', handleGlobalKeyDown);
    
    // 설정 변경 이벤트
    setupSettingsListeners();
    
    // 창 크기 변경 이벤트
    window.addEventListener('resize', handleWindowResize);
    
    // 전체화면 변경 이벤트
    document.addEventListener('fullscreenchange', handleFullscreenChange);
}

/**
 * 설정 변경 이벤트 리스너 설정
 */
function setupSettingsListeners() {
    const settingsInputs = [
        { id: 'render-distance', key: 'renderDistance', display: 'render-distance-value' },
        { id: 'fov', key: 'fov', display: 'fov-value' },
        { id: 'mouse-sensitivity', key: 'mouseSensitivity', display: 'mouse-sensitivity-value' },
        { id: 'sound-volume', key: 'soundVolume', display: 'sound-volume-value' },
        { id: 'show-coords', key: 'showCoords' },
        { id: 'show-fps', key: 'showFps' }
    ];
    
    settingsInputs.forEach(setting => {
        const input = document.getElementById(setting.id);
        const display = document.getElementById(setting.display);
        
        if (input) {
            // 초기 값 설정
            if (input.type === 'range') {
                input.value = GameState.settings[setting.key];
                if (display) display.textContent = input.value;
            } else if (input.type === 'checkbox') {
                input.checked = GameState.settings[setting.key];
            }
            
            // 변경 이벤트 리스너
            input.addEventListener('input', (e) => {
                const value = input.type === 'checkbox' ? e.target.checked : Number(e.target.value);
                GameState.settings[setting.key] = value;
                
                if (display) display.textContent = value;
                
                // 설정 적용
                applySettings();
            });
        }
    });
}

/**
 * 게임 시스템 초기화
 */
function initializeGameSystems() {
    // Canvas 설정
    if (elements.worldCanvas) {
        const ctx = elements.worldCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = false; // 픽셀 아트 스타일 유지
        
        // Canvas 크기 설정
        resizeCanvas();
    }
    
    // 게임 상태 초기화
    GameState.isRunning = false;
    GameState.isPaused = false;
    GameState.currentScreen = 'main-menu';
    
    console.log('🔧 게임 시스템 초기화 완료');
}

/**
 * 새 세계 시작
 */
async function startNewWorld() {
    console.log('🌍 새로운 세계 생성 시작');
    
    showScreen('loading');
    updateLoadingProgress(0, '세계 초기화 중...');
    
    try {
        // 게임 인스턴스 생성 또는 가져오기
        if (!window.gameInstance) {
            window.gameInstance = new Game();
        }
        
        // 월드 생성
        updateLoadingProgress(20, '지형 생성 중...');
        GameState.world = new World();
        await GameState.world.generate();
        
        // 플레이어 생성
        updateLoadingProgress(50, '플레이어 초기화 중...');
        GameState.player = new Player();
        GameState.player.setPosition(0, GameState.world.getHeightAt(0, 0) + 2, 0);
        
        // 초기 아이템 지급
        if (GameState.player.gameMode === 'survival') {
            GameState.player.addToInventory(BlockType.GRASS, 64);
            GameState.player.addToInventory(BlockType.DIRT, 64);
            GameState.player.addToInventory(BlockType.STONE, 64);
            GameState.player.addToInventory(BlockType.WOOD, 32);
        }
        
        // 렌더러 생성
        updateLoadingProgress(70, '렌더러 초기화 중...');
        GameState.renderer = new Renderer(elements.worldCanvas);
        
        // 입력 핸들러 생성
        updateLoadingProgress(80, '입력 시스템 초기화 중...');
        GameState.inputHandler = new InputHandler();
        
        // UI 시스템 생성
        updateLoadingProgress(90, 'UI 시스템 초기화 중...');
        GameState.ui = new UI();
        
        updateLoadingProgress(100, '완료!');
        
        // 게임 시작
        setTimeout(() => {
            startGame();
        }, 500);
        
    } catch (error) {
        console.error('세계 생성 중 오류:', error);
        alert('세계 생성 중 오류가 발생했습니다.');
        showScreen('main-menu');
    }
}

/**
 * 세계 불러오기
 */
function loadWorld() {
    // 로컬 스토리지에서 저장된 세계 불러오기
    const savedWorld = localStorage.getItem('minecraft-world');
    if (savedWorld) {
        try {
            const worldData = JSON.parse(savedWorld);
            console.log('💾 저장된 세계 불러오기:', worldData);
            
            showScreen('loading');
            updateLoadingProgress(0, '세계 불러오는 중...');
            
            // 세계 복원 로직
            setTimeout(() => {
                updateLoadingProgress(100, '완료!');
                startGame();
            }, 1000);
            
        } catch (error) {
            console.error('세계 불러오기 오류:', error);
            alert('저장된 세계를 불러올 수 없습니다.');
        }
    } else {
        alert('저장된 세계가 없습니다.');
    }
}

/**
 * 게임 시작
 */
function startGame() {
    console.log('🎮 게임 시작');
    
    showScreen('game');
    
    GameState.isRunning = true;
    GameState.isPaused = false;
    
    // 포인터 락 요청 (마우스 컨트롤용)
    requestPointerLock();
    
    // 게임 루프 시작
    startGameLoop();
    
    // UI 업데이트 시작
    if (GameState.ui) {
        GameState.ui.startUpdates();
    }
}

/**
 * 게임 일시정지/재개
 */
function togglePause() {
    if (GameState.isRunning) {
        if (GameState.isPaused) {
            resumeGame();
        } else {
            pauseGame();
        }
    }
}

function pauseGame() {
    console.log('⏸️ 게임 일시정지');
    GameState.isPaused = true;
    showElement('pause-menu');
    document.exitPointerLock();
}

function resumeGame() {
    console.log('▶️ 게임 재개');
    GameState.isPaused = false;
    hideElement('pause-menu');
    requestPointerLock();
}

/**
 * 게임 종료
 */
function quitGame() {
    console.log('🚪 게임 종료');
    
    // 게임 상태 정리
    GameState.isRunning = false;
    GameState.isPaused = false;
    
    // 포인터 락 해제
    document.exitPointerLock();
    
    // 게임 객체들 정리
    if (GameState.inputHandler) {
        GameState.inputHandler.destroy();
        GameState.inputHandler = null;
    }
    
    if (GameState.ui) {
        GameState.ui.stopUpdates();
        GameState.ui = null;
    }
    
    GameState.world = null;
    GameState.player = null;
    GameState.renderer = null;
    
    // 메인 메뉴로 돌아가기
    showScreen('main-menu');
}

/**
 * 세계 저장
 */
function saveWorld() {
    if (GameState.world && GameState.player) {
        try {
            const worldData = {
                world: GameState.world.serialize(),
                player: GameState.player.serialize(),
                timestamp: Date.now()
            };
            
            localStorage.setItem('minecraft-world', JSON.stringify(worldData));
            console.log('💾 세계 저장 완료');
            
            // 성공 메시지 표시
            if (GameState.ui) {
                GameState.ui.showNotification('세계가 저장되었습니다!', 'success');
            }
        } catch (error) {
            console.error('세계 저장 오류:', error);
            if (GameState.ui) {
                GameState.ui.showNotification('세계 저장 중 오류가 발생했습니다.', 'error');
            }
        }
    }
}

/**
 * 설정 메뉴 표시
 */
function showSettings() {
    showScreen('settings');
}

function hideSettings() {
    if (GameState.isRunning) {
        showScreen('game');
    } else {
        showScreen('main-menu');
    }
}

/**
 * 설정 적용
 */
function applySettings() {
    if (GameState.renderer) {
        GameState.renderer.updateSettings(GameState.settings);
    }
    
    if (GameState.player) {
        GameState.player.updateSettings(GameState.settings);
    }
    
    // UI 요소들 업데이트
    const statusInfo = document.getElementById('status-info');
    if (statusInfo) {
        statusInfo.style.display = GameState.settings.showCoords ? 'block' : 'none';
    }
}

/**
 * 정보 표시
 */
function showAbout() {
    alert(`Minecraft HTML Edition
    
웹 기반 마인크래프트 클론 게임

특징:
• HTML5 Canvas 기반 3D 렌더링
• 블록 배치/파괴 시스템
• 인벤토리 및 제작 시스템
• 실시간 월드 생성

개발: Claude Code
버전: 1.0.0`);
}

/**
 * 도움말 표시/숨김
 */
function showHelp() {
    showElement('controls-help');
}

function hideHelp() {
    hideElement('controls-help');
}

/**
 * 전역 키 입력 처리
 */
function handleGlobalKeyDown(event) {
    switch (event.code) {
        case 'Escape':
            if (GameState.isRunning && !GameState.isPaused) {
                pauseGame();
            } else if (GameState.isPaused) {
                resumeGame();
            }
            break;
            
        case 'F1':
            event.preventDefault();
            if (GameState.isRunning) {
                const helpElement = document.getElementById('controls-help');
                if (helpElement.classList.contains('hidden')) {
                    showHelp();
                } else {
                    hideHelp();
                }
            }
            break;
            
        case 'F11':
            event.preventDefault();
            toggleFullscreen();
            break;
    }
}

/**
 * 화면 전환 함수들
 */
function showScreen(screenName) {
    // 모든 화면 숨기기
    const screens = ['main-menu', 'game-screen', 'loading-screen', 'settings-menu'];
    screens.forEach(screen => {
        const element = document.getElementById(screen);
        if (element) {
            element.classList.add('hidden');
        }
    });
    
    // 특정 화면 표시
    const targetScreen = document.getElementById(screenName + (screenName === 'game' ? '-screen' : ''));
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        GameState.currentScreen = screenName;
    }
}

function showElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.remove('hidden');
    }
}

function hideElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add('hidden');
    }
}

/**
 * 로딩 진행률 업데이트
 */
function updateLoadingProgress(progress, text) {
    const progressBar = document.querySelector('.loading-progress');
    const loadingText = document.getElementById('loading-text');
    
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
    
    if (loadingText && text) {
        loadingText.textContent = text;
    }
}

/**
 * 게임 루프
 */
let lastTime = 0;
let frameCount = 0;
let fpsTime = 0;

function gameLoop(currentTime) {
    if (!GameState.isRunning) {
        return;
    }
    
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // FPS 계산
    frameCount++;
    fpsTime += deltaTime;
    
    if (fpsTime >= 1000) {
        const fps = Math.round(frameCount * 1000 / fpsTime);
        updateFPS(fps);
        frameCount = 0;
        fpsTime = 0;
    }
    
    if (!GameState.isPaused) {
        // 게임 로직 업데이트
        if (GameState.player) {
            GameState.player.update(deltaTime);
        }
        
        if (GameState.world) {
            GameState.world.update(deltaTime);
        }
        
        // 렌더링
        if (GameState.renderer) {
            GameState.renderer.render(GameState.world, GameState.player);
        }
        
        // UI 업데이트
        if (GameState.ui) {
            GameState.ui.update(deltaTime);
        }
    }
    
    requestAnimationFrame(gameLoop);
}

function startGameLoop() {
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

/**
 * FPS 표시 업데이트
 */
function updateFPS(fps) {
    const fpsElement = document.getElementById('fps-value');
    if (fpsElement && GameState.settings.showFps) {
        fpsElement.textContent = fps;
    }
}

/**
 * 유틸리티 함수들
 */
function resizeCanvas() {
    if (elements.worldCanvas) {
        const container = elements.worldCanvas.parentElement;
        elements.worldCanvas.width = container.clientWidth;
        elements.worldCanvas.height = container.clientHeight;
        
        if (GameState.renderer) {
            GameState.renderer.resize(elements.worldCanvas.width, elements.worldCanvas.height);
        }
    }
}

function handleWindowResize() {
    resizeCanvas();
}

function requestPointerLock() {
    if (elements.worldCanvas && elements.worldCanvas.requestPointerLock) {
        elements.worldCanvas.requestPointerLock();
    }
}

function toggleFullscreen() {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        document.documentElement.requestFullscreen();
    }
}

function handleFullscreenChange() {
    setTimeout(resizeCanvas, 100);
}

/**
 * 게임 시작점
 */
document.addEventListener('DOMContentLoaded', () => {
    try {
        initializeGame();
    } catch (error) {
        console.error('게임 초기화 실패:', error);
        alert('게임을 초기화할 수 없습니다. 페이지를 새로고침해주세요.');
    }
});

// 전역 객체로 내보내기 (디버깅용)
window.GameState = GameState;
window.showScreen = showScreen;