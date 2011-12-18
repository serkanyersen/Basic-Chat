var app = require(__dirname + '/node_modules/express/').createServer();
var io = require(__dirname + '/node_modules/socket.io/').listen(app);

app.listen(process.env.PORT);

app.get('/', function(req, res) {
    res.sendfile(__dirname + '/index.html');
});

var sockets = {};
io.sockets.on('connection', function(socket) {
    sockets[socket.id] = socket;
    socket.on('disconnect', function(e) {
        try {
            delete sockets[this.id];
        }catch (er) {}
    });
    socket.on('message', function(e) {
        for (var id in sockets) {
            if (id !== this.id) {
                sockets[id].send(e);
            }
        }
    });
});