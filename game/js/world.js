/**
 * 월드 생성 및 관리 시스템
 */

// 월드 설정
const WORLD_CONFIG = {
    CHUNK_SIZE: 16,
    WORLD_HEIGHT: 64,
    SEA_LEVEL: 32,
    RENDER_DISTANCE: 8,
    MAX_HEIGHT: 255,
    MIN_HEIGHT: 0
};

/**
 * 청크 클래스 - 16x16x64 블록 영역
 */
class Chunk {
    constructor(x, z) {
        this.x = x; // 청크 X 좌표
        this.z = z; // 청크 Z 좌표
        this.blocks = new Array(WORLD_CONFIG.CHUNK_SIZE * WORLD_CONFIG.CHUNK_SIZE * WORLD_CONFIG.WORLD_HEIGHT).fill(BlockType.AIR);
        this.generated = false;
        this.dirty = false; // 변경사항이 있어서 다시 렌더링이 필요한지
        this.lastAccessed = Date.now();
    }
    
    /**
     * 블록 인덱스 계산
     */
    getBlockIndex(x, y, z) {
        if (x < 0 || x >= WORLD_CONFIG.CHUNK_SIZE || 
            y < 0 || y >= WORLD_CONFIG.WORLD_HEIGHT || 
            z < 0 || z >= WORLD_CONFIG.CHUNK_SIZE) {
            return -1;
        }
        return x + z * WORLD_CONFIG.CHUNK_SIZE + y * WORLD_CONFIG.CHUNK_SIZE * WORLD_CONFIG.CHUNK_SIZE;
    }
    
    /**
     * 블록 가져오기
     */
    getBlock(x, y, z) {
        const index = this.getBlockIndex(x, y, z);
        if (index === -1) return BlockType.AIR;
        return this.blocks[index];
    }
    
    /**
     * 블록 설정
     */
    setBlock(x, y, z, blockType) {
        const index = this.getBlockIndex(x, y, z);
        if (index === -1) return false;
        
        if (this.blocks[index] !== blockType) {
            this.blocks[index] = blockType;
            this.dirty = true;
            return true;
        }
        return false;
    }
    
    /**
     * 청크 생성
     */
    generate() {
        if (this.generated) return;
        
        for (let x = 0; x < WORLD_CONFIG.CHUNK_SIZE; x++) {
            for (let z = 0; z < WORLD_CONFIG.CHUNK_SIZE; z++) {
                const worldX = this.x * WORLD_CONFIG.CHUNK_SIZE + x;
                const worldZ = this.z * WORLD_CONFIG.CHUNK_SIZE + z;
                
                // 높이 맵 생성 (간단한 노이즈)
                const height = this.generateHeight(worldX, worldZ);
                
                // 지형 생성
                for (let y = 0; y < WORLD_CONFIG.WORLD_HEIGHT; y++) {
                    let blockType = BlockType.AIR;
                    
                    if (y === 0) {
                        blockType = BlockType.BEDROCK; // 기반암
                    } else if (y < height - 4) {
                        blockType = BlockType.STONE; // 돌
                        
                        // 광석 생성
                        if (this.shouldGenerateOre(worldX, y, worldZ)) {
                            blockType = this.getOreType(y);
                        }
                    } else if (y < height - 1) {
                        blockType = BlockType.DIRT; // 흙
                    } else if (y < height) {
                        blockType = y < WORLD_CONFIG.SEA_LEVEL ? BlockType.SAND : BlockType.GRASS; // 표면
                    } else if (y < WORLD_CONFIG.SEA_LEVEL) {
                        blockType = BlockType.WATER; // 물
                    }
                    
                    this.setBlock(x, y, z, blockType);
                }
                
                // 나무 생성
                if (height >= WORLD_CONFIG.SEA_LEVEL && Math.random() < 0.05) {
                    this.generateTree(x, height, z);
                }
            }
        }
        
        this.generated = true;
        this.dirty = true;
    }
    
