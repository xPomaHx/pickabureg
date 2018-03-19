$(function() {
    var socket = io();
    socket.on('updateProxy', function(iproxy) {
        var img = iproxy.img;
        var proxy = iproxy.proxy;
        proxy.status = iproxy.status;
        proxy.img = img;
        var index = app.proxys.findIndex(el => el.ipport === proxy.ipport);
        Vue.set(app.proxys, index, proxy);
    });
    socket.on('addProxy', function(iproxy) {
        var proxy = iproxy.proxy;
        proxy.status = iproxy.status+"";
        app.proxys.push(proxy);
    });
    var app = new Vue({
        el: '#proxylistcheker',
        data: {
            proxys: [],
        },
        methods: {
            sendClickCords: function(proxy, e) {
                var x = e.pageX - e.target.offsetLeft;
                var y = e.pageY - e.target.offsetTop;
                var ipport = "";
                var arg = {
                    x: x,
                    y: y,
                    ipport: proxy.ipport,
                };
                socket.emit('addProxyClick', arg);
            },
            startReg: function() {
                socket.emit('startReg', function(msg) {
                    console.dir(msg);
                });
            }
        },
    });
});