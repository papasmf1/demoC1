/**
 * 플레이어 시스템
 */

// 플레이어 설정
const PLAYER_CONFIG = {
    SPEED: 5, // 이동 속도
    JUMP_SPEED: 8, // 점프 속도
    GRAVITY: 20, // 중력 가속도
    HEIGHT: 1.8, // 플레이어 높이
    WIDTH: 0.6, // 플레이어 너비
    EYE_HEIGHT: 1.6, // 눈 높이
    REACH_DISTANCE: 5, // 블록 도달 거리
    MAX_HEALTH: 20, // 최대 체력
    MAX_HUNGER: 20, // 최대 허기
    CREATIVE_MODE: false // 크리에이티브 모드
};

/**
 * 플레이어 클래스
 */
class Player {
    constructor() {
        // 위치 및 회전
        this.position = { x: 0, y: 64, z: 0 };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.rotation = { yaw: 0, pitch: 0 }; // yaw: 좌우, pitch: 상하
        
        // 상태
        this.onGround = false;
        this.inWater = false;
        this.health = PLAYER_CONFIG.MAX_HEALTH;
        this.hunger = PLAYER_CONFIG.MAX_HUNGER;
        this.gameMode = PLAYER_CONFIG.CREATIVE_MODE ? 'creative' : 'survival';
        
        // 인벤토리
        this.inventory = new Array(36).fill(null); // 36개 슬롯
        this.hotbarIndex = 0; // 현재 선택된 핫바 인덱스
        
        // 마이닝
        this.miningBlock = null;
        this.miningProgress = 0;
        this.miningStartTime = 0;
        
        // 입력 상태
        this.keys = {};
        this.mouseButtons = {};
        
        // 카메라
        this.camera = {
            fov: 70,
            near: 0.1,
            far: 1000
        };
    }
    
    /**
     * 플레이어 업데이트
     */
    update(deltaTime, world) {
        this.handleInput(deltaTime);
        this.updatePhysics(deltaTime, world);
        this.updateMining(deltaTime, world);
        this.updateStatus(deltaTime);
        
        // 월드에 플레이어 위치 업데이트
        if (world) {
            world.playerPosition = { ...this.position };
        }
    }
    