    /**
     * 높이 생성 (간단한 노이즈 함수)
     */
    generateHeight(x, z) {
        // 간단한 사인파 기반 높이 생성
        const noise1 = Math.sin(x * 0.01) * Math.cos(z * 0.01);
        const noise2 = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 0.5;
        const height = WORLD_CONFIG.SEA_LEVEL + (noise1 + noise2) * 10;
        return Math.max(5, Math.min(WORLD_CONFIG.WORLD_HEIGHT - 10, Math.floor(height)));
    }
    
    /**
     * 광석 생성 여부 결정
     */
    shouldGenerateOre(x, y, z) {
        const seed = x * 73856093 ^ y * 19349663 ^ z * 83492791;
        const random = Math.abs(Math.sin(seed)) * 1000 % 1;
        
        // 높이에 따른 광석 확률
        if (y < 16) return random < 0.08; // 다이아몬드 레벨
        if (y < 32) return random < 0.12; // 금/철 레벨
        if (y < 48) return random < 0.15; // 석탄 레벨
        return false;
    }
    
    /**
     * 높이에 따른 광석 타입 결정
     */
    getOreType(y) {
        if (y < 12) {
            const random = Math.random();
            if (random < 0.1) return BlockType.DIAMOND_ORE;
            if (random < 0.4) return BlockType.GOLD_ORE;
            return BlockType.IRON_ORE;
        } else if (y < 32) {
            return Math.random() < 0.3 ? BlockType.GOLD_ORE : BlockType.IRON_ORE;
        } else {
            return BlockType.COAL_ORE;
        }
    }
    
    /**
     * 나무 생성
     */
    generateTree(x, y, z) {
        const treeHeight = 4 + Math.floor(Math.random() * 3);
        
        // 나무 줄기
        for (let i = 0; i < treeHeight; i++) {
            if (y + i < WORLD_CONFIG.WORLD_HEIGHT) {
                this.setBlock(x, y + i, z, BlockType.WOOD);
            }
        }
        
        // 나뭇잎
        for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
                for (let dy = 0; dy <= 2; dy++) {
                    const leafX = x + dx;
                    const leafY = y + treeHeight + dy - 1;
                    const leafZ = z + dz;
                    
                    if (leafX >= 0 && leafX < WORLD_CONFIG.CHUNK_SIZE && 
                        leafZ >= 0 && leafZ < WORLD_CONFIG.CHUNK_SIZE &&
                        leafY < WORLD_CONFIG.WORLD_HEIGHT) {
                        
                        const distance = Math.abs(dx) + Math.abs(dz) + Math.abs(dy);
                        if (distance <= 3 && Math.random() < 0.8) {
                            if (this.getBlock(leafX, leafY, leafZ) === BlockType.AIR) {
                                this.setBlock(leafX, leafY, leafZ, BlockType.LEAVES);
                            }
                        }
                    }
                }
            }
        }
    }
    
    /**
     * 청크 직렬화
     */
    serialize() {
        return {
            x: this.x,
            z: this.z,
            blocks: Array.from(this.blocks),
            generated: this.generated
        };
    }
    
    /**
     * 청크 복원
     */
    static deserialize(data) {
        const chunk = new Chunk(data.x, data.z);
        chunk.blocks = new Uint8Array(data.blocks);
        chunk.generated = data.generated;
        chunk.dirty = true;
        return chunk;
    }
}

/**
 * 월드 클래스
 */
class World {
    constructor() {
        this.chunks = new Map(); // 'x,z' -> Chunk
        this.seed = Math.floor(Math.random() * 1000000);
        this.loadedChunks = new Set();
        this.playerPosition = { x: 0, y: 0, z: 0 };
    }
    
    /**
     * 청크 키 생성
     */
    getChunkKey(chunkX, chunkZ) {
        return `${chunkX},${chunkZ}`;
    }
    
