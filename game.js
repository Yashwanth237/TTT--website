let boxes = document.querySelectorAll(".box");
let resetBtn = document.querySelector("#reset-btn");
let newGameBtn =document.querySelector("#new-btn");
let msgContainer = document.querySelector(".msg-container");
let msg = document.querySelector("#msg");
let turn = document.querySelector("#turn");
let playerTag = document.querySelector("#player");

let trunO = true; //playerX PlayerO
let resultTimer = null;

const winning = [
    [0,1,2],
    [0,3,6],
    [0,4,8],
    [1,4,7],
    [2,5,8],
    [2,4,6],
    [3,4,5],
    [6,7,8],
];

// Name saved by the login page
try {
    const player = sessionStorage.getItem("ttt-player");
    if (player) playerTag.textContent = `Player: ${player}`;
} catch (err) {
    // Storage unavailable; just leave the name off.
}

const showTurn = () => {
    const mark = trunO ? "O" : "X";
    turn.innerHTML = `Turn: <b class="${mark.toLowerCase()}">${mark}</b>`;
};

boxes.forEach((box, index)=>{
    box.addEventListener("click", () => {
       // console.log("Box was clicked");
        let mark;
        if(trunO){
            mark = 'O';
            trunO = false;
        }else{
            mark = 'X';
            trunO = true;
        }
        box.innerText = mark;
        box.classList.add(mark.toLowerCase());
        box.setAttribute("aria-label", `Cell ${index + 1}: ${mark}`);
        box.disabled = true;

        robot.look(index);
        robot.mood("think");
        robot.say(`${mark} on cell ${index + 1}. Your move, ${trunO ? "O" : "X"}.`);
        showTurn();

        checkWinner();
    });
});

const resetGame= () => {
    clearTimeout(resultTimer);
    trunO = true;
    enableBoxes();
    msgContainer.classList.add("hide");
    showTurn();
    robot.look(null);
    robot.mood("idle");
    robot.say("Board cleared. O goes first.");
};


const disableBoxes = () => {
    for(let box of boxes){
        box.disabled = true;
    }
};

const enableBoxes = () => {
    boxes.forEach((box, index) => {
        box.disabled = false;
        box.innerText= "";
        box.classList.remove("o", "x", "win");
        box.setAttribute("aria-label", `Cell ${index + 1}`);
    });
};

const showWinner = (winner, pattern) =>{
    msg.innerText = `Congratulations, Winner is ${winner}`;
    pattern.forEach((i) => boxes[i].classList.add("win"));
    disableBoxes();
    turn.textContent = "Game over";
    robot.look(null);
    robot.mood("win");
    robot.say(`${winner} wins! Celebration protocol engaged.`);
    // Let the winning line light up before the panel covers it
    resultTimer = setTimeout(() => {
        msgContainer.classList.remove("hide");
        newGameBtn.focus();
    }, 900);
};

const showDraw = () => {
    msg.innerText = "It's a draw";
    turn.textContent = "Game over";
    robot.look(null);
    robot.mood("draw");
    robot.say("Stalemate detected. Recalibrating…");
    resultTimer = setTimeout(() => {
        msgContainer.classList.remove("hide");
        newGameBtn.focus();
    }, 900);
};

const checkWinner = () =>{
    for(let pattern of winning){
            // boxes[pattern[0]].innerText,
            // boxes[pattern[1]].innerText,
            // boxes[pattern[2]].innerText

            let pos1val = boxes[pattern[0]].innerText;
            let pos2val = boxes[pattern[1]].innerText;
            let pos3val = boxes[pattern[2]].innerText;

            if(pos1val != "" && pos2val != "" && pos3val != ""){
                if (pos1val === pos2val && pos2val === pos3val){
                    //console.log("Winner",pos1val);

                    showWinner(pos1val, pattern);
                    return;
                }
            }
    }
    if ([...boxes].every((box) => box.innerText !== "")) {
        showDraw();
    }
};

newGameBtn.addEventListener("click",resetGame);
resetBtn.addEventListener("click",resetGame);
