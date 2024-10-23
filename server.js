const express = require('express')
const path = require('path');
const http = require('http')
const socketIo = require('socket.io')
const jwt = require('jsonwebtoken')
const cors = require('cors')
require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const PORT = process.env.PORT || 5000

const FRONTEND_URL = 'https://wom-projekt1-ws.azurewebsites.net'



const app = express()
app.use(express.static(path.join(__dirname, 'frontend')));
const server = http.createServer(app)
const io = socketIo(server, {
    cors: {
        origin: FRONTEND_URL,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        }
})
app.use(cors({
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}))

const clients = {}

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`)

    const token = socket.handshake.query.token
    console.log("Logged token: ",token)
    const boardId = socket.handshake.query.board

    try{
        const userData = jwt.verify(token, process.env.JWT_SECRET)
        console.log(`token authorized for user ${userData.sub} ${userData.name}`)
    } catch (error) {
        console.log(error.message)
        socket.emit('error', {msg: 'ERROR: Invalid token'})
        socket.disconnect()
        return
    }
    
    if (!clients[boardId]){
        clients[boardId] = new Set()
    }
    clients[boardId].add(socket)
    console.log(`Client connected to ${boardId}. Total clients on this board: ${clients[boardId].size}`)

    socket.on('fetchNotes', async () => {
        const notes = await prisma.note.findMany({ where: { boardId } })
        socket.emit('notesFetched', notes)
    })

    socket.on('message', (message) => {
        console.log('Received message:', message)

        clients[boardId].forEach(client => {
            if (client !== socket) {
            client.emit('message', message)
            }
        })
    })

    socket.on('createNote', async (noteData) => {
        console.log('Creating a new note: ', noteData)

        const newNote = await prisma.note.create({
            data: {
                content: noteData.content,
                boardId: boardId
            }
        })

        clients[boardId].forEach(client => {
            client.emit('noteCreated', newNote)
        })
    })

    socket.on('updateNote', async (noteData) => {
        console.log('Updating note:', noteData)

        const updatedNote = await prisma.note.update({
            where: {id: noteData.noteId},
            data: {content: noteData.content}
        })

        clients[boardId].forEach(client => {
            client.emit('noteUpdated', updatedNote)
        })
    })

    socket.on('disconnect', () => {
        clients[boardId].delete(socket)
        console.log(`Client disconnected from ${boardId}. Total clients on this board: ${clients[boardId].size}`)
    })

})

server.listen(PORT, () => {
    console.log(`WebSocket server listening on port ${PORT}`)
})