    /**
     * 월드 좌표를 청크 좌표로 변환
     */
    worldToChunk(x, z) {
        return {
            chunkX: Math.floor(x / WORLD_CONFIG.CHUNK_SIZE),
            chunkZ: Math.floor(z / WORLD_CONFIG.CHUNK_SIZE),
            localX: ((x % WORLD_CONFIG.CHUNK_SIZE) + WORLD_CONFIG.CHUNK_SIZE) % WORLD_CONFIG.CHUNK_SIZE,
            localZ: ((z % WORLD_CONFIG.CHUNK_SIZE) + WORLD_CONFIG.CHUNK_SIZE) % WORLD_CONFIG.CHUNK_SIZE
        };
    }
    
    /**
     * 청크 가져오기 또는 생성
     */
    getChunk(chunkX, chunkZ) {
        const key = this.getChunkKey(chunkX, chunkZ);
        let chunk = this.chunks.get(key);
        
        if (!chunk) {
            chunk = new Chunk(chunkX, chunkZ);
            this.chunks.set(key, chunk);
        }
        
        if (!chunk.generated) {
            chunk.generate();
        }
        
        chunk.lastAccessed = Date.now();
        return chunk;
    }
    
    /**
     * 블록 가져오기
     */
    getBlock(x, y, z) {
        if (y < 0 || y >= WORLD_CONFIG.WORLD_HEIGHT) {
            return y < 0 ? BlockType.BEDROCK : BlockType.AIR;
        }
        
        const { chunkX, chunkZ, localX, localZ } = this.worldToChunk(x, z);
        const chunk = this.getChunk(chunkX, chunkZ);
        return chunk.getBlock(localX, y, localZ);
    }
    
    /**
     * 블록 설정
     */
    setBlock(x, y, z, blockType) {
        if (y < 0 || y >= WORLD_CONFIG.WORLD_HEIGHT) {
            return false;
        }
        
        const { chunkX, chunkZ, localX, localZ } = this.worldToChunk(x, z);
        const chunk = this.getChunk(chunkX, chunkZ);
        return chunk.setBlock(localX, y, localZ, blockType);
    }
    
    /**
     * 특정 위치의 높이 가져오기
     */
    getHeightAt(x, z) {
        for (let y = WORLD_CONFIG.WORLD_HEIGHT - 1; y >= 0; y--) {
            const blockType = this.getBlock(x, y, z);
            const blockData = BlockData[blockType];
            if (blockData && blockData.solid) {
                return y;
            }
        }
        return 0;
    }
    
    /**
     * 플레이어 주변 청크 로드
     */
    loadChunksAroundPlayer(playerX, playerZ) {
        const { chunkX, chunkZ } = this.worldToChunk(playerX, playerZ);
        const renderDistance = WORLD_CONFIG.RENDER_DISTANCE;
        
        // 새로운 청크들 로드
        for (let dx = -renderDistance; dx <= renderDistance; dx++) {
            for (let dz = -renderDistance; dz <= renderDistance; dz++) {
                const currentChunkX = chunkX + dx;
                const currentChunkZ = chunkZ + dz;
                const key = this.getChunkKey(currentChunkX, currentChunkZ);
                
                if (!this.loadedChunks.has(key)) {
                    this.getChunk(currentChunkX, currentChunkZ);
                    this.loadedChunks.add(key);
                }
            }
        }
        
        // 멀리 있는 청크들 언로드
        this.unloadDistantChunks(chunkX, chunkZ);
    }
    
    /**
     * 멀리 있는 청크들 언로드
     */
    unloadDistantChunks(playerChunkX, playerChunkZ) {
        const unloadDistance = WORLD_CONFIG.RENDER_DISTANCE + 2;
        const chunksToUnload = [];
        
        for (const [key, chunk] of this.chunks.entries()) {
            const distance = Math.max(
                Math.abs(chunk.x - playerChunkX),
                Math.abs(chunk.z - playerChunkZ)
            );
            
            if (distance > unloadDistance) {
                chunksToUnload.push(key);
            }
        }
        
        chunksToUnload.forEach(key => {
            this.chunks.delete(key);
            this.loadedChunks.delete(key);
        });
    }
    
