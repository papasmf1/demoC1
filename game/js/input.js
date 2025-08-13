/**
 * 입력 처리 시스템
 */

// 입력 설정
const INPUT_CONFIG = {
    MOUSE_SENSITIVITY: 0.002,
    MOUSE_WHEEL_SENSITIVITY: 0.1,
    DOUBLE_CLICK_TIME: 300,
    KEY_REPEAT_DELAY: 100
};

/**
 * 입력 핸들러 클래스
 */
class InputHandler {
    constructor() {
        // 키보드 상태
        this.keys = {};
        this.previousKeys = {};
        
        // 마우스 상태
        this.mouseButtons = {};
        this.mousePosition = { x: 0, y: 0 };
        this.mouseDelta = { x: 0, y: 0 };
        this.wheelDelta = 0;
        
        // 터치 상태 (모바일 지원)
        this.touches = {};
        this.touchStartPos = { x: 0, y: 0 };
        
        // 이벤트 상태
        this.isPointerLocked = false;
        this.preventContextMenu = true;
        
        // 더블클릭 감지
        this.lastClickTime = 0;
        this.clickCount = 0;
        
        // 콜백 함수들
        this.callbacks = {
            onKeyDown: [],
            onKeyUp: [],
            onMouseDown: [],
            onMouseUp: [],
            onMouseMove: [],
            onMouseWheel: [],
            onDoubleClick: []
        };
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 키보드 이벤트
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // 마우스 이벤트
        document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('wheel', (e) => this.handleMouseWheel(e));
        document.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
        
        // 포인터 락 이벤트
        document.addEventListener('pointerlockchange', () => this.handlePointerLockChange());
        document.addEventListener('pointerlockerror', () => this.handlePointerLockError());
        
        // 터치 이벤트 (모바일 지원)
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // 윈도우 포커스 이벤트
        window.addEventListener('blur', () => this.handleWindowBlur());
        window.addEventListener('focus', () => this.handleWindowFocus());
    }
    
