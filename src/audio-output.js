(function () {
  function normalizeDevices(devices) {
    return (Array.isArray(devices) ? devices : []).filter((device) => device && device.kind === 'audiooutput' && typeof device.deviceId === 'string');
  }
  function resolveOutputDeviceId(savedId, devices) {
    if (typeof savedId !== 'string' || savedId.length === 0) return null;
    return normalizeDevices(devices).some((device) => device.deviceId === savedId) ? savedId : null;
  }
  window.AcordeAudioOutput = { normalizeDevices, resolveOutputDeviceId };
})();
