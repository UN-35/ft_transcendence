
import {LocalGame, createTournamentRegistration} from './main.js';

const game_local_btn = document.getElementById('game-local');
const game_tourn_btn = document.getElementById('tournament');
// const game_remote_btn = document.getElementById('game-remote');

// function toggle_game_visiblity() {
//     let game_selection_conatiner = document.querySelector('.game-section');
//     let is_game_visible = document.querySelector('.game-section').style.display == 'none' ? true : false;
//     let game_canvas = document.querySelector('canvas.webgl');

//     if (is_game_visible) {
//         game_selection_conatiner.style.display = 'block';
//         game_canvas.style.display = 'none';
//         return;
//     }
//     game_selection_conatiner.style.display = 'none';
//     game_canvas.style.display = 'block';
// }

game_local_btn.addEventListener('click', () => {
    showForm('game');
    LocalGame();
})

game_tourn_btn.addEventListener('click', () => {
    showForm('tournament-registration');
    createTournamentRegistration();
})
