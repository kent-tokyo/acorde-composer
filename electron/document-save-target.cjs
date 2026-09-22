const path = require('node:path');

const MUSICXML_EXTENSIONS = new Set(['.musicxml', '.xml']);

function isMusicXmlPath(filePath) {
  return typeof filePath === 'string' && MUSICXML_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function ensureMusicXmlPath(filePath) {
  if (typeof filePath !== 'string' || !filePath.trim()) throw new TypeError('MusicXML save path is required');
  return isMusicXmlPath(filePath) ? filePath : `${filePath}.musicxml`;
}

class DocumentSaveTargets {
  constructor() {
    this.paths = new Map();
  }

  trackOpened(ownerId, filePath) {
    if (isMusicXmlPath(filePath)) this.paths.set(ownerId, filePath);
    else this.paths.delete(ownerId);
  }

  clear(ownerId) {
    this.paths.delete(ownerId);
  }

  get(ownerId) {
    return this.paths.get(ownerId) || null;
  }

  set(ownerId, filePath) {
    const resolved = ensureMusicXmlPath(filePath);
    this.paths.set(ownerId, resolved);
    return resolved;
  }
}

module.exports = { DocumentSaveTargets, ensureMusicXmlPath, isMusicXmlPath };
