/**
 * OS Producer-Consumer & Counting Semaphore Simulation
 * Producer: Emergency Reception / Triage Desk
 * Bounded Buffer: Emergency Treatment Queue (default capacity: 6 slots)
 * Consumer: Treatment Department / Emergency Physicians
 * 
 * Semaphores:
 * - mutex = 1 (binary semaphore for mutual exclusion over the buffer)
 * - empty = capacity (counting semaphore tracking free buffer slots)
 * - full = 0 (counting semaphore tracking occupied buffer slots)
 */

class ProducerConsumerSimulation {
  constructor(capacity = 6) {
    this.capacity = capacity;
    this.buffer = []; // Bounded buffer
    this.mutex = 1;   // Semaphore mutex
    this.empty = capacity; // Semaphore empty
    this.full = 0;    // Semaphore full
    this.producedCount = 0;
    this.consumedCount = 0;
    this.eventLogs = [];

    // Seed initial buffer items
    this.produce({ id: 'PAT-E101', name: 'John Doe', condition: 'Severe Laceration', priority: 'High' });
    this.produce({ id: 'PAT-E102', name: 'Alice Smith', condition: 'Heat Exhaustion', priority: 'Medium' });
    this.produce({ id: 'PAT-E103', name: 'Carlos Ramos', condition: 'Fractured Ankle', priority: 'Medium' });
  }

  getState() {
    return {
      capacity: this.capacity,
      buffer: this.buffer,
      bufferSize: this.buffer.length,
      isFull: this.buffer.length >= this.capacity,
      isEmpty: this.buffer.length === 0,
      semaphores: {
        mutex: this.mutex,
        empty: this.empty,
        full: this.full
      },
      stats: {
        producedCount: this.producedCount,
        consumedCount: this.consumedCount,
        occupancyRate: Math.round((this.buffer.length / this.capacity) * 100)
      },
      recentLogs: this.eventLogs.slice(0, 15)
    };
  }

  setCapacity(newCapacity) {
    const cap = Math.max(3, Math.min(20, parseInt(newCapacity, 10) || 6));
    this.capacity = cap;
    this.empty = Math.max(0, this.capacity - this.buffer.length);
    this.logEvent('INFO', `Bounded buffer capacity dynamically resized to ${this.capacity} slots`);
    return this.getState();
  }

  /**
   * Producer action: Reception registers incoming patient into emergency buffer
   */
  produce(patient = null) {
    // Semaphore wait(empty)
    if (this.empty <= 0 || this.buffer.length >= this.capacity) {
      this.logEvent('WARNING', `PRODUCER BLOCKED: Emergency Reception cannot admit new case. Buffer is FULL (${this.buffer.length}/${this.capacity}). Waiting on empty semaphore.`);
      return {
        success: false,
        error: 'BUFFER_FULL',
        message: 'Buffer is FULL: Emergency triage queue overflow! Wait until doctors consume cases.',
        state: this.getState()
      };
    }

    // Semaphore wait(mutex)
    this.mutex = 0;
    this.empty--;

    const item = patient || {
      id: `PAT-E${100 + this.producedCount + 1}`,
      name: getRandomPatientName(),
      condition: getRandomCondition(),
      priority: getRandomPriority(),
      producedAt: new Date().toLocaleTimeString()
    };

    this.buffer.push(item);
    this.producedCount++;

    // Semaphore signal(mutex)
    this.mutex = 1;
    // Semaphore signal(full)
    this.full++;

    this.logEvent('SUCCESS', `PRODUCED: Reception produced emergency case [${item.id}: ${item.name} - ${item.condition}]. Buffer: ${this.buffer.length}/${this.capacity}. Semaphore full=${this.full}, empty=${this.empty}`);

    return {
      success: true,
      item,
      state: this.getState()
    };
  }

  /**
   * Consumer action: Treatment Department dequeues patient for active doctor treatment
   */
  consume() {
    // Semaphore wait(full)
    if (this.full <= 0 || this.buffer.length === 0) {
      this.logEvent('WARNING', `CONSUMER BLOCKED: Treatment Dept has no waiting cases. Buffer is EMPTY. Waiting on full semaphore.`);
      return {
        success: false,
        error: 'BUFFER_EMPTY',
        message: 'Buffer is EMPTY: No patients waiting in triage. Treatment department idle.',
        state: this.getState()
      };
    }

    // Semaphore wait(mutex)
    this.mutex = 0;
    this.full--;

    const item = this.buffer.shift();
    this.consumedCount++;

    // Semaphore signal(mutex)
    this.mutex = 1;
    // Semaphore signal(empty)
    this.empty++;

    this.logEvent('SUCCESS', `CONSUMED: Treatment team consumed emergency case [${item.id}: ${item.name}]. Dequeued to resuscitation bay. Semaphore full=${this.full}, empty=${this.empty}`);

    return {
      success: true,
      item,
      state: this.getState()
    };
  }

  reset() {
    this.buffer = [];
    this.mutex = 1;
    this.empty = this.capacity;
    this.full = 0;
    this.producedCount = 0;
    this.consumedCount = 0;
    this.eventLogs = [];
    this.logEvent('INFO', 'Producer-Consumer simulation reset to initial state.');
    return this.getState();
  }

  logEvent(level, message) {
    const entry = {
      id: `PC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    };
    this.eventLogs.unshift(entry);
    if (this.eventLogs.length > 50) this.eventLogs.pop();
  }
}

function getRandomPatientName() {
  const names = ['Liam Harris', 'Emma Clark', 'Noah Lewis', 'Ava Robinson', 'William Walker', 'Sophia Hall', 'Lucas Allen', 'Mia Young'];
  return names[Math.floor(Math.random() * names.length)];
}

function getRandomCondition() {
  const conds = ['Severe Concussion', 'Acute Pancreatitis', 'Compound Dislocation', 'Asthmatic Attack', 'Septic Shiver', 'Hypertensive Episode'];
  return conds[Math.floor(Math.random() * conds.length)];
}

function getRandomPriority() {
  const prios = ['Critical', 'High', 'Medium', 'Low'];
  return prios[Math.floor(Math.random() * prios.length)];
}

const producerConsumer = new ProducerConsumerSimulation(6);

module.exports = producerConsumer;
