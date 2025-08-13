/**
 * 인벤토리 관리 시스템
 */

/**
 * 인벤토리 아이템 클래스
 */
class InventoryItem {
    constructor(type, count = 1, metadata = {}) {
        this.type = type;
        this.count = count;
        this.metadata = metadata;
        this.maxStack = this.getMaxStackSize();
    }
    
    /**
     * 최대 스택 크기 반환
     */
    getMaxStackSize() {
        // 대부분의 블록은 64개까지 스택 가능
        return 64;
    }
    
    /**
     * 스택할 수 있는지 확인
     */
    canStackWith(other) {
        return other && 
               this.type === other.type && 
               JSON.stringify(this.metadata) === JSON.stringify(other.metadata);
    }
    
    /**
     * 아이템 추가 (스택)
     */
    addCount(amount) {
        const oldCount = this.count;
        this.count = Math.min(this.maxStack, this.count + amount);
        return this.count - oldCount; // 실제 추가된 양
    }
    
    /**
     * 아이템 제거
     */
    removeCount(amount) {
        const removed = Math.min(this.count, amount);
        this.count -= removed;
        return removed;
    }
    
    /**
     * 스택이 가득 찼는지 확인
     */
    isFull() {
        return this.count >= this.maxStack;
    }
    
    /**
     * 스택이 비었는지 확인
     */
    isEmpty() {
        return this.count <= 0;
    }
    
    /**
     * 복제
     */
    clone() {
        return new InventoryItem(this.type, this.count, { ...this.metadata });
    }
    
    /**
     * 직렬화
     */
    serialize() {
        return {
            type: this.type,
            count: this.count,
            metadata: this.metadata
        };
    }
    
    /**
     * 역직렬화
     */
    static deserialize(data) {
        return new InventoryItem(data.type, data.count, data.metadata || {});
    }
}

/**
 * 인벤토리 클래스
 */
class Inventory {
    constructor(size = 36) {
        this.size = size;
        this.slots = new Array(size).fill(null);
        this.selectedSlot = 0;
    }
    
    /**
     * 아이템 추가
     */
    addItem(type, count = 1, metadata = {}) {
        const item = new InventoryItem(type, 0, metadata);
        let remainingCount = count;
        
        // 기존 스택에 추가 시도
        for (let i = 0; i < this.size && remainingCount > 0; i++) {
            const slot = this.slots[i];
            if (slot && slot.canStackWith(item) && !slot.isFull()) {
                const added = slot.addCount(remainingCount);
                remainingCount -= added;
            }
        }
        
        // 빈 슬롯에 새 스택 생성
        for (let i = 0; i < this.size && remainingCount > 0; i++) {
            if (!this.slots[i]) {
                const newCount = Math.min(remainingCount, item.maxStack);
                this.slots[i] = new InventoryItem(type, newCount, metadata);
                remainingCount -= newCount;
            }
        }
        
        return count - remainingCount; // 실제 추가된 양
    }
    
    /**
     * 아이템 제거
     */
    removeItem(type, count = 1, metadata = {}) {
        const targetItem = new InventoryItem(type, 0, metadata);
        let remainingCount = count;
        
        // 뒤에서부터 제거 (최근에 추가된 것부터)
        for (let i = this.size - 1; i >= 0 && remainingCount > 0; i--) {
            const slot = this.slots[i];
            if (slot && slot.canStackWith(targetItem)) {
                const removed = slot.removeCount(remainingCount);
                remainingCount -= removed;
                
                if (slot.isEmpty()) {
                    this.slots[i] = null;
                }
            }
        }
        
        return count - remainingCount; // 실제 제거된 양
    }
    
    /**
     * 아이템 개수 세기
     */
    countItem(type, metadata = {}) {
        const targetItem = new InventoryItem(type, 0, metadata);
        let total = 0;
        
        for (const slot of this.slots) {
            if (slot && slot.canStackWith(targetItem)) {
                total += slot.count;
            }
        }
        
        return total;
    }
    
    /**
     * 아이템이 있는지 확인
     */
    hasItem(type, count = 1, metadata = {}) {
        return this.countItem(type, metadata) >= count;
    }
    