    /**
     * 입력 처리
     */
    handleInput(deltaTime) {
        const speed = PLAYER_CONFIG.SPEED * deltaTime;
        let moveX = 0;
        let moveZ = 0;
        
        // 이동 입력
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            moveZ -= 1;
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            moveZ += 1;
        }
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            moveX -= 1;
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            moveX += 1;
        }
        
        // 점프
        if ((this.keys['Space']) && this.onGround) {
            this.velocity.y = PLAYER_CONFIG.JUMP_SPEED;
            this.onGround = false;
        }
        
        // 크리에이티브 모드에서 비행
        if (this.gameMode === 'creative') {
            if (this.keys['Space']) {
                this.velocity.y += speed * 2;
            }
            if (this.keys['ShiftLeft'] || this.keys['ShiftRight']) {
                this.velocity.y -= speed * 2;
            }
        }
        
        // 이동 벡터 정규화
        if (moveX !== 0 || moveZ !== 0) {
            const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
            moveX /= length;
            moveZ /= length;
            
            // 카메라 방향에 따른 이동
            const yaw = this.rotation.yaw;
            const cos = Math.cos(yaw);
            const sin = Math.sin(yaw);
            
            this.velocity.x = (moveX * cos - moveZ * sin) * speed;
            this.velocity.z = (moveX * sin + moveZ * cos) * speed;
        } else {
            // 마찰력 적용
            this.velocity.x *= 0.8;
            this.velocity.z *= 0.8;
        }
    }
    
    /**
     * 물리 엔진 업데이트
     */
    updatePhysics(deltaTime, world) {
        if (!world) return;
        
        // 중력 적용 (크리에이티브 모드가 아닐 때)
        if (this.gameMode !== 'creative') {
            this.velocity.y -= PLAYER_CONFIG.GRAVITY * deltaTime;
        }
        
        // 이동 적용
        const newPosition = {
            x: this.position.x + this.velocity.x * deltaTime,
            y: this.position.y + this.velocity.y * deltaTime,
            z: this.position.z + this.velocity.z * deltaTime
        };
        
        // 충돌 감지 및 처리
        this.handleCollisions(newPosition, world);
        
        // 물에 있는지 확인
        this.checkInWater(world);
        
        // 데미지 확인 (용암 등)
        this.checkEnvironmentalDamage(world);
    }
    
    /**
     * 충돌 감지 및 처리
     */
    handleCollisions(newPosition, world) {
        const width = PLAYER_CONFIG.WIDTH / 2;
        const height = PLAYER_CONFIG.HEIGHT;
        
        // X축 충돌 검사
        const testPositions = [
            { x: newPosition.x - width, z: this.position.z - width },
            { x: newPosition.x + width, z: this.position.z - width },
            { x: newPosition.x - width, z: this.position.z + width },
            { x: newPosition.x + width, z: this.position.z + width }
        ];
        
        let canMoveX = true;
        for (const testPos of testPositions) {
            for (let y = 0; y < height; y++) {
                const blockY = Math.floor(this.position.y + y);
                const blockType = world.getBlock(Math.floor(testPos.x), blockY, Math.floor(testPos.z));
                const blockData = BlockData[blockType];
                
                if (blockData && blockData.solid) {
                    canMoveX = false;
                    break;
                }
            }
            if (!canMoveX) break;
        }
        
        if (canMoveX) {
            this.position.x = newPosition.x;
        } else {
            this.velocity.x = 0;
        }
        
        // Z축 충돌 검사
        const testPositionsZ = [
            { x: this.position.x - width, z: newPosition.z - width },
            { x: this.position.x + width, z: newPosition.z - width },
            { x: this.position.x - width, z: newPosition.z + width },
            { x: this.position.x + width, z: newPosition.z + width }
        ];
        
        let canMoveZ = true;
        for (const testPos of testPositionsZ) {
            for (let y = 0; y < height; y++) {
                const blockY = Math.floor(this.position.y + y);
                const blockType = world.getBlock(Math.floor(testPos.x), blockY, Math.floor(testPos.z));
                const blockData = BlockData[blockType];
                
                if (blockData && blockData.solid) {
                    canMoveZ = false;
                    break;
                }
            }
            if (!canMoveZ) break;
        }
        
        if (canMoveZ) {
            this.position.z = newPosition.z;
        } else {
            this.velocity.z = 0;
        }
        
        // Y축 충돌 검사
        let canMoveY = true;
        this.onGround = false;
        
        if (this.velocity.y < 0) {
            // 아래로 이동할 때 (떨어질 때)
            const groundY = Math.floor(newPosition.y);
            for (const testPos of testPositions) {
                const blockType = world.getBlock(Math.floor(testPos.x), groundY, Math.floor(testPos.z));
                const blockData = BlockData[blockType];
                
                if (blockData && blockData.solid) {
                    canMoveY = false;
                    this.onGround = true;
                    this.velocity.y = 0;
                    // 정확한 위치로 조정
                    this.position.y = groundY + 1;
                    break;
                }
            }
        } else if (this.velocity.y > 0) {
            // 위로 이동할 때 (점프할 때)
            const ceilingY = Math.floor(newPosition.y + height);
            for (const testPos of testPositions) {
                const blockType = world.getBlock(Math.floor(testPos.x), ceilingY, Math.floor(testPos.z));
                const blockData = BlockData[blockType];
                
                if (blockData && blockData.solid) {
                    canMoveY = false;
                    this.velocity.y = 0;
                    break;
                }
            }
        }
        
        if (canMoveY && !this.onGround) {
            this.position.y = newPosition.y;
        }
        
        // 월드 경계 처리
        this.position.y = Math.max(0, Math.min(WORLD_CONFIG.MAX_HEIGHT - height, this.position.y));
    }
    
    /**
     * 물에 있는지 확인
     */
    checkInWater(world) {
        const eyeY = Math.floor(this.position.y + PLAYER_CONFIG.EYE_HEIGHT);
        const blockType = world.getBlock(Math.floor(this.position.x), eyeY, Math.floor(this.position.z));
        this.inWater = (blockType === BlockType.WATER);
        
        if (this.inWater) {
            // 물에서의 부력 효과
            this.velocity.y += 2 * PLAYER_CONFIG.GRAVITY * 0.016; // 부력
        }
    }
    
    /**
     * 환경 데미지 확인
     */
    checkEnvironmentalDamage(world) {
        const blockType = world.getBlock(
            Math.floor(this.position.x),
            Math.floor(this.position.y),
            Math.floor(this.position.z)
        );
        
        const blockData = BlockData[blockType];
        if (blockData && blockData.damage) {
            this.takeDamage(blockData.damage * 0.016); // 초당 데미지
        }
    }
    
    /**
     * 마이닝 업데이트
     */
    updateMining(deltaTime, world) {
        if (!this.miningBlock || !world) {
            this.miningProgress = 0;
            this.miningStartTime = 0;
            return;
        }
        
        const { x, y, z } = this.miningBlock;
        const blockType = world.getBlock(x, y, z);
        
        if (blockType === BlockType.AIR) {
            this.stopMining();
            return;
        }
        
        const block = new Block(blockType, x, y, z);
        const currentTool = this.getCurrentTool();
        const miningTime = block.getMiningTime(currentTool);
        
        if (miningTime === Infinity) {
            // 파괴 불가능한 블록
            this.stopMining();
            return;
        }
        
        this.miningProgress += deltaTime / miningTime;
        
        if (this.miningProgress >= 1.0) {
            // 블록 파괴 완료
            this.breakBlock(world, x, y, z, block);
            this.stopMining();
        }
    }
    
    /**
     * 블록 파괴
     */
    breakBlock(world, x, y, z, block) {
        // 블록 제거
        world.setBlock(x, y, z, BlockType.AIR);
        
        // 드롭 아이템 수집 (서바이벌 모드에서만)
        if (this.gameMode === 'survival') {
            const drops = block.getDrops();
            for (const drop of drops) {
                this.addToInventory(drop.type, drop.count);
            }
        }
        
        // 파티클 효과 (나중에 구현)
        this.createBreakParticles(x, y, z, block);
    }
    
    /**
     * 블록 설치
     */
    placeBlock(world, x, y, z, blockType) {
        if (!world) return false;
        
        // 플레이어와 충돌하는지 확인
        const playerBounds = this.getBounds();
        const blockBounds = {
            minX: x, maxX: x + 1,
            minY: y, maxY: y + 1,
            minZ: z, maxZ: z + 1
        };
        
        if (this.boundsIntersect(playerBounds, blockBounds)) {
            return false; // 충돌하므로 설치 불가
        }
        
        // 블록 설치
        const success = world.setBlock(x, y, z, blockType);
        
        if (success && this.gameMode === 'survival') {
            // 인벤토리에서 아이템 제거
            this.removeFromInventory(blockType, 1);
        }
        
        return success;
    }
    
    /**
     * 플레이어 경계 박스 계산
     */
    getBounds() {
        const width = PLAYER_CONFIG.WIDTH / 2;
        const height = PLAYER_CONFIG.HEIGHT;
        
        return {
            minX: this.position.x - width,
            maxX: this.position.x + width,
            minY: this.position.y,
            maxY: this.position.y + height,
            minZ: this.position.z - width,
            maxZ: this.position.z + width
        };
    }
    
    /**
     * 경계 박스 충돌 검사
     */
    boundsIntersect(bounds1, bounds2) {
        return (bounds1.minX < bounds2.maxX && bounds1.maxX > bounds2.minX &&
                bounds1.minY < bounds2.maxY && bounds1.maxY > bounds2.minY &&
                bounds1.minZ < bounds2.maxZ && bounds1.maxZ > bounds2.minZ);
    }
    
    /**
     * 현재 도구 가져오기
     */
    getCurrentTool() {
        const currentItem = this.inventory[this.hotbarIndex];
        return currentItem ? this.getToolType(currentItem) : null;
    }
    
    /**
     * 아이템의 도구 타입 확인
     */
    getToolType(itemType) {
        // 간단한 도구 매핑
        const toolMap = {
            [BlockType.WOOD]: 'axe',
            [BlockType.STONE]: 'pickaxe',
            [BlockType.DIRT]: 'shovel',
            [BlockType.SAND]: 'shovel'
        };
        return toolMap[itemType] || null;
    }
    
    /**
     * 마이닝 시작
     */
    startMining(x, y, z) {
        this.miningBlock = { x, y, z };
        this.miningProgress = 0;
        this.miningStartTime = Date.now();
    }
    
    /**
     * 마이닝 중지
     */
    stopMining() {
        this.miningBlock = null;
        this.miningProgress = 0;
        this.miningStartTime = 0;
    }
    
    /**
     * 인벤토리에 아이템 추가
     */
    addToInventory(itemType, count) {
        // 기존 슬롯에서 같은 아이템 찾기
        for (let i = 0; i < this.inventory.length; i++) {
            const slot = this.inventory[i];
            if (slot && slot.type === itemType && slot.count < 64) {
                const addCount = Math.min(count, 64 - slot.count);
                slot.count += addCount;
                count -= addCount;
                
                if (count <= 0) return true;
            }
        }
        
        // 빈 슬롯에 추가
        for (let i = 0; i < this.inventory.length; i++) {
            if (!this.inventory[i]) {
                this.inventory[i] = { type: itemType, count: Math.min(count, 64) };
                count -= Math.min(count, 64);
                
                if (count <= 0) return true;
            }
        }
        
        return count === 0; // 모든 아이템이 추가되었는지 반환
    }
    
    /**
     * 인벤토리에서 아이템 제거
     */
    removeFromInventory(itemType, count) {
        for (let i = 0; i < this.inventory.length; i++) {
            const slot = this.inventory[i];
            if (slot && slot.type === itemType) {
                const removeCount = Math.min(count, slot.count);
                slot.count -= removeCount;
                count -= removeCount;
                
                if (slot.count <= 0) {
                    this.inventory[i] = null;
                }
                
                if (count <= 0) return true;
            }
        }
        
        return count === 0;
    }
    
    /**
     * 데미지 받기
     */
    takeDamage(amount) {
        if (this.gameMode === 'creative') return;
        
        this.health -= amount;
        this.health = Math.max(0, this.health);
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    /**
     * 회복
     */
    heal(amount) {
        this.health += amount;
        this.health = Math.min(PLAYER_CONFIG.MAX_HEALTH, this.health);
    }
    
    /**
     * 사망 처리
     */
    die() {
        console.log('💀 플레이어 사망');
        // 리스폰 로직
        this.respawn();
    }
    
    /**
     * 리스폰
     */
    respawn() {
        this.position = { x: 0, y: 64, z: 0 };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.health = PLAYER_CONFIG.MAX_HEALTH;
        this.hunger = PLAYER_CONFIG.MAX_HUNGER;
        
        if (this.gameMode === 'survival') {
            // 서바이벌 모드에서는 인벤토리 클리어 (하드코어 모드)
            // this.inventory.fill(null);
        }
    }
    
    /**
     * 상태 업데이트
     */
    updateStatus(deltaTime) {
        // 허기 감소 (서바이벌 모드에서만)
        if (this.gameMode === 'survival') {
            this.hunger -= 0.1 * deltaTime;
            this.hunger = Math.max(0, this.hunger);
            
            // 허기에 따른 체력 변화
            if (this.hunger <= 0) {
                this.takeDamage(0.5 * deltaTime);
            } else if (this.hunger >= PLAYER_CONFIG.MAX_HUNGER * 0.9 && this.health < PLAYER_CONFIG.MAX_HEALTH) {
                this.heal(0.2 * deltaTime);
            }
        }
    }
    
    /**
     * 파티클 생성 (임시)
     */
    createBreakParticles(x, y, z, block) {
        // 나중에 파티클 시스템에서 구현
        console.log(`💥 블록 파괴 파티클: ${block.data.displayName} at (${x}, ${y}, ${z})`);
    }
    
    /**
     * 위치 설정
     */
    setPosition(x, y, z) {
        this.position.x = x;
        this.position.y = y;
        this.position.z = z;
    }
    
    /**
     * 회전 설정
     */
    setRotation(yaw, pitch) {
        this.rotation.yaw = yaw;
        this.rotation.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
    }
    
    /**
     * 시야 방향 벡터 계산
     */
    getLookDirection() {
        const yaw = this.rotation.yaw;
        const pitch = this.rotation.pitch;
        
        return {
            x: Math.sin(yaw) * Math.cos(pitch),
            y: -Math.sin(pitch),
            z: -Math.cos(yaw) * Math.cos(pitch)
        };
    }
    
    /**
     * 눈 위치 계산
     */
    getEyePosition() {
        return {
            x: this.position.x,
            y: this.position.y + PLAYER_CONFIG.EYE_HEIGHT,
            z: this.position.z
        };
    }
    
    /**
     * 설정 업데이트
     */
    updateSettings(settings) {
        if (settings.mouseSensitivity !== undefined) {
            this.mouseSensitivity = settings.mouseSensitivity;
        }
        if (settings.fov !== undefined) {
            this.camera.fov = settings.fov;
        }
    }
    
    /**
     * 플레이어 직렬화
     */
    serialize() {
        return {
            position: this.position,
            rotation: this.rotation,
            health: this.health,
            hunger: this.hunger,
            gameMode: this.gameMode,
            inventory: this.inventory,
            hotbarIndex: this.hotbarIndex
        };
    }
    
    /**
     * 플레이어 복원
     */
    static deserialize(data) {
        const player = new Player();
        player.position = data.position || { x: 0, y: 64, z: 0 };
        player.rotation = data.rotation || { yaw: 0, pitch: 0 };
        player.health = data.health || PLAYER_CONFIG.MAX_HEALTH;
        player.hunger = data.hunger || PLAYER_CONFIG.MAX_HUNGER;
        player.gameMode = data.gameMode || 'survival';
        player.inventory = data.inventory || new Array(36).fill(null);
        player.hotbarIndex = data.hotbarIndex || 0;
        return player;
    }
}

// 전역으로 내보내기
window.Player = Player;
window.PLAYER_CONFIG = PLAYER_CONFIG;