const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const PORT = process.env.PORT || 5000

const app = express()
const server = http.createServer(app)
const io = socketIo(server)

const clients = {}

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`)

    const token = socket.handshake.query.token
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
    console.log(`Client connected to ${boardId}. Total clients on this board: ${clients[boardId].size}`)

    socket.on('message', (message) => {
        console.log('Received message:', message)

        clients[boardId].forEach(client => {
            if (client !== socket) {
            client.emit('message', message)
            }
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