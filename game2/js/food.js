/**
 * Food 클래스 - 뱀이 먹는 음식 객체
 */

class Food {
    constructor(gridSize, canvasWidth, canvasHeight) {
        this.gridSize = gridSize;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.tileSize = canvasWidth / gridSize;
        
        // 음식 위치
        this.position = { x: 0, y: 0 };
        this.type = 'normal';
        
        // 렌더링 설정
        this.color = '#FF5722';
        this.glowColor = '#FF8A65';
        
        // 애니메이션 설정
        this.animationTime = 0;
        this.pulseSpeed = 2; // 펄스 속도
        this.rotationSpeed = 1; // 회전 속도
        this.scale = 1;
        this.rotation = 0;
        
        // 특수 음식 설정
        this.specialFoodChance = 0.1; // 10% 확률
        this.specialFoodDuration = 10000; // 10초
        this.specialFoodTimer = 0;
        
        // 음식 타입별 설정
        this.foodTypes = {
            normal: {
                color: '#FF5722',
                glowColor: '#FF8A65',
                points: 10,
                symbol: '●',
                effect: null
            },
            apple: {
                color: '#F44336',
                glowColor: '#EF5350',
                points: 15,
                symbol: '🍎',
                effect: null
            },
            golden: {
                color: '#FFD700',
                glowColor: '#FFF176',
                points: 50,
                symbol: '⭐',
                effect: 'bonus'
            },
            speed: {
                color: '#2196F3',
                glowColor: '#64B5F6',
                points: 25,
                symbol: '⚡',
                effect: 'speed'
            },
            mega: {
                color: '#9C27B0',
                glowColor: '#BA68C8',
                points: 100,
                symbol: '💎',
                effect: 'mega'
            }
        };
        
        this.generateFood();
    }
    
    /**
     * 음식 업데이트
     */
    update(deltaTime) {
        this.animationTime += deltaTime;
        
        // 펄스 애니메이션
        this.scale = 1 + Math.sin(this.animationTime * this.pulseSpeed * 0.001) * 0.1;
        
        // 회전 애니메이션
        this.rotation = (this.animationTime * this.rotationSpeed * 0.001) % (Math.PI * 2);
        
        // 특수 음식 타이머
        if (this.type !== 'normal' && this.type !== 'apple') {
            this.specialFoodTimer -= deltaTime;
            if (this.specialFoodTimer <= 0) {
                this.type = 'normal';
                this.updateFoodProperties();
            }
        }
    }
    
    /**
     * 새로운 음식 생성
     */
    generateFood(snake = null) {
        // 음식 타입 결정
        this.determineType();
        this.updateFoodProperties();
        
        // 위치 생성 (뱀과 겹치지 않는 곳)
        this.generatePosition(snake);
        
        // 특수 음식인 경우 타이머 설정
        if (this.type !== 'normal' && this.type !== 'apple') {
            this.specialFoodTimer = this.specialFoodDuration;
        }
        
        // 애니메이션 초기화
        this.animationTime = 0;
        this.scale = 1;
        this.rotation = 0;
    }
    
    /**
     * 음식 타입 결정
     */
    determineType() {
        const random = Math.random();
        
        if (random < 0.05) { // 5% 확률
            this.type = 'mega';
        } else if (random < 0.1) { // 5% 확률
            this.type = 'golden';
        } else if (random < 0.15) { // 5% 확률
            this.type = 'speed';
        } else if (random < 0.4) { // 25% 확률
            this.type = 'apple';
        } else { // 60% 확률
            this.type = 'normal';
        }
    }
    
    /**
     * 음식 속성 업데이트
     */
    updateFoodProperties() {
        const foodData = this.foodTypes[this.type];
        this.color = foodData.color;
        this.glowColor = foodData.glowColor;
    }
    
