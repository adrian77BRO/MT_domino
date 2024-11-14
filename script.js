const gameBoard = document.getElementById("game-board");
const playerTilesContainer = document.getElementById("player-tiles");
const messageDiv = document.getElementById("message");
const eatTileButton = document.getElementById("eat-tile");

let gameState = {
    board: [],
    playerHand: [],
    virtualHand: [],
    deck: [],
};

function initializeGame() {
    for (let i = 0; i <= 6; i++) {
        for (let j = i; j <= 6; j++) {
            gameState.deck.push(`${i}-${j}`);
        }
    }

    gameState.deck = shuffleArray(gameState.deck);
    gameState.playerHand = gameState.deck.splice(0, 7);
    gameState.virtualHand = gameState.deck.splice(0, 7);

    renderBoard();
    renderPlayerTiles();
    updateDeckCount();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function renderPlayerTiles() {
    playerTilesContainer.innerHTML = '';
    gameState.playerHand.forEach(tile => {
        const tileDiv = document.createElement("div");
        tileDiv.className = "tile";
        tileDiv.innerText = tile;
        tileDiv.onclick = () => playTile(tile);
        playerTilesContainer.appendChild(tileDiv);
    });
}

function renderBoard() {
    gameBoard.innerHTML = '';
    gameState.board.forEach(tile => {
        const tileDiv = document.createElement("div");
        tileDiv.className = "tile";
        tileDiv.innerText = tile;
        gameBoard.appendChild(tileDiv);
    });
}

function updateDeckCount() {
    eatTileButton.innerText = `Tomar ficha (${gameState.deck.length})`;
    eatTileButton.disabled = gameState.deck.length === 0;
}

async function validateMove(newTile) {
    if (gameState.board.length === 0) {
        return true;
    }

    const boardString = gameState.board.map(tile => `(${tile})`).join('') + `(${newTile})`;
    console.log(boardString);
    const response = await fetch("http://127.0.0.1:5000/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ board: boardString })
    });
    const result = await response.json();
    return result.valid;
}

function normalizeTileForBoard(tile, rightEnd) {
    const [left, right] = tile.split("-").map(Number);

    if (right === rightEnd) {
        return `${right}-${left}`;
    }
    return tile;
}

async function playTile(tile) {
    const rightEnd = gameState.board.length > 0 ? parseInt(gameState.board[gameState.board.length - 1].split("-")[1]) : null;
    const normalizedTile = rightEnd !== null ? normalizeTileForBoard(tile, rightEnd) : tile;

    if (await validateMove(normalizedTile)) {
        gameState.board.push(normalizedTile);
        gameState.playerHand = gameState.playerHand.filter(t => t !== tile);
        renderBoard();
        renderPlayerTiles();
        messageDiv.innerText = "Ficha jugada. Turno del oponente...";
        checkGameEnd();

        if (gameState.playerHand.length === 0) {
            messageDiv.innerText = "¡Felicidades! Ganaste, te quedaste sin fichas.";
            return;
        }
        setTimeout(playVirtualMove, 1000);
    } else {
        if (await hasPlayableTile(gameState.playerHand)) {
            messageDiv.innerText = "Movimiento inválido. Intente de nuevo.";
        } else if (gameState.deck.length > 0) {
            eatTile();
            messageDiv.innerText = "Comiendo una ficha...";
        } else {
            messageDiv.innerText = "No tienes jugadas válidas y no hay fichas para comer. Es turno del oponente.";
            setTimeout(playVirtualMove, 1000);
        }
    }
}

async function playVirtualMove() {
    const rightEnd = gameState.board.length > 0 ? parseInt(gameState.board[gameState.board.length - 1].split("-")[1]) : null;

    while (true) {
        let played = false;
        for (let tile of gameState.virtualHand) {
            const normalizedTile = rightEnd !== null ? normalizeTileForBoard(tile, rightEnd) : tile;
            if (await validateMove(normalizedTile)) {
                gameState.board.push(normalizedTile);
                gameState.virtualHand = gameState.virtualHand.filter(t => t !== tile);
                played = true;
                break;
            }
        }
        if (played) {
            renderBoard();
            checkGameEnd();
            if (gameState.virtualHand.length === 0) {
                messageDiv.innerText = "El oponente ha ganado, se quedó sin fichas.";
                return;
            }
            messageDiv.innerText = "Es tu turno.";
            return;
        }
        if (gameState.deck.length > 0) {
            let newTile = gameState.deck.pop();
            gameState.virtualHand.push(newTile);
            updateDeckCount();
            continue;
        }
        messageDiv.innerText = "El oponente no tiene jugadas válidas y no quedan fichas para comer.";
        checkGameEnd();
        return;
    }
}

async function hasPlayableTile(hand) {
    for (let tile of hand) {
        const rightEnd = gameState.board.length > 0 ? parseInt(gameState.board[gameState.board.length - 1].split("-")[1]) : null;
        const normalizedTile = rightEnd !== null ? normalizeTileForBoard(tile, rightEnd) : tile;
        if (await validateMove(normalizedTile)) return true;
    }
    return false;
}

async function checkGameEnd() {
    if (gameState.deck.length === 0 &&
        !(await hasPlayableTile(gameState.playerHand)) &&
        !(await hasPlayableTile(gameState.virtualHand))) {
        endGame();
    }
}

function eatTile() {
    if (gameState.deck.length > 0) {
        let newTile = gameState.deck.pop();
        gameState.playerHand.push(newTile);
        renderPlayerTiles();
        updateDeckCount();
        messageDiv.innerText = `Has tomado una ficha: ${newTile}.`;
    } else {
        messageDiv.innerText = "No quedan fichas en el mazo.";
    }
}

function endGame() {
    const playerScore = calculateScore(gameState.playerHand);
    const virtualScore = calculateScore(gameState.virtualHand);

    if (gameState.playerHand.length === 0) {
        messageDiv.innerText = `¡Ganaste! Te quedaste sin fichas.`;
    } else if (gameState.virtualHand.length === 0) {
        messageDiv.innerText = `¡Perdiste! El oponente se quedó sin fichas.`;
    } else if (playerScore < virtualScore) {
        messageDiv.innerText = `¡Ganaste! Puntuación: Tú ${playerScore} - Oponente ${virtualScore}`;
    } else if (playerScore > virtualScore) {
        messageDiv.innerText = `¡Perdiste! Puntuación: Tú ${playerScore} - Oponente ${virtualScore}`;
    } else {
        messageDiv.innerText = `Es un empate. Puntuación: Tú ${playerScore} - Oponente ${virtualScore}`;
    }
}

function calculateScore(hand) {
    return hand.reduce((sum, tile) => {
        const [left, right] = tile.split("-").map(Number);
        return sum + left + right;
    }, 0);
}

initializeGame();