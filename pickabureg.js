var mongoose = require('mongoose');
var puppeteer = require('puppeteer');
var fs = require('fs');
const express = require('express');
const checkProxy = require('check-proxy').check;
const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var eden = require('node-eden');
var random_name = require('node-random-name');
var generate = require('project-name-generator');
var md5 = require('md5');
var AccountPickabu = require(__dirname + '/models/AccountPickabu.js');
var Proxy = require(__dirname + '/proxycombain/models/Proxy.js');
mongoose.connect("mongodb://localhost/proxycombain");
process.setMaxListeners(0);
/* process.on('unhandledRejection', (reason, p) => {
     console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
 });*/
app.use(express.static('public'));

function getName() {
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
    var rnd = getRandomInt(0, 7);
    var w = [];
    w.push(random_name({
        last: true
    }));
    w.push(generate({
        words: 1
    }).raw);
    w.push(eden.adam());
    w.push(eden.word());
    w.push(eden.eve());
    w.push(random_name({
        first: true
    }));
    var rez = "";
    while (rez.length < 5) {
        //var max = getRandomInt(0, w.length);
        var max = getRandomInt(1, 3);
        for (var i = 1; i < max; i++) {
            if (i == 2) {
                w.push(getRandomInt(1917, 2020));
            }
            var index1 = getRandomInt(0, w.length);
            if (w[index1]) {
                rez += w[index1];
                //w = w.splice(index1, 1);
            }
        }
    }
    return rez;
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
var currentBrowserNubmer = 0;
var maxBrowserNubmer = 1;
var currentProxychekerNubmer = 0;
var maxProxychekerNubmer = 5;
/* confend */
io.on('connection', function(socket) {
    socket.on('startReg', function(clb) {
        var proxy;
        var browser;
        var page;
        (async () => {
            proxy = await Proxy.findOne({
                anonymityLevel: 1,
                supportsHttps: 1,
                lock: false,
                pickabu: true,
                protocol: {
                    $ne: "none"
                },
            }).sort({
                date: -1,
            }).limit(1).exec();
            console.dir(proxy);
            var status = "";
            status += "Получаю прокси<br>";
            await socket.emit('addProxy', {
                status,
                proxy
            });
            try {
                var sendScreen = async () => {
                    await page.screenshot({
                        fullPage: true,
                    }).then((img) => {
                        var img = new Buffer(img).toString('base64');
                        img = "data:image/png;base64," + img;
                        socket.emit('updateProxy', {
                            img,
                            status,
                            proxy
                        });
                    });
                };
                status += "запускаю браузер<br>";
                await socket.emit('updateProxy', {
                    status,
                    proxy
                });
                var args = [];
                //if (proxy.protocol.indexOf("http") != -1) {
                //    proxy.protocol = "http";
                //} else {
                //    proxy.protocol = "socks"
                //}
                
                args.push('--proxy-server=' + proxy.protocol + '://' + proxy.ip + ":" + proxy.port);
                //args.push('--disable-gpu');
                //args.push('--disable-extensions');
                //args.push('--headless');
                //args.push('--ignore-certificate-errors');
                //args.push('--no-sandbox');
                //args.push('--disable-setuid-sandbox');
                args.push('--user-data-dir=' + __dirname + '/pathtoprofile/' + md5(proxy.ipport) + "/");
                browser = await puppeteer.launch({
                    args: args,
                });
                page = await browser.newPage();
                await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36");
                var screenupdate = setInterval(sendScreen, 3333);
                var name = getName();
                var pass = md5(name);
                var a = await page.goto('https://pikabu.ru/html.php?id=terms').catch(() => {});
                page.on('console', msg => console.log('PAGE LOG:', ...msg.args));
                var evalconsole = await page.evaluate(async (name, pass) => {
                    $(`<style>
html, body {
    width: 999px!important;
    height: 999px!important;
    overflow: hidden!important;
}
iframe {
    position: fixed!important;
    top: 0!important;
    left: 0!important;
    z-index: 9999!important;
}
                        < /style>`).appendTo("head");
                    $(".b-sign li:nth-child(2)").click();
                    $("#signup-p").val(pass);
                    var nickresult = false;

                    function getRandomInt(min, max) {
                        return Math.floor(Math.random() * (max - min)) + min;
                    }
                    do {
                        nickresult = (await $.ajax({
                            url: "/ajax/username_check.php",
                            type: "post",
                            data: {
                                username: name
                            }
                        })).result;
                        if (!nickresult) {
                            var plate = getRandomInt(0, name.length);
                            name = name.substring(0, plate) + getRandomInt(0, 99) + name.substring(plate);
                        }
                    }
                    while (!nickresult)
                    $("#signup-u").val(name);
                    $("input[data-name=email]").val(name + "@yandex.ru");
                    return name;
                }, name, pass);
                console.dir(evalconsole);
                //await page.waitForNavigation().catch(() => {});
                status += "Страница открыта<br>";
                await socket.emit('updateProxy', {
                    status,
                    proxy
                });
                await timeout(240000);
            } catch (er) {
                console.dir(er);
                status = er;
            } finally {
                console.log("stop");
                clearInterval(screenupdate);
                await browser.close().catch(() => {});
                await socket.emit('updateProxy', {
                    status,
                    proxy
                });
            }
            clb("Ready! startReg");
        })();
        socket.on('addProxyClick', function(arg) {
            var x = arg.x;
            var y = arg.y;
            var ipport = arg.ipport;
            if (proxy.ipport != ipport) return false;
            (async () => {
                var mouse = page.mouse
                console.log("x:" + x + "y:" + y);
                await mouse.click(x, y);
                //await mouse.down();
                //await mouse.up();
                //sendScreen();
            })();
        });
    });
});
http.listen(4444, function() {
    console.log('listening on *:4444');
});
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});