    /**
     * 위치 생성
     */
    generatePosition(snake) {
        let attempts = 0;
        const maxAttempts = 100;
        
        do {
            this.position = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize)
            };
            attempts++;
        } while (snake && snake.checkCollisionAt(this.position) && attempts < maxAttempts);
        
        // 만약 최대 시도 후에도 위치를 찾지 못했다면 강제로 설정
        if (attempts >= maxAttempts) {
            let found = false;
            for (let y = 0; y < this.gridSize && !found; y++) {
                for (let x = 0; x < this.gridSize && !found; x++) {
                    const pos = { x, y };
                    if (!snake || !snake.checkCollisionAt(pos)) {
                        this.position = pos;
                        found = true;
                    }
                }
            }
        }
    }
    
    /**
     * 음식과 뱀의 충돌 체크
     */
    checkCollision(snake) {
        const head = snake.getHead();
        return Utils.positionsEqual(head, this.position);
    }
    
    /**
     * 음식을 먹었을 때의 효과 반환
     */
    getEatenEffect() {
        const foodData = this.foodTypes[this.type];
        return {
            points: foodData.points,
            effect: foodData.effect,
            type: this.type
        };
    }
    
    /**
     * 음식 렌더링
     */
    render(ctx) {
        const centerX = (this.position.x + 0.5) * this.tileSize;
        const centerY = (this.position.y + 0.5) * this.tileSize;
        const size = this.tileSize * 0.8 * this.scale;
        
        // 저장된 컨텍스트 상태
        ctx.save();
        
        // 중심점으로 이동 및 회전
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation);
        
        // 글로우 효과 (특수 음식에만)
        if (this.type !== 'normal') {
            this.drawGlow(ctx, size);
        }
        
        // 음식 타입에 따른 렌더링
        switch (this.type) {
            case 'normal':
                this.drawNormalFood(ctx, size);
                break;
            case 'apple':
                this.drawApple(ctx, size);
                break;
            case 'golden':
                this.drawGoldenFood(ctx, size);
                break;
            case 'speed':
                this.drawSpeedFood(ctx, size);
                break;
            case 'mega':
                this.drawMegaFood(ctx, size);
                break;
        }
        
        // 특수 음식 타이머 표시
        if (this.type !== 'normal' && this.type !== 'apple') {
            this.drawTimer(ctx, size);
        }
        
        // 상태 복원
        ctx.restore();
        
        // 파티클 효과 (특수 음식)
        if (this.type === 'mega' || this.type === 'golden') {
            this.drawParticles(ctx, centerX, centerY);
        }
    }
    
    /**
     * 글로우 효과 그리기
     */
    drawGlow(ctx, size) {
        const glowSize = size * 1.5;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize / 2);
        gradient.addColorStop(0, this.glowColor + '80'); // 반투명
        gradient.addColorStop(1, this.glowColor + '00'); // 완전 투명
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, glowSize / 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * 일반 음식 그리기
     */
    drawNormalFood(ctx, size) {
        const radius = size / 2;
        
        // 그림자
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(2, 2, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 메인 원
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 하이라이트
        ctx.fillStyle = Utils.adjustBrightness(this.color, 1.4);
        ctx.beginPath();
        ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * 사과 그리기
     */
    drawApple(ctx, size) {
        const radius = size / 2;
        
        // 사과 몸체
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 사과 줄기
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(-radius * 0.1, -radius, radius * 0.2, radius * 0.3);
        
        // 사과 잎
        ctx.fillStyle = '#66BB6A';
        ctx.beginPath();
        ctx.ellipse(radius * 0.2, -radius * 0.8, radius * 0.2, radius * 0.1, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        
        // 하이라이트
        ctx.fillStyle = Utils.adjustBrightness(this.color, 1.3);
        ctx.beginPath();
        ctx.arc(-radius * 0.2, -radius * 0.2, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * 황금 음식 그리기
     */
    drawGoldenFood(ctx, size) {
        const radius = size / 2;
        
        // 별 모양 그리기
        ctx.fillStyle = this.color;
        ctx.beginPath();
        
        const spikes = 5;
        const outerRadius = radius;
        const innerRadius = radius * 0.5;
        
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i / (spikes * 2)) * Math.PI * 2;
            const currentRadius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = Math.cos(angle) * currentRadius;
            const y = Math.sin(angle) * currentRadius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        ctx.fill();
        
        // 중앙 원
        ctx.fillStyle = Utils.adjustBrightness(this.color, 1.3);
        ctx.beginPath();
        ctx.arc(0, 0, innerRadius * 0.7, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * 스피드 음식 그리기
     */
    drawSpeedFood(ctx, size) {
        const radius = size / 2;
        
        // 번개 모양
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(-radius * 0.3, -radius);
        ctx.lineTo(radius * 0.2, -radius * 0.2);
        ctx.lineTo(-radius * 0.1, -radius * 0.2);
        ctx.lineTo(radius * 0.3, radius);
        ctx.lineTo(-radius * 0.2, radius * 0.2);
        ctx.lineTo(radius * 0.1, radius * 0.2);
        ctx.closePath();
        ctx.fill();
        
        // 글로우 효과
        ctx.strokeStyle = this.glowColor;
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    
    /**
     * 메가 음식 그리기
     */
    drawMegaFood(ctx, size) {
        const radius = size / 2;
        
        // 다이아몬드 모양
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -radius);
        ctx.lineTo(radius * 0.6, 0);
        ctx.lineTo(0, radius);
        ctx.lineTo(-radius * 0.6, 0);
        ctx.closePath();
        ctx.fill();
        
        // 내부 다이아몬드
        ctx.fillStyle = Utils.adjustBrightness(this.color, 1.5);
        ctx.beginPath();
        ctx.moveTo(0, -radius * 0.6);
        ctx.lineTo(radius * 0.3, 0);
        ctx.lineTo(0, radius * 0.6);
        ctx.lineTo(-radius * 0.3, 0);
        ctx.closePath();
        ctx.fill();
        
        // 빛나는 효과
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-radius * 0.2, -radius * 0.4);
        ctx.lineTo(radius * 0.2, -radius * 0.4);
        ctx.stroke();
    }
    
    /**
     * 타이머 표시
     */
    drawTimer(ctx, size) {
        if (this.specialFoodTimer <= 0) return;
        
        const progress = this.specialFoodTimer / this.specialFoodDuration;
        const radius = size / 2 + 5;
        
        // 타이머 원
        ctx.strokeStyle = progress > 0.3 ? '#4CAF50' : '#F44336';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, radius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
        ctx.stroke();
    }
    
    /**
     * 파티클 효과
     */
    drawParticles(ctx, centerX, centerY) {
        const particleCount = 6;
        const time = this.animationTime * 0.001;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2 + time;
            const distance = 30 + Math.sin(time * 2 + i) * 10;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            const alpha = (Math.sin(time * 3 + i) + 1) / 2;
            
            ctx.fillStyle = this.glowColor + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    /**
     * 특정 위치에 음식 설정
     */
    setPosition(x, y) {
        this.position = { x, y };
    }
    
    /**
     * 음식 위치 반환
     */
    getPosition() {
        return { ...this.position };
    }
    
    /**
     * 음식 타입 반환
     */
    getType() {
        return this.type;
    }
    
    /**
     * 특정 타입의 음식으로 변경
     */
    setType(type) {
        if (this.foodTypes[type]) {
            this.type = type;
            this.updateFoodProperties();
            
            if (type !== 'normal' && type !== 'apple') {
                this.specialFoodTimer = this.specialFoodDuration;
            }
        }
    }
    
    /**
     * 음식 상태 직렬화
     */
    serialize() {
        return {
            position: this.position,
            type: this.type,
            specialFoodTimer: this.specialFoodTimer,
            animationTime: this.animationTime
        };
    }
    
    /**
     * 음식 상태 복원
     */
    deserialize(data) {
        this.position = data.position || this.position;
        this.type = data.type || this.type;
        this.specialFoodTimer = data.specialFoodTimer || 0;
        this.animationTime = data.animationTime || 0;
        
        this.updateFoodProperties();
    }
}

// 전역으로 내보내기
window.Food = Food;