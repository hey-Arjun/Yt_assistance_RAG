import { toggleAssistantPanel } from "./panel.js";

export function initRobot() {
  if (document.getElementById("yt-assistant-robot")) return;

  const robot = document.createElement("div");
  robot.id = "yt-assistant-robot";

  // 1. GET THE CORRECT URL FOR THE EXTENSION IMAGE (Note the .jpg extension)
  const imageUrl = chrome.runtime.getURL("assets/robot.jpeg");

  // 2. INJECT THE IMG TAG
  // object-fit: cover; ensures the image isn't squished if it's not a perfect square.
  robot.innerHTML = `
  <img src="${imageUrl}" style="
    width: 100%; 
    height: 100%; 
    border-radius: 50%; 
    object-fit: contain; 
    padding: 8px; /* Increase this number (10px, 12px) to shrink the robot more */
    box-sizing: border-box; /* Crucial so padding doesn't break the circle */
    display: block;
  ">`;

Object.assign(robot.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    width: "65px",
    height: "65px",
    zIndex: "999999",
    cursor: "pointer",
    backgroundColor: "#ffffff",
    borderRadius: "50%",
    border: "3px solid #6405e0",
    overflow: "hidden", 
    boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
    transition: "transform 0.2s ease",
    userSelect: "none"
  });

  robot.title = "YT Assistant - Click to chat";

  // Hover animation
  robot.addEventListener("mouseenter", () => {
    robot.style.transform = "scale(1.1)";
  });

  robot.addEventListener("mouseleave", () => {
    robot.style.transform = "scale(1)";
  });

  // DRAG & CLICK LOGIC (Unchanged, optimized version)
// Inside your initRobot() function in content/ui/robot.js

let isDragging = false;
let startX, startY, initialLeft, initialTop;
let dragRequest;

robot.addEventListener("mousedown", (e) => {
  // 1. Record the starting positions
  const rect = robot.getBoundingClientRect();
  startX = e.clientX;
  startY = e.clientY;
  initialLeft = rect.left;
  initialTop = rect.top;
  
  isDragging = false;
  
  // 2. Define the move function (The "Follower")
  const onMouseMove = (moveEvent) => {
    const deltaX = moveEvent.clientX - startX;
    const deltaY = moveEvent.clientY - startY;

    // Only start "dragging" if the mouse moved at least 5px
    if (!isDragging && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
      isDragging = true;
      robot.style.transition = "none"; // Kill transitions while dragging
      document.body.style.userSelect = "none"; // Stop text highlighting
    }

    if (isDragging) {
      // Use requestAnimationFrame for 60fps smoothness
      if (dragRequest) cancelAnimationFrame(dragRequest);
      
      dragRequest = requestAnimationFrame(() => {
        const newX = initialLeft + deltaX;
        const newY = initialTop + deltaY;

        // Keep the robot within screen bounds
        const maxX = window.innerWidth - robot.offsetWidth;
        const maxY = window.innerHeight - robot.offsetHeight;

        robot.style.left = `${Math.max(0, Math.min(newX, maxX))}px`;
        robot.style.top = `${Math.max(0, Math.min(newY, maxY))}px`;
        robot.style.right = "auto";
        robot.style.bottom = "auto";
      });
    }
  };

  // 3. Define the Drop function
  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    document.body.style.userSelect = "auto";
    
    if (dragRequest) cancelAnimationFrame(dragRequest);

    if (!isDragging) {
      // It was just a click!
      toggleAssistantPanel();
    } else {
      // It was a drag! Add back the hover transition
      setTimeout(() => {
        robot.style.transition = "transform 0.2s ease, box-shadow 0.2s ease";
      }, 10);
    }
  };

  // 4. Attach listeners to DOCUMENT so mouse can move fast without "losing" the robot
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
  
  // Prevent default browser ghost-image drag
  e.preventDefault();
});

  document.body.appendChild(robot);
}