    /**
     * 슬롯에서 아이템 가져오기
     */
    getItem(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.size) {
            return null;
        }
        return this.slots[slotIndex];
    }
    
    /**
     * 슬롯에 아이템 설정
     */
    setItem(slotIndex, item) {
        if (slotIndex < 0 || slotIndex >= this.size) {
            return false;
        }
        this.slots[slotIndex] = item;
        return true;
    }
    
    /**
     * 두 슬롯 교환
     */
    swapSlots(slot1, slot2) {
        if (slot1 < 0 || slot1 >= this.size || slot2 < 0 || slot2 >= this.size) {
            return false;
        }
        
        const temp = this.slots[slot1];
        this.slots[slot1] = this.slots[slot2];
        this.slots[slot2] = temp;
        return true;
    }
    
    /**
     * 슬롯 이동 (스택 가능하면 합치기)
     */
    moveSlot(fromSlot, toSlot) {
        if (fromSlot < 0 || fromSlot >= this.size || toSlot < 0 || toSlot >= this.size) {
            return false;
        }
        
        const fromItem = this.slots[fromSlot];
        const toItem = this.slots[toSlot];
        
        if (!fromItem) return false;
        
        if (!toItem) {
            // 빈 슬롯으로 이동
            this.slots[toSlot] = fromItem;
            this.slots[fromSlot] = null;
        } else if (toItem.canStackWith(fromItem) && !toItem.isFull()) {
            // 스택 가능한 아이템
            const moved = toItem.addCount(fromItem.count);
            fromItem.removeCount(moved);
            
            if (fromItem.isEmpty()) {
                this.slots[fromSlot] = null;
            }
        } else {
            // 교환
            this.slots[fromSlot] = toItem;
            this.slots[toSlot] = fromItem;
        }
        
        return true;
    }
    
    /**
     * 빈 슬롯 찾기
     */
    findEmptySlot() {
        for (let i = 0; i < this.size; i++) {
            if (!this.slots[i]) {
                return i;
            }
        }
        return -1;
    }
    
    /**
     * 아이템을 찾을 수 있는 슬롯 찾기
     */
    findItemSlot(type, metadata = {}) {
        const targetItem = new InventoryItem(type, 0, metadata);
        
        for (let i = 0; i < this.size; i++) {
            const slot = this.slots[i];
            if (slot && slot.canStackWith(targetItem)) {
                return i;
            }
        }
        
        return -1;
    }
    
    /**
     * 인벤토리가 가득 찼는지 확인
     */
    isFull() {
        return this.slots.every(slot => slot !== null);
    }
    
    /**
     * 인벤토리가 비었는지 확인
     */
    isEmpty() {
        return this.slots.every(slot => slot === null);
    }
    
    /**
     * 인벤토리 정리 (같은 아이템들 합치기)
     */
    organize() {
        const itemGroups = new Map();
        
        // 아이템들을 타입별로 그룹화
        for (let i = 0; i < this.size; i++) {
            const slot = this.slots[i];
            if (slot) {
                const key = JSON.stringify({ type: slot.type, metadata: slot.metadata });
                if (!itemGroups.has(key)) {
                    itemGroups.set(key, []);
                }
                itemGroups.get(key).push({ slot, index: i });
            }
        }
        
        // 슬롯 초기화
        this.slots.fill(null);
        
        let currentIndex = 0;
        
        // 그룹별로 스택 재구성
        for (const [key, items] of itemGroups.entries()) {
            let totalCount = items.reduce((sum, item) => sum + item.slot.count, 0);
            const template = items[0].slot;
            
            while (totalCount > 0 && currentIndex < this.size) {
                const stackSize = Math.min(totalCount, template.maxStack);
                this.slots[currentIndex] = new InventoryItem(
                    template.type,
                    stackSize,
                    template.metadata
                );
                totalCount -= stackSize;
                currentIndex++;
            }
        }
    }
    
    /**
     * 선택된 아이템 가져오기 (핫바용)
     */
    getSelectedItem() {
        return this.getItem(this.selectedSlot);
    }
    
    /**
     * 선택된 슬롯 설정
     */
    setSelectedSlot(slot) {
        if (slot >= 0 && slot < Math.min(this.size, 9)) { // 핫바는 처음 9개 슬롯
            this.selectedSlot = slot;
            return true;
        }
        return false;
    }
    
    /**
     * 핫바 회전 (마우스 휠)
     */
    rotateHotbar(direction) {
        const hotbarSize = Math.min(this.size, 9);
        if (direction > 0) {
            this.selectedSlot = (this.selectedSlot + 1) % hotbarSize;
        } else if (direction < 0) {
            this.selectedSlot = (this.selectedSlot - 1 + hotbarSize) % hotbarSize;
        }
    }
    
    /**
     * 직렬화
     */
    serialize() {
        return {
            size: this.size,
            selectedSlot: this.selectedSlot,
            slots: this.slots.map(slot => slot ? slot.serialize() : null)
        };
    }
    
    /**
     * 역직렬화
     */
    static deserialize(data) {
        const inventory = new Inventory(data.size);
        inventory.selectedSlot = data.selectedSlot || 0;
        inventory.slots = data.slots.map(slotData => 
            slotData ? InventoryItem.deserialize(slotData) : null
        );
        return inventory;
    }
    
    /**
     * 복제
     */
    clone() {
        const clone = new Inventory(this.size);
        clone.selectedSlot = this.selectedSlot;
        clone.slots = this.slots.map(slot => slot ? slot.clone() : null);
        return clone;
    }
}

/**
 * 핫바 클래스 (인벤토리의 특별한 형태)
 */
class Hotbar {
    constructor(inventory, size = 9) {
        this.inventory = inventory;
        this.size = size;
        this.selectedIndex = 0;
    }
    
    /**
     * 선택된 아이템 가져오기
     */
    getSelectedItem() {
        return this.inventory.getItem(this.selectedIndex);
    }
    
    /**
     * 핫바 아이템 가져오기
     */
    getItem(index) {
        if (index < 0 || index >= this.size) {
            return null;
        }
        return this.inventory.getItem(index);
    }
    
    /**
     * 선택 인덱스 설정
     */
    setSelectedIndex(index) {
        if (index >= 0 && index < this.size) {
            this.selectedIndex = index;
            this.inventory.selectedSlot = index;
            return true;
        }
        return false;
    }
    
    /**
     * 다음 아이템 선택
     */
    selectNext() {
        this.selectedIndex = (this.selectedIndex + 1) % this.size;
        this.inventory.selectedSlot = this.selectedIndex;
    }
    
    /**
     * 이전 아이템 선택
     */
    selectPrevious() {
        this.selectedIndex = (this.selectedIndex - 1 + this.size) % this.size;
        this.inventory.selectedSlot = this.selectedIndex;
    }
    
    /**
     * 핫바의 모든 아이템 가져오기
     */
    getAllItems() {
        const items = [];
        for (let i = 0; i < this.size; i++) {
            items.push(this.getItem(i));
        }
        return items;
    }
}

// 전역으로 내보내기
window.InventoryItem = InventoryItem;
window.Inventory = Inventory;
window.Hotbar = Hotbar;