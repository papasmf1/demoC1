/**
 * 노이즈 생성 함수들 - 지형 생성용
 */

/**
 * 1D 노이즈 클래스
 */
class Noise1D {
    constructor(seed = Math.random()) {
        this.seed = seed;
    }
    
    /**
     * 간단한 해시 함수
     */
    hash(x) {
        x = Math.floor(x);
        x = (x << 13) ^ x;
        return (1.0 - ((x * (x * x * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824.0);
    }
    
    /**
     * 선형 보간 노이즈
     */
    noise(x) {
        const intX = Math.floor(x);
        const fracX = x - intX;
        
        const a = this.hash(intX);
        const b = this.hash(intX + 1);
        
        return MathUtils.lerp(a, b, fracX);
    }
    
    /**
     * 스무스 노이즈
     */
    smoothNoise(x) {
        return this.noise(x) / 2 + this.noise(x - 1) / 4 + this.noise(x + 1) / 4;
    }
}

/**
 * 2D 노이즈 클래스
 */
class Noise2D {
    constructor(seed = Math.random()) {
        this.seed = seed;
        this.permutation = this.generatePermutation();
    }
    
    /**
     * 순열 테이블 생성
     */
    generatePermutation() {
        const p = [];
        for (let i = 0; i < 256; i++) {
            p[i] = i;
        }
        
        // 시드 기반 셔플
        let seedValue = this.seed * 10000;
        for (let i = 255; i > 0; i--) {
            seedValue = (seedValue * 9301 + 49297) % 233280;
            const j = Math.floor((seedValue / 233280) * (i + 1));
            [p[i], p[j]] = [p[j], p[i]];
        }
        
        return p.concat(p); // 중복하여 512개 요소
    }
    
    /**
     * 그라디언트 함수
     */
    grad(hash, x, y) {
        const h = hash & 3;
        const u = h < 2 ? x : y;
        const v = h < 2 ? y : x;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }
    
    /**
     * 페이드 함수 (5차 다항식)
     */
    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    
    /**
     * 펄린 노이즈
     */
    perlin(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        
        x -= Math.floor(x);
        y -= Math.floor(y);
        
        const u = this.fade(x);
        const v = this.fade(y);
        
        const A = this.permutation[X] + Y;
        const AA = this.permutation[A];
        const AB = this.permutation[A + 1];
        const B = this.permutation[X + 1] + Y;
        const BA = this.permutation[B];
        const BB = this.permutation[B + 1];
        
        return MathUtils.lerp(
            MathUtils.lerp(
                this.grad(this.permutation[AA], x, y),
                this.grad(this.permutation[BA], x - 1, y),
                u
            ),
            MathUtils.lerp(
                this.grad(this.permutation[AB], x, y - 1),
                this.grad(this.permutation[BB], x - 1, y - 1),
                u
            ),
            v
        );
    }
    
    /**
     * 옥타브 노이즈 (프랙털 노이즈)
     */
    octaveNoise(x, y, octaves = 4, persistence = 0.5, scale = 0.01) {
        let value = 0;
        let amplitude = 1;
        let frequency = scale;
        let maxValue = 0;
        
        for (let i = 0; i < octaves; i++) {
            value += this.perlin(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= 2;
        }
        
        return value / maxValue;
    }
    
    /**
     * 터뷸런스 (절댓값 노이즈)
     */
    turbulence(x, y, octaves = 4, scale = 0.01) {
        let value = 0;
        let amplitude = 1;
        let frequency = scale;
        let maxValue = 0;
        
        for (let i = 0; i < octaves; i++) {
            value += Math.abs(this.perlin(x * frequency, y * frequency)) * amplitude;
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }
        
        return value / maxValue;
    }
    
    /**
     * 리지드 노이즈 (산맥 형태)
     */
    ridgedNoise(x, y, octaves = 4, scale = 0.01) {
        let value = 0;
        let amplitude = 1;
        let frequency = scale;
        let maxValue = 0;
        
        for (let i = 0; i < octaves; i++) {
            const n = 1 - Math.abs(this.perlin(x * frequency, y * frequency));
            value += n * n * amplitude;
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }
        
        return value / maxValue;
    }
}

/**
 * 간단한 노이즈 함수들
 */
const NoiseUtils = {
    /**
     * 간단한 사인파 노이즈
     */
    sineNoise(x, y, frequency = 0.1, amplitude = 1) {
        return Math.sin(x * frequency) * Math.cos(y * frequency) * amplitude;
    },
    
    /**
     * 간단한 해시 노이즈
     */
    hashNoise(x, y) {
        let n = Math.floor(x) * 73856093 ^ Math.floor(y) * 19349663;
        n = (n << 13) ^ n;
        return (1.0 - ((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824.0);
    },
    
    /**
     * 보로노이 노이즈 (단순화된 버전)
     */
    voronoiNoise(x, y, scale = 10) {
        const cellX = Math.floor(x / scale);
        const cellY = Math.floor(y / scale);
        
        let minDistance = Infinity;
        
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const neighborX = cellX + dx;
                const neighborY = cellY + dy;
                
                // 셀 중심점 계산
                const centerX = (neighborX + 0.5 + this.hashNoise(neighborX, neighborY) * 0.5) * scale;
                const centerY = (neighborY + 0.5 + this.hashNoise(neighborY, neighborX) * 0.5) * scale;
                
                const distance = MathUtils.distance(x, y, 0, centerX, centerY, 0);
                minDistance = Math.min(minDistance, distance);
            }
        }
        
        return 1.0 - MathUtils.clamp(minDistance / scale, 0, 1);
    },
    
    /**
     * 워리 노이즈 (물결 패턴)
     */
    worleyNoise(x, y, scale = 10) {
        const cellX = Math.floor(x / scale);
        const cellY = Math.floor(y / scale);
        
        const distances = [];
        
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const neighborX = cellX + dx;
                const neighborY = cellY + dy;
                
                const centerX = (neighborX + 0.5 + this.hashNoise(neighborX, neighborY) * 0.5) * scale;
                const centerY = (neighborY + 0.5 + this.hashNoise(neighborY, neighborX) * 0.5) * scale;
                
                const distance = MathUtils.distance(x, y, 0, centerX, centerY, 0);
                distances.push(distance);
            }
        }
        
        distances.sort((a, b) => a - b);
        
        // 두 번째로 가까운 점과의 거리 차이
        return MathUtils.clamp((distances[1] - distances[0]) / scale, 0, 1);
    }
};

/**
 * 지형 생성 전용 노이즈 프리셋
 */
const TerrainNoise = {
    /**
     * 높이맵 생성
     */
    generateHeightmap(x, z, seed = 0) {
        const noise = new Noise2D(seed);
        
        // 기본 지형 높이
        let height = noise.octaveNoise(x, z, 4, 0.5, 0.01) * 20;
        
        // 언덕 추가
        height += noise.octaveNoise(x, z, 3, 0.3, 0.005) * 10;
        
        // 세밀한 변화
        height += noise.octaveNoise(x, z, 6, 0.7, 0.02) * 3;
        
        return height + 32; // 기본 해수면 높이
    },
    
    /**
     * 바이옴 맵 생성
     */
    generateBiomeMap(x, z, seed = 0) {
        const noise = new Noise2D(seed + 1000);
        
        const temperature = noise.octaveNoise(x, z, 3, 0.5, 0.003);
        const humidity = noise.octaveNoise(x + 1000, z + 1000, 3, 0.5, 0.003);
        
        // 간단한 바이옴 분류
        if (temperature < -0.3) {
            return 'snow'; // 눈 바이옴
        } else if (temperature > 0.3 && humidity < -0.2) {
            return 'desert'; // 사막 바이옴
        } else if (humidity < -0.3) {
            return 'plains'; // 평원 바이옴
        } else {
            return 'forest'; // 숲 바이옴
        }
    },
    
    /**
     * 동굴 생성
     */
    generateCaves(x, y, z, seed = 0) {
        const noise = new Noise2D(seed + 2000);
        
        // 3D 노이즈 시뮬레이션 (2D 노이즈를 Y축으로 변조)
        const caveNoise1 = noise.octaveNoise(x, z + y * 0.5, 6, 0.6, 0.02);
        const caveNoise2 = noise.octaveNoise(x + y * 0.3, z, 6, 0.6, 0.02);
        
        const caveValue = (caveNoise1 + caveNoise2) / 2;
        
        // 높이에 따른 동굴 확률 조정
        let caveThreshold = -0.2;
        if (y < 20) {
            caveThreshold -= 0.1; // 낮은 곳에 더 많은 동굴
        }
        
        return caveValue < caveThreshold;
    },
    
    /**
     * 광석 분포 생성
     */
    generateOreDistribution(x, y, z, oreType, seed = 0) {
        const noise = new Noise2D(seed + oreType * 100);
        
        let oreChance = 0;
        let heightMultiplier = 1;
        
        // 광석별 깊이 설정
        switch (oreType) {
            case 'coal':
                if (y > 48) return false;
                oreChance = 0.15;
                break;
            case 'iron':
                if (y > 32) return false;
                oreChance = 0.12;
                heightMultiplier = (32 - y) / 32;
                break;
            case 'gold':
                if (y > 16) return false;
                oreChance = 0.08;
                heightMultiplier = (16 - y) / 16;
                break;
            case 'diamond':
                if (y > 12) return false;
                oreChance = 0.05;
                heightMultiplier = (12 - y) / 12;
                break;
        }
        
        const oreNoise = noise.octaveNoise(x, z + y, 4, 0.5, 0.05);
        return oreNoise * heightMultiplier > (1 - oreChance);
    }
};

// 전역으로 내보내기
window.Noise1D = Noise1D;
window.Noise2D = Noise2D;
window.NoiseUtils = NoiseUtils;
window.TerrainNoise = TerrainNoise;