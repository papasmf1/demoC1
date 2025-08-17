/**
 * 설정 관리 클래스
 */

class SettingsManager {
    constructor() {
        this.elements = {
            // 설정 입력 요소들
            gridSize: document.getElementById('grid-size'),
            gameSpeed: document.getElementById('game-speed'),
            soundEffects: document.getElementById('sound-effects'),
            wallCollision: document.getElementById('wall-collision'),
            snakeColor: document.getElementById('snake-color'),
            foodColor: document.getElementById('food-color'),
            
            // 값 표시 요소들
            speedValue: document.getElementById('speed-value'),
            
            // 버튼들
            saveSettingsBtn: document.getElementById('save-settings-btn'),
            resetSettingsBtn: document.getElementById('reset-settings-btn'),
            closeSettingsBtn: document.getElementById('close-settings-btn')
        };
        
        // 기본 설정값
        this.defaultSettings = {
            gridSize: 25,
            gameSpeed: 120,
            soundEffects: true,
            wallCollision: true,
            snakeColor: '#4CAF50',
            foodColor: '#FF5722'
        };
        
        // 현재 설정
        this.currentSettings = { ...this.defaultSettings };
        
        this.initialize();
    }
    
    /**
     * 설정 관리자 초기화
     */
    initialize() {
        this.loadSettings();
        this.setupEventListeners();
        this.updateUI();
        
        console.log('⚙️ 설정 관리자 초기화 완료');
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 그리드 크기 변경
        if (this.elements.gridSize) {
            this.elements.gridSize.addEventListener('change', (e) => {
                this.currentSettings.gridSize = parseInt(e.target.value);
                this.onSettingChange('gridSize', this.currentSettings.gridSize);
            });
        }
        
        // 게임 속도 변경
        if (this.elements.gameSpeed) {
            this.elements.gameSpeed.addEventListener('input', (e) => {
                const speed = parseInt(e.target.value);
                this.currentSettings.gameSpeed = speed;
                this.updateSpeedDisplay(speed);
                this.onSettingChange('gameSpeed', speed);
            });
        }
        
        // 효과음 토글
        if (this.elements.soundEffects) {
            this.elements.soundEffects.addEventListener('change', (e) => {
                this.currentSettings.soundEffects = e.target.checked;
                this.onSettingChange('soundEffects', this.currentSettings.soundEffects);
            });
        }
        
        // 벽 충돌 토글
        if (this.elements.wallCollision) {
            this.elements.wallCollision.addEventListener('change', (e) => {
                this.currentSettings.wallCollision = e.target.checked;
                this.onSettingChange('wallCollision', this.currentSettings.wallCollision);
            });
        }
        
        // 뱀 색상 변경
        if (this.elements.snakeColor) {
            this.elements.snakeColor.addEventListener('change', (e) => {
                this.currentSettings.snakeColor = e.target.value;
                this.onSettingChange('snakeColor', this.currentSettings.snakeColor);
                this.previewColorChange('snake', e.target.value);
            });
        }
        
        // 음식 색상 변경
        if (this.elements.foodColor) {
            this.elements.foodColor.addEventListener('change', (e) => {
                this.currentSettings.foodColor = e.target.value;
                this.onSettingChange('foodColor', this.currentSettings.foodColor);
                this.previewColorChange('food', e.target.value);
            });
        }
        
        // 설정 저장 버튼
        if (this.elements.saveSettingsBtn) {
            this.elements.saveSettingsBtn.addEventListener('click', () => {
                this.saveSettings();
            });
        }
        
        // 설정 초기화 버튼
        if (this.elements.resetSettingsBtn) {
            this.elements.resetSettingsBtn.addEventListener('click', () => {
                this.resetToDefaults();
            });
        }
        
        // 설정 닫기 버튼
        if (this.elements.closeSettingsBtn) {
            this.elements.closeSettingsBtn.addEventListener('click', () => {
                this.closeSettings();
            });
        }
        
        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveSettings();
            }
        });
    }
    
    /**
     * 설정값을 UI에 반영
     */
    updateUI() {
        // 그리드 크기
        if (this.elements.gridSize) {
            this.elements.gridSize.value = this.currentSettings.gridSize;
        }
        
        // 게임 속도
        if (this.elements.gameSpeed) {
            this.elements.gameSpeed.value = this.currentSettings.gameSpeed;
            this.updateSpeedDisplay(this.currentSettings.gameSpeed);
        }
        
        // 효과음
        if (this.elements.soundEffects) {
            this.elements.soundEffects.checked = this.currentSettings.soundEffects;
        }
        
        // 벽 충돌
        if (this.elements.wallCollision) {
            this.elements.wallCollision.checked = this.currentSettings.wallCollision;
        }
        
        // 뱀 색상
        if (this.elements.snakeColor) {
            this.elements.snakeColor.value = this.currentSettings.snakeColor;
        }
        
        // 음식 색상
        if (this.elements.foodColor) {
            this.elements.foodColor.value = this.currentSettings.foodColor;
        }
    }
    
    /**
     * 속도 표시 업데이트
     */
    updateSpeedDisplay(speed) {
        if (this.elements.speedValue) {
            this.elements.speedValue.textContent = `${speed}ms`;
        }
    }
    
    /**
     * 설정 변경 시 호출
     */
    onSettingChange(settingName, value) {
        console.log(`설정 변경: ${settingName} = ${value}`);
        
        // 게임 인스턴스에 실시간으로 설정 적용
        if (window.gameInstance) {
            window.gameInstance.settings[settingName] = value;
            window.gameInstance.applySettings();
        }
        
        // 특별한 처리가 필요한 설정들
        switch (settingName) {
            case 'gridSize':
                this.onGridSizeChange(value);
                break;
            case 'gameSpeed':
                this.onGameSpeedChange(value);
                break;
            case 'soundEffects':
                this.testSoundEffects(value);
                break;
        }
    }
    
    /**
     * 그리드 크기 변경 처리
     */
    onGridSizeChange(gridSize) {
        if (window.gameInstance) {
            window.gameInstance.gridSize = gridSize;
            
            // 게임이 진행 중이 아닐 때만 즉시 적용
            if (window.gameInstance.state === GAME_STATES.MENU) {
                window.gameInstance.createGameObjects();
            } else {
                // 게임 중일 때는 경고 메시지
                this.showSettingWarning('그리드 크기 변경은 다음 게임부터 적용됩니다.');
            }
        }
    }
    
    /**
     * 게임 속도 변경 처리
     */
    onGameSpeedChange(speed) {
        if (window.gameInstance && window.gameInstance.snake) {
            window.gameInstance.snake.setSpeed(speed);
        }
    }
    
    /**
     * 효과음 테스트
     */
    testSoundEffects(enabled) {
        if (enabled) {
            // 테스트 사운드 재생
            Utils.playEatSound();
        }
    }
    
    /**
     * 색상 변경 미리보기
     */
    previewColorChange(type, color) {
        // 설정 화면에서 색상 미리보기 효과
        const preview = document.createElement('div');
        preview.className = `color-preview ${type}`;
        preview.style.backgroundColor = color;
        preview.style.position = 'fixed';
        preview.style.top = '10px';
        preview.style.right = '10px';
        preview.style.width = '50px';
        preview.style.height = '50px';
        preview.style.borderRadius = '50%';
        preview.style.zIndex = '9999';
        preview.style.border = '2px solid white';
        preview.style.boxShadow = '0 2px 10px rgba(0,0,0,0.5)';
        
        document.body.appendChild(preview);
        
        setTimeout(() => {
            document.body.removeChild(preview);
        }, 1000);
    }
    
    /**
     * 설정 저장
     */
    saveSettings() {
        const success = Utils.saveToStorage('snake-settings', this.currentSettings);
        
        if (success) {
            this.showSettingMessage('설정이 저장되었습니다!', 'success');
            
            // 게임 인스턴스 설정 업데이트
            if (window.gameInstance) {
                window.gameInstance.settings = { ...this.currentSettings };
                window.gameInstance.saveSettings();
            }
            
            // 버튼 애니메이션
            this.animateButton(this.elements.saveSettingsBtn);
            
        } else {
            this.showSettingMessage('설정 저장에 실패했습니다.', 'error');
        }
        
        console.log('💾 설정 저장:', this.currentSettings);
    }
    
    /**
     * 설정을 기본값으로 초기화
     */
    resetToDefaults() {
        if (confirm('모든 설정을 기본값으로 되돌리시겠습니까?')) {
            this.currentSettings = { ...this.defaultSettings };
            this.updateUI();
            
            // 게임 인스턴스에도 적용
            if (window.gameInstance) {
                window.gameInstance.settings = { ...this.currentSettings };
                window.gameInstance.applySettings();
            }
            
            this.showSettingMessage('설정이 기본값으로 초기화되었습니다.', 'info');
            
            // 버튼 애니메이션
            this.animateButton(this.elements.resetSettingsBtn);
            
            console.log('🔄 설정 초기화');
        }
    }
    
    /**
     * 설정 창 닫기
     */
    closeSettings() {
        // 저장되지 않은 변경사항이 있는지 확인
        const savedSettings = this.loadSettingsFromStorage();
        const hasUnsavedChanges = JSON.stringify(this.currentSettings) !== JSON.stringify(savedSettings);
        
        if (hasUnsavedChanges) {
            if (confirm('저장하지 않은 변경사항이 있습니다. 저장하시겠습니까?')) {
                this.saveSettings();
            }
        }
        
        // UI 관리자를 통해 메인 메뉴로 이동
        if (window.uiManager) {
            window.uiManager.showScreen('main-menu');
        }
    }
    
    /**
     * 로컬 스토리지에서 설정 로드
     */
    loadSettings() {
        const savedSettings = this.loadSettingsFromStorage();
        this.currentSettings = { ...this.defaultSettings, ...savedSettings };
        
        console.log('📂 설정 로드:', this.currentSettings);
    }
    
    /**
     * 스토리지에서 설정 데이터 가져오기
     */
    loadSettingsFromStorage() {
        return Utils.loadFromStorage('snake-settings', {});
    }
    
    /**
     * 설정 메시지 표시
     */
    showSettingMessage(message, type = 'info') {
        // 임시 메시지 요소 생성
        const messageElement = document.createElement('div');
        messageElement.className = `setting-message ${type}`;
        messageElement.textContent = message;
        messageElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            font-family: 'Press Start 2P', monospace;
            font-size: 10px;
            z-index: 10000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            animation: slideInFromTop 0.3s ease-out;
        `;
        
        document.body.appendChild(messageElement);
        
        setTimeout(() => {
            messageElement.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => {
                document.body.removeChild(messageElement);
            }, 300);
        }, 2000);
    }
    
    /**
     * 설정 경고 메시지 표시
     */
    showSettingWarning(message) {
        this.showSettingMessage(message, 'warning');
    }
    
    /**
     * 버튼 애니메이션
     */
    animateButton(button) {
        if (button) {
            button.style.transform = 'scale(0.95)';
            button.style.transition = 'transform 0.1s ease';
            
            setTimeout(() => {
                button.style.transform = 'scale(1)';
            }, 100);
        }
    }
    
    /**
     * 설정 유효성 검사
     */
    validateSettings() {
        const errors = [];
        
        // 그리드 크기 검사
        if (this.currentSettings.gridSize < 10 || this.currentSettings.gridSize > 50) {
            errors.push('그리드 크기는 10-50 사이여야 합니다.');
        }
        
        // 게임 속도 검사
        if (this.currentSettings.gameSpeed < 50 || this.currentSettings.gameSpeed > 500) {
            errors.push('게임 속도는 50-500ms 사이여야 합니다.');
        }
        
        // 색상 유효성 검사
        const colorRegex = /^#[0-9A-Fa-f]{6}$/;
        if (!colorRegex.test(this.currentSettings.snakeColor)) {
            errors.push('뱀 색상이 올바르지 않습니다.');
        }
        
        if (!colorRegex.test(this.currentSettings.foodColor)) {
            errors.push('음식 색상이 올바르지 않습니다.');
        }
        
        return errors;
    }
    
    /**
     * 설정 내보내기
     */
    exportSettings() {
        const settingsJson = JSON.stringify(this.currentSettings, null, 2);
        const blob = new Blob([settingsJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'snake-game-settings.json';
        link.click();
        
        URL.revokeObjectURL(url);
        
        console.log('📤 설정 내보내기 완료');
    }
    
    /**
     * 설정 가져오기
     */
    importSettings(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const importedSettings = JSON.parse(e.target.result);
                
                // 설정 유효성 검사
                if (this.isValidSettingsFormat(importedSettings)) {
                    this.currentSettings = { ...this.defaultSettings, ...importedSettings };
                    this.updateUI();
                    this.showSettingMessage('설정을 가져왔습니다!', 'success');
                    
                    console.log('📥 설정 가져오기 완료:', this.currentSettings);
                } else {
                    this.showSettingMessage('올바르지 않은 설정 파일입니다.', 'error');
                }
            } catch (error) {
                console.error('설정 가져오기 오류:', error);
                this.showSettingMessage('설정 파일을 읽을 수 없습니다.', 'error');
            }
        };
        
        reader.readAsText(file);
    }
    
    /**
     * 설정 형식 유효성 검사
     */
    isValidSettingsFormat(settings) {
        const requiredKeys = Object.keys(this.defaultSettings);
        return requiredKeys.every(key => settings.hasOwnProperty(key));
    }
    
    /**
     * 현재 설정값 반환
     */
    getCurrentSettings() {
        return { ...this.currentSettings };
    }
    
    /**
     * 특정 설정값 반환
     */
    getSetting(key) {
        return this.currentSettings[key];
    }
    
    /**
     * 특정 설정값 변경
     */
    setSetting(key, value) {
        if (this.currentSettings.hasOwnProperty(key)) {
            this.currentSettings[key] = value;
            this.onSettingChange(key, value);
            this.updateUI();
            return true;
        }
        return false;
    }
    
    /**
     * 정리
     */
    dispose() {
        console.log('🗑️ 설정 관리자 정리');
        this.saveSettings();
    }
}

// 전역으로 내보내기
window.SettingsManager = SettingsManager;