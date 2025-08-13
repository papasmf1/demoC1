/**
 * UI 관리 시스템
 */

/**
 * UI 관리자 클래스
 */
class UI {
    constructor() {
        // UI 요소들
        this.elements = {
            hotbar: document.getElementById('hotbar'),
            inventory: document.getElementById('inventory-screen'),
            chat: document.getElementById('chat-container'),
            statusInfo: document.getElementById('status-info'),
            debugInfo: document.getElementById('debug-info'),
            notifications: document.getElementById('notifications'),
            healthBar: document.getElementById('health-hunger'),
            crosshair: document.getElementById('crosshair')
        };
        
        // 상태
        this.inventoryOpen = false;
        this.chatOpen = false;
        this.debugVisible = false;
        
        // 알림 시스템
        this.notifications = [];
        this.notificationId = 0;
        
        // 업데이트 인터벌
        this.updateInterval = null;
        
        // 초기화
        this.initialize();
    }
    
    /**
     * UI 초기화
     */
    initialize() {
        this.setupHotbar();
        this.setupInventory();
        this.setupChat();
        this.setupEventListeners();
        
        // 초기 UI 상태 설정
        this.hideInventory();
        this.hideChat();
        this.hideDebugInfo();
    }
    
    /**
     * 핫바 설정
     */
    setupHotbar() {
        if (!this.elements.hotbar) return;
        
        // 핫바 슬롯 클릭 이벤트
        const slots = this.elements.hotbar.querySelectorAll('.hotbar-slot');
        slots.forEach((slot, index) => {
            slot.addEventListener('click', () => {
                if (GameState.player) {
                    GameState.player.hotbarIndex = index;
                    this.updateHotbar();
                }
            });
        });
    }
    
    /**
     * 인벤토리 설정
     */
    setupInventory() {
        if (!this.elements.inventory) return;
        
        // 인벤토리 닫기 버튼
        const closeBtn = this.elements.inventory.querySelector('.close-inventory-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideInventory());
        }
        
        // 배경 클릭으로 닫기
        this.elements.inventory.addEventListener('click', (e) => {
            if (e.target === this.elements.inventory) {
                this.hideInventory();
            }
        });
    }
    
