

const socket = io()

const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const messageTemplate = document.querySelector('#message-template')
                            .innerHTML

const LinkTemplate = document.querySelector('#message-location-template')
                            .innerHTML

const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
const { username,room }= Qs.parse(location.search,{ignoreQueryPrefix:true})

const autoScroll = () =>{
    const $newMessage = $messages.lastElementChild

    const newMessageStyle = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight+newMessageMargin

    const visibleHeight = $messages.offsetHeight

    const containerHeight = $messages.scrollHeight

    const scrollOffset = $messages.scrollTop + visibleHeight


    if (containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight

    }



}
socket.on('message',(message)=>{
    console.log(message)
    const html = Mustache.render(messageTemplate,{
        username: message.username,
        createdAt: moment(message.createdAt).format('h:mm a'),
        message : message.text
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
})

socket.on('sendLocation',(location)=>{
    console.log(location)
    const html1 = Mustache.render(LinkTemplate,{
        username: location.username,
        location : location.url,
        createdAt: moment(location.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html1)
    autoScroll()
})
$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault();
    $messageFormButton.setAttribute('disabled','disabled')
    const message = e.target.elements.message.value
    socket.emit('sendMessage',message,(error)=>{
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value =''
        $messageFormInput.focus()
        if(error){
           return console.log(error)
        }
        console.log('Message delivered')
        
    })
})

$sendLocationButton.addEventListener('click',()=>{

    if(!navigator.geolocation){
        return alert('Location is not supported')
    }
    $sendLocationButton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position)=>{
    
        const long = position.coords.longitude
        const latit = position.coords.latitude
        const location =`https://www.google.com/maps?q=${latit},${long}`
        
        socket.emit('sendLocation',location,(error)=>{
            $sendLocationButton.removeAttribute('disabled')
            if(error){
                return console.log(error)
            } 
            console.log('Location Shared')

        })
    })
})

socket.emit('join',{
    username,
    room

},(error)=>{
    if(error){
        alert(error)
        location.href ='/'
    }
})

socket.on('roomData',({room, users})=>{

    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

