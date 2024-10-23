let token;
let boardId;
let socket;

const loginContainer = document.getElementById('login-container');
const registerContainer = document.getElementById('register-container');
const boardContainer = document.getElementById('board-container');
const boardCreator = document.getElementById('board-creator');
const boardInviter = document.getElementById('board-inviter');
const boardsNavbar = document.getElementById('boards-navbar');


boardsNavbar.style.display = 'none';


document.getElementById('show-register').addEventListener('click', function() {
    loginContainer.style.display = 'none';
    registerContainer.style.display = 'block';
});

document.getElementById('show-login').addEventListener('click', function() {
    loginContainer.style.display = 'block';
    registerContainer.style.display = 'none';
});

document.getElementById('board-creator-toggle').addEventListener('click', function() {
    
    if (boardCreator.style.display == 'none') {
        boardCreator.style.display = 'block';
    } else {
        boardCreator.style.display = 'none';
    }
});

document.getElementById('board-inviter-toggle').addEventListener('click', function() {
    
    if (boardInviter.style.display == 'none') {
        boardInviter.style.display = 'block';
    } else {
        boardInviter.style.display = 'none';
    }
});

document.getElementById('register-btn').addEventListener('click', async () => {
    const name = document.getElementById('registername').value;
    const password = document.getElementById('registerpass').value;

    if(password != document.getElementById('passwordcheck').value) {
        document.getElementById('regmessage').innerText = 'Passwords do not match. Please try again.'
        throw new Error('Passwords do not match')
    }

    try {
        const response = await fetch('https://wom-projekt1-hgdyf8h2a0fshuh0.northeurope-01.azurewebsites.net/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, password }),
        });

        if (!response.ok) {
            throw new Error('Registration failed');
        }

        const data = await response.json();
        document.getElementById('regmessage').innerText = data.message || 'User created. Redirecting...';
        setTimeout(() => {
            loginContainer.style.display = 'block';
            registerContainer.style.display = 'none';
        }, 2000);

    } catch (error) {
        console.error('Error:', error.message);
        document.getElementById('regmessage').innerText = error.message || 'An error occurred';
    }
});

document.getElementById('login-btn').addEventListener('click', async () => {
    const name = document.getElementById('name').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('https://wom-projekt1-hgdyf8h2a0fshuh0.northeurope-01.azurewebsites.net/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, password }),
        });

        if (!response.ok) {
            throw new Error('Login failed');
        }

        const data = await response.json();
        token = data.jwt;
        document.getElementById('message').innerText = data.message || 'Login successful';
        localStorage.setItem("notesJWT", token);
        loginContainer.style.display = 'none';
        boardContainer.style.display = 'block';
        boardCreator.style.display = 'none';
        boardInviter.style.display = 'none';
        boardsNavbar.style.display = 'block';

        await fetchBoards();
    } catch (error) {
        console.error('Error:', error.message);
        document.getElementById('message').innerText = error.message || 'An error occurred';
    }
});

async function fetchBoards() {
    try {
        const response = await fetch('https://wom-projekt1-hgdyf8h2a0fshuh0.northeurope-01.azurewebsites.net/boards', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch boards');
        }

        const data = await response.json();
        populateBoardSelect(data.boards);
    } catch (error) {
        console.error('Error:', error.message);
        document.getElementById('message').innerText = error.message || 'An error occurred while fetching boards';
    }
}

function populateBoardSelect(boards) {
    const boardSelect = document.getElementById('board-select');
    boardSelect.innerHTML = '';
    boards.forEach(board => {
        const option = document.createElement('option');
        option.value = board.id;
        option.text = board.title;
        boardSelect.appendChild(option);
    });

    boardSelect.addEventListener('change', (event) => {
        boardId = event.target.value;
        fetchNotes();
        setupSocket();
    });
}
//skapa ny board
document.getElementById('create-board').addEventListener('click', async () => {

  const title = document.getElementById('board-title').value;

  if(title == ""){
    document.getElementById('delete-msg').innerText = "Please enter a title"
    throw new Error("Title cannot be empty")
  }

  try {
        const response = await fetch('https://wom-projekt1-hgdyf8h2a0fshuh0.northeurope-01.azurewebsites.net/boards/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ title }),
        });

        if (!response.ok) {
            throw new Error('Board creation failed');
        }
        /*
        const data = await response.json();
        document.getElementById('board-create-msg').innerText = "";
        document.getElementById('board-create-msg').innerText = data.message || 'Board created';
        
        */
       alert('Board created!');
       await fetchBoards();

    } catch (error) {
        console.error('Error:', error.message);
        document.getElementById('board-create-msg').innerText = error.message || 'An error occurred';
    }
});
/*//ändra board titel
document.getElementById('board-edit-title').addEventListener('click', async () => {
    const newTitle = document.getElementById('edited-title').value;

    if (!newTitle) {
        document.getElementById('update-msg').innerText = 'Please enter a new title.';
        return;
    }

    try {
        const response = await fetch(`https://wom-projekt1-hgdyf8h2a0fshuh0.northeurope-01.azurewebsites.net/boards/${boardId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ title: newTitle }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.msg || 'Failed to update board title');
        }

        const data = await response.json();
        document.getElementById('board-update-msg').innerText = data.msg || 'Board title updated successfully';
        await fetchBoards();

    } catch (error) {
        console.error('Error:', error.message);
        document.getElementById('board-update-msg').innerText = error.message || 'An error occurred';
    }
});*/

