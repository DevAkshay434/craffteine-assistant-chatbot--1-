(function () {
  if (document.getElementById("crafftein-chat-widget")) return;

  // Create container
  const container = document.createElement("div");
  container.id = "crafftein-chat-widget";
  document.body.appendChild(container);

  // Create iframe to host the chat
  const iframe = document.createElement("iframe");
  iframe.src =
    "https://craffteine-assistant-chatbot-1.onrender.com/";
  iframe.style.position = "fixed";
  iframe.style.bottom = "20px";
  iframe.style.right = "20px";
  iframe.style.width = "400px";
  iframe.style.height = "600px";
  iframe.style.border = "none";
  iframe.style.zIndex = "99999";
  iframe.style.borderRadius = "20px";
  iframe.style.transition = "all 0.3s ease";

  container.appendChild(iframe);
})();