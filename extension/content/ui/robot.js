import { toggleAssistantPanel } from "./panel.js";

export function initRobot() {
  if (document.getElementById("yt-assistant-robot")) return;

  const robot = document.createElement("div");
  robot.id = "yt-assistant-robot";

  robot.innerHTML = "🤖";
  robot.style.position = "fixed";
  robot.style.bottom = "20px";
  robot.style.right = "20px";
  robot.style.width = "64px";
  robot.style.height = "64px";
  robot.style.zIndex = "999999";
  robot.style.cursor = "pointer";
  robot.style.userSelect = "none";
  robot.style.filter = "drop-shadow(0 6px 16px rgba(0,0,0,0.4))";
  robot.style.backgroundColor = "#f9f0f0ff";
  robot.style.borderRadius = "50%";
  robot.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
  robot.style.display = "flex";
  robot.style.alignItems = "center";
  robot.style.justifyContent = "center";
  robot.style.fontSize = "32px";

  robot.title = "YT Assistant - Click to chat";

  // Hover animation
  robot.addEventListener("mouseenter", () => {
    robot.style.transform = "scale(1.1)";
    robot.style.transition = "transform 0.2s ease";
  });

  robot.addEventListener("mouseleave", () => {
    robot.style.transform = "scale(1)";
  });

  // Drag vs click detection
  let isRobotDragging = false;
  let robotOffsetX = 0;
  let robotOffsetY = 0;
  let mouseDownTime = 0;
  let mouseDownX = 0;
  let mouseDownY = 0;

  robot.addEventListener("mousedown", (e) => {
    robotOffsetX = e.clientX - robot.getBoundingClientRect().left;
    robotOffsetY = e.clientY - robot.getBoundingClientRect().top;

    mouseDownTime = Date.now();
    mouseDownX = e.clientX;
    mouseDownY = e.clientY;

    robot.style.transition = "none";
    e.stopPropagation();
  });

  document.addEventListener("mousemove", (e) => {
    if (!mouseDownTime) return;

    const dist = Math.hypot(e.clientX - mouseDownX, e.clientY - mouseDownY);
    if (dist > 5) isRobotDragging = true;

    if (!isRobotDragging) return;

    const x = e.clientX - robotOffsetX;
    const y = e.clientY - robotOffsetY;

    robot.style.left = `${Math.max(0, Math.min(x, window.innerWidth - robot.offsetWidth))}px`;
    robot.style.top = `${Math.max(0, Math.min(y, window.innerHeight - robot.offsetHeight))}px`;
    robot.style.right = "auto";
    robot.style.bottom = "auto";
  });

  document.addEventListener("mouseup", () => {
    if (!mouseDownTime) return;

    const clickDuration = Date.now() - mouseDownTime;

    if (!isRobotDragging && clickDuration < 500) {
      toggleAssistantPanel();
    }

    mouseDownTime = 0;
    isRobotDragging = false;
    robot.style.transition = "all 0.2s ease";
  });

  document.body.appendChild(robot);
}
