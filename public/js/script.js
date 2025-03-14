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
    const profilePictureForm = document.getElementById('profilePictureForm');
    const uploadProfilePictureBtn = document.getElementById('uploadProfilePictureBtn');
    const profilePictureInput = document.getElementById('profilePicture');
    const profilePicturePreview = document.getElementById('profilePicturePreview');
    const profilePictureError = document.getElementById('profilePictureError');
    const profilePictureSuccess = document.getElementById('profilePictureSuccess');








    if (uploadProfilePictureBtn) {
        uploadProfilePictureBtn.addEventListener('click', async (e) => {
          e.preventDefault(); // Prevent default form submission (if it's a form)
    
          const file = profilePictureInput.files[0];
    
          if (!file) {
            profilePictureError.textContent = 'Please select a file to upload.';
            profilePictureSuccess.textContent = '';
            return;
          }
    
          const formData = new FormData();
          formData.append('profilePicture', file);
    
          try {
            const response = await fetch('/user/profile-picture', {
              method: 'POST',
              body: formData,
            });
    
            const data = await response.json();
    
            if (response.ok) {
              profilePictureSuccess.textContent = data.message;
              profilePictureError.textContent = '';
              profilePicturePreview.src = data.profilePicture;
            } else {
              profilePictureError.textContent = data.message;
              profilePictureSuccess.textContent = '';
            }
          } catch (error) {
            console.error('Error uploading profile picture:', error);
            profilePictureError.textContent = 'Failed to upload profile picture.';
            profilePictureSuccess.textContent = '';
          }
        });
      } else {
        console.warn("Upload Profile Picture Button not found!");
      }
    
    
      // Edit Username
      const editUsernameForm = document.getElementById('editUsernameForm');
      const editUsernameBtn = document.getElementById('editUsernameBtn');
      const newUsernameInput = document.getElementById('newUsername');
      const usernameError = document.getElementById('usernameError');
      const usernameSuccess = document.getElementById('usernameSuccess');
    
      if (editUsernameBtn) {
        editUsernameBtn.addEventListener('click', async (e) => {
          e.preventDefault(); // Prevent default form submission (if it's a form)
    
          const newUsername = newUsernameInput.value;
    
          try {
            const response = await fetch('/user/edit-username', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ newUsername }),
            });
    
            const data = await response.json();
    
            if (response.ok) {
              usernameSuccess.textContent = data.message;
              usernameError.textContent = '';
            } else {
              usernameError.textContent = data.message;
              usernameSuccess.textContent = '';
            }
          } catch (error) {
            console.error('Error updating username:', error);
            usernameError.textContent = 'Failed to update username.';
            usernameSuccess.textContent = '';
          }
        });
      } else {
        console.warn("Edit Username Button not found!");
      }
    
      // Edit Email
      const editEmailForm = document.getElementById('editEmailForm');
      const editEmailBtn = document.getElementById('editEmailBtn');
      const newEmailInput = document.getElementById('newEmail');
      const emailError = document.getElementById('emailError');
      const emailSuccess = document.getElementById('emailSuccess');
    
      if (editEmailBtn) {
        editEmailBtn.addEventListener('click', async (e) => {
          //e.preventDefault(); // Prevent default form submission (if it's a form)
    
          const newEmail = newEmailInput.value;
    
          try {
            const response = await fetch('/user/edit-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ newEmail }),
            });
    
            const data = await response.json();
    
            if (response.ok) {
              emailSuccess.textContent = data.message;
              emailError.textContent = '';
            } else {
              emailError.textContent = data.message;
              emailSuccess.textContent = '';
            }
          } catch (error) {
            console.error('Error updating email:', error);
            emailError.textContent = 'Failed to update email.';
            emailSuccess.textContent = '';
          }
        });
      } else {
        console.warn("Edit Email Button not found!");
      }



    // Function to open a specific chat
    window.openChat = async (chatId) => {
        currentlyOpenChatId = chatId;

        try {
            const response = await fetch(`/chat/${chatId}/messages`);
            const data = await response.json();

            if (response.ok) {
                messagesDiv.innerHTML = ''; // Clear existing messages
                data.messages.forEach(message => {
                    const messageElement = document.createElement('div');
                    messageElement.textContent = `${message.sender.username}: ${message.content}`; // Customize display
                    messagesDiv.appendChild(messageElement);
                });

                chatArea.style.display = 'block';
                socket.emit('joinChat', chatId);
                //Fetch the chat name if it is group
                const chatDetails = await fetchUserChats();
                let name = "";
                for (let i = 0; i < chatDetails.length; i++) {
                    if (chatDetails[i]._id == chatId) {
                        name = chatDetails[i].groupName;
                    }
                }
                chatTitle.textContent = name;
            } else {
                console.error('Failed to fetch chat messages:', data.message);
                alert('Failed to fetch chat messages.');
            }
        } catch (error) {
            console.error('Error fetching chat messages:', error);
            alert('Failed to fetch chat messages.');
        }
    };
    async function fetchUserChats() {
        try {
            const response = await fetch('/chat/chats');
            const data = await response.json();
    
            if (response.ok) {
                chatList.innerHTML = ''; // Clear existing list
    
                data.chats.forEach(chat => {
                    const chatElement = document.createElement('div');
                    chatElement.classList.add('chat-item');
    
                    // If it's a group chat, show the group name
                    if (chat.groupName) {
                        chatElement.textContent = chat.groupName;
                    } else {
                        // For private chats, filter participants by excluding the current user
                        if (chat.participants && chat.participants.length > 1) {
                            const otherParticipants = chat.participants.filter(participant => participant.username !== window.currentUsername);
    
                            // Display the username of the other participant in the private chat
                            if (otherParticipants.length > 0) {
                                chatElement.textContent = otherParticipants[0].username;  // Display the other user's username
                            }
                        } else {
                            chatElement.textContent = 'Private Chat';  // Fallback for cases with no participants
                        }
                    }
    
                    // When clicking on the chat, open the chat
                    chatElement.addEventListener('click', () => openChat(chat._id));
                    chatList.appendChild(chatElement);
                });
    
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
    
    
    // Private Chat Modal Functions
    if(openPrivateChatModalBtn){
     openPrivateChatModalBtn.addEventListener('click', () => {
        privateChatModal.style.display = 'block';
    });
   }
    

//    if(closePrivateModal){
//     closePrivateModal.addEventListener('click', () => {
//         privateChatModal.style.display = 'none';
//         privateChatError.textContent = '';
//         privateChatSuccess.textContent = '';
//     });
//    }

    


   if(createPrivateChatBtn){
    createPrivateChatBtn.addEventListener('click', async () => {
        console.log("sdfbsdf")
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