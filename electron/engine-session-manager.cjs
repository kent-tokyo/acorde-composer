class EngineSessionManager {
  constructor(createSession) {
    if (typeof createSession !== 'function') throw new TypeError('createSession must be a function');
    this.createSession = createSession;
    this.sessions = new Map();
  }

  request(ownerId, request) {
    if (!Number.isInteger(ownerId) || ownerId < 0) return Promise.reject(new TypeError('engine owner id is required'));
    let session = this.sessions.get(ownerId);
    if (!session) {
      session = this.createSession(ownerId);
      if (!session || typeof session.request !== 'function') throw new TypeError('engine session must expose request');
      this.sessions.set(ownerId, session);
    }
    return session.request(request);
  }

  release(ownerId) {
    const session = this.sessions.get(ownerId);
    if (!session) return false;
    this.sessions.delete(ownerId);
    session.close?.();
    return true;
  }

  clear() {
    for (const ownerId of [...this.sessions.keys()]) this.release(ownerId);
  }

  get size() { return this.sessions.size; }
}

module.exports = { EngineSessionManager };
