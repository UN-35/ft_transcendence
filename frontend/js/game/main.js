import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import * as THREE from 'three';
import Ball from './Ball.js';
import Paddle from './Paddle.js';
import ScoreDisplay from './manage-scores.js';
export { LocalGame, createTournamentRegistration, TournamentGame };

let game_animation_stopped = false;

function key_up_handler(event) {

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        this.pad_direction = 0;
        this.player = "player1"

    }

    if (event.key === 'w' || event.key === 's') {
        this.pad_direction = 0;
        this.player = "player2"
    }

    this.socket.send(JSON.stringify({
        type: 'update_player',
        pad_direction: this.pad_direction,
        player: this.player
    }));
}

let gameStarted = false

function key_down_handler(event) {
    if (event.key === 'ArrowUp') {
        this.pad_direction = 1;
        this.player = "player1"
    } else if (event.key === 'ArrowDown') {
        this.pad_direction = -1;
        this.player = "player1"

    }

    if (event.key === 'w') {
        this.pad_direction = 1;
        this.player = "player2"

    } else if (event.key === 's') {
        this.pad_direction = -1;
        this.player = "player2"

    }

    if (event.code === "Space") {
        console.log("Game Started!");
        game_animation_stopped = false;
        if (gameStarted == false) {
            this.socket.send(JSON.stringify({
                type: "game_started",
                boundaries: { x: this.boundaries.x, y: this.boundaries.y }
            }));
            gameStarted = true;
        }
        this.tic()
    }

    this.socket.send(JSON.stringify({
        type: 'update_player',
        pad_direction: this.pad_direction,
        player: this.player
    }));

}

const scene = new THREE.Scene();
let pad_direction = 0;


// Canvas
const canvas = document.querySelector('canvas.webgl');

const boundaries = new THREE.Vector2(12, 23)
const planGeometry = new THREE.PlaneGeometry(
    boundaries.x * 3,
    boundaries.y * 3,
)
planGeometry.rotateX(-Math.PI * 0.5)
const planMaterial = new THREE.MeshBasicMaterial({
    wireframe: true,
    color: 0x161616
})

//add the plan
const plan = new THREE.Mesh(planGeometry, planMaterial)
plan.position.y = -0.5
plan.receiveShadow = true
scene.add(plan);


const boundGeometry = new RoundedBoxGeometry(1, 2, boundaries.y * 2, 5, 0.5)
const boundMaterial = new THREE.MeshBasicMaterial({ color: 0x559155 })
const leftBound = new THREE.Mesh(boundGeometry, boundMaterial)
leftBound.position.x = -boundaries.x - 0.5

const rightBound = leftBound.clone()
rightBound.position.x *= -1

scene.add(leftBound, rightBound)

const player1Paddle = new Paddle(scene, boundaries, new THREE.Vector3(0, 0, 19))
const player2Paddle = new Paddle(scene, boundaries, new THREE.Vector3(0, 0, -19))


// Camera
const camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1);
camera.position.set(-10, 30, 0);
scene.add(camera);


// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const display_score = new ScoreDisplay(scene)
const ball = new Ball(scene, boundaries)

const local_game_socket = new WebSocket("ws://127.0.0.1:8000/ws/local-game/")


function LocalGame() {

    let player = null
    let context = { 
        socket: local_game_socket,
        tic,
        boundaries,
        pad_direction,
        player,
    };


    let up = key_up_handler.bind(context);
    let down = key_down_handler.bind(context);
    document.addEventListener('keydown', down);
    document.addEventListener('keyup', up);

    let stopped = false;
    const clean_up = () => {
        document.removeEventListener('keydown', down);
        document.removeEventListener('keyup', up);
    }

    renderer.render(scene, camera)

    function tic() {
        console.log('hey')
        display_score.updateScores(player1Paddle.score, player2Paddle.score)
        controls.update()

        renderer.render(scene, camera)
        if (stopped != true)
            requestAnimationFrame(tic)
    }

 
    local_game_socket.onopen = () => {
        console.log("Websocket connection established")
    }


    local_game_socket.onmessage = (_event) => {
        let data = JSON.parse(_event.data)
        const type = data.type

        if (type === 'updates') {
            player1Paddle.mesh.position.x = data.player1_pos
            player2Paddle.mesh.position.x = data.player2_pos
            ball.mesh.position.set(
                data.ball_position.x,
                data.ball_position.y,
                data.ball_position.z,
            )
            player1Paddle.score = data.player1_score
            player2Paddle.score = data.player2_score

            if ((player1Paddle.score ?? 0) >= 3 || (player2Paddle.score ?? 0) >= 3) {
                player1Paddle.score = 0;
                player2Paddle.score = 0;
                stopped = true;
                clean_up();
                showForm('dashboard');
            }
            
        }
        if (type === 'match_ended') {
            gameStarted = false;
        }
    }

    local_game_socket.onerror = () => {
        console.error("Websocket error")
    }

    local_game_socket.onclose = () => {
        console.log("Websocket connection closed ")
    }

}