    /**
     * 키보드 이벤트 처리
     */
    handleKeyDown(event) {
        const keyCode = event.code || event.key;
        
        // 이미 눌려있는 키는 무시 (키 반복 방지)
        if (this.keys[keyCode]) return;
        
        this.keys[keyCode] = true;
        
        // 기본 브라우저 동작 방지 (게임에서 사용하는 키들)
        const gameKeys = ['Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight', 
                         'F1', 'F11', 'Tab', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
        
        if (gameKeys.includes(keyCode)) {
            event.preventDefault();
        }
        
        // 콜백 호출
        this.triggerCallbacks('onKeyDown', { key: keyCode, event: event });
        
        // 게임 상태에 따른 특별 처리
        if (GameState && GameState.isRunning) {
            this.handleGameKeyDown(keyCode, event);
        }
    }
    
    handleKeyUp(event) {
        const keyCode = event.code || event.key;
        this.keys[keyCode] = false;
        
        this.triggerCallbacks('onKeyUp', { key: keyCode, event: event });
        
        if (GameState && GameState.isRunning) {
            this.handleGameKeyUp(keyCode, event);
        }
    }
    
    /**
     * 게임 중 키 입력 처리
     */
    handleGameKeyDown(keyCode, event) {
        switch (keyCode) {
            case 'KeyE':
                // 인벤토리 토글
                if (GameState.ui) {
                    GameState.ui.toggleInventory();
                }
                break;
                
            case 'KeyT':
                // 채팅 열기
                if (GameState.ui) {
                    GameState.ui.openChat();
                }
                break;
                
            case 'KeyF3':
                event.preventDefault();
                // 디버그 정보 토글
                if (GameState.ui) {
                    GameState.ui.toggleDebugInfo();
                }
                break;
                
            case 'KeyC':
                // 크리에이티브 모드 토글 (디버그용)
                if (event.ctrlKey && GameState.player) {
                    GameState.player.gameMode = GameState.player.gameMode === 'creative' ? 'survival' : 'creative';
                    console.log(`게임 모드: ${GameState.player.gameMode}`);
                }
                break;
                
            // 핫바 선택 (1-9)
            case 'Digit1': case 'Digit2': case 'Digit3': case 'Digit4': case 'Digit5':
            case 'Digit6': case 'Digit7': case 'Digit8': case 'Digit9':
                const hotbarIndex = parseInt(keyCode.replace('Digit', '')) - 1;
                if (GameState.player) {
                    GameState.player.hotbarIndex = hotbarIndex;
                }
                if (GameState.ui) {
                    GameState.ui.updateHotbar();
                }
                break;
        }
    }
    
    handleGameKeyUp(keyCode, event) {
        // 게임 중 키 해제 시 처리할 내용
    }
    
    /**
     * 마우스 이벤트 처리
     */
    handleMouseDown(event) {
        const button = event.button;
        this.mouseButtons[button] = true;
        
        // 더블클릭 감지
        const currentTime = Date.now();
        if (currentTime - this.lastClickTime < INPUT_CONFIG.DOUBLE_CLICK_TIME) {
            this.clickCount++;
            if (this.clickCount === 2) {
                this.triggerCallbacks('onDoubleClick', { button: button, event: event });
                this.clickCount = 0;
            }
        } else {
            this.clickCount = 1;
        }
        this.lastClickTime = currentTime;
        
        this.triggerCallbacks('onMouseDown', { button: button, event: event });
        
        if (GameState && GameState.isRunning && !GameState.isPaused) {
            this.handleGameMouseDown(button, event);
        }
    }
    
    handleMouseUp(event) {
        const button = event.button;
        this.mouseButtons[button] = false;
        
        this.triggerCallbacks('onMouseUp', { button: button, event: event });
        
        if (GameState && GameState.isRunning && !GameState.isPaused) {
            this.handleGameMouseUp(button, event);
        }
    }
    
    handleMouseMove(event) {
        this.mousePosition.x = event.clientX;
        this.mousePosition.y = event.clientY;
        
        if (this.isPointerLocked) {
            this.mouseDelta.x = event.movementX || 0;
            this.mouseDelta.y = event.movementY || 0;
            
            // 플레이어 회전 처리
            if (GameState && GameState.player && GameState.isRunning && !GameState.isPaused) {
                const sensitivity = (GameState.settings.mouseSensitivity || 5) * INPUT_CONFIG.MOUSE_SENSITIVITY;
                GameState.player.rotation.yaw += this.mouseDelta.x * sensitivity;
                GameState.player.rotation.pitch += this.mouseDelta.y * sensitivity;
                
                // 피치 제한 (-90도 ~ 90도)
                GameState.player.rotation.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, GameState.player.rotation.pitch));
            }
        }
        
