/*global io:false */
var Chat = {
    name: '',
    colors: {},
    socket: undefined,
    lastMessage: '',
    randomColor: function (format) {
        var rint = Math.round(0xffffff * Math.random());
        switch (format) {
            case 'hex':
                return ('#0' + rint.toString(16)).replace(/^#0([0-9a-f]{6})$/i, '#$1');
            case 'rgb':
                return 'rgb(' + (rint >> 16) + ',' + (rint >> 8 & 255) + ',' + (rint & 255) + ')';
            default:
                return rint;
        }
    },
    
    fixUserName: function(username){
        return username.replace(/\W/gim, '_');
    },
    
    getUserColor: function(user){
        if (!(user in this.colors)) {
            this.colors[user] = this.randomColor('hex');
        }
        return this.colors[user];
    },
    
    onMessage: function(mes){
        var e = JSON.parse(mes);
        
        if (e.writing === undefined) {
            if($('#output div:last-child').hasClass('user-'+e.user)){
                $('#output div:last-child').append('<pre>' + this.escapeHTML(e.message) + '</pre>');
            }else{
                $('#output').append('<div class="user-'+e.user+'"><div class="color-box" style="background:'+this.getUserColor(e.user)+'"></div><b>' + e.user + '</b>: <pre>' + this.escapeHTML(e.message) + '</pre></div>');
            }
            $('#output').scrollTop($('#output')[0].scrollHeight);
        } else if (e.writing === true) {
            if(e.user === this.name){ return; /* don't print my status */ }
            $('#ww-' + this.fixUserName(e.user)).remove();
            $('#writing').append('<div id="ww-' + this.fixUserName(e.user) + '">' + e.user + ' is writing...</div>');
        } else if (e.writing === false) {
            $('#ww-' + this.fixUserName(e.user)).remove();
        } else {
            $('#output').append(mes);
            $('#output').scrollTop($('#output')[0].scrollHeight);
        }
    },
    
    setSocketEvents: function(){
        this.socket.on('message', $.proxy(this.onMessage, this));
    },
    
    setName: function(){
        $('#name').val($.cookie('name') || '');
        var $this = this;
        $('#set-name').click(function(){
            $this.name = $this.escapeHTML($('#name').val());
            $('#entry').attr('disabled', false);
            $.cookie('name', $this.name);
            $this.joined();
            $('#name-cont').remove();
        });
    },
    
    send: function(object, str){
        this.socket.send(JSON.stringify(object));
        if(str !== ''){
            $('#output').append(str || object.message);
            $('#output').scrollTop($('#output')[0].scrollHeight);
        } 
    },
    
    escapeHTML: function(html){
        return html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    },
    
    joined: function(){
        this.socket.emit('join',{
            name: this.name
        });
    },
    
    setKeyEvent: function(){
        var entry = $('#entry');
        var $this = this;
        var time = 0;
        entry.keyup(function(e) {
            if (e.keyCode == 13) {
                $this.send({
                    user: $this.name,
                    message: entry.val()
                }, '');
                $this.lastMessage = entry.val();
                entry.val('');
            }
            
            clearTimeout(time);
            time = setTimeout(function(){
                $this.send({
                    user: $this.name,
                    writing: (entry.val().trim() !== '')
                }, '');    
            }, 200);
        });
    },
    onServerMessage: function(){
        var $this = this;
        this.socket.on('serverMessage', function(data){
            $('#output').append('<div class="info-text" style="color:gold">' + data.message + '</div>');
            $('#entry').val($this.lastMessage);
        });
    },
    participants: function(){
        var $this = this;
        this.socket.on('join', function(data){
            $('#output').append('<div class="info-text">' + data.name + ' has joined the chat</div>');
        });
        
        this.socket.on('leave', function(data){
            $('#output').append('<div class="info-text">' + data.name + ' has left the chat</div>');
        });
        
        this.socket.on('updateParticipantList', function(data){
            $('#participants').html('');
            for(var i in data.list){
                if(data.list[i]){
                    $('#participants').append('<li style="color:'+$this.getUserColor(data.list[i])+'" >'+data.list[i]+'</li>');
                }
            }
        });
        
    },

    setOutputHeight: function(){
        var o = $('#output'), c = $('#o-cont');
        var calc = function(){
            o.css('display', 'none');
            var h = c.height()+parseFloat(c.css('padding-top'))+parseFloat(c.css('padding-bottom'));
            o.css('display', '');
            o.css('height', h);
        };
        
        calc();
        var t;
        $(window).resize(function(){
            calc();
            clearTimeout(t);
            t = setTimeout(function(){ calc(); }, 100); // Resize may happen really fast
        });
    },
    
    init: function(){
        
        this.socket = io.connect(location.hostname); 
        this.setSocketEvents();
        this.setName();
        this.participants();
        this.setKeyEvent();
        this.setOutputHeight();
        this.onServerMessage();
    }
};

$(function() {
    Chat.init();
});