function createTournamentRegistration() {
    const startBtn = document.getElementById('tournamentBtn');
    const errorMsg = document.getElementById('error-message');

    startBtn.addEventListener('click', () => {
        const players = {
            player1: document.getElementById('player1').value.trim(),
            player2: document.getElementById('player2').value.trim(),
            player3: document.getElementById('player3').value.trim(),
            player4: document.getElementById('player4').value.trim()
        };

        if (Object.values(players).some(name => !name)) {
            errorMsg.textContent = 'All player names are required';
            errorMsg.style.display = 'block';
            return;
        }

        const uniqueNames = new Set(Object.values(players));
        if (uniqueNames.size !== 4) {
            errorMsg.textContent = 'All player names must be unique';
            errorMsg.style.display = 'block';
            return;
        }

        showForm('game');

        TournamentGame(players);
    });
}



function TournamentGame(players) {
    const tourn_socket = new WebSocket("ws://127.0.0.1:8000/ws/tournament-game/")
    let player = null
    // const boundaries = new THREE.Vector2(12, 23)
    
    let context = {
        socket: tourn_socket,
        tic,
        boundaries,
        pad_direction,
        player

    };
    let up = key_up_handler.bind(context);
    let down = key_down_handler.bind(context);
    document.addEventListener('keydown', down);
    document.addEventListener('keyup', up);

    const clean_up = () => {
        document.removeEventListener('keydown', down);
        document.removeEventListener('keyup', up);
    }

    let tournamentUI = document.querySelector('div.game-info')

    tournamentUI.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 20px;
    border-radius: 8px;
    z-index: 1000;
    min-width: 200px;
    `;


    renderer.render(scene, camera)
    function tic() {

        display_score.updateScores(player1Paddle.score, player2Paddle.score)
        controls.update()

        renderer.render(scene, camera)
        if (game_animation_stopped != true)
            requestAnimationFrame(tic)
    }

    tourn_socket.onopen = () => {
        console.log("Websocket connection established");
        tourn_socket.send(JSON.stringify({
            type: 'register_players',
            players: players
        }));
    }

    tourn_socket.onmessage = (_event) => {
        let data = JSON.parse(_event.data)
        const type = data.type

        if (type === 'tournament_update') {
            updateTournamentUI(data.matches);
        }
        if (type === 'next_match') {
            player1Paddle.score = 0
            player2Paddle.score = 0

            gameStarted = false
            game_animation_stopped = false

            tournamentUI.innerHTML = `
                <h2>Final Game</h2>
                <div>
                    ${data.player2} vs ${data.player1}
                </div>
                <div>Press Space to start the match</div>
            `
        }
        if (type === 'tournament_complete') {
            tournamentUI.innerHTML = `
                <h2>Tournament Complete!</h2>
                <div>Winner: ${data.winner}</div>
                <button onclick="location.reload()">Play Again</button>
            `;
            gameStarted = false;
            clean_up();
            showForm('dashboard');
        }

        if (type === 'player_list') {
            displayPlayerSelection(data.players)
        }


        if (type === 'updates') {
            player1Paddle.mesh.position.x = data.player1_pos
            player2Paddle.mesh.position.x = data.player2_pos
            ball.mesh.position.set(
                data.ball_position.x,
                data.ball_position.y,
                data.ball_position.z,
            )
            player1Paddle.score = data.player1_score
            player2Paddle.score = data.player2_score

            if ((player1Paddle.score ?? 0) >= 3 || (player2Paddle.score ?? 0) >= 3) {
                player1Paddle.score = 0;
                player2Paddle.score = 0;
                game_animation_stopped = true;
                gameStarted = false;
            }

        }
    }
    function updateTournamentUI(matches) {
        let html = '<h2>Tournament Progress</h2>';

        html += '<h3>Semifinals</h3>';
        html += `<div>Match 1: ${matches[0].player2} vs ${matches[0].player1}</div>`;
        html += `<div>Match 2: ${matches[1].player2} vs ${matches[1].player1}</div>`;

        tournamentUI.innerHTML = html;
    }

    function displayPlayerSelection(players) {
        tournamentUI.innerHTML = `
            <h2>Select Player</h2>
            ${Object.entries(players).map(([id, player]) => `
                <button 
                    ${player.connected ? 'disabled' : ''} 
                    onclick="${selectPlayer(id)}"
                >
                    ${player.name} ${player.connected ? '(Taken)' : ''}
                </button>
            `).join('')}
        `;
    }
    function selectPlayer(id) {
        tourn_socket.send(JSON.stringify({
            type: 'select_player',
            player_id: id
        }));
    }

    tourn_socket.onerror = () => {
        console.error("Websocket error")
    }

    tourn_socket.onclose = () => {
        console.log("Websocket connection closed ")
    }
}
