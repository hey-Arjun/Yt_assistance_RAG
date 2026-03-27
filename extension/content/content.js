(async () => {
  // We use chrome.runtime.getURL to get the correct path for the internal file
  const src = chrome.runtime.getURL('content/ui/robot.js');
  const { initRobot } = await import(src);
  initRobot();
})();