document.addEventListener('DOMContentLoaded', () => {
    const openPrivateChatModalBtn = document.getElementById('openPrivateChatModalBtn');
    const openGroupChatModalBtn = document.getElementById('openGroupChatModalBtn');
    const privateChatModal = document.getElementById('privateChatModal');
    const groupChatModal = document.getElementById('groupChatModal');
    const closePrivateModal = document.getElementById('closePrivateModal');
    const closeGroupModal = document.getElementById('closeGroupModal');
    const createPrivateChatBtn = document.getElementById('createPrivateChatBtn');
    const createGroupChatBtn = document.getElementById('createGroupChatBtn');
    const chatArea = document.getElementById('chatArea');
    const chatList = document.getElementById('chatList');
    const recipientEmailInput = document.getElementById('recipientEmail');
    const groupNameInput = document.getElementById('groupName');
    const recipientEmailsInput = document.getElementById('recipientEmails');
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const messagesDiv = document.getElementById('messages');
    const privateChatError = document.getElementById('privateChatError');
    const privateChatSuccess = document.getElementById('privateChatSuccess');
    const groupChatError = document.getElementById('groupChatError');
    const groupChatSuccess = document.getElementById('groupChatSuccess');
    const chatTitle = document.getElementById('chatTitle');
    let currentlyOpenChatId = null;
    // Function to open a specific chat
   
    window.openChat = async (chatId) => {
        const messagesDiv = document.getElementById('messages');
        const chatArea = document.getElementById('chatArea');
        const chatTitle = document.getElementById('chatTitle');
    
        currentlyOpenChatId = chatId;
    
        try {
            const response = await fetch(`/chat/${chatId}/messages`);
            const data = await response.json();
    
            if (response.ok) {
                messagesDiv.innerHTML = ''; // Clear existing messages
                data.messages.forEach(message => {
                    const messageElement = document.createElement('div');
                    const senderProfilePic = document.createElement('img');
                    senderProfilePic.classList.add('sender-profile-pic');
                    senderProfilePic.src = message.sender.profilePicture || '/path/to/default/profile.jpg';
                    senderProfilePic.alt = `${message.sender.username}'s profile picture`;
    
                    const messageContent = document.createElement('span');
                    messageContent.textContent = `${message.sender.username}: ${message.content}`;  // Customize display
    
                    messageElement.appendChild(senderProfilePic);
                    messageElement.appendChild(messageContent);
    
                    messagesDiv.appendChild(messageElement);
                });
    
                chatArea.style.display = 'block';
                socket.emit('joinChat', chatId);
            } else {
                console.error('Failed to fetch chat messages:', data.message);
                alert('Failed to fetch chat messages.');
            }
        } catch (error) {
            console.error('Error fetching chat messages:', error);
            alert('Failed to fetch chat messages.');
        }
    };
    

    
    let currentPage = 1;
const chatsPerPage = 3;

async function fetchUserChats(page = 1) {
    try {
        const response = await fetch(`/chat/chats?page=${page}&limit=${chatsPerPage}`);
        const data = await response.json();

        if (response.ok) {
            chatList.innerHTML = ''; // Clear existing list

            data.chats.forEach(chat => {
                const chatElement = document.createElement('div');
                chatElement.classList.add('chat-item');

                // Create an element for the profile picture (assume using the first participant's picture)
                const profilePicElement = document.createElement('img');
                profilePicElement.classList.add('profile-pic');
                const profilePicUrl = chat.participants.length > 0 ? chat.participants[0].profilePicture : '/path/to/default/profile.jpg';
                profilePicElement.src = profilePicUrl;
                profilePicElement.alt = 'Profile Picture';

                // Append the profile picture to the chat element
                chatElement.appendChild(profilePicElement);

                // For a group chat, show the group name or the username of the other participant in a private chat
                if (chat.groupName) {
                    chatElement.textContent += ` ${chat.groupName}`;  // Display group name
                } else {
                    // Private chat, show the username of the other participant
                    const otherParticipants = chat.participants.filter(participant => participant.username !== window.currentUsername);
                    if (otherParticipants.length > 0) {
                        chatElement.textContent += ` ${otherParticipants[0].username}`;
                    }
                }

                // When clicking on the chat, open the chat
                chatElement.addEventListener('click', () => openChat(chat._id));
                chatList.appendChild(chatElement);
            });

            // Update pagination controls
            updatePaginationControls(data.currentPage, data.totalPages);
            return data.chats;
        } else {
            console.error('Failed to fetch user chats:', data.message);
            alert('Failed to fetch user chats.');
        }
    } catch (error) {
        console.error('Error fetching user chats:', error);
        alert('Failed to fetch user chats.');
    }
}

// Update pagination controls
function updatePaginationControls(currentPage, totalPages) {
    const paginationContainer = document.getElementById('paginationControls');
    paginationContainer.innerHTML = '';

    // Add Previous Button
    if (currentPage > 1) {
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Previous';
        prevButton.classList.add('btn', 'btn-primary');
        prevButton.addEventListener('click', () => fetchUserChats(currentPage - 1));
        paginationContainer.appendChild(prevButton);
    }

    // Add Next Button
    if (currentPage < totalPages) {
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next';
        nextButton.classList.add('btn', 'btn-primary');
        nextButton.addEventListener('click', () => fetchUserChats(currentPage + 1));
        paginationContainer.appendChild(nextButton);
    }
}

    
    
    // Private Chat Modal Functions
    if(openPrivateChatModalBtn){
     openPrivateChatModalBtn.addEventListener('click', () => {
        privateChatModal.style.display = 'block';
    });
   }
    

   if(closePrivateModal){
    closePrivateModal.addEventListener('click', () => {
        privateChatModal.style.display = 'none';
        privateChatError.textContent = '';
        privateChatSuccess.textContent = '';
    });
   }

    


   if(createPrivateChatBtn){
    createPrivateChatBtn.addEventListener('click', async () => {
        const recipientEmail = recipientEmailInput.value;
        privateChatError.textContent = '';
        privateChatSuccess.textContent = '';

        try {
            const response = await fetch('/chat/private', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ recipientEmail })
            });

            const data = await response.json();

            if (response.ok) {
                privateChatSuccess.textContent = data.message;
                $('#privateChatModal').modal('hide');       // Replaced line
                await fetchUserChats(); // Refresh chat list
                openChat(data.chatId); // Open the newly created chat
            } else {
                privateChatError.textContent = data.message;
            }
        } catch (error) {
            console.error('Error creating private chat:', error);
            privateChatError.textContent = 'Failed to create private chat.';
        }
    });
}


   

    // Group Chat Modal Functions
    if(openGroupChatModalBtn){
     openGroupChatModalBtn.addEventListener('click', () => {
        groupChatModal.style.display = 'block';
    });
   }
   
   if(closeGroupModal){
        closeGroupModal.addEventListener('click', () => {
            groupChatModal.style.display = 'none';
            groupChatError.textContent = '';
            groupChatSuccess.textContent = '';
        });
   }
    



   if(createGroupChatBtn){
    createGroupChatBtn.addEventListener('click', async () => {
       const groupName = groupNameInput.value;
       const recipientEmails = recipientEmailsInput.value.split(',').map(email => email.trim());
       groupChatError.textContent = '';
       groupChatSuccess.textContent = '';

       try {
           const response = await fetch('/chat/group', {
               method: 'POST',
               headers: {
                   'Content-Type': 'application/json'
               },
               body: JSON.stringify({ groupName, recipientEmails })
           });

           const data = await response.json();

           if (response.ok) {
               groupChatSuccess.textContent = data.message;
               $('#groupChatModal').modal('hide');
               await fetchUserChats(); // Refresh chat list
               openChat(data.chatId); // Open the newly created chat
           } else {
               groupChatError.textContent = data.message;
           }
       } catch (error) {
           console.error('Error creating group chat:', error);
           groupChatError.textContent = 'Failed to create group chat.';
       }
   });
  }


  
    

    // Send Message Function
    if(sendMessageBtn){
        sendMessageBtn.addEventListener('click', async () => {
            const content = messageInput.value;

            if (currentlyOpenChatId && content) {
                try {
                    const response = await fetch(`/chat/${currentlyOpenChatId}/message`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ content })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        messageInput.value = ''; // Clear input
                        await openChat(currentlyOpenChatId); // Refresh chat messages

                    } else {
                        console.error('Failed to send message:', data.message);
                        alert('Failed to send message.');
                    }
                } catch (error) {
                    console.error('Error sending message:', error);
                    alert('Failed to send message.');
                }
            } else {
                alert('Please select a chat and enter a message.');
            }
        });
    }
    

    // Socket.IO: Receive New Message
    socket.on('newMessage', (data) => {
        if (data.chatId === currentlyOpenChatId) {
            const message = data.message;
            const messageElement = document.createElement('div');
            messageElement.textContent = `${message.sender.username}: ${message.content}`;
            messagesDiv.appendChild(messageElement);
            messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll to bottom
        }
    });

    // Initial fetch of user chats
    fetchUserChats();

    // Close modal if clicked outside the modal
    window.addEventListener('click', (event) => {
        if (event.target == privateChatModal) {
            privateChatModal.style.display = 'none';
            privateChatError.textContent = '';
            privateChatSuccess.textContent = '';
             privateChatModal.setAttribute('aria-hidden', 'true');
        }
        if (event.target == groupChatModal) {
            groupChatModal.style.display = 'none';
            groupChatError.textContent = '';
            groupChatSuccess.textContent = '';
             groupChatModal.setAttribute('aria-hidden', 'true');
        }
    });
        });