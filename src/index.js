const path = require('path')
const http = require('http')
const express = require('express')
const {generateMessage,generateLocationMessage} = require('./utils/messages')
const socketio = require('socket.io')
const { addUser, getUser, removeUser, getUserInRoom } = require ('./utils/users')
const app = express()
const server = http.createServer(app)
const io = socketio(server)
const Filter = require('bad-words')
const port = process.env.PORT|3000


const publicDirectoryPath = path.join(__dirname,'../public')

app.use(express.static(publicDirectoryPath))


io.on('connection',(socket) =>{
    
    console.log('New websocket connected')
   
    socket.on('join',({ username, room },callback)=>{
        const {error , user} = addUser({id:socket.id,username,room})
        if(error){
            return callback(error)
        }
        socket.join(user.room)
        
        socket.emit('message',generateMessage('admin','Welcome!!'))
        socket.broadcast.to(user.room).emit('message',generateMessage('admin',`${user.username} has joined`))
        io.to(user.room).emit('roomData',{
            room: user.room,
            users: getUserInRoom(user.room)
        })
        callback()
    })
    socket.on('sendMessage',(message,callback)=>{
         const user = getUser(socket.id)
         console.log(user.room)
        const filter  = new Filter()
        if(filter.isProfane(message)){
            return callback('profanity is not allowed')
        } 
        io.to(user.room).emit('message',generateMessage(user.username,message))
        callback()
    })

    socket.on('sendLocation',(location,callback)=>{
        const user = getUser(socket.id)

        io.to(user.room).emit('sendLocation',generateLocationMessage(user.username,location))
        callback()
    })
    socket.on('disconnect',()=>{
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessage('admin',`${user.username} has left`))
            io.to(user.room).emit('roomData',{
                room: user.room,
                users: getUserInRoom(user.room)
            })
        }
    })
 

})


server.listen(port, ()=>{
    console.log('Server is up on Port '+port)
})