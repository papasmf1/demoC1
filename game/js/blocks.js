/**
 * 블록 시스템 - 블록 타입과 속성 정의
 */

// 블록 타입 열거형
const BlockType = {
    AIR: 0,
    GRASS: 1,
    DIRT: 2,
    STONE: 3,
    WOOD: 4,
    LEAVES: 5,
    SAND: 6,
    WATER: 7,
    LAVA: 8,
    COBBLESTONE: 9,
    GLASS: 10,
    COAL_ORE: 11,
    IRON_ORE: 12,
    GOLD_ORE: 13,
    DIAMOND_ORE: 14,
    BEDROCK: 15
};

// 블록 데이터 정의
const BlockData = {
    [BlockType.AIR]: {
        name: 'Air',
        displayName: '공기',
        solid: false,
        transparent: true,
        hardness: 0,
        color: [0, 0, 0, 0], // 투명
        tool: null,
        drops: []
    },
    
    [BlockType.GRASS]: {
        name: 'Grass Block',
        displayName: '잔디 블록',
        solid: true,
        transparent: false,
        hardness: 0.6,
        color: [124, 179, 66], // 잔디 초록색
        topColor: [139, 195, 74], // 잔디 윗면
        tool: 'shovel',
        drops: [{ type: BlockType.DIRT, count: 1 }]
    },
    
    [BlockType.DIRT]: {
        name: 'Dirt',
        displayName: '흙',
        solid: true,
        transparent: false,
        hardness: 0.5,
        color: [141, 110, 99],
        tool: 'shovel',
        drops: [{ type: BlockType.DIRT, count: 1 }]
    },
    
    [BlockType.STONE]: {
        name: 'Stone',
        displayName: '돌',
        solid: true,
        transparent: false,
        hardness: 1.5,
        color: [117, 117, 117],
        tool: 'pickaxe',
        drops: [{ type: BlockType.COBBLESTONE, count: 1 }]
    },
    
    [BlockType.WOOD]: {
        name: 'Oak Wood',
        displayName: '참나무',
        solid: true,
        transparent: false,
        hardness: 2.0,
        color: [141, 110, 99],
        sideColor: [160, 130, 105], // 나무 옆면
        tool: 'axe',
        drops: [{ type: BlockType.WOOD, count: 1 }]
    },
    
    [BlockType.LEAVES]: {
        name: 'Oak Leaves',
        displayName: '참나무 잎',
        solid: true,
        transparent: true,
        hardness: 0.2,
        color: [76, 175, 80],
        tool: null,
        drops: [
            { type: BlockType.WOOD, count: 1, chance: 0.05 }, // 묘목 (나무로 대체)
        ]
    },
    
    [BlockType.SAND]: {
        name: 'Sand',
        displayName: '모래',
        solid: true,
        transparent: false,
        hardness: 0.5,
        color: [255, 213, 79],
        tool: 'shovel',
        drops: [{ type: BlockType.SAND, count: 1 }],
        physics: true // 중력 영향
    },
    
    [BlockType.WATER]: {
        name: 'Water',
        displayName: '물',
        solid: false,
        transparent: true,
        hardness: 0,
        color: [33, 150, 243, 150], // 반투명 파란색
        tool: null,
        drops: [],
        fluid: true
    },
    
    [BlockType.LAVA]: {
        name: 'Lava',
        displayName: '용암',
        solid: false,
        transparent: true,
        hardness: 0,
        color: [255, 87, 34, 200], // 반투명 주황색
        tool: null,
        drops: [],
        fluid: true,
        lightLevel: 15,
        damage: 4 // 데미지
    },
    
    [BlockType.COBBLESTONE]: {
        name: 'Cobblestone',
        displayName: '조약돌',
        solid: true,
        transparent: false,
        hardness: 2.0,
        color: [97, 97, 97],
        tool: 'pickaxe',
        drops: [{ type: BlockType.COBBLESTONE, count: 1 }]
    },
    
    [BlockType.GLASS]: {
        name: 'Glass',
        displayName: '유리',
        solid: true,
        transparent: true,
        hardness: 0.3,
        color: [224, 247, 250, 200], // 반투명
        tool: null,
        drops: [] // 유리는 깨지면 아무것도 안 나옴
    },
    
    [BlockType.COAL_ORE]: {
        name: 'Coal Ore',
        displayName: '석탄 광석',
        solid: true,
        transparent: false,
        hardness: 3.0,
        color: [117, 117, 117],
        oreColor: [66, 66, 66], // 석탄 색상
        tool: 'pickaxe',
        drops: [{ type: 'coal', count: 1 }] // 아이템으로 드롭
    },
    
    [BlockType.IRON_ORE]: {
        name: 'Iron Ore',
        displayName: '철 광석',
        solid: true,
        transparent: false,
        hardness: 3.0,
        color: [117, 117, 117],
        oreColor: [255, 193, 7],
        tool: 'pickaxe',
        drops: [{ type: BlockType.IRON_ORE, count: 1 }]
    },
    
    [BlockType.GOLD_ORE]: {
        name: 'Gold Ore',
        displayName: '금 광석',
        solid: true,
        transparent: false,
        hardness: 3.0,
        color: [117, 117, 117],
        oreColor: [255, 215, 0],
        tool: 'pickaxe',
        drops: [{ type: BlockType.GOLD_ORE, count: 1 }]
    },
    
    [BlockType.DIAMOND_ORE]: {
        name: 'Diamond Ore',
        displayName: '다이아몬드 광석',
        solid: true,
        transparent: false,
        hardness: 3.0,
        color: [117, 117, 117],
        oreColor: [0, 188, 212],
        tool: 'pickaxe',
        drops: [{ type: 'diamond', count: 1 }] // 아이템으로 드롭
    },
    
    [BlockType.BEDROCK]: {
        name: 'Bedrock',
        displayName: '기반암',
        solid: true,
        transparent: false,
        hardness: -1, // 파괴 불가
        color: [33, 33, 33],
        tool: null,
        drops: []
    }
};

