/**
 * 유틸리티 함수들
 */

/**
 * 수학 유틸리티
 */
const MathUtils = {
    /**
     * 값을 범위 내로 제한
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },
    
    /**
     * 선형 보간
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    },
    
    /**
     * 도를 라디안으로 변환
     */
    degToRad(degrees) {
        return degrees * Math.PI / 180;
    },
    
    /**
     * 라디안을 도로 변환
     */
    radToDeg(radians) {
        return radians * 180 / Math.PI;
    },
    
    /**
     * 두 점 사이의 거리 계산
     */
    distance(x1, y1, z1, x2, y2, z2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dz = z2 - z1;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    },
    
    /**
     * 벡터 정규화
     */
    normalize(x, y, z) {
        const length = Math.sqrt(x * x + y * y + z * z);
        if (length === 0) return { x: 0, y: 0, z: 0 };
        return {
            x: x / length,
            y: y / length,
            z: z / length
        };
    },
    
    /**
     * 무작위 정수 생성
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    /**
     * 무작위 실수 생성
     */
    randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }
};

/**
 * 색상 유틸리티
 */
const ColorUtils = {
    /**
     * RGB를 HEX로 변환
     */
    rgbToHex(r, g, b) {
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },
    
    /**
     * HEX를 RGB로 변환
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },
    
    /**
     * 색상 보간
     */
    lerpColor(color1, color2, t) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        
        if (!c1 || !c2) return color1;
        
        const r = Math.round(MathUtils.lerp(c1.r, c2.r, t));
        const g = Math.round(MathUtils.lerp(c1.g, c2.g, t));
        const b = Math.round(MathUtils.lerp(c1.b, c2.b, t));
        
        return this.rgbToHex(r, g, b);
    }
};

/**
 * 배열 유틸리티
 */
const ArrayUtils = {
    /**
     * 배열 셔플
     */
    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },
    
    /**
     * 배열에서 무작위 요소 선택
     */
    randomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    },
    
    /**
     * 배열 청크 분할
     */
    chunk(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
};

/**
 * 시간 유틸리티
 */
const TimeUtils = {
    /**
     * 시간 포맷팅
     */
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
        }
    },
    
    /**
     * FPS 계산
     */
    calculateFPS(deltaTime) {
        return Math.round(1000 / deltaTime);
    }
};

/**
 * DOM 유틸리티
 */
const DOMUtils = {
    /**
     * 요소 생성
     */
    createElement(tag, className, parent) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (parent) parent.appendChild(element);
        return element;
    },
    
    /**
     * 요소 제거
     */
    removeElement(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    },
    
    /**
     * 클래스 토글
     */
    toggleClass(element, className) {
        if (element.classList.contains(className)) {
            element.classList.remove(className);
            return false;
        } else {
            element.classList.add(className);
            return true;
        }
    }
};

/**
 * 저장소 유틸리티
 */
const StorageUtils = {
    /**
     * 로컬 스토리지에 데이터 저장
     */
    save(key, data) {
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
    load(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('로드 실패:', error);
            return defaultValue;
        }
    },
    
    /**
     * 로컬 스토리지에서 데이터 제거
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('삭제 실패:', error);
            return false;
        }
    },
    
    /**
     * 로컬 스토리지 전체 정리
     */
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('정리 실패:', error);
            return false;
        }
    }
};

// 전역으로 내보내기
window.MathUtils = MathUtils;
window.ColorUtils = ColorUtils;
window.ArrayUtils = ArrayUtils;
window.TimeUtils = TimeUtils;
window.DOMUtils = DOMUtils;
window.StorageUtils = StorageUtils;