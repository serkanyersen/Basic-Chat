var express = require(__dirname + '/node_modules/express/');
var app = express.createServer(express.static(__dirname + '/public'));
var os = require('os');
var io = require(__dirname + '/node_modules/socket.io/').listen(app);

app.listen(process.env.PORT);

var sockets = {};

if(os.hostname().match('heroku') && false){
    io.configure(function(){
        io.set("transports", ["xhr-polling"]); 
        io.set("polling duration", 10); 
    });
}

io.sockets.on('connection', function(socket) {
    sockets[socket.id] = socket;
    
    socket.on('disconnect', function() {
        var list = [];
        for (var id in sockets) {
            sockets[id].emit('leave', {id:this.id, name: this.name});
            if(id !== this.id){
                list.push(sockets[id].name);
            }
        }
        
        for (id in sockets) {
            sockets[id].emit('updateParticipantList', {list: list});
        }
        
        try {
            delete sockets[this.id];
        }catch (er) {}
    });
    
    socket.on('join', function(data){
        var list = [];
        for (var id in sockets) {
            socket.name = data.name;
            data.id = socket.id;
            sockets[id].emit('join', data);
            list.push(sockets[id].name);
        }
        list.push(os.hostname());
        list.push(os.type());
        list.push(os.platform());
        for (id in sockets) {
            sockets[id].emit('updateParticipantList', {list: list});
        }
    });
    
    socket.on('message', function(e) {
        for (var id in sockets) {
            //if (id !== this.id) {
                sockets[id].send(e);
                
            //}
        }
    });
});