//invite user
document.getElementById('invite-user').addEventListener('click', async () => {
  const username = document.getElementById('invited-user').value;

  try {
      const response = await fetch(`https://wom-projekt1-hgdyf8h2a0fshuh0.northeurope-01.azurewebsites.net/boards/${boardId}/invite`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ username }),
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.msg || 'Failed to invite user');
      }

      const data = await response.json();
      document.getElementById('invite-msg').innerText = data.msg || 'User invited successfully';
      await fetchBoards();

  } catch (error) {
      console.error('Error:', error.message);
      document.getElementById('invite-msg').innerText = error.message || 'An error occurred';
  }
});

document.getElementById('delete-board').addEventListener('click', async () => {

  try {
        const response = await fetch(`https://wom-projekt1-hgdyf8h2a0fshuh0.northeurope-01.azurewebsites.net/boards/${boardId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            }
        });

        if (!response.ok) {
            throw new Error('Board deletion failed');
        }

        const data = await response.json();
        //document.getElementById('delete-msg').innerText = data.message || 'Board deleted';
        alert('Board deleted!');
        await fetchBoards();

    } catch (error) {
        console.error('Error:', error.message);
        document.getElementById('delete-msg').innerText = error.message || 'An error occurred';
    }
});

async function fetchNotes() {
    try {
        const response = await fetch(`https://wom-projekt1-hgdyf8h2a0fshuh0.northeurope-01.azurewebsites.net/boards/${boardId}/notes`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch notes');
        }

        const data = await response.json();
        console.log('Fetched notes:', data.notes);
        displayNotes(data.notes);
    } catch (error) {
        console.error('Error:', error.message);
        document.getElementById('message').innerText = error.message || 'An error occurred while fetching notes';
    }
}
/*
function displayNotes(notes) {
    const notesContainer = document.getElementById('notes');
    notesContainer.innerHTML = '';
    notes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.innerHTML = `
            <div id="note" class="note">
                <div id="widget_content">
                <span class="note-content" data-id="${note.id}">${note.content}</span>
                <textarea type="text" class="note-input" placeholder="Edit note"></textarea>
                <button id="${note.id}">Delete Note</button>
                </div>
                </div>
        `;
        notesContainer.appendChild(noteElement);
        document.getElementById(`${note.id}`).addEventListener('click', () => {
            deleteNote();
        })
    });
    document.getElementById('notes-container').style.display = 'block';

    const noteInputs = document.querySelectorAll('.note-input');
    noteInputs.forEach(input => {
        input.addEventListener('input', (event) => {
            const noteId = event.target.closest('div').querySelector('.note-content').dataset.id;
            const content = event.target.value;
            sendNoteUpdate(noteId, content);
        });
    });
}
*/

function displayNotes(notes) {
    const notesContainer = document.getElementById('notes');
    notesContainer.innerHTML = '';

    notes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.innerHTML = `
            <div id="note-${note.id}" class="note" style="position: absolute; left: ${note.x}px; top: ${note.y}px; width: ${note.width}px; height: ${note.height}px;">
                <div class="note-header"></div>
                <textarea type="text" class="note-input" data-id="${note.id}">${note.content}</textarea>
                <button id="delete-${note.id}">X</button>
            </div>
        `;

        notesContainer.appendChild(noteElement);

        $(noteElement).draggable({
            handle: ".note-header",
            stop: function(event, ui) {
                const x = ui.position.left;
                const y = ui.position.top;
            }
        }).resizable({
            stop: function(event, ui) {
                const newSize = { width: ui.size.width, height: ui.size.height };
            }
        });

        document.getElementById(`delete-${note.id}`).addEventListener('click', () => {
            deleteNote(note.id);
        });
    });

    document.getElementById('notes-container').style.display = 'block';

    const noteInputs = document.querySelectorAll('.note-input');
    noteInputs.forEach(input => {
        input.addEventListener('input', (event) => {
            const noteId = event.target.dataset.id;
            const content = event.target.value;
            sendNoteUpdate(noteId, content);
        });
    });
}
/*
function saveNotePosition(noteId, x, y) {
    fetch(`https://wom-projekt1-hgdyf8h2a0fshuh0.northeurope-01.azurewebsites.net/boards/${boardId}/notes/${noteId}/position`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ x, y }),
    })
    .then(response => {
        console.log('Response:', response);
        if (!response.ok) {
            return response.text().then(err => {
                throw new Error(err || 'Failed to save note position');
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Note position saved successfully:', data);
    })
    .catch(error => {
        console.error('Error saving note position:', error.message);
        document.getElementById('message').innerText = 'Error saving note position: ' + error.message;
    });
} 

async function saveNoteSize(noteId, size) {
    try {
        const response = await fetch(`https://wom-projekt1-hgdyf8h2a0fshuh0.northeurope-01.azurewebsites.net/boards/${boardId}/notes/${noteId}/size`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(size),
        });

        if (!response.ok) {
            throw new Error('Failed to save note size');
        }

        console.log('Note size saved successfully');
    } catch (error) {
        console.error('Error saving note size:', error.message);
    }
} */

document.getElementById('create-note').addEventListener('click', async () => {
    const content = " "

    if (!content) {
        document.getElementById('note-msg').innerText = 'Please enter note content.';
        return;
    }

    try {
        const response = await fetch(`https://wom-projekt1-hgdyf8h2a0fshuh0.northeurope-01.azurewebsites.net/boards/${boardId}/notes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ content }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create note');
        }

        const data = await response.json();
        //document.getElementById('note-msg').innerText = data.message || 'Note created successfully';
        await fetchNotes();

    } catch (error) {
        console.error('Error:', error.message);
        document.getElementById('note-msg').innerText = error.message || 'An error occurred';
    }
});
/*
async function deleteNote() {
    const noteContent = document.querySelector('.note-content');
    const noteId = noteContent.getAttribute('data-id');

    try {
        const response = await fetch(`https://wom-projekt1-hgdyf8h2a0fshuh0.northeurope-01.azurewebsites.net/boards/${boardId}/notes/${noteId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.msg || 'Failed to delete note');
        }

        fetchNotes();
    } catch (error) {
        console.error('Error deleting note:', error.message);
        document.getElementById('message').innerText = error.message || 'An error occurred';
    }
}
*/



async function deleteNote(noteId) {
    try {
        const response = await fetch(`https://wom-projekt1-hgdyf8h2a0fshuh0.northeurope-01.azurewebsites.net/boards/${boardId}/notes/${noteId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.msg || 'Failed to delete note');
        }

        fetchNotes(); 
    } catch (error) {
        console.error('Error deleting note:', error.message);
        document.getElementById('message').innerText = error.message || 'An error occurred';
    }
}

function setupSocket() {
    if (!socket) {
        socket = io('http://localhost:5000', {
            query: { board: boardId, token: token }
        });

        socket.on('connect', () => {
            console.log('Connected to Socket.IO server');
            socket.emit('fetchNotes');
        });

        socket.on('noteUpdated', (updatedNote) => {
            const noteElement = document.querySelector(`.note-content[data-id="${updatedNote.id}"]`);
            if (noteElement) {
                noteElement.textContent = updatedNote.content;
            }
        });

        socket.on('notesFetched', (notes) => {
            displayNotes(notes);
        });

        socket.on('error', (error) => {
            console.error('Socket.IO error observed:', error);
            document.getElementById('message').innerText = 'Socket.IO connection failed. Please try again later.';
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket.IO connection disconnected:', reason);
            document.getElementById('message').innerText = 'Socket.IO connection disconnected.';
        });
    }
}

function sendNoteUpdate(noteId, content) {
    if (socket && socket.connected) {
        socket.emit('updateNote', { noteId, content });
    } else {
        console.error('Socket.IO is not connected. Cannot send message.');
        document.getElementById('message').innerText = 'Cannot send message: Socket.IO is not connected.';
    }
}