// public/js/chat.js

document.addEventListener('DOMContentLoaded', () => {
  // Get references to HTML elements based on YOUR chat.html
  const chatMessages = document.getElementById('chatMessages'); // Corrected ID
  const userMessageInput = document.getElementById('userMessage'); // Corrected ID (textarea)
  const sendButton = document.getElementById('sendButton'); // Corrected ID
  const chatForm = document.getElementById('chatForm'); // Get the form

  if (!chatMessages || !userMessageInput || !sendButton || !chatForm) {
      console.error('Chat elements not found in the DOM!');
      return; // Stop execution if elements are missing
  }

  // Function to display messages in the chat box
  function displayMessage(sender, text) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`); // Add 'message' and sender class

    // Basic handling for messages that might contain simple newlines
    messageElement.innerHTML = `<div class="message-avatar">${sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>'}</div>
                                <div class="message-content">${text.replace(/\n/g, '<br>')}</div>`;


    chatMessages.appendChild(messageElement); // Append to chatMessages div

    // Auto-scroll to the latest message
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Function to send message to backend
  async function sendMessage() {
    const message = userMessageInput.value.trim();

    if (!message) {
      return; // Don't send empty messages
    }

    // Display user message immediately
    displayMessage('user', message);

    // Clear input and disable elements while waiting
    userMessageInput.value = '';
    userMessageInput.style.height = 'auto'; // Reset textarea height
    userMessageInput.disabled = true;
    sendButton.disabled = true;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message }),
      });

      const data = await response.json();

      if (response.ok) {
        // Display AI response
        displayMessage('ai', data.reply);
      } else {
        // Handle backend errors (e.g., 400, 500)
        console.error('Backend error:', data);
        displayMessage('system', `Error: ${data.error || 'Could not get response from AI.'}`);
      }

    } catch (error) {
      // Handle network or other fetch errors
      console.error('Fetch error:', error);
      displayMessage('system', 'Error sending message. Please check your connection or server.');

    } finally {
      // Re-enable input and button
      userMessageInput.disabled = false;
      sendButton.disabled = false;
      userMessageInput.focus(); // Put focus back on input
    }
  }

  // Event listener for the FORM submission
  chatForm.addEventListener('submit', (event) => {
    event.preventDefault(); // *** IMPORTANT: Prevent default form submission (page reload) ***
    sendMessage();
  });

  // Optional: Adjust textarea height as user types
  userMessageInput.addEventListener('input', () => {
    userMessageInput.style.height = 'auto'; // Reset height
    userMessageInput.style.height = (userMessageInput.scrollHeight) + 'px'; // Set new height
  });

  // Optional: Add a welcome message when the page loads
  // displayMessage('ai', 'Hi there! I\'m your mental health assistant. I\'m here to listen, provide support, and offer helpful tips for your well-being. How are you feeling today?');
  // Note: You already have a static welcome message in your HTML. You can remove that static one and use this JS one if you prefer dynamic loading.

  // Add event listeners for suggestion chips (Optional but good UX)
  document.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
          userMessageInput.value = chip.textContent; // Put chip text into input
          userMessageInput.focus(); // Focus the input
          // You might want to automatically send or just let the user edit/send
          // sendMessage(); // Uncomment this line to automatically send when a chip is clicked
      });
  });

});