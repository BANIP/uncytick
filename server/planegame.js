

class User{
    constructor(username, id){
        this.username = username;
        this.id = id;
        this.eventList = {};
    }

    emit(eventname,data){
        console.log(this.username, "이벤트 발생",eventname,data);
    }

    on(eventname,callback){
        this.eventList[eventname] = callback
    }

    trigger(eventname,datas){
        this.eventList[eventname].call(this,datas)
    }

    removeAllListeners(eventname){
        delete this.eventList[eventname]
    }
}

class Game{
    constructor(user1, user2){
        this.user1 = user1;
        this.user2 = user2;
        this.users = [user1,user2];
        this.gamepan = [[0,0,0],[0,0,0],[0,0,0]];
        this.user1.enemy = user2;
        this.user2.enemy = user1;

        this.toUsers( user => {
            user.emit("gamestart",{
                enemyUsername : user.enemy.username,
                enemyId : user.enemy.id
            });
            this.initListener(user);
            user.emit("renewgamepan",{ gamepan: this.gamepan });
        });
        this.initTurn();
        this.turnNext();
    }

    toUsers(callback){
        this.users.forEach((user) => callback(user));
    }

    initTurn(){
        const rand = Math.floor( Math.random() * 2 );
        this.turn = rand === 0 ? this.user1 : this.user2;
    }

    turnNext(){
        const isUser1Turn = this.turn.id === this.user1.id;
        this.turn = isUser1Turn ? this.user2 : this.user1;
        this.toUsers(user => {
            user.emit("servermessage",{ message: `${this.turn.username}의 턴이에요!` });
        })
    }

    initListener(user){
        const isMyTurn = (user) => user.id === this.turn.id;
        const isDrawn = ([x,y]) => this.gamepan[x][y];
        const isGameEnd = (result) => result === 1 || result === -1;
        const isGameDraw =  (result) => result === 0;

        user.on("draw",({ axis }) => {
            try{
                if( !isMyTurn(user) ) throw {message: "내 턴이 아니에요."}
                if( isDrawn(axis) ) throw {message: "이미 둔 장소에요."}

                const result = this.draw(user, axis);
                this.toUsers(user => user.emit("renewgamepan",{ gamepan: this.gamepan }));

                if( isGameEnd( result ) ){
                    const winner = result === 1 ? this.user1 : this.user2;
                    const looser = winner.enemy;
                    winner.emit("gameend",{state: "win"});
                    looser.emit("gameend",{state: "lose"});
                    this.removeListener();
                } else if ( isGameDraw(result) ){
                    console.log( isGameDraw(result))
                    this.toUsers(user => user.emit("gameend",{state: "draw"}));
                    this.removeListener();
                } else {
                    this.turnNext()
                }
                console.log(this.gamepan)

            } catch( data ) {
                if(data instanceof Error) throw data;
                user.emit("servermessage",data);
            }

            
        })
    }

    removeListener(){

        this.users.map(user => {
            user.removeAllListeners("draw");
            user.enemy = undefined;
        });
    }

    draw(user,axis){
        const [x,y] = axis;
        this.gamepan[x][y] = this.user1 === user ? 1: -1;
        return this.isWin();
    }
    /**
     * @return {number | null}
     *  1 : 플레이어1 승리
     *  2 : 플레이어2 승리
     *  0 : 무승부
     *  null : 겜 안끝남
     *              
     */
    isWin(){
        var winner = null;
        const { gamepan, isLine } = this;
        const setWinner = (array) => { 
            const result = isLine(array);
            if(result) winner = result;
        }
        //가로 
            gamepan.forEach( (array) => setWinner(array) )
        //세로
            for(let i = 0; i < 3;i++){
                const array = [0,1,2].map(v => gamepan[v][i]);
                setWinner(array)
            }
        //대각선
            {
                const array = [0,1,2].map(v => gamepan[v][v]);
                setWinner(array)
            }
            {
                const array = [0,1,2].map(v => gamepan[2-v][v]);
                setWinner(array)
            }
        if(winner) return winner
        return gamepan.every( vert => vert.every( v => v) ) ? 0 : null;
    }

    isLine(array){
        // 1: user1승리 -1: user2승리
        // 0: 채워짐 null: 제대로 안채워진
        const first = array[0]
        let isFill = true;
        const isCorrect = array.every(v => {
            if(v === 0){
                isFill = false;
                return false;
            }
            return v === first;
        })
        if( isCorrect ) return first
        return isFill ? 0 : null;
    }
}


const user1=new User("철수",1);
const user2=new User("영희",2);  
new Game(user1, user2);
user1.trigger("draw",{axis: [0,0]});
user2.trigger("draw",{axis: [0,1]});
user1.trigger("draw",{axis: [1,0]});
user2.trigger("draw",{axis: [1,1]});
user1.trigger("draw",{axis: [2,0]});
user2.trigger("draw",{axis: [2,1]});