/**
 * 블록 클래스
 */
class Block {
    constructor(type, x = 0, y = 0, z = 0) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.z = z;
        this.data = BlockData[type] || BlockData[BlockType.AIR];
        this.damage = 0; // 블록 데미지 (0-1)
        this.metadata = 0; // 추가 데이터 (회전, 상태 등)
    }
    
    /**
     * 블록이 고체인지 확인
     */
    isSolid() {
        return this.data.solid;
    }
    
    /**
     * 블록이 투명한지 확인
     */
    isTransparent() {
        return this.data.transparent;
    }
    
    /**
     * 블록이 유체인지 확인
     */
    isFluid() {
        return this.data.fluid || false;
    }
    
    /**
     * 블록이 중력의 영향을 받는지 확인
     */
    hasPhysics() {
        return this.data.physics || false;
    }
    
    /**
     * 블록의 밝기 레벨 반환
     */
    getLightLevel() {
        return this.data.lightLevel || 0;
    }
    
    /**
     * 블록이 도구로 채굴 가능한지 확인
     */
    canMineWith(tool) {
        if (this.data.hardness === -1) return false; // 기반암은 채굴 불가
        if (!this.data.tool) return true; // 도구가 필요 없는 블록
        return this.data.tool === tool;
    }
    
    /**
     * 블록 채굴 시간 계산 (초)
     */
    getMiningTime(tool) {
        if (this.data.hardness === -1) return Infinity;
        if (this.data.hardness === 0) return 0;
        
        let multiplier = 1;
        if (this.data.tool && this.data.tool === tool) {
            multiplier = 0.4; // 적절한 도구 사용시 빨라짐
        } else if (this.data.tool && this.data.tool !== tool) {
            multiplier = 5; // 잘못된 도구 사용시 느려짐
        }
        
        return this.data.hardness * multiplier;
    }
    
    /**
     * 블록 파괴시 드롭 아이템 계산
     */
    getDrops() {
        const drops = [];
        
        for (const drop of this.data.drops) {
            const chance = drop.chance || 1.0;
            if (Math.random() < chance) {
                drops.push({
                    type: drop.type,
                    count: drop.count
                });
            }
        }
        
        return drops;
    }
    
    /**
     * 블록 색상 반환 (면에 따라 다를 수 있음)
     */
    getColor(face = 'all') {
        if (face === 'top' && this.data.topColor) {
            return this.data.topColor;
        } else if (face === 'side' && this.data.sideColor) {
            return this.data.sideColor;
        }
        
        return this.data.color;
    }
    
    /**
     * 광석 색상 반환
     */
    getOreColor() {
        return this.data.oreColor || null;
    }
    
    /**
     * 블록 데미지 추가
     */
    addDamage(amount) {
        this.damage = Math.min(this.damage + amount, 1.0);
        return this.damage >= 1.0; // 완전히 파괴되었는지 반환
    }
    
    /**
     * 블록 데미지 리셋
     */
    resetDamage() {
        this.damage = 0;
    }
    
    /**
     * 블록을 JSON으로 직렬화
     */
    serialize() {
        return {
            type: this.type,
            x: this.x,
            y: this.y,
            z: this.z,
            damage: this.damage,
            metadata: this.metadata
        };
    }
    
    /**
     * JSON에서 블록 복원
     */
    static deserialize(data) {
        const block = new Block(data.type, data.x, data.y, data.z);
        block.damage = data.damage || 0;
        block.metadata = data.metadata || 0;
        return block;
    }
    
    /**
     * 블록 복제
     */
    clone() {
        const cloned = new Block(this.type, this.x, this.y, this.z);
        cloned.damage = this.damage;
        cloned.metadata = this.metadata;
        return cloned;
    }
}