    /**
     * 채팅 설정
     */
    setupChat() {
        if (!this.elements.chat) return;
        
        const chatInput = this.elements.chat.querySelector('#chat-input');
        if (chatInput) {
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.sendChatMessage(chatInput.value);
                    chatInput.value = '';
                    this.hideChat();
                } else if (e.key === 'Escape') {
                    this.hideChat();
                }
            });
        }
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 키보드 이벤트는 InputHandler에서 처리
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyE' && GameState.isRunning && !GameState.isPaused) {
                this.toggleInventory();
            }
        });
    }
    
    /**
     * UI 업데이트 시작
     */
    startUpdates() {
        this.updateInterval = setInterval(() => {
            this.updateUI();
        }, 100); // 100ms마다 업데이트
    }
    
    /**
     * UI 업데이트 중지
     */
    stopUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    
    /**
     * UI 전체 업데이트
     */
    updateUI() {
        if (!GameState.player) return;
        
        this.updateHotbar();
        this.updateStatusInfo();
        this.updateHealthHunger();
        
        if (this.debugVisible) {
            this.updateDebugInfo();
        }
    }
    
    /**
     * 핫바 업데이트
     */
    updateHotbar() {
        if (!this.elements.hotbar || !GameState.player) return;
        
        const slots = this.elements.hotbar.querySelectorAll('.hotbar-slot');
        const inventory = GameState.player.inventory;
        const activeIndex = GameState.player.hotbarIndex;
        
        slots.forEach((slot, index) => {
            // 활성 슬롯 표시
            if (index === activeIndex) {
                slot.classList.add('active');
            } else {
                slot.classList.remove('active');
            }
            
            // 아이템 정보 업데이트
            const item = inventory[index];
            const icon = slot.querySelector('.item-icon');
            const count = slot.querySelector('.item-count');
            
            if (item && item.type !== null) {
                if (icon) {
                    icon.style.display = 'block';
                    // 아이템 아이콘은 CSS에서 처리 (텍스처 없으므로 색상으로 대체)
                    icon.style.backgroundColor = this.getBlockColor(item.type);
                }
                if (count) {
                    count.textContent = item.count > 1 ? item.count : '';
                    count.style.display = item.count > 1 ? 'block' : 'none';
                }
            } else {
                if (icon) icon.style.display = 'none';
                if (count) count.style.display = 'none';
            }
        });
    }
    
    /**
     * 상태 정보 업데이트
     */
    updateStatusInfo() {
        if (!this.elements.statusInfo || !GameState.player || !GameState.settings.showCoords) {
            if (this.elements.statusInfo) {
                this.elements.statusInfo.style.display = 'none';
            }
            return;
        }
        
        this.elements.statusInfo.style.display = 'block';
        
        const player = GameState.player;
        const pos = player.position;
        const rot = player.rotation;
        
        this.elements.statusInfo.innerHTML = `
            <div>위치: X: ${pos.x.toFixed(1)}, Y: ${pos.y.toFixed(1)}, Z: ${pos.z.toFixed(1)}</div>
            <div>방향: ${this.getDirectionName(rot.yaw)} (${(rot.yaw * 180 / Math.PI).toFixed(1)}°)</div>
            <div>게임 모드: ${player.gameMode}</div>
        `;
    }
    
    /**
     * 체력/허기 바 업데이트
     */
    updateHealthHunger() {
        if (!this.elements.healthBar || !GameState.player) return;
        
        const player = GameState.player;
        const heartsContainer = this.elements.healthBar.querySelector('.hearts');
        const hungerContainer = this.elements.healthBar.querySelector('.hunger');
        
        if (heartsContainer) {
            this.updateHearts(heartsContainer, player.health, PLAYER_CONFIG.MAX_HEALTH);
        }
        
        if (hungerContainer) {
            this.updateHunger(hungerContainer, player.hunger, PLAYER_CONFIG.MAX_HUNGER);
        }
    }
    
    /**
     * 하트 업데이트
     */
    updateHearts(container, health, maxHealth) {
        const heartCount = Math.ceil(maxHealth / 2);
        container.innerHTML = '';
        
        for (let i = 0; i < heartCount; i++) {
            const heart = document.createElement('span');
            heart.className = 'heart';
            
            const heartValue = (i + 1) * 2;
            if (health >= heartValue) {
                heart.classList.add('full');
                heart.textContent = '♥';
            } else if (health >= heartValue - 1) {
                heart.classList.add('half');
                heart.textContent = '♥';
            } else {
                heart.classList.add('empty');
                heart.textContent = '♡';
            }
            
            container.appendChild(heart);
        }
    }
    
    /**
     * 허기 바 업데이트
     */
    updateHunger(container, hunger, maxHunger) {
        const drumstickCount = Math.ceil(maxHunger / 2);
        container.innerHTML = '';
        
        for (let i = 0; i < drumstickCount; i++) {
            const drumstick = document.createElement('span');
            drumstick.className = 'drumstick';
            
            const hungerValue = (i + 1) * 2;
            if (hunger >= hungerValue - 0.5) {
                drumstick.classList.add('full');
                drumstick.textContent = '🍖';
            } else {
                drumstick.classList.add('empty');
                drumstick.textContent = '🍖';
            }
            
            container.appendChild(drumstick);
        }
    }
    
    /**
     * 디버그 정보 업데이트
     */
    updateDebugInfo() {
        if (!this.elements.debugInfo || !GameState.player || !GameState.world) return;
        
        const player = GameState.player;
        const world = GameState.world;
        const pos = player.position;
        
        // FPS 계산
        const fps = this.calculateFPS();
        
        this.elements.debugInfo.innerHTML = `
            <div class="debug-line">FPS: ${fps}</div>
            <div class="debug-line">위치: ${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}</div>
            <div class="debug-line">청크: ${Math.floor(pos.x / 16)}, ${Math.floor(pos.z / 16)}</div>
            <div class="debug-line">로드된 청크: ${world.chunks.size}</div>
            <div class="debug-line">체력: ${player.health.toFixed(1)}/${PLAYER_CONFIG.MAX_HEALTH}</div>
            <div class="debug-line">허기: ${player.hunger.toFixed(1)}/${PLAYER_CONFIG.MAX_HUNGER}</div>
            <div class="debug-line">땅에 서있음: ${player.onGround ? 'Yes' : 'No'}</div>
            <div class="debug-line">물 속: ${player.inWater ? 'Yes' : 'No'}</div>
        `;
    }
    
    /**
     * 인벤토리 토글
     */
    toggleInventory() {
        if (this.inventoryOpen) {
            this.hideInventory();
        } else {
            this.showInventory();
        }
    }
    
    /**
     * 인벤토리 표시
     */
    showInventory() {
        if (!this.elements.inventory) return;
        
        this.elements.inventory.classList.remove('hidden');
        this.inventoryOpen = true;
        
        // 포인터 락 해제
        document.exitPointerLock();
        
        // 인벤토리 내용 업데이트
        this.updateInventoryDisplay();
    }
    
    /**
     * 인벤토리 숨김
     */
    hideInventory() {
        if (!this.elements.inventory) return;
        
        this.elements.inventory.classList.add('hidden');
        this.inventoryOpen = false;
        
        // 게임 중이면 포인터 락 다시 요청
        if (GameState.isRunning && !GameState.isPaused) {
            setTimeout(() => {
                if (document.getElementById('world-canvas')) {
                    document.getElementById('world-canvas').requestPointerLock();
                }
            }, 100);
        }
    }
    
    /**
     * 인벤토리 디스플레이 업데이트
     */
    updateInventoryDisplay() {
        if (!GameState.player) return;
        
        const inventoryGrid = this.elements.inventory?.querySelector('.inventory-grid');
        if (!inventoryGrid) return;
        
        inventoryGrid.innerHTML = '';
        
        for (let i = 0; i < 36; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.slot = i;
            
            const item = GameState.player.inventory[i];
            if (item && item.type !== null) {
                const icon = document.createElement('div');
                icon.className = 'item-icon';
                icon.style.backgroundColor = this.getBlockColor(item.type);
                icon.style.width = '20px';
                icon.style.height = '20px';
                slot.appendChild(icon);
                
                if (item.count > 1) {
                    const count = document.createElement('span');
                    count.className = 'item-count';
                    count.textContent = item.count;
                    slot.appendChild(count);
                }
            }
            
            inventoryGrid.appendChild(slot);
        }
    }
    
    /**
     * 채팅 열기
     */
    openChat() {
        if (!this.elements.chat) return;
        
        this.chatOpen = true;
        const chatInput = this.elements.chat.querySelector('#chat-input');
        if (chatInput) {
            chatInput.style.display = 'block';
            chatInput.focus();
        }
        
        // 포인터 락 해제
        document.exitPointerLock();
    }
    
    /**
     * 채팅 숨김
     */
    hideChat() {
        if (!this.elements.chat) return;
        
        this.chatOpen = false;
        const chatInput = this.elements.chat.querySelector('#chat-input');
        if (chatInput) {
            chatInput.style.display = 'none';
            chatInput.blur();
        }
        
        // 게임 중이면 포인터 락 다시 요청
        if (GameState.isRunning && !GameState.isPaused) {
            setTimeout(() => {
                if (document.getElementById('world-canvas')) {
                    document.getElementById('world-canvas').requestPointerLock();
                }
            }, 100);
        }
    }
    
    /**
     * 채팅 메시지 전송
     */
    sendChatMessage(message) {
        if (!message.trim()) return;
        
        this.addChatMessage('player', message);
        
        // 간단한 명령어 처리
        if (message.startsWith('/')) {
            this.handleCommand(message);
        }
    }
    
    /**
     * 채팅 메시지 추가
     */
    addChatMessage(type, message) {
        const chatMessages = this.elements.chat?.querySelector('#chat-messages');
        if (!chatMessages) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${type}`;
        messageElement.textContent = message;
        
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // 메시지가 너무 많으면 오래된 것 제거
        while (chatMessages.children.length > 100) {
            chatMessages.removeChild(chatMessages.firstChild);
        }
    }
    
    /**
     * 간단한 명령어 처리
     */
    handleCommand(command) {
        const parts = command.slice(1).split(' ');
        const cmd = parts[0].toLowerCase();
        
        switch (cmd) {
            case 'gamemode':
                if (parts[1] && GameState.player) {
                    const mode = parts[1].toLowerCase();
                    if (mode === 'creative' || mode === 'survival') {
                        GameState.player.gameMode = mode;
                        this.addChatMessage('system', `게임 모드를 ${mode}으로 변경했습니다.`);
                    }
                }
                break;
                
            case 'give':
                if (parts[1] && parts[2] && GameState.player) {
                    const blockName = parts[1];
                    const count = parseInt(parts[2]) || 1;
                    const blockType = this.getBlockTypeByName(blockName);
                    
                    if (blockType !== null) {
                        GameState.player.addToInventory(blockType, count);
                        this.addChatMessage('system', `${blockName} ${count}개를 지급했습니다.`);
                    }
                }
                break;
                
            case 'tp':
                if (parts.length >= 4 && GameState.player) {
                    const x = parseFloat(parts[1]);
                    const y = parseFloat(parts[2]);
                    const z = parseFloat(parts[3]);
                    
                    if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
                        GameState.player.setPosition(x, y, z);
                        this.addChatMessage('system', `위치 (${x}, ${y}, ${z})로 이동했습니다.`);
                    }
                }
                break;
                
            default:
                this.addChatMessage('system', `알 수 없는 명령어: ${cmd}`);
        }
    }
    
    /**
     * 디버그 정보 토글
     */
    toggleDebugInfo() {
        if (this.debugVisible) {
            this.hideDebugInfo();
        } else {
            this.showDebugInfo();
        }
    }
    
    /**
     * 디버그 정보 표시
     */
    showDebugInfo() {
        if (this.elements.debugInfo) {
            this.elements.debugInfo.classList.remove('hidden');
            this.debugVisible = true;
        }
    }
    
    /**
     * 디버그 정보 숨김
     */
    hideDebugInfo() {
        if (this.elements.debugInfo) {
            this.elements.debugInfo.classList.add('hidden');
            this.debugVisible = false;
        }
    }
    
    /**
     * 알림 표시
     */
    showNotification(message, type = 'info', duration = 3000) {
        const notification = {
            id: this.notificationId++,
            message,
            type,
            element: null
        };
        
        // 알림 요소 생성
        const element = document.createElement('div');
        element.className = `notification ${type}`;
        element.textContent = message;
        notification.element = element;
        
        // 알림 컨테이너에 추가
        const container = this.elements.notifications || document.getElementById('notifications');
        if (container) {
            container.appendChild(element);
        }
        
        // 자동 제거
        setTimeout(() => {
            this.hideNotification(notification.id);
        }, duration);
        
        this.notifications.push(notification);
    }
    
    /**
     * 알림 숨김
     */
    hideNotification(id) {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index === -1) return;
        
        const notification = this.notifications[index];
        if (notification.element) {
            notification.element.classList.add('fade-out');
            setTimeout(() => {
                if (notification.element.parentNode) {
                    notification.element.parentNode.removeChild(notification.element);
                }
            }, 300);
        }
        
        this.notifications.splice(index, 1);
    }
    
    /**
     * 유틸리티 함수들
     */
    getBlockColor(blockType) {
        const colors = {
            [BlockType.GRASS]: '#7CB342',
            [BlockType.DIRT]: '#8D6E63',
            [BlockType.STONE]: '#757575',
            [BlockType.WOOD]: '#8D6E63',
            [BlockType.LEAVES]: '#4CAF50',
            [BlockType.SAND]: '#FFD54F',
            [BlockType.WATER]: '#2196F3',
            [BlockType.LAVA]: '#FF5722',
            [BlockType.COBBLESTONE]: '#616161',
            [BlockType.GLASS]: '#E0F7FA',
            [BlockType.COAL_ORE]: '#424242',
            [BlockType.IRON_ORE]: '#FFC107',
            [BlockType.GOLD_ORE]: '#FFD700',
            [BlockType.DIAMOND_ORE]: '#00BCD4',
            [BlockType.BEDROCK]: '#212121'
        };
        return colors[blockType] || '#808080';
    }
    
    getBlockTypeByName(name) {
        const names = {
            'grass': BlockType.GRASS,
            'dirt': BlockType.DIRT,
            'stone': BlockType.STONE,
            'wood': BlockType.WOOD,
            'leaves': BlockType.LEAVES,
            'sand': BlockType.SAND,
            'cobblestone': BlockType.COBBLESTONE,
            'glass': BlockType.GLASS
        };
        return names[name.toLowerCase()] || null;
    }
    
    getDirectionName(yaw) {
        const angle = ((yaw * 180 / Math.PI) % 360 + 360) % 360;
        
        if (angle < 22.5 || angle >= 337.5) return '북';
        if (angle < 67.5) return '북동';
        if (angle < 112.5) return '동';
        if (angle < 157.5) return '남동';
        if (angle < 202.5) return '남';
        if (angle < 247.5) return '남서';
        if (angle < 292.5) return '서';
        if (angle < 337.5) return '북서';
        return '북';
    }
    
    calculateFPS() {
        // 간단한 FPS 계산 (실제로는 GameState에서 관리)
        return GameState.fps || 60;
    }
    
    /**
     * UI 정리
     */
    destroy() {
        this.stopUpdates();
        this.notifications = [];
        this.notificationId = 0;
    }
}

// 전역으로 내보내기
window.UI = UI;