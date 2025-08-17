/**
 * Snake 클래스 - 뱀 게임의 핵심 객체
 */

class Snake {
    constructor(gridSize, canvasWidth, canvasHeight) {
        this.gridSize = gridSize;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.tileSize = canvasWidth / gridSize;
        
        // 뱀의 초기 위치 (중앙)
        const centerX = Math.floor(gridSize / 2);
        const centerY = Math.floor(gridSize / 2);
        
        // 뱀의 몸체 (머리부터 꼬리까지)
        this.body = [
            { x: centerX, y: centerY },
            { x: centerX - 1, y: centerY },
            { x: centerX - 2, y: centerY }
        ];
        
        // 이동 방향
        this.direction = DIRECTIONS.RIGHT;
        this.nextDirection = DIRECTIONS.RIGHT;
        
        // 뱀의 상태
        this.growing = false;
        this.speed = 150; // 기본 속도 (ms)
        
        // 렌더링 설정
        this.headColor = '#4CAF50';
        this.bodyColor = '#66BB6A';
        this.eyeColor = '#FFFFFF';
        
        // 애니메이션 설정
        this.animationTime = 0;
        this.smoothMovement = true;
        this.lastMoveTime = 0;
        this.interpolationFactor = 0;
        
        // 이전 위치 저장 (부드러운 움직임용)
        this.previousBody = this.body.map(segment => ({ ...segment }));
    }
    
    /**
     * 뱀 업데이트
     */
    update(deltaTime) {
        this.animationTime += deltaTime;
        
        // 방향 변경 처리
        if (!Utils.areOppositeDirections(this.direction, this.nextDirection)) {
            this.direction = this.nextDirection;
        }
        
        // 이동 시간 체크
        if (this.animationTime >= this.speed) {
            this.move();
            this.animationTime = 0;
            this.lastMoveTime = Date.now();
        }
        
        // 보간 계산 (부드러운 움직임)
        if (this.smoothMovement) {
            this.interpolationFactor = Math.min(1, this.animationTime / this.speed);
        }
    }
    