    /**
     * 레이캐스팅을 통한 블록 감지
     */
    raycast(origin, direction, maxDistance = 10) {
        const step = 0.1;
        const maxSteps = Math.floor(maxDistance / step);
        
        for (let i = 0; i < maxSteps; i++) {
            const distance = i * step;
            const x = Math.floor(origin.x + direction.x * distance);
            const y = Math.floor(origin.y + direction.y * distance);
            const z = Math.floor(origin.z + direction.z * distance);
            
            const blockType = this.getBlock(x, y, z);
            const blockData = BlockData[blockType];
            
            if (blockData && blockData.solid) {
                return {
                    hit: true,
                    position: { x, y, z },
                    block: new Block(blockType, x, y, z),
                    distance: distance
                };
            }
        }
        
        return { hit: false };
    }
    
    /**
     * 월드 업데이트
     */
    update(deltaTime) {
        this.loadChunksAroundPlayer(this.playerPosition.x, this.playerPosition.z);
        
        // 물리학 업데이트 (중력이 적용되는 블록들)
        this.updatePhysics();
    }
    
    /**
     * 물리학 업데이트
     */
    updatePhysics() {
        const physicsBlocks = [BlockType.SAND]; // 중력이 적용되는 블록들
        
        for (const [key, chunk] of this.chunks.entries()) {
            if (!chunk.generated) continue;
            
            for (let x = 0; x < WORLD_CONFIG.CHUNK_SIZE; x++) {
                for (let z = 0; z < WORLD_CONFIG.CHUNK_SIZE; z++) {
                    for (let y = 1; y < WORLD_CONFIG.WORLD_HEIGHT; y++) {
                        const blockType = chunk.getBlock(x, y, z);
                        
                        if (physicsBlocks.includes(blockType)) {
                            const belowType = chunk.getBlock(x, y - 1, z);
                            if (belowType === BlockType.AIR || BlockData[belowType]?.fluid) {
                                chunk.setBlock(x, y, z, BlockType.AIR);
                                chunk.setBlock(x, y - 1, z, blockType);
                            }
                        }
                    }
                }
            }
        }
    }
    
    /**
     * 월드 저장
     */
    serialize() {
        const chunksData = {};
        for (const [key, chunk] of this.chunks.entries()) {
            chunksData[key] = chunk.serialize();
        }
        
        return {
            seed: this.seed,
            chunks: chunksData,
            playerPosition: this.playerPosition
        };
    }
    
    /**
     * 월드 복원
     */
    static deserialize(data) {
        const world = new World();
        world.seed = data.seed;
        world.playerPosition = data.playerPosition || { x: 0, y: 0, z: 0 };
        
        for (const [key, chunkData] of Object.entries(data.chunks)) {
            const chunk = Chunk.deserialize(chunkData);
            world.chunks.set(key, chunk);
            world.loadedChunks.add(key);
        }
        
        return world;
    }
    
    /**
     * 월드 생성 (비동기)
     */
    async generate() {
        console.log('🌍 월드 생성 시작...');
        
        // 초기 청크들 생성
        const initialChunks = 4;
        for (let x = -initialChunks; x <= initialChunks; x++) {
            for (let z = -initialChunks; z <= initialChunks; z++) {
                this.getChunk(x, z);
                await new Promise(resolve => setTimeout(resolve, 1)); // 비동기 처리
            }
        }
        
        console.log('✅ 월드 생성 완료');
    }
}

// 전역으로 내보내기
window.World = World;
window.Chunk = Chunk;
window.WORLD_CONFIG = WORLD_CONFIG;