/**
 * 블록 유틸리티 함수들
 */
class BlockUtils {
    /**
     * 블록 타입이 유효한지 확인
     */
    static isValidBlockType(type) {
        return type in BlockData;
    }
    
    /**
     * 블록 이름으로 타입 찾기
     */
    static getBlockTypeByName(name) {
        for (const [type, data] of Object.entries(BlockData)) {
            if (data.name.toLowerCase() === name.toLowerCase()) {
                return parseInt(type);
            }
        }
        return BlockType.AIR;
    }
    
    /**
     * 모든 블록 타입 목록 반환
     */
    static getAllBlockTypes() {
        return Object.keys(BlockData).map(type => parseInt(type));
    }
    
    /**
     * 채굴 가능한 블록들만 반환
     */
    static getMinableBlocks() {
        return Object.entries(BlockData)
            .filter(([type, data]) => data.hardness >= 0)
            .map(([type, data]) => parseInt(type));
    }
    
    /**
     * 건축 가능한 블록들 반환
     */
    static getBuildableBlocks() {
        return Object.entries(BlockData)
            .filter(([type, data]) => data.solid && type != BlockType.BEDROCK)
            .map(([type, data]) => parseInt(type));
    }
    
    /**
     * 투명한 블록들 반환
     */
    static getTransparentBlocks() {
        return Object.entries(BlockData)
            .filter(([type, data]) => data.transparent)
            .map(([type, data]) => parseInt(type));
    }
    
    /**
     * 광석 블록들 반환
     */
    static getOreBlocks() {
        return [
            BlockType.COAL_ORE,
            BlockType.IRON_ORE,
            BlockType.GOLD_ORE,
            BlockType.DIAMOND_ORE
        ];
    }
    
    /**
     * 유체 블록들 반환
     */
    static getFluidBlocks() {
        return Object.entries(BlockData)
            .filter(([type, data]) => data.fluid)
            .map(([type, data]) => parseInt(type));
    }
    
    /**
     * 색상을 RGBA 문자열로 변환
     */
    static colorToRGBA(color) {
        if (color.length === 3) {
            return `rgba(${color[0]}, ${color[1]}, ${color[2]}, 1)`;
        } else if (color.length === 4) {
            return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 255})`;
        }
        return 'rgba(0, 0, 0, 1)';
    }
    
    /**
     * 블록 면의 방향 벡터
     */
    static getFaceDirection(face) {
        const directions = {
            front: [0, 0, 1],
            back: [0, 0, -1],
            left: [-1, 0, 0],
            right: [1, 0, 0],
            top: [0, 1, 0],
            bottom: [0, -1, 0]
        };
        
        return directions[face] || [0, 0, 0];
    }
}

// 전역으로 내보내기
window.BlockType = BlockType;
window.BlockData = BlockData;
window.Block = Block;
window.BlockUtils = BlockUtils;