    /**
     * 뱀 이동
     */
    move() {
        // 이전 위치 저장
        this.previousBody = this.body.map(segment => ({ ...segment }));
        
        // 머리의 새로운 위치 계산
        const head = { ...this.body[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;
        
        // 새로운 머리 추가
        this.body.unshift(head);
        
        // 성장하지 않으면 꼬리 제거
        if (!this.growing) {
            this.body.pop();
        } else {
            this.growing = false;
        }
    }
    
    /**
     * 방향 변경
     */
    setDirection(newDirection) {
        // 현재 방향과 반대 방향으로는 움직일 수 없음
        if (!Utils.areOppositeDirections(this.direction, newDirection)) {
            this.nextDirection = newDirection;
        }
    }
    
    /**
     * 뱀 성장
     */
    grow() {
        this.growing = true;
    }
    
    /**
     * 자기 자신과 충돌 체크
     */
    checkSelfCollision() {
        const head = this.body[0];
        
        // 머리가 몸체의 다른 부분과 충돌하는지 확인
        for (let i = 1; i < this.body.length; i++) {
            if (Utils.positionsEqual(head, this.body[i])) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 벽 충돌 체크
     */
    checkWallCollision() {
        const head = this.body[0];
        
        return (
            head.x < 0 || 
            head.x >= this.gridSize || 
            head.y < 0 || 
            head.y >= this.gridSize
        );
    }
    
    /**
     * 특정 위치와 충돌 체크
     */
    checkCollisionAt(position) {
        return this.body.some(segment => 
            Utils.positionsEqual(segment, position)
        );
    }
    
    /**
     * 머리 위치 반환
     */
    getHead() {
        return { ...this.body[0] };
    }
    
    /**
     * 몸체 위치들 반환
     */
    getBody() {
        return [...this.body];
    }
    
    /**
     * 뱀 길이 반환
     */
    getLength() {
        return this.body.length;
    }
    
    /**
     * 속도 설정
     */
    setSpeed(speed) {
        this.speed = Math.max(50, Math.min(500, speed));
    }
    
    /**
     * 색상 설정
     */
    setColors(headColor, bodyColor) {
        this.headColor = headColor;
        this.bodyColor = bodyColor;
    }
    
    /**
     * 뱀 렌더링
     */
    render(ctx) {
        const tileSize = this.tileSize;
        
        // 몸체 렌더링 (꼬리부터 머리까지)
        for (let i = this.body.length - 1; i >= 0; i--) {
            const segment = this.body[i];
            const isHead = i === 0;
            
            let renderX = segment.x * tileSize;
            let renderY = segment.y * tileSize;
            
            // 부드러운 움직임 적용
            if (this.smoothMovement && this.previousBody[i]) {
                const prevSegment = this.previousBody[i];
                renderX = Utils.lerp(prevSegment.x * tileSize, segment.x * tileSize, this.interpolationFactor);
                renderY = Utils.lerp(prevSegment.y * tileSize, segment.y * tileSize, this.interpolationFactor);
            }
            
            // 세그먼트 색상 결정
            let segmentColor = this.bodyColor;
            if (isHead) {
                segmentColor = this.headColor;
            } else {
                // 몸체는 머리에서 꼬리로 갈수록 어두워짐
                const darknessFactor = 0.9 - (i / this.body.length) * 0.2;
                segmentColor = Utils.adjustBrightness(this.bodyColor, darknessFactor);
            }
            
            // 세그먼트 그리기
            this.drawSegment(ctx, renderX, renderY, tileSize, segmentColor, isHead);
            
            // 머리에 눈 그리기
            if (isHead) {
                this.drawEyes(ctx, renderX, renderY, tileSize);
            }
        }
        
        // 디버그 모드에서 그리드 표시
        if (window.DEBUG_MODE) {
            this.drawDebugInfo(ctx);
        }
    }
    
    /**
     * 세그먼트 그리기
     */
    drawSegment(ctx, x, y, size, color, isHead) {
        const padding = 1;
        const segmentSize = size - padding * 2;
        const cornerRadius = isHead ? segmentSize * 0.3 : segmentSize * 0.2;
        
        // 그림자 효과
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.drawRoundedRect(ctx, x + padding + 2, y + padding + 2, segmentSize, segmentSize, cornerRadius);
        
        // 메인 세그먼트
        ctx.fillStyle = color;
        this.drawRoundedRect(ctx, x + padding, y + padding, segmentSize, segmentSize, cornerRadius);
        
        // 하이라이트 효과
        if (isHead) {
            const highlightColor = Utils.adjustBrightness(color, 1.3);
            ctx.fillStyle = highlightColor;
            this.drawRoundedRect(ctx, x + padding + 2, y + padding + 2, segmentSize - 4, segmentSize * 0.3, cornerRadius);
        }
        
        // 테두리
        ctx.strokeStyle = Utils.adjustBrightness(color, 0.7);
        ctx.lineWidth = 1;
        this.strokeRoundedRect(ctx, x + padding, y + padding, segmentSize, segmentSize, cornerRadius);
    }
    
    /**
     * 눈 그리기
     */
    drawEyes(ctx, x, y, size) {
        const eyeSize = size * 0.15;
        const eyeOffset = size * 0.25;
        
        let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
        
        // 방향에 따른 눈 위치 계산
        switch (this.direction) {
            case DIRECTIONS.UP:
                leftEyeX = x + eyeOffset;
                leftEyeY = y + eyeOffset;
                rightEyeX = x + size - eyeOffset;
                rightEyeY = y + eyeOffset;
                break;
            case DIRECTIONS.DOWN:
                leftEyeX = x + eyeOffset;
                leftEyeY = y + size - eyeOffset;
                rightEyeX = x + size - eyeOffset;
                rightEyeY = y + size - eyeOffset;
                break;
            case DIRECTIONS.LEFT:
                leftEyeX = x + eyeOffset;
                leftEyeY = y + eyeOffset;
                rightEyeX = x + eyeOffset;
                rightEyeY = y + size - eyeOffset;
                break;
            case DIRECTIONS.RIGHT:
                leftEyeX = x + size - eyeOffset;
                leftEyeY = y + eyeOffset;
                rightEyeX = x + size - eyeOffset;
                rightEyeY = y + size - eyeOffset;
                break;
        }
        
        // 눈 그리기
        ctx.fillStyle = this.eyeColor;
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // 눈동자
        ctx.fillStyle = '#000000';
        const pupilSize = eyeSize * 0.6;
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, pupilSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, pupilSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * 둥근 사각형 그리기
     */
    drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, radius);
        ctx.fill();
    }
    
    /**
     * 둥근 사각형 테두리 그리기
     */
    strokeRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, radius);
        ctx.stroke();
    }
    
    /**
     * 디버그 정보 표시
     */
    drawDebugInfo(ctx) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        
        // 그리드 그리기
        for (let x = 0; x <= this.gridSize; x++) {
            ctx.beginPath();
            ctx.moveTo(x * this.tileSize, 0);
            ctx.lineTo(x * this.tileSize, this.canvasHeight);
            ctx.stroke();
        }
        
        for (let y = 0; y <= this.gridSize; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * this.tileSize);
            ctx.lineTo(this.canvasWidth, y * this.tileSize);
            ctx.stroke();
        }
        
        // 방향 표시
        const head = this.body[0];
        const centerX = (head.x + 0.5) * this.tileSize;
        const centerY = (head.y + 0.5) * this.tileSize;
        const arrowSize = this.tileSize * 0.3;
        
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + this.direction.x * arrowSize,
            centerY + this.direction.y * arrowSize
        );
        ctx.stroke();
    }
    
    /**
     * 뱀 초기화
     */
    reset() {
        const centerX = Math.floor(this.gridSize / 2);
        const centerY = Math.floor(this.gridSize / 2);
        
        this.body = [
            { x: centerX, y: centerY },
            { x: centerX - 1, y: centerY },
            { x: centerX - 2, y: centerY }
        ];
        
        this.direction = DIRECTIONS.RIGHT;
        this.nextDirection = DIRECTIONS.RIGHT;
        this.growing = false;
        this.animationTime = 0;
        this.interpolationFactor = 0;
        
        this.previousBody = this.body.map(segment => ({ ...segment }));
    }
    
    /**
     * 뱀 상태 직렬화
     */
    serialize() {
        return {
            body: this.body,
            direction: this.direction,
            nextDirection: this.nextDirection,
            growing: this.growing,
            speed: this.speed,
            headColor: this.headColor,
            bodyColor: this.bodyColor
        };
    }
    
    /**
     * 뱀 상태 복원
     */
    deserialize(data) {
        this.body = data.body || this.body;
        this.direction = data.direction || this.direction;
        this.nextDirection = data.nextDirection || this.nextDirection;
        this.growing = data.growing || false;
        this.speed = data.speed || this.speed;
        this.headColor = data.headColor || this.headColor;
        this.bodyColor = data.bodyColor || this.bodyColor;
        
        this.previousBody = this.body.map(segment => ({ ...segment }));
    }
}

// Canvas의 roundRect 메서드가 없는 경우를 위한 폴리필
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
    };
}

// 전역으로 내보내기
window.Snake = Snake;