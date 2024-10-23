let token;
let boardId;
let socket;
//const apiURL = "https://wom-projekt1-hgdyf8h2a0fshuh0.northeurope-01.azurewebsites.net"
const apiURL = "http://localhost:8080"
const wssURL = "http://localhost:5000/"
//const wssURL = "wss://wom-projekt1-ws.azurewebsites.net/"

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

document.getElementById('board-refresh').addEventListener('click', function() {
    fetchBoards();
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
        const response = await fetch(`${apiURL}/users/register`, {
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
        const response = await fetch(`${apiURL}/users/login`, {
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
        const response = await fetch(`${apiURL}/boards`, {
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

    if (boardSelect.options.length > 0) {
        boardId = boardSelect.value;
        console.log('Connecting to board:', boardId);
        fetchNotes();
        setupSocket();
    }

    boardSelect.addEventListener('change', (event) => {
        
        boardId = event.target.value;
        console.log('Connecting to board:', boardId);
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
        const response = await fetch(`${apiURL}/boards/`, {
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

       alert('Board created!');
       await fetchBoards();

    } catch (error) {
        console.error('Error:', error.message);
        document.getElementById('board-create-msg').innerText = error.message || 'An error occurred';
    }
});


//invite user
document.getElementById('invite-user').addEventListener('click', async () => {
    const username = document.getElementById('invited-user').value;
  
    try {
        const response = await fetch(`${apiURL}/boards/${boardId}/invite`, {
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
        const response = await fetch(`${apiURL}/boards/${boardId}`, {
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
        alert('Board deleted!');
        await fetchBoards();

    } catch (error) {
        console.error('Error:', error.message);
        document.getElementById('delete-msg').innerText = error.message || 'An error occurred';
    }
});

async function fetchNotes() {
    try {
        const response = await fetch(`${apiURL}/boards/${boardId}/notes`, {
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

function displayNotes(notes) {
    const notesContainer = document.getElementById('notes');
    notesContainer.innerHTML = '';

    notes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.innerHTML = `
            <div id="note-${note.id}" class="note" >
                <div class="note-header"></div>
                <textarea type="text" class="note-input" data-id="${note.id}">${note.content}</textarea>
                <button id="delete-${note.id}">X</button>
            </div>
        `;

        notesContainer.appendChild(noteElement);

        $(noteElement).draggable({
            
            handle: '.note-header'});
        

        document.getElementById(`delete-${note.id}`).addEventListener('click', () => {
            socket.emit('deleteNote', note.id)
        });
    });

    document.getElementById('notes-container').style.display = 'block';

    const noteInputs = document.querySelectorAll('.note-input');
    const debouncedSendNoteUpdate = debounce(sendNoteUpdate, 300);

    noteInputs.forEach(input => {
        input.addEventListener('input', (event) => {
            const noteId = event.target.dataset.id;
            const content = event.target.value;
            debouncedSendNoteUpdate(noteId, content);
        });
    });
}


document.getElementById('create-note').addEventListener('click', async () => {
    content = "";
    socket.emit('createNote', content);
});

function setupSocket() {
    if (socket) {
        socket.disconnect(); 
        socket = null; 
    }

    socket = io(`${wssURL}`, {
        query: { board: boardId, token: token }
    });

    socket.on('connect', () => {
        console.log('Connected to Socket.IO server');
        socket.emit('fetchNotes');
    });

    socket.on('noteCreated', (note) => {
        const notesContainer = document.getElementById('notes');
        notesContainer.innerHTML = '';
        const noteElement = document.createElement('div');
        noteElement.innerHTML = `
            <div id="note-${note.id}" class="note" >
                <div class="note-header"></div>
                <textarea type="text" class="note-input" data-id="${note.id}">${note.content}</textarea>
                <button id="delete-${note.id}">X</button>
            </div>
        `;

        notesContainer.appendChild(noteElement);

        $(noteElement).draggable();

        document.getElementById(`delete-${note.id}`).addEventListener('click', () => {
            socket.emit('deleteNote', note.id)
        });
        socket.emit('fetchNotes');
    });

    socket.on('noteDeleted', (noteId) => {
        const noteElement = document.getElementById(`note-${noteId}`);
        if (noteElement) {
            noteElement.remove();
        }
        socket.emit('fetchNotes');
    });

    socket.on('noteUpdated', (updatedNote) => {
        const noteElement = document.querySelector(`.note-input[data-id="${updatedNote.id}"]`);
        if (noteElement) {
            noteElement.textContent = updatedNote.content; 
        }
    });

    
    socket.on('notesFetched', (notes) => {
        displayNotes(notes);
    });

    socket.on('error', (error) => {
        console.error('Socket.IO error:', error);
        document.getElementById('message').innerText = 'Socket.IO connection failed. Please try again later.';
    });

    socket.on('disconnect', (reason) => {
        console.log('Socket.IO disconnected:', reason);
        document.getElementById('message').innerText = 'Socket.IO connection disconnected.';
        socket = null; 
    });
}

function sendNoteUpdate(noteId, content) {
    if (socket && socket.connected) {
        socket.emit('updateNote', { noteId, content });

    } else {
        console.error('Socket.IO is not connected. Cannot send message.');
        document.getElementById('message').innerText = 'Cannot send message: Socket.IO is not connected.';
    }
}
//chatgpt lösning för server crash när man skriver för snabbt
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}
