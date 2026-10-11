/**
 * OS Memory Management Engine for Hospital Capacity
 * Demonstrates:
 * - Contiguous Partition Allocation (Fixed & Dynamic Partitions for Wards/Beds)
 * - Allocation Algorithms: First-Fit, Best-Fit, Worst-Fit
 * - Internal & External Fragmentation calculations
 * - Virtual Memory / Paging concepts applied to patient admission records
 */

class HospitalMemoryManager {
  constructor() {
    // Initial Wards as Memory Partitions
    // Total Capacity: 100 Capacity Units (Beds/Monitor Points)
    this.partitions = [
      { id: 'BLOCK-01', name: 'ICU Critical Block A', size: 10, allocated: 8, patientId: 'PAT-1001, PAT-1002', status: 'OCCUPIED' },
      { id: 'BLOCK-02', name: 'Trauma Resuscitation Bay', size: 15, allocated: 15, patientId: 'PAT-1006, PAT-1007', status: 'OCCUPIED' },
      { id: 'BLOCK-03', name: 'Post-Op Step Down Unit', size: 20, allocated: 0, patientId: null, status: 'FREE' },
      { id: 'BLOCK-04', name: 'Acute Medical Ward 1', size: 25, allocated: 20, patientId: 'PAT-1009, PAT-1011', status: 'OCCUPIED' },
      { id: 'BLOCK-05', name: 'Acute Medical Ward 2', size: 15, allocated: 0, patientId: null, status: 'FREE' },
      { id: 'BLOCK-06', name: 'Observation & Triage Lounge', size: 15, allocated: 12, patientId: 'PAT-1015, PAT-1017', status: 'OCCUPIED' }
    ];
  }

  getCapacityState() {
    let totalCapacity = 0;
    let totalAllocated = 0;
    let internalFrag = 0;
    let externalFrag = 0;
    let freeBlocks = 0;

    this.partitions.forEach(p => {
      totalCapacity += p.size;
      if (p.status === 'OCCUPIED') {
        totalAllocated += p.allocated;
        internalFrag += (p.size - p.allocated); // Unused space within allocated block
      } else {
        externalFrag += p.size; // Free space scattered in blocks
        freeBlocks++;
      }
    });

    return {
      totalCapacity,
      totalAllocated,
      freeCapacity: totalCapacity - totalAllocated,
      internalFragmentation: internalFrag,
      externalFragmentation: externalFrag,
      utilizationRate: Math.round((totalAllocated / totalCapacity) * 100),
      partitions: this.partitions
    };
  }

  allocatePartition(reqSize, patientId, algorithm = 'First-Fit') {
    const size = parseInt(reqSize, 10);
    let chosenIdx = -1;

    const freeIndices = [];
    this.partitions.forEach((p, idx) => {
      if (p.status === 'FREE' && p.size >= size) {
        freeIndices.push(idx);
      }
    });

    if (freeIndices.length === 0) {
      return {
        success: false,
        error: 'OUT_OF_CAPACITY',
        message: `Insufficient contiguous block space for requirement size ${size}. External fragmentation: ${this.partitions.filter(p => p.status === 'FREE').reduce((s, p) => s + p.size, 0)} units available across disparate blocks.`
      };
    }

    if (algorithm === 'First-Fit') {
      // First block that fits
      chosenIdx = freeIndices[0];
    } else if (algorithm === 'Best-Fit') {
      // Smallest block that fits
      chosenIdx = freeIndices.reduce((best, cur) => {
        return this.partitions[cur].size < this.partitions[best].size ? cur : best;
      }, freeIndices[0]);
    } else if (algorithm === 'Worst-Fit') {
      // Largest block that fits
      chosenIdx = freeIndices.reduce((worst, cur) => {
        return this.partitions[cur].size > this.partitions[worst].size ? cur : worst;
      }, freeIndices[0]);
    }

    const block = this.partitions[chosenIdx];
    block.status = 'OCCUPIED';
    block.allocated = size;
    block.patientId = patientId;

    return {
      success: true,
      algorithm,
      allocatedBlock: block,
      internalFragmentation: block.size - block.allocated,
      state: this.getCapacityState()
    };
  }

  deallocatePartition(blockId) {
    const block = this.partitions.find(p => p.id === blockId);
    if (!block) return { success: false, message: 'Block not found' };

    block.status = 'FREE';
    block.allocated = 0;
    block.patientId = null;

    return {
      success: true,
      message: `Block ${blockId} freed into memory pool`,
      state: this.getCapacityState()
    };
  }

  reset() {
    this.partitions = [
      { id: 'BLOCK-01', name: 'ICU Critical Block A', size: 10, allocated: 8, patientId: 'PAT-1001, PAT-1002', status: 'OCCUPIED' },
      { id: 'BLOCK-02', name: 'Trauma Resuscitation Bay', size: 15, allocated: 15, patientId: 'PAT-1006, PAT-1007', status: 'OCCUPIED' },
      { id: 'BLOCK-03', name: 'Post-Op Step Down Unit', size: 20, allocated: 0, patientId: null, status: 'FREE' },
      { id: 'BLOCK-04', name: 'Acute Medical Ward 1', size: 25, allocated: 20, patientId: 'PAT-1009, PAT-1011', status: 'OCCUPIED' },
      { id: 'BLOCK-05', name: 'Acute Medical Ward 2', size: 15, allocated: 0, patientId: null, status: 'FREE' },
      { id: 'BLOCK-06', name: 'Observation & Triage Lounge', size: 15, allocated: 12, patientId: 'PAT-1015, PAT-1017', status: 'OCCUPIED' }
    ];
    return this.getCapacityState();
  }
}

const memoryManager = new HospitalMemoryManager();

module.exports = memoryManager;