        this.triggerCallbacks('onMouseMove', { 
            x: this.mousePosition.x, 
            y: this.mousePosition.y,
            deltaX: this.mouseDelta.x,
            deltaY: this.mouseDelta.y,
            event: event 
        });
    }
    
    handleMouseWheel(event) {
        this.wheelDelta = event.deltaY * INPUT_CONFIG.MOUSE_WHEEL_SENSITIVITY;
        
        // 핫바 아이템 선택
        if (GameState && GameState.player && GameState.isRunning && !GameState.isPaused) {
            let newIndex = GameState.player.hotbarIndex;
            
            if (this.wheelDelta > 0) {
                newIndex = (newIndex + 1) % 9;
            } else if (this.wheelDelta < 0) {
                newIndex = (newIndex - 1 + 9) % 9;
            }
            
            GameState.player.hotbarIndex = newIndex;
            
            if (GameState.ui) {
                GameState.ui.updateHotbar();
            }
        }
        
        this.triggerCallbacks('onMouseWheel', { delta: this.wheelDelta, event: event });
        
        event.preventDefault();
    }
    
    handleContextMenu(event) {
        if (this.preventContextMenu) {
            event.preventDefault();
        }
    }
    
    /**
     * 게임 중 마우스 입력 처리
     */
    handleGameMouseDown(button, event) {
        if (!GameState.player || !GameState.world) return;
        
        const player = GameState.player;
        const world = GameState.world;
        
        // 레이캐스팅으로 대상 블록 찾기
        const eyePos = player.getEyePosition();
        const lookDir = player.getLookDirection();
        const raycast = world.raycast(eyePos, lookDir, PLAYER_CONFIG.REACH_DISTANCE);
        
        if (button === 0) { // 좌클릭 - 블록 파괴
            if (raycast.hit) {
                player.startMining(raycast.position.x, raycast.position.y, raycast.position.z);
            }
        } else if (button === 2) { // 우클릭 - 블록 설치
            event.preventDefault();
            
            if (raycast.hit) {
                // 블록을 설치할 위치 계산 (히트된 블록 옆)
                const placePos = this.calculatePlacePosition(raycast, lookDir);
                
                if (placePos) {
                    const currentItem = player.inventory[player.hotbarIndex];
                    if (currentItem && currentItem.type !== null) {
                        const success = player.placeBlock(world, placePos.x, placePos.y, placePos.z, currentItem.type);
                        
                        if (success && GameState.ui) {
                            GameState.ui.updateHotbar();
                        }
                    }
                }
            }
        }
    }
    
    handleGameMouseUp(button, event) {
        if (button === 0 && GameState.player) {
            // 마이닝 중지
            GameState.player.stopMining();
        }
    }
    
    /**
     * 블록 설치 위치 계산
     */
    calculatePlacePosition(raycast, lookDir) {
        const hitPos = raycast.position;
        
        // 가장 가까운 면을 찾아서 그 방향으로 블록 설치
        const directions = [
            { dir: [0, 1, 0], face: 'top' },
            { dir: [0, -1, 0], face: 'bottom' },
            { dir: [1, 0, 0], face: 'right' },
            { dir: [-1, 0, 0], face: 'left' },
            { dir: [0, 0, 1], face: 'front' },
            { dir: [0, 0, -1], face: 'back' }
        ];
        
        // 시선 방향과 가장 반대되는 면 선택
        let bestFace = null;
        let bestDot = -Infinity;
        
        for (const d of directions) {
            const dot = lookDir.x * d.dir[0] + lookDir.y * d.dir[1] + lookDir.z * d.dir[2];
            if (dot > bestDot) {
                bestDot = dot;
                bestFace = d;
            }
        }
        
        if (bestFace) {
            return {
                x: hitPos.x + bestFace.dir[0],
                y: hitPos.y + bestFace.dir[1],
                z: hitPos.z + bestFace.dir[2]
            };
        }
        
        return null;
    }
    
    /**
     * 포인터 락 처리
     */
    handlePointerLockChange() {
        this.isPointerLocked = (document.pointerLockElement !== null);
        
        if (!this.isPointerLocked && GameState && GameState.isRunning && !GameState.isPaused) {
            // 포인터 락이 해제되면 게임 일시정지
            if (typeof pauseGame === 'function') {
                pauseGame();
            }
        }
    }
    
    handlePointerLockError() {
        console.warn('포인터 락 요청 실패');
    }
    
    /**
     * 터치 이벤트 처리 (모바일 지원)
     */
    handleTouchStart(event) {
        event.preventDefault();
        
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            this.touches[touch.identifier] = {
                x: touch.clientX,
                y: touch.clientY,
                startTime: Date.now()
            };
            
            if (i === 0) {
                this.touchStartPos.x = touch.clientX;
                this.touchStartPos.y = touch.clientY;
            }
        }
    }
    
    handleTouchMove(event) {
        event.preventDefault();
        
        if (GameState && GameState.player && GameState.isRunning && !GameState.isPaused) {
            const touch = event.touches[0];
            if (touch && this.touches[touch.identifier]) {
                const startTouch = this.touches[touch.identifier];
                const deltaX = touch.clientX - startTouch.x;
                const deltaY = touch.clientY - startTouch.y;
                
                // 터치 이동을 마우스 이동으로 변환
                const sensitivity = 0.01;
                GameState.player.rotation.yaw += deltaX * sensitivity;
                GameState.player.rotation.pitch += deltaY * sensitivity;
                
                // 피치 제한
                GameState.player.rotation.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, GameState.player.rotation.pitch));
                
                // 터치 위치 업데이트
                this.touches[touch.identifier].x = touch.clientX;
                this.touches[touch.identifier].y = touch.clientY;
            }
        }
    }
    
    handleTouchEnd(event) {
        event.preventDefault();
        
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            const touchData = this.touches[touch.identifier];
            
            if (touchData) {
                const duration = Date.now() - touchData.startTime;
                const distance = Math.sqrt(
                    Math.pow(touch.clientX - touchData.x, 2) +
                    Math.pow(touch.clientY - touchData.y, 2)
                );
                
                // 짧은 탭으로 인식 (클릭과 동일하게 처리)
                if (duration < 300 && distance < 30) {
                    this.handleGameMouseDown(0, { clientX: touch.clientX, clientY: touch.clientY });
                }
                
                delete this.touches[touch.identifier];
            }
        }
    }
    
    /**
     * 윈도우 포커스 처리
     */
    handleWindowBlur() {
        // 모든 키 상태 초기화
        this.keys = {};
        this.mouseButtons = {};
        
        if (GameState && GameState.isRunning && !GameState.isPaused) {
            // 포커스를 잃으면 자동으로 일시정지
            if (typeof pauseGame === 'function') {
                pauseGame();
            }
        }
    }
    
    handleWindowFocus() {
        // 포커스를 다시 얻었을 때의 처리
    }
    
    /**
     * 입력 상태 업데이트
     */
    update() {
        // 이전 프레임 키 상태 저장
        this.previousKeys = { ...this.keys };
        
        // 마우스 델타 리셋
        if (!this.isPointerLocked) {
            this.mouseDelta.x = 0;
            this.mouseDelta.y = 0;
        }
        
        this.wheelDelta = 0;
        
        // 플레이어에게 키 상태 전달
        if (GameState && GameState.player) {
            GameState.player.keys = this.keys;
            GameState.player.mouseButtons = this.mouseButtons;
        }
    }
    
    /**
     * 키가 방금 눌렸는지 확인
     */
    isKeyPressed(keyCode) {
        return this.keys[keyCode] && !this.previousKeys[keyCode];
    }
    
    /**
     * 키가 현재 눌려있는지 확인
     */
    isKeyDown(keyCode) {
        return this.keys[keyCode] || false;
    }
    
    /**
     * 마우스 버튼이 현재 눌려있는지 확인
     */
    isMouseButtonDown(button) {
        return this.mouseButtons[button] || false;
    }
    
    /**
     * 콜백 등록
     */
    addEventListener(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }
    
    /**
     * 콜백 제거
     */
    removeEventListener(event, callback) {
        if (this.callbacks[event]) {
            const index = this.callbacks[event].indexOf(callback);
            if (index > -1) {
                this.callbacks[event].splice(index, 1);
            }
        }
    }
    
    /**
     * 콜백 트리거
     */
    triggerCallbacks(event, data) {
        if (this.callbacks[event]) {
            for (const callback of this.callbacks[event]) {
                callback(data);
            }
        }
    }
    
    /**
     * 입력 핸들러 정리
     */
    destroy() {
        // 모든 이벤트 리스너 제거
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        document.removeEventListener('mousedown', this.handleMouseDown);
        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('wheel', this.handleMouseWheel);
        document.removeEventListener('contextmenu', this.handleContextMenu);
        
        // 상태 초기화
        this.keys = {};
        this.mouseButtons = {};
        this.callbacks = {};
    }
}

// 전역으로 내보내기
window.InputHandler = InputHandler;
window.INPUT_CONFIG = INPUT_CONFIG;