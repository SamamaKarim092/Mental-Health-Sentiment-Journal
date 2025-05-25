// public/js/chat.js

document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chatMessages');
    const userMessageInput = document.getElementById('userMessage');
    const sendButton = document.getElementById('sendButton');
    const chatForm = document.getElementById('chatForm');

    // Elements for chat history
    const aiAssistantLink = document.getElementById('aiAssistantLink');
    const chatHistorySidebar = document.getElementById('chatHistorySidebar');
    const newChatButton = document.getElementById('newChatButton');
    const chatHistoryList = document.getElementById('chatHistoryList');

    let currentChatId = null; // Stores the ID of the currently active chat

    if (!chatMessages || !userMessageInput || !sendButton || !chatForm ||
        !aiAssistantLink || !chatHistorySidebar || !newChatButton || !chatHistoryList) {
        console.error('One or more chat elements not found in the DOM. Check your HTML IDs.');
        return;
    }

    // Function to format timestamp
    function formatTimestamp(dateString) {
        const date = new Date(dateString);
        // Options for a more readable time format
        const options = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true, // Use 12-hour clock with AM/PM
            month: 'short', // e.g., Jan, Feb
            day: 'numeric' // e.g., 1, 2, 31
        };
        return date.toLocaleString('en-US', options);
    }

    // Function to display messages in the chat box
    // Modified to accept a message object with sender, text, and timestamp
    function displayMessage(sender, text, timestamp = new Date()) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);

        // Format the timestamp
        const formattedTime = formatTimestamp(timestamp);

        messageElement.innerHTML = `
            <div class="message-avatar">${sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>'}</div>
            <div class="message-content">
                <p>${text.replace(/\n/g, '<br>')}</p>
                <span class="message-timestamp">${formattedTime}</span>
            </div>
        `;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Function to clear chat messages
    function clearChatMessages() {
        chatMessages.innerHTML = `
            <div class="message ai-message">
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <p>Hi there! I'm your mental health assistant. I'm here to listen, provide support, and offer helpful tips for your well-being. How are you feeling today?</p>
                    <span class="message-timestamp">${formatTimestamp(new Date())}</span>
                </div>
            </div>
        `;
    }

    // Function to load a specific chat's history
    async function loadChat(chatId) {
        currentChatId = chatId;
        clearChatMessages(); // Clear current messages
        try {
            const response = await fetch(`/api/chat/history/${chatId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const chatHistory = await response.json();
            // Display each message with its timestamp
            chatHistory.messages.forEach(msg => {
                displayMessage(msg.sender, msg.text, msg.timestamp);
            });
            // Highlight the active chat in the sidebar
            document.querySelectorAll('.chat-history-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(`.chat-history-item[data-chat-id="${chatId}"]`).classList.add('active');

        } catch (error) {
            console.error('Error loading chat history:', error);
            displayMessage('system', 'Error loading chat history. Please try again.', new Date()); // System messages also get a timestamp
        }
    }

    // Function to fetch and display chat list in sidebar
    async function fetchChatList() {
        try {
            const response = await fetch('/api/chat/list');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const chatList = await response.json();
            chatHistoryList.innerHTML = ''; // Clear existing list

            if (chatList.length === 0) {
                chatHistoryList.innerHTML = '<div class="no-chats-message">No past chats. Start a new one!</div>';
                return;
            }

            chatList.forEach(chat => {
                const chatItem = document.createElement('div');
                chatItem.classList.add('chat-history-item');
                chatItem.dataset.chatId = chat._id; // Store chat ID

                // Get a preview of the first message
                const firstMessageText = chat.messages && chat.messages.length > 0
                                         ? chat.messages[0].text.substring(0, 30) + (chat.messages[0].text.length > 30 ? '...' : '')
                                         : 'Empty Chat';

                chatItem.innerHTML = `
                    <i class="fas fa-comment-dots"></i>
                    <span>${firstMessageText}</span>
                    <button class="delete-chat-btn" data-chat-id="${chat._id}"><i class="fas fa-trash"></i></button>
                `;
                chatItem.addEventListener('click', (event) => {
                    // Prevent activating chat if delete button is clicked
                    if (!event.target.closest('.delete-chat-btn')) {
                        loadChat(chat._id);
                    }
                });
                chatHistoryList.appendChild(chatItem);
            });
            // If there's an active chat, highlight it. Otherwise, load the most recent one.
            if (currentChatId) {
                const activeItem = document.querySelector(`.chat-history-item[data-chat-id="${currentChatId}"]`);
                if (activeItem) {
                    activeItem.classList.add('active');
                }
            } else if (chatList.length > 0) {
                // Automatically load the most recent chat if no chat is active
                loadChat(chatList[0]._id);
            }

            // Add event listeners for delete buttons
            document.querySelectorAll('.delete-chat-btn').forEach(button => {
                button.addEventListener('click', async (event) => {
                    event.stopPropagation(); // Prevent the parent chat-item click
                    const chatIdToDelete = button.dataset.chatId;
                    // IMPORTANT: Replace alert with a custom modal for better UX if this goes to production
                    if (confirm('Are you sure you want to delete this chat?')) {
                        try {
                            const response = await fetch(`/api/chat/${chatIdToDelete}`, {
                                method: 'DELETE'
                            });
                            if (response.ok) {
                                console.log(`Chat ${chatIdToDelete} deleted.`);
                                fetchChatList(); // Refresh list
                                if (currentChatId === chatIdToDelete) {
                                    startNewChat(); // Start a new chat if the active one was deleted
                                }
                            } else {
                                console.error('Error deleting chat:', await response.json());
                                // IMPORTANT: Replace alert with a custom modal
                                alert('Failed to delete chat.');
                            }
                        } catch (error) {
                            console.error('Network error deleting chat:', error);
                            // IMPORTANT: Replace alert with a custom modal
                            alert('Network error during chat deletion.');
                        }
                    }
                });
            });

        } catch (error) {
            console.error('Error fetching chat list:', error);
            chatHistoryList.innerHTML = '<div class="error-message">Failed to load chat history.</div>';
        }
    }

    // Function to start a new chat
    function startNewChat() {
        currentChatId = null; // Reset current chat ID
        clearChatMessages(); // Clear messages for a new conversation
        userMessageInput.focus();
        // Remove active class from any previously active chat in the sidebar
        document.querySelectorAll('.chat-history-item').forEach(item => {
            item.classList.remove('active');
        });
    }

    // Function to send message to backend
    async function sendMessage() {
        const message = userMessageInput.value.trim();

        if (!message) {
            return;
        }

        // Display user message immediately with current time
        displayMessage('user', message, new Date());
        userMessageInput.value = '';
        userMessageInput.style.height = 'auto';
        userMessageInput.disabled = true;
        sendButton.disabled = true;

        try {
            const payload = {
                message: message
            };
            if (currentChatId) {
                payload.chatId = currentChatId; // Include chatId if continuing a conversation
            }

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.chatId && !currentChatId) {
                    currentChatId = data.chatId; // Set chatId if this was the first message of a new chat
                    fetchChatList(); // Refresh chat list to show the new chat
                }
                // Display AI response with its received timestamp (or current time if not provided)
                displayMessage('ai', data.reply, new Date()); // Assuming AI response doesn't send timestamp back, use current time
            } else {
                console.error('Backend error:', data);
                displayMessage('system', `Error: ${data.error || 'Could not get response from AI.'}`, new Date());
            }

        } catch (error) {
            console.error('Fetch error:', error);
            displayMessage('system', 'Error sending message. Please check your connection or server.', new Date());

        } finally {
            userMessageInput.disabled = false;
            sendButton.disabled = false;
            userMessageInput.focus();
        }
    }

    // Event listeners
    chatForm.addEventListener('submit', (event) => {
        event.preventDefault();
        sendMessage();
    });

    userMessageInput.addEventListener('input', () => {
        userMessageInput.style.height = 'auto';
        userMessageInput.style.height = (userMessageInput.scrollHeight) + 'px';
    });

    // Toggle chat history sidebar visibility
    aiAssistantLink.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default link behavior
        chatHistorySidebar.classList.toggle('visible');
        if (chatHistorySidebar.classList.contains('visible')) {
            fetchChatList(); // Fetch list when sidebar becomes visible
        }
        // Also remove active class from all nav items and add to AI Assistant
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        aiAssistantLink.classList.add('active');
    });

    // New Chat button
    newChatButton.addEventListener('click', startNewChat);

    // Initial load: If AI Assistant link is active on page load, show history sidebar and fetch list
    if (aiAssistantLink.classList.contains('active')) {
        chatHistorySidebar.classList.add('visible');
        fetchChatList();
    } else {
        // If AI Assistant is not the active tab on load, ensure history sidebar is hidden
        chatHistorySidebar.classList.remove('visible');
    }


    // Add event listeners for suggestion chips
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            userMessageInput.value = chip.textContent;
            userMessageInput.focus();
        });
    });
});