/**
 * 제작 시스템
 */

/**
 * 제작 레시피 클래스
 */
class Recipe {
    constructor(id, name, pattern, result, shapeless = false) {
        this.id = id;
        this.name = name;
        this.pattern = pattern; // 2x2 또는 3x3 패턴
        this.result = result; // { type, count, metadata }
        this.shapeless = shapeless; // 모양 상관없이 재료만 맞으면 됨
    }
    
    /**
     * 패턴이 일치하는지 확인
     */
    matches(grid) {
        if (this.shapeless) {
            return this.matchesShapeless(grid);
        } else {
            return this.matchesShaped(grid);
        }
    }
    
    /**
     * 모양 있는 제작 확인
     */
    matchesShaped(grid) {
        const gridSize = Math.sqrt(grid.length);
        const patternSize = Math.sqrt(this.pattern.length);
        
        if (gridSize < patternSize) return false;
        
        // 패턴을 그리드의 모든 위치에서 시도
        for (let offsetY = 0; offsetY <= gridSize - patternSize; offsetY++) {
            for (let offsetX = 0; offsetX <= gridSize - patternSize; offsetX++) {
                if (this.matchesAtOffset(grid, gridSize, offsetX, offsetY)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * 특정 오프셋에서 패턴 일치 확인
     */
    matchesAtOffset(grid, gridSize, offsetX, offsetY) {
        const patternSize = Math.sqrt(this.pattern.length);
        
        // 패턴 영역 외부는 비어있어야 함
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const gridIndex = y * gridSize + x;
                const gridItem = grid[gridIndex];
                
                const inPattern = (x >= offsetX && x < offsetX + patternSize && 
                                 y >= offsetY && y < offsetY + patternSize);
                
                if (inPattern) {
                    const patternX = x - offsetX;
                    const patternY = y - offsetY;
                    const patternIndex = patternY * patternSize + patternX;
                    const requiredType = this.pattern[patternIndex];
                    
                    if (requiredType === null && gridItem !== null) {
                        return false;
                    }
                    if (requiredType !== null && (gridItem === null || gridItem.type !== requiredType)) {
                        return false;
                    }
                } else {
                    // 패턴 외부는 비어있어야 함
                    if (gridItem !== null) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }
    
    /**
     * 모양 없는 제작 확인
     */
    matchesShapeless(grid) {
        const required = {};
        const available = {};
        
        // 필요한 재료 계산
        for (const type of this.pattern) {
            if (type !== null) {
                required[type] = (required[type] || 0) + 1;
            }
        }
        
        // 사용 가능한 재료 계산
        for (const item of grid) {
            if (item !== null) {
                available[item.type] = (available[item.type] || 0) + 1;
            }
        }
        
        // 필요한 재료가 모두 있는지 확인
        for (const [type, count] of Object.entries(required)) {
            if ((available[type] || 0) < count) {
                return false;
            }
        }
        
        // 추가 재료가 없는지 확인
        for (const [type, count] of Object.entries(available)) {
            if ((required[type] || 0) < count) {
                return false;
            }
        }
        
        return true;
    }
}

/**
 * 제작 시스템 클래스
 */
class CraftingSystem {
    constructor() {
        this.recipes = new Map();
        this.initializeRecipes();
    }
    
    /**
     * 기본 레시피 초기화
     */
    initializeRecipes() {
        // 나무 판자 (2x2 제작)
        this.addRecipe(new Recipe(
            'wooden_planks',
            '나무 판자',
            [BlockType.WOOD, null, null, null],
            { type: BlockType.WOOD, count: 4 },
            true
        ));
        
        // 막대기
        this.addRecipe(new Recipe(
            'sticks',
            '막대기',
            [
                BlockType.WOOD, null, null,
                BlockType.WOOD, null, null,
                null, null, null
            ],
            { type: 'stick', count: 4 }
        ));
        
        // 나무 곡괭이
        this.addRecipe(new Recipe(
            'wooden_pickaxe',
            '나무 곡괭이',
            [
                BlockType.WOOD, BlockType.WOOD, BlockType.WOOD,
                null, 'stick', null,
                null, 'stick', null
            ],
            { type: 'wooden_pickaxe', count: 1 }
        ));
        
        // 나무 삽
        this.addRecipe(new Recipe(
            'wooden_shovel',
            '나무 삽',
            [
                null, BlockType.WOOD, null,
                null, 'stick', null,
                null, 'stick', null
            ],
            { type: 'wooden_shovel', count: 1 }
        ));
        
        // 나무 도끼
        this.addRecipe(new Recipe(
            'wooden_axe',
            '나무 도끼',
            [
                BlockType.WOOD, BlockType.WOOD, null,
                BlockType.WOOD, 'stick', null,
                null, 'stick', null
            ],
            { type: 'wooden_axe', count: 1 }
        ));
        
        // 조약돌
        this.addRecipe(new Recipe(
            'cobblestone_from_stone',
            '조약돌',
            [BlockType.STONE, null, null, null],
            { type: BlockType.COBBLESTONE, count: 1 },
            true
        ));
        
        // 돌 곡괭이
        this.addRecipe(new Recipe(
            'stone_pickaxe',
            '돌 곡괭이',
            [
                BlockType.COBBLESTONE, BlockType.COBBLESTONE, BlockType.COBBLESTONE,
                null, 'stick', null,
                null, 'stick', null
            ],
            { type: 'stone_pickaxe', count: 1 }
        ));
        
        // 횃불 (임시 - 아이템이 있다고 가정)
        this.addRecipe(new Recipe(
            'torch',
            '횃불',
            [
                'coal', null, null,
                'stick', null, null,
                null, null, null
            ],
            { type: 'torch', count: 4 }
        ));
        
        // 유리 (모래를 구워서 만드는 것으로 가정)
        this.addRecipe(new Recipe(
            'glass_from_sand',
            '유리',
            [BlockType.SAND, null, null, null],
            { type: BlockType.GLASS, count: 1 },
            true
        ));
        
        // 상자 (나무 판자로)
        this.addRecipe(new Recipe(
            'chest',
            '상자',
            [
                BlockType.WOOD, BlockType.WOOD, BlockType.WOOD,
                BlockType.WOOD, null, BlockType.WOOD,
                BlockType.WOOD, BlockType.WOOD, BlockType.WOOD
            ],
            { type: 'chest', count: 1 }
        ));
    }
    
    /**
     * 레시피 추가
     */
    addRecipe(recipe) {
        this.recipes.set(recipe.id, recipe);
    }
    
    /**
     * 레시피 제거
     */
    removeRecipe(id) {
        return this.recipes.delete(id);
    }
    
    /**
     * 레시피 찾기
     */
    findRecipe(grid) {
        for (const recipe of this.recipes.values()) {
            if (recipe.matches(grid)) {
                return recipe;
            }
        }
        return null;
    }
    
    /**
     * 제작 가능한 아이템 목록
     */
    getAvailableRecipes(inventory) {
        const available = [];
        
        for (const recipe of this.recipes.values()) {
            if (this.canCraft(recipe, inventory)) {
                available.push(recipe);
            }
        }
        
        return available;
    }
    
    /**
     * 제작 가능한지 확인
     */
    canCraft(recipe, inventory) {
        const required = {};
        
        // 필요한 재료 계산
        for (const type of recipe.pattern) {
            if (type !== null) {
                required[type] = (required[type] || 0) + 1;
            }
        }
        
        // 인벤토리에 재료가 있는지 확인
        for (const [type, count] of Object.entries(required)) {
            if (inventory.countItem(type) < count) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * 아이템 제작
     */
    craft(recipe, craftingGrid, inventory) {
        if (!recipe.matches(craftingGrid)) {
            return false;
        }
        
        // 재료 소모
        const consumed = {};
        for (const type of recipe.pattern) {
            if (type !== null) {
                consumed[type] = (consumed[type] || 0) + 1;
            }
        }
        
        for (const [type, count] of Object.entries(consumed)) {
            if (inventory.removeItem(type, count) < count) {
                // 제작 실패 - 재료 복원 (실제로는 트랜잭션 방식으로 처리해야 함)
                return false;
            }
        }
        
        // 결과 아이템 추가
        const added = inventory.addItem(
            recipe.result.type, 
            recipe.result.count, 
            recipe.result.metadata || {}
        );
        
        if (added < recipe.result.count) {
            // 인벤토리가 가득참 - 일부만 추가됨
            console.warn('인벤토리가 가득참 - 제작 결과 일부 손실');
        }
        
        return true;
    }
}

/**
 * 제작 테이블 클래스
 */
class CraftingTable {
    constructor(size = 2) {
        this.size = size; // 2x2 또는 3x3
        this.grid = new Array(size * size).fill(null);
        this.result = null;
        this.craftingSystem = new CraftingSystem();
    }
    
    /**
     * 그리드에 아이템 설정
     */
    setGridItem(index, item) {
        if (index < 0 || index >= this.grid.length) {
            return false;
        }
        
        this.grid[index] = item;
        this.updateResult();
        return true;
    }
    
    /**
     * 그리드에서 아이템 가져오기
     */
    getGridItem(index) {
        if (index < 0 || index >= this.grid.length) {
            return null;
        }
        return this.grid[index];
    }
    
    /**
     * 그리드 비우기
     */
    clearGrid() {
        this.grid.fill(null);
        this.result = null;
    }
    
    /**
     * 결과 업데이트
     */
    updateResult() {
        const recipe = this.craftingSystem.findRecipe(this.grid);
        this.result = recipe ? recipe.result : null;
    }
    
    /**
     * 제작 실행
     */
    craft(inventory) {
        const recipe = this.craftingSystem.findRecipe(this.grid);
        if (!recipe) {
            return false;
        }
        
        // 그리드의 아이템들을 인벤토리로 반환
        for (let i = 0; i < this.grid.length; i++) {
            if (this.grid[i]) {
                inventory.addItem(this.grid[i].type, this.grid[i].count, this.grid[i].metadata);
            }
        }
        
        // 그리드 비우기
        this.clearGrid();
        
        // 제작 실행
        const success = this.craftingSystem.craft(recipe, this.grid, inventory);
        
        return success;
    }
    
    /**
     * 직렬화
     */
    serialize() {
        return {
            size: this.size,
            grid: this.grid.map(item => item ? item.serialize() : null),
            result: this.result
        };
    }
    
    /**
     * 역직렬화
     */
    static deserialize(data) {
        const table = new CraftingTable(data.size);
        table.grid = data.grid.map(itemData => 
            itemData ? InventoryItem.deserialize(itemData) : null
        );
        table.result = data.result;
        return table;
    }
}

/**
 * 간단한 제작 매니저 (플레이어의 2x2 제작)
 */
class SimpleCrafting {
    constructor() {
        this.craftingSystem = new CraftingSystem();
    }
    
    /**
     * 2x2 제작 그리드에서 제작 가능한 아이템 확인
     */
    getResult(grid) {
        const recipe = this.craftingSystem.findRecipe(grid);
        return recipe ? recipe.result : null;
    }
    
    /**
     * 제작 실행
     */
    craft(grid, inventory) {
        const recipe = this.craftingSystem.findRecipe(grid);
        if (!recipe) {
            return null;
        }
        
        return this.craftingSystem.craft(recipe, grid, inventory) ? recipe.result : null;
    }
    
    /**
     * 빠른 제작 (인벤토리에서 직접)
     */
    quickCraft(recipeId, inventory) {
        const recipe = this.craftingSystem.recipes.get(recipeId);
        if (!recipe) {
            return false;
        }
        
        if (!this.craftingSystem.canCraft(recipe, inventory)) {
            return false;
        }
        
        // 가상 그리드 생성
        const grid = [...recipe.pattern];
        
        return this.craftingSystem.craft(recipe, grid, inventory);
    }
}

// 유틸리티 함수들
const CraftingUtils = {
    /**
     * 레시피 패턴을 문자열로 변환 (디버그용)
     */
    patternToString(pattern) {
        const size = Math.sqrt(pattern.length);
        let result = '';
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const index = y * size + x;
                const item = pattern[index];
                result += item ? (typeof item === 'string' ? item[0] : 'B') : '.';
            }
            result += '\n';
        }
        
        return result;
    },
    
    /**
     * 그리드를 문자열로 변환 (디버그용)
     */
    gridToString(grid) {
        const size = Math.sqrt(grid.length);
        let result = '';
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const index = y * size + x;
                const item = grid[index];
                result += item ? 'I' : '.';
            }
            result += '\n';
        }
        
        return result;
    }
};

// 전역으로 내보내기
window.Recipe = Recipe;
window.CraftingSystem = CraftingSystem;
window.CraftingTable = CraftingTable;
window.SimpleCrafting = SimpleCrafting;
window.CraftingUtils = CraftingUtils;