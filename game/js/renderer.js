/**
 * 3D 렌더링 시스템
 */

// 렌더링 설정
const RENDER_CONFIG = {
    BLOCK_SIZE: 32, // 픽셀 단위 블록 크기
    VIEW_DISTANCE: 8, // 청크 단위 시야 거리
    FOG_START: 6,
    FOG_END: 8,
    FRUSTUM_CULLING: true,
    FACE_CULLING: true
};

/**
 * 3D 렌더러 클래스
 */
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 렌더링 설정
        this.width = canvas.width;
        this.height = canvas.height;
        this.fov = 70;
        this.near = 0.1;
        this.far = 1000;
        
        // 변환 행렬들
        this.projectionMatrix = this.createProjectionMatrix();
        this.viewMatrix = this.createIdentityMatrix();
        
        // 렌더링 상태
        this.renderDistance = RENDER_CONFIG.VIEW_DISTANCE;
        this.showWireframe = false;
        this.enableFog = true;
        
        // 성능 관련
        this.frameBuffer = null;
        this.depthBuffer = null;
        this.visibleBlocks = [];
        
        // 텍스처 캐시
        this.blockTextures = new Map();
        
        // 설정
        this.setupCanvas();
        this.initializeTextures();
    }
    
    /**
     * 캔버스 설정
     */
    setupCanvas() {
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        
        // 픽셀 아트 스타일 유지
        this.canvas.style.imageRendering = 'pixelated';
        this.canvas.style.imageRendering = '-moz-crisp-edges';
        this.canvas.style.imageRendering = 'crisp-edges';
    }
    
    /**
     * 텍스처 초기화
     */
    initializeTextures() {
        // 각 블록 타입별 색상 정의
        const blockColors = {
            [BlockType.GRASS]: { top: '#7CB342', side: '#8D6E63' },
            [BlockType.DIRT]: { all: '#8D6E63' },
            [BlockType.STONE]: { all: '#757575' },
            [BlockType.WOOD]: { top: '#8D6E63', side: '#A1887F' },
            [BlockType.LEAVES]: { all: '#4CAF50' },
            [BlockType.SAND]: { all: '#FFD54F' },
            [BlockType.WATER]: { all: 'rgba(33, 150, 243, 0.8)' },
            [BlockType.LAVA]: { all: '#FF5722' },
            [BlockType.COBBLESTONE]: { all: '#616161' },
            [BlockType.GLASS]: { all: 'rgba(224, 247, 250, 0.9)' },
            [BlockType.COAL_ORE]: { all: '#757575', ore: '#424242' },
            [BlockType.IRON_ORE]: { all: '#757575', ore: '#FFC107' },
            [BlockType.GOLD_ORE]: { all: '#757575', ore: '#FFD700' },
            [BlockType.DIAMOND_ORE]: { all: '#757575', ore: '#00BCD4' },
            [BlockType.BEDROCK]: { all: '#212121' }
        };
        
        this.blockColors = blockColors;
    }
    
    /**
     * 메인 렌더링 함수
     */
    render(world, player) {
        if (!world || !player) return;
        
        // 화면 클리어
        this.clear();
        
        // 카메라 설정
        this.setupCamera(player);
        
        // 월드 렌더링
        this.renderWorld(world, player);
        
        // UI 오버레이 (크로스헤어 등)
        this.renderUI();
    }
    
    /**
     * 화면 클리어
     */
    clear() {
        // 하늘 그라디언트
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.5, '#98E4FF');
        gradient.addColorStop(1, '#B0E0E6');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    /**
     * 카메라 설정
     */
    setupCamera(player) {
        const eyePos = player.getEyePosition();
        const lookDir = player.getLookDirection();
        
        // 뷰 행렬 생성
        this.viewMatrix = this.createViewMatrix(eyePos, lookDir);
        
        // 프로젝션 행렬 업데이트
        this.projectionMatrix = this.createProjectionMatrix();
    }
    
    /**
     * 월드 렌더링
     */
    renderWorld(world, player) {
        const playerPos = player.getEyePosition();
        const lookDir = player.getLookDirection();
        
        // 플레이어 주변 청크들 수집
        const chunks = this.getVisibleChunks(world, playerPos);
        
        // 모든 보이는 블록들 수집
        this.visibleBlocks = [];
        
        for (const chunk of chunks) {
            this.collectVisibleBlocks(chunk, playerPos, lookDir);
        }
        
        // 깊이 순으로 정렬 (뒤에서 앞으로)
        this.visibleBlocks.sort((a, b) => b.distance - a.distance);
        
        // 블록들 렌더링
        for (const blockInfo of this.visibleBlocks) {
            this.renderBlock(blockInfo, playerPos);
        }
    }
    
    /**
     * 보이는 청크들 수집
     */
    getVisibleChunks(world, playerPos) {
        const chunks = [];
        const chunkX = Math.floor(playerPos.x / WORLD_CONFIG.CHUNK_SIZE);
        const chunkZ = Math.floor(playerPos.z / WORLD_CONFIG.CHUNK_SIZE);
        
        for (let dx = -this.renderDistance; dx <= this.renderDistance; dx++) {
            for (let dz = -this.renderDistance; dz <= this.renderDistance; dz++) {
                const chunk = world.getChunk(chunkX + dx, chunkZ + dz);
                if (chunk && chunk.generated) {
                    chunks.push(chunk);
                }
            }
        }
        
        return chunks;
    }
    
    /**
     * 청크에서 보이는 블록들 수집
     */
    collectVisibleBlocks(chunk, playerPos, lookDir) {
        const chunkWorldX = chunk.x * WORLD_CONFIG.CHUNK_SIZE;
        const chunkWorldZ = chunk.z * WORLD_CONFIG.CHUNK_SIZE;
        
        for (let x = 0; x < WORLD_CONFIG.CHUNK_SIZE; x++) {
            for (let z = 0; z < WORLD_CONFIG.CHUNK_SIZE; z++) {
                for (let y = 0; y < WORLD_CONFIG.WORLD_HEIGHT; y++) {
                    const blockType = chunk.getBlock(x, y, z);
                    
                    if (blockType === BlockType.AIR) continue;
                    
                    const worldX = chunkWorldX + x;
                    const worldZ = chunkWorldZ + z;
                    
                    // 거리 체크
                    const dx = worldX - playerPos.x;
                    const dy = y - playerPos.y;
                    const dz = worldZ - playerPos.z;
                    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    
                    if (distance > this.renderDistance * WORLD_CONFIG.CHUNK_SIZE) continue;
                    
                    // 프러스텀 컬링 (간단한 FOV 체크)
                    if (RENDER_CONFIG.FRUSTUM_CULLING) {
                        const dirToBlock = { x: dx, y: dy, z: dz };
                        const dotProduct = (dirToBlock.x * lookDir.x + dirToBlock.y * lookDir.y + dirToBlock.z * lookDir.z) / distance;
                        
                        if (dotProduct < -0.5) continue; // 뒤쪽 블록 제외
                    }
                    
                    // 면 컬링 - 보이는 면이 있는지 확인
                    const visibleFaces = this.getVisibleFaces(chunk, x, y, z, blockType);
                    if (visibleFaces.length === 0) continue;
                    
                    this.visibleBlocks.push({
                        x: worldX,
                        y: y,
                        z: worldZ,
                        type: blockType,
                        distance: distance,
                        visibleFaces: visibleFaces
                    });
                }
            }
        }
    }
    
    /**
     * 보이는 면들 확인
     */
    getVisibleFaces(chunk, x, y, z, blockType) {
        const faces = [];
        const blockData = BlockData[blockType];
        
        if (!blockData || !blockData.solid) {
            return ['front', 'back', 'left', 'right', 'top', 'bottom'];
        }
        
        // 각 면이 공기나 투명한 블록에 인접한지 확인
        const adjacentBlocks = [
            { face: 'front', dx: 0, dy: 0, dz: 1 },
            { face: 'back', dx: 0, dy: 0, dz: -1 },
            { face: 'left', dx: -1, dy: 0, dz: 0 },
            { face: 'right', dx: 1, dy: 0, dz: 0 },
            { face: 'top', dx: 0, dy: 1, dz: 0 },
            { face: 'bottom', dx: 0, dy: -1, dz: 0 }
        ];
        
        for (const adj of adjacentBlocks) {
            const adjX = x + adj.dx;
            const adjY = y + adj.dy;
            const adjZ = z + adj.dz;
            
            let adjacentType;
            
            if (adjX < 0 || adjX >= WORLD_CONFIG.CHUNK_SIZE ||
                adjZ < 0 || adjZ >= WORLD_CONFIG.CHUNK_SIZE ||
                adjY < 0 || adjY >= WORLD_CONFIG.WORLD_HEIGHT) {
                adjacentType = BlockType.AIR;
            } else {
                adjacentType = chunk.getBlock(adjX, adjY, adjZ);
            }
            
            const adjBlockData = BlockData[adjacentType];
            
            if (!adjBlockData || !adjBlockData.solid || adjBlockData.transparent) {
                faces.push(adj.face);
            }
        }
        
        return faces;
    }
    
    /**
     * 블록 렌더링
     */
    renderBlock(blockInfo, playerPos) {
        const { x, y, z, type, visibleFaces } = blockInfo;
        
        // 3D 변환
        const screenPos = this.worldToScreen(x + 0.5, y + 0.5, z + 0.5, playerPos);
        
        if (!screenPos) return; // 화면 밖
        
        const blockSize = Math.max(1, RENDER_CONFIG.BLOCK_SIZE / Math.max(1, blockInfo.distance));
        
        // 각 면 렌더링
        for (const face of visibleFaces) {
            this.renderBlockFace(x, y, z, type, face, screenPos, blockSize, blockInfo.distance);
        }
    }
    
    /**
     * 블록 면 렌더링
     */
    renderBlockFace(x, y, z, blockType, face, screenPos, size, distance) {
        const colors = this.blockColors[blockType] || { all: '#808080' };
        let faceColor = colors.all || colors.top || '#808080';
        
        // 면별 색상 적용
        if (face === 'top' && colors.top) {
            faceColor = colors.top;
        } else if ((face === 'left' || face === 'right' || face === 'front' || face === 'back') && colors.side) {
            faceColor = colors.side;
        }
        
        // 거리에 따른 어둡게 효과 (간단한 안개)
        let alpha = 1.0;
        if (this.enableFog && distance > RENDER_CONFIG.FOG_START * WORLD_CONFIG.CHUNK_SIZE) {
            const fogFactor = (distance - RENDER_CONFIG.FOG_START * WORLD_CONFIG.CHUNK_SIZE) /
                            (RENDER_CONFIG.FOG_END * WORLD_CONFIG.CHUNK_SIZE - RENDER_CONFIG.FOG_START * WORLD_CONFIG.CHUNK_SIZE);
            alpha = Math.max(0.1, 1.0 - Math.min(1.0, fogFactor));
        }
        
        // 면의 밝기 조정 (간단한 조명)
        let brightness = 1.0;
        switch (face) {
            case 'top': brightness = 1.0; break;
            case 'bottom': brightness = 0.3; break;
            case 'front':
            case 'back': brightness = 0.8; break;
            case 'left':
            case 'right': brightness = 0.6; break;
        }
        
        // 색상 적용
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        // RGBA 색상 파싱 및 적용
        const adjustedColor = this.adjustColorBrightness(faceColor, brightness);
        this.ctx.fillStyle = adjustedColor;
        
        // 간단한 정사각형 면 그리기
        const halfSize = size / 2;
        this.ctx.fillRect(
            screenPos.x - halfSize,
            screenPos.y - halfSize,
            size,
            size
        );
        
        // 광석 하이라이트
        if (colors.ore) {
            this.ctx.fillStyle = colors.ore;
            const oreSize = size * 0.6;
            const oreHalf = oreSize / 2;
            this.ctx.fillRect(
                screenPos.x - oreHalf,
                screenPos.y - oreHalf,
                oreSize,
                oreSize
            );
        }
        
        // 와이어프레임 모드
        if (this.showWireframe) {
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(
                screenPos.x - halfSize,
                screenPos.y - halfSize,
                size,
                size
            );
        }
        
        this.ctx.restore();
    }
    
    /**
     * 색상 밝기 조정
     */
    adjustColorBrightness(color, brightness) {
        // 간단한 색상 조정 (RGB만 지원)
        if (color.startsWith('#')) {
            const r = parseInt(color.substr(1, 2), 16);
            const g = parseInt(color.substr(3, 2), 16);
            const b = parseInt(color.substr(5, 2), 16);
            
            const newR = Math.floor(r * brightness);
            const newG = Math.floor(g * brightness);
            const newB = Math.floor(b * brightness);
            
            return `rgb(${newR}, ${newG}, ${newB})`;
        }
        
        return color;
    }
    
    /**
     * 월드 좌표를 화면 좌표로 변환
     */
    worldToScreen(worldX, worldY, worldZ, playerPos) {
        // 간단한 원근 투영
        const dx = worldX - playerPos.x;
        const dy = worldY - playerPos.y;
        const dz = worldZ - playerPos.z;
        
        // 카메라 뒤에 있는 점은 제외
        if (dz > -0.1) return null;
        
        const distance = Math.abs(dz);
        const scale = RENDER_CONFIG.BLOCK_SIZE / distance;
        
        const screenX = this.width / 2 + (dx * scale);
        const screenY = this.height / 2 - (dy * scale);
        
        // 화면 경계 체크
        if (screenX < -100 || screenX > this.width + 100 ||
            screenY < -100 || screenY > this.height + 100) {
            return null;
        }
        
        return { x: screenX, y: screenY };
    }
    
    /**
     * UI 렌더링
     */
    renderUI() {
        // 크로스헤어는 HTML/CSS에서 처리
        // 여기서는 추가적인 UI 요소들만 처리
    }
    
    /**
     * 행렬 생성 함수들
     */
    createIdentityMatrix() {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    }
    
    createProjectionMatrix() {
        const aspect = this.width / this.height;
        const fov = this.fov * Math.PI / 180;
        const f = 1.0 / Math.tan(fov / 2);
        const rangeInv = 1 / (this.near - this.far);
        
        return [
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (this.near + this.far) * rangeInv, -1,
            0, 0, this.near * this.far * rangeInv * 2, 0
        ];
    }
    
    createViewMatrix(eyePos, lookDir) {
        // 간단한 뷰 행렬 (여기서는 사용하지 않지만 구조상 유지)
        return this.createIdentityMatrix();
    }
    
    /**
     * 캔버스 크기 조정
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        
        this.projectionMatrix = this.createProjectionMatrix();
        this.setupCanvas();
    }
    
    /**
     * 설정 업데이트
     */
    updateSettings(settings) {
        if (settings.renderDistance !== undefined) {
            this.renderDistance = Math.max(2, Math.min(16, settings.renderDistance));
        }
        
        if (settings.fov !== undefined) {
            this.fov = Math.max(30, Math.min(120, settings.fov));
            this.projectionMatrix = this.createProjectionMatrix();
        }
    }
    
    /**
     * 디버그 정보 렌더링
     */
    renderDebugInfo(player, world) {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 300, 120);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px monospace';
        
        const pos = player.position;
        const rot = player.rotation;
        
        this.ctx.fillText(`위치: ${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`, 20, 30);
        this.ctx.fillText(`회전: ${(rot.yaw * 180 / Math.PI).toFixed(1)}°, ${(rot.pitch * 180 / Math.PI).toFixed(1)}°`, 20, 50);
        this.ctx.fillText(`렌더된 블록: ${this.visibleBlocks.length}개`, 20, 70);
        this.ctx.fillText(`로드된 청크: ${world.chunks.size}개`, 20, 90);
        this.ctx.fillText(`체력: ${player.health.toFixed(1)}/${PLAYER_CONFIG.MAX_HEALTH}`, 20, 110);
        
        this.ctx.restore();
    }
    
    /**
     * 스크린샷 캡처
     */
    captureScreenshot() {
        return this.canvas.toDataURL('image/png');
    }
    
    /**
     * 렌더러 정리
     */
    dispose() {
        this.blockTextures.clear();
        this.visibleBlocks = [];
    }
}

// 전역으로 내보내기
window.Renderer = Renderer;
window.RENDER_CONFIG = RENDER_CONFIG;