const http = require("http");
const app = require("express")();
app.listen(9091, ()=> console.log("Listen on http port 9091"));

app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));
// hashmap
const clients = {};
const games = {};
const websocketServer = require('websocket').server;
const httpServer = http.createServer();
httpServer.listen(9090, ()=>{
    console.log("listen 9090");
});

const wsServer = new websocketServer({
    "httpServer": httpServer,
});

wsServer.on('request', request =>{
    //connect
    const connection = request.accept(null, request.origin);
    connection.on('open', ()=> console.log("Open!"));
    connection.on('close', ()=> console.log("close!"));
    connection.on('message', massage =>{
        const result = JSON.parse(massage.utf8Data);
        
        //user create new game
        if(result.method === 'create'){
            const clientId = result.clientId;
            const gameId = guid();
            games[gameId] = {
                'id': gameId,
                'balls': 20,
                'clients': [],
            }

            const payLoad = {
                'method': 'create',
                'game':games[gameId],
            }

            const con = clients[clientId].connection;
            con.send(JSON.stringify(payLoad));
        }

        //join method
        if(result.method === 'join'){
            
            const clientId = result.clientId;
            const gameId = result.gameId;
            const game = games[gameId];
            if(game.clients.length >= 3){
                console.log("Max player");
                return;
            }
            
            const color = {'0':'red', '1': 'blue', '2': 'green'}[game.clients.length];
            game.clients.push({
                'clientId': clientId,
                'color': color,
            });

            //start game
            if(game.clients.length === 3){ //Проверить ошибку
                updateGameState();
            }

            const payLoad = {
                'method': 'join',
                'game': game,
            }

            game.clients.forEach(client => {
                clients[client.clientId].connection.send(JSON.stringify(payLoad));
            });

            // play
            if(result.method === 'play'){
                const clientId = result.clientId;
                const gameId = result.gameId;
                const ballId = result.ballId;

                let state = games[gameId].state;
                if(!state){
                    state = {};
                }

                state[ballId] = color;
                games[gameId].state = state;

                const game = games[gameId];
                const payLoad = {
                    'method': 'play',
                    'game': game,
                }
            }

        }
    });
    const clientId = guid();
    clients[clientId] = {
        'connection': connection,
    }

    const payLoad = {
        'method': 'connect',
        'clientId': clientId,
    }

    //send back the clients connect
    connection.send(JSON.stringify(payLoad));
});

function updateGameState(){

    for(const g of Object.keys(games)){
        const game = games[g];

        const payLoad = {
            'method': 'update',
            'game': game
        }
        game.clients.forEach(c =>{
            clients[c.clientId].connection.send(JSON.stringify(payLoad));
        });
    }

    setTimeout(updateGameState, 500);
}

//code to create id from stack overflow
function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}
 
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();