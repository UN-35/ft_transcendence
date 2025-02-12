import {
    Mesh,
    MeshBasicMaterial,
    MeshNormalMaterial,
    Raycaster,
    SphereGeometry,
    Vector3,
} from 'three'

export default class Ball {

    constructor(scene, boundaries) {
        this.scene = scene
        this.boundaries = boundaries
        this.radius = 0.5

        this.geometry = new SphereGeometry(this.radius)
        this.material = new MeshBasicMaterial({color: 0xf1f1f1})
        this.mesh = new Mesh(this.geometry, this.material)

        this.scene.add(this.mesh);


    }

}