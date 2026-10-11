/**
 * OS Mutex & Process Synchronization Engine
 * Demonstrates mutual exclusion, critical section protection, and locking queues
 * for contested hospital resources (e.g. ICU-05, OT-01).
 */

class MutexManager {
  constructor() {
    // Map of resourceKey -> { isLocked: bool, holder: object, queue: array, history: array }
    this.locks = new Map();
  }

  getLockState(resourceKey) {
    if (!this.locks.has(resourceKey)) {
      this.locks.set(resourceKey, {
        resourceKey,
        isLocked: false,
        holder: null,
        acquiredAt: null,
        waitingQueue: [],
        history: []
      });
    }
    return this.locks.get(resourceKey);
  }

  /**
   * Attempts to acquire lock. If already locked, enqueues requester in waiting queue.
   */
  acquire(resourceKey, requester, autoReleaseMs = 0) {
    const lock = this.getLockState(resourceKey);
    const timestamp = new Date().toLocaleTimeString();

    if (!lock.isLocked) {
      lock.isLocked = true;
      lock.holder = {
        id: requester.id || `REQ-${Date.now()}`,
        name: requester.name || 'Anonymous Staff',
        role: requester.role || 'Doctor',
        patientId: requester.patientId || 'PAT-1001',
        acquiredAt: timestamp
      };

      const entry = {
        action: 'ACQUIRED',
        user: lock.holder.name,
        role: lock.holder.role,
        patientId: lock.holder.patientId,
        timestamp,
        message: `[MUTEX ACQUIRED] ${lock.holder.name} obtained exclusive lock on ${resourceKey}`
      };
      lock.history.unshift(entry);

      if (autoReleaseMs > 0) {
        setTimeout(() => {
          this.release(resourceKey, lock.holder.id, true);
        }, autoReleaseMs);
      }

      return {
        success: true,
        status: 'ACQUIRED',
        resourceKey,
        holder: lock.holder,
        waitingQueue: lock.waitingQueue,
        history: lock.history
      };
    } else {
      // Resource is busy! Put into waiting queue (Blocked state)
      const waitingItem = {
        id: requester.id || `REQ-${Date.now()}`,
        name: requester.name || 'Anonymous Staff',
        role: requester.role || 'Doctor',
        patientId: requester.patientId || 'PAT-1001',
        enqueuedAt: timestamp
      };
      lock.waitingQueue.push(waitingItem);

      const entry = {
        action: 'QUEUED',
        user: waitingItem.name,
        role: waitingItem.role,
        patientId: waitingItem.patientId,
        timestamp,
        message: `[MUTEX CONFLICT] ${waitingItem.name} blocked on critical section. Added to lock queue (Position: ${lock.waitingQueue.length})`
      };
      lock.history.unshift(entry);

      return {
        success: false,
        status: 'BLOCKED_IN_QUEUE',
        resourceKey,
        holder: lock.holder,
        queuePosition: lock.waitingQueue.length,
        waitingQueue: lock.waitingQueue,
        history: lock.history
      };
    }
  }

  /**
   * Releases current lock holder, promotes next waiting process from queue
   */
  release(resourceKey, requesterId, isAuto = false) {
    const lock = this.getLockState(resourceKey);
    const timestamp = new Date().toLocaleTimeString();

    if (!lock.isLocked) {
      return { success: false, message: 'Resource is not locked' };
    }

    const previousHolder = lock.holder;
    const releaseEntry = {
      action: 'RELEASED',
      user: previousHolder ? previousHolder.name : 'Unknown',
      timestamp,
      message: `[MUTEX RELEASED] Critical section exit on ${resourceKey} by ${previousHolder?.name || 'System'}${isAuto ? ' (Auto timeout)' : ''}`
    };
    lock.history.unshift(releaseEntry);

    // If queue has waiting processes, grant lock to next in FIFO order
    if (lock.waitingQueue.length > 0) {
      const nextRequester = lock.waitingQueue.shift();
      lock.isLocked = true;
      lock.holder = {
        ...nextRequester,
        acquiredAt: timestamp
      };

      const promotedEntry = {
        action: 'PROMOTED',
        user: nextRequester.name,
        role: nextRequester.role,
        patientId: nextRequester.patientId,
        timestamp,
        message: `[MUTEX PROMOTED] Lock transferred from queue to ${nextRequester.name}`
      };
      lock.history.unshift(promotedEntry);

      return {
        success: true,
        status: 'PROMOTED_NEXT',
        previousHolder,
        currentHolder: lock.holder,
        waitingQueue: lock.waitingQueue,
        history: lock.history
      };
    } else {
      lock.isLocked = false;
      lock.holder = null;

      return {
        success: true,
        status: 'IDLE',
        previousHolder,
        currentHolder: null,
        waitingQueue: [],
        history: lock.history
      };
    }
  }

  /**
   * Simulates a race condition test where 3 requesters attempt allocation simultaneously
   */
  simulateRaceCondition(resourceKey = 'ICU-05') {
    // Reset resource lock
    this.locks.delete(resourceKey);

    const candidates = [
      { id: 'R1', name: 'Dr. Robert Chen (Cardiology)', role: 'Doctor', patientId: 'PAT-1001' },
      { id: 'R2', name: 'Dr. Angela Rossi (Trauma)', role: 'Doctor', patientId: 'PAT-1002' },
      { id: 'R3', name: 'David Vance (Dispatch)', role: 'Emergency Coordinator', patientId: 'PAT-1003' }
    ];

    const results = [];
    candidates.forEach((cand, index) => {
      const res = this.acquire(resourceKey, cand);
      results.push({
        candidate: cand,
        outcome: res.status,
        success: res.success,
        details: res.status === 'ACQUIRED' ? 'Acquired Critical Section Lock' : `Blocked (Queue Position: ${res.queuePosition})`
      });
    });

    return {
      resourceKey,
      results,
      finalState: this.getLockState(resourceKey)
    };
  }
}

const syncManager = new MutexManager();

module.exports = syncManager;
