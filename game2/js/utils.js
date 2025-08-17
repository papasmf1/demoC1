/**
 * Snake Game 유틸리티 함수들
 */

// 상수 정의
const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

const GAME_STATES = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    SETTINGS: 'settings'
};

const DIFFICULTY_SETTINGS = {
    easy: {
        speed: 200,
        gridSize: 20,
        scoreMultiplier: 1
    },
    medium: {
        speed: 150,
        gridSize: 25,
        scoreMultiplier: 2
    },
    hard: {
        speed: 100,
        gridSize: 30,
        scoreMultiplier: 3
    },
    expert: {
        speed: 80,
        gridSize: 35,
        scoreMultiplier: 5
    }
};

/**
 * 유틸리티 함수들
 */
const Utils = {
    /**
     * 두 점 사이의 거리 계산
     */
    distance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.sqrt(dx * dx + dy * dy);
    },

    /**
     * 두 위치가 같은지 확인
     */
    positionsEqual(pos1, pos2) {
        return pos1.x === pos2.x && pos1.y === pos2.y;
    },

    /**
     * 배열에서 랜덤 요소 선택
     */
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    /**
     * 범위 내 랜덤 정수 생성
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * 값을 범위 내로 제한
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    /**
     * 선형 보간
     */
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    },

    /**
     * 색상 보간 (RGB)
     */
    lerpColor(color1, color2, factor) {
        const r1 = parseInt(color1.substring(1, 3), 16);
        const g1 = parseInt(color1.substring(3, 5), 16);
        const b1 = parseInt(color1.substring(5, 7), 16);
        
        const r2 = parseInt(color2.substring(1, 3), 16);
        const g2 = parseInt(color2.substring(3, 5), 16);
        const b2 = parseInt(color2.substring(5, 7), 16);
        
        const r = Math.round(this.lerp(r1, r2, factor));
        const g = Math.round(this.lerp(g1, g2, factor));
        const b = Math.round(this.lerp(b1, b2, factor));
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    },

    /**
     * 색상을 밝게/어둡게 조정
     */
    adjustBrightness(color, factor) {
        const r = parseInt(color.substring(1, 3), 16);
        const g = parseInt(color.substring(3, 5), 16);
        const b = parseInt(color.substring(5, 7), 16);
        
        const newR = Math.round(Math.max(0, Math.min(255, r * factor)));
        const newG = Math.round(Math.max(0, Math.min(255, g * factor)));
        const newB = Math.round(Math.max(0, Math.min(255, b * factor)));
        
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    },

    /**
     * 디바운스 함수
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * 스로틀 함수
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * 로컬 스토리지에 데이터 저장
     */
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('저장 실패:', error);
            return false;
        }
    },

    /**
     * 로컬 스토리지에서 데이터 로드
     */
    loadFromStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('로드 실패:', error);
            return defaultValue;
        }
    },

    /**
     * 요소에 클래스 토글
     */
    toggleClass(element, className) {
        if (element.classList.contains(className)) {
            element.classList.remove(className);
            return false;
        } else {
            element.classList.add(className);
            return true;
        }
    },

    /**
     * 요소를 부드럽게 표시/숨김
     */
    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let start = null;
        function animate(timestamp) {
            if (!start) start = timestamp;
            const progress = (timestamp - start) / duration;
            
            if (progress < 1) {
                element.style.opacity = progress;
                requestAnimationFrame(animate);
            } else {
                element.style.opacity = '1';
            }
        }
        
        requestAnimationFrame(animate);
    },

    fadeOut(element, duration = 300) {
        let start = null;
        const initialOpacity = parseFloat(getComputedStyle(element).opacity);
        
        function animate(timestamp) {
            if (!start) start = timestamp;
            const progress = (timestamp - start) / duration;
            
            if (progress < 1) {
                element.style.opacity = initialOpacity * (1 - progress);
                requestAnimationFrame(animate);
            } else {
                element.style.opacity = '0';
                element.style.display = 'none';
            }
        }
        
        requestAnimationFrame(animate);
    },

    /**
     * 점수를 포맷팅
     */
    formatScore(score) {
        return score.toString().padStart(6, '0');
    },

    /**
     * 시간을 포맷팅
     */
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
        } else if (minutes > 0) {
            return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
        } else {
            return `${seconds}s`;
        }
    },

    /**
     * 모바일 디바이스 감지
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    /**
     * 터치 이벤트 지원 감지
     */
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },

    /**
     * 키 코드를 방향으로 변환
     */
    keyToDirection(keyCode) {
        switch (keyCode) {
            case 'ArrowUp':
            case 'KeyW':
                return DIRECTIONS.UP;
            case 'ArrowDown':
            case 'KeyS':
                return DIRECTIONS.DOWN;
            case 'ArrowLeft':
            case 'KeyA':
                return DIRECTIONS.LEFT;
            case 'ArrowRight':
            case 'KeyD':
                return DIRECTIONS.RIGHT;
            default:
                return null;
        }
    },

    /**
     * 방향이 반대인지 확인
     */
    areOppositeDirections(dir1, dir2) {
        return (dir1.x === -dir2.x && dir1.y === -dir2.y);
    },

    /**
     * 점수에 따른 레벨 계산
     */
    calculateLevel(score) {
        return Math.floor(score / 100) + 1;
    },

    /**
     * 레벨에 따른 속도 계산
     */
    calculateSpeed(baseSpeed, level) {
        const speedIncrease = Math.floor((level - 1) / 2) * 10;
        return Math.max(50, baseSpeed - speedIncrease);
    },

    /**
     * 효과음 재생 (Web Audio API)
     */
    playSound(frequency, duration, type = 'sine', volume = 0.1) {
        if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') {
            return; // 브라우저가 Web Audio API를 지원하지 않음
        }
        
        const audioContext = new (AudioContext || webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    },

    /**
     * 먹이 획득 사운드
     */
    playEatSound() {
        this.playSound(800, 0.1, 'square', 0.05);
    },

    /**
     * 게임 오버 사운드
     */
    playGameOverSound() {
        this.playSound(200, 0.5, 'sawtooth', 0.1);
        setTimeout(() => this.playSound(150, 0.5, 'sawtooth', 0.1), 200);
        setTimeout(() => this.playSound(100, 1, 'sawtooth', 0.1), 400);
    },

    /**
     * 레벨업 사운드
     */
    playLevelUpSound() {
        this.playSound(523, 0.2, 'sine', 0.05);
        setTimeout(() => this.playSound(659, 0.2, 'sine', 0.05), 200);
        setTimeout(() => this.playSound(784, 0.4, 'sine', 0.05), 400);
    }
};

/**
 * 벡터 연산 유틸리티
 */
const Vector2 = {
    /**
     * 벡터 생성
     */
    create(x, y) {
        return { x, y };
    },

    /**
     * 벡터 복사
     */
    copy(vector) {
        return { x: vector.x, y: vector.y };
    },

    /**
     * 벡터 덧셈
     */
    add(v1, v2) {
        return { x: v1.x + v2.x, y: v1.y + v2.y };
    },

    /**
     * 벡터 뺄셈
     */
    subtract(v1, v2) {
        return { x: v1.x - v2.x, y: v1.y - v2.y };
    },

    /**
     * 벡터 크기
     */
    magnitude(vector) {
        return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    },

    /**
     * 벡터 정규화
     */
    normalize(vector) {
        const mag = this.magnitude(vector);
        if (mag === 0) return { x: 0, y: 0 };
        return { x: vector.x / mag, y: vector.y / mag };
    }
};

// 전역으로 내보내기
window.DIRECTIONS = DIRECTIONS;
window.GAME_STATES = GAME_STATES;
window.DIFFICULTY_SETTINGS = DIFFICULTY_SETTINGS;
window.Utils = Utils;
window.Vector2 = Vector2;