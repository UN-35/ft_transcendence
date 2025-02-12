import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { MeshBasicMaterial, Mesh, DoubleSide } from 'three';

export default class ScoreDisplay {
    constructor(scene) {
        this.scene = scene;
        this.player1Text = null;
        this.player2Text = null;
        this.loader = new FontLoader();
        this.font = null;
        this.init();
    }

    init() {
        this.loader.load('https://cdn.jsdelivr.net/npm/three/examples/fonts/helvetiker_regular.typeface.json', (font) => {
            this.font = font;
            this.createScoreDisplays('0', '0');
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (err) => {
            console.error('An error happened while loading the font:', err);
        });
    }

    createScoreDisplays(score1, score2) {
        if (!this.font) return;

        const textOptions = {
            font: this.font,
            size: 5,
            depth: 0.1,
            curveSegments: 12,
            bevelEnabled: false
        };

        const textMaterial = new MeshBasicMaterial({ 
            color: 0x559155,
            side: DoubleSide
        });

        if (this.player1Text) {
            // this.player1Text.dispose();
            this.scene.remove(this.player1Text);
        }
        if (this.player2Text) {
            // this.player2Text.dispose();
            this.scene.remove(this.player2Text);
        }

        if (this.player1Gometry) this.player1Geometry.dispose();
        if (this.player2Geometry) this.player2Geometry.dispose();

        this.player1Geometry = new TextGeometry(score1, textOptions);
        this.player2Geometry = new TextGeometry(score2, textOptions);

        this.player1Geometry.computeBoundingBox();
        this.player2Geometry.computeBoundingBox();

        this.player1Text = new Mesh(this.player1Geometry, textMaterial);
        this.player2Text = new Mesh(this.player2Geometry, textMaterial);


        this.player1Text.position.set(0, 0, 6);
        this.player2Text.position.set(0, 0, -10);

        this.player1Text.rotation.x = -Math.PI / 2;
        this.player2Text.rotation.x = -Math.PI / 2;

        this.player1Text.rotation.z = -Math.PI / 2;
        this.player2Text.rotation.z = -Math.PI / 2;

        this.scene.add(this.player1Text);
        this.scene.add(this.player2Text);
    }

    updateScores(player1Score, player2Score) {
        this.createScoreDisplays(
            player1Score.toString(),
            player2Score.toString()
        );
    }
}