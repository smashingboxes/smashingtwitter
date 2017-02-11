const NEAR = 0.1;
const FAR = 3000;
const WIDTH = 32;

var container, controls;
var camera, scene, renderer, geometry, i, h, color, birdMesh;
var mouseX = 0, mouseY = 0, time, last = performance.now();


var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
var BOUNDS = 800, BOUNDS_HALF = BOUNDS / 2;


var gpuCompute;
var velocityVariable;
var positionVariable;
var positionUniforms;
var velocityUniforms;
var birdUniforms;


import './Bird';

let Detector = require('three/examples/js/Detector');
let stats = require('three/examples/js/libs/stats.min');
let gui = require('three/examples/js/libs/dat.gui.min');
let TrackballControls = require('three/examples/js/controls/TrackballControls');
let GPUComputationRenderer = require('./lib/GPUComputationRenderer');

//debugger;

let velocityTexture = require('./shaders/velocity.frag.glsl');
let positionTexture = require('./shaders/position.frag.glsl');
let birdFS = require('./shaders/bird.frag.glsl');
let birdVS = require('./shaders/bird.vert.glsl');

export default class App {
    constructor() {
        this._bind('_render', '_handleResize');
        this._setup3D();
        this._createScene();

        window.addEventListener('resize', this._handleResize.bind(this));
    }

    start() {
        requestAnimationFrame(this._render);
    }

    _bind(...methods) {
        methods.forEach((method) => this[method] = this[method].bind(this));
    }

    _setup3D() {
        renderer = this._renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(1);
        document.body.appendChild(renderer.domElement);

        this._setupScene();
        this._setupListeners();
        this.initComputeRenderer();
        this.initBirds();
    }

    _setupScene() {
        scene = this._scene = new THREE.Scene();
        this._scene.fog = new THREE.Fog( 0xffffff, 100, 1000 );
        camera = this._camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, NEAR, FAR);
        camera.position.y = (1.6);
        camera.position.z = (500);
    }

    _setupListeners() {
        controls = new THREE.TrackballControls( this._camera );
        controls.rotateSpeed = 1.0;
        controls.zoomSpeed = 1.2;
        controls.panSpeed = 0.8;
        controls.noZoom = false;
        controls.noPan = false;
        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;
        controls.keys = [ 65, 83, 68 ];
        controls.addEventListener( 'change', () => {
            renderer.render( scene, this._camera );
            console.log('hi');
        } );

    }

    _createScene() {
        scene = this._scene;

        var grid = new THREE.GridHelper(1000, 5, 0x333333, 0x333333);
        scene.add(grid);
    }

    initComputeRenderer() {
        gpuCompute = new GPUComputationRenderer( WIDTH, WIDTH, renderer );
        var dtPosition = gpuCompute.createTexture();
        var dtVelocity = gpuCompute.createTexture();
        this.fillPositionTexture( dtPosition );
        this.fillVelocityTexture( dtVelocity );

        velocityVariable = gpuCompute.addVariable(
            "textureVelocity",
            velocityTexture,
            dtVelocity
        );

        positionVariable = gpuCompute.addVariable(
            "texturePosition",
            positionTexture,
            dtPosition
        );

        gpuCompute.setVariableDependencies( velocityVariable, [ positionVariable, velocityVariable ] );
        gpuCompute.setVariableDependencies( positionVariable, [ positionVariable, velocityVariable ] );
        positionUniforms = positionVariable.material.uniforms;
        velocityUniforms = velocityVariable.material.uniforms;
        positionUniforms.time = { value: 0.0 };
        positionUniforms.delta = { value: 0.0 };
        velocityUniforms.time = { value: 1.0 };
        velocityUniforms.delta = { value: 0.0 };
        velocityUniforms.testing = { value: 1.0 };
        velocityUniforms.seperationDistance = { value: 1.0 };
        velocityUniforms.alignmentDistance = { value: 1.0 };
        velocityUniforms.cohesionDistance = { value: 1.0 };
        velocityUniforms.freedomFactor = { value: 1.0 };
        velocityUniforms.predator = { value: new THREE.Vector3() };
        velocityVariable.material.defines.BOUNDS = BOUNDS.toFixed( 2 );
        velocityVariable.wrapS = THREE.RepeatWrapping;
        velocityVariable.wrapT = THREE.RepeatWrapping;
        positionVariable.wrapS = THREE.RepeatWrapping;
        positionVariable.wrapT = THREE.RepeatWrapping;
        var error = gpuCompute.init();
        if ( error !== null ) {
            console.error( error );
        }
    }

    initBirds() {
        var geometry = new THREE.BirdGeometry();
        const scene = this._scene;
        // For Vertex and Fragment
        birdUniforms = {
            color: { value: new THREE.Color( 0xff2200 ) },
            texturePosition: { value: null },
            textureVelocity: { value: null },
            time: { value: 1.0 },
            delta: { value: 0.0 }
        };
        // ShaderMaterial
        var material = new THREE.ShaderMaterial( {
            uniforms:       birdUniforms,
            vertexShader:   birdVS,
            fragmentShader: birdFS,
            side: THREE.DoubleSide
        });
        birdMesh = new THREE.Mesh( geometry, material );
        birdMesh.rotation.y = Math.PI / 2;
        birdMesh.matrixAutoUpdate = false;
        birdMesh.updateMatrix();
        scene.add(birdMesh);
    }

    fillPositionTexture(texture) {
        var theArray = texture.image.data;
        for ( var k = 0, kl = theArray.length; k < kl; k += 4 ) {
            var x = Math.random() * BOUNDS - BOUNDS_HALF;
            var y = Math.random() * BOUNDS - BOUNDS_HALF;
            var z = Math.random() * BOUNDS - BOUNDS_HALF;
            theArray[ k + 0 ] = x;
            theArray[ k + 1 ] = y;
            theArray[ k + 2 ] = z;
            theArray[ k + 3 ] = 1;
        }
    }
    fillVelocityTexture(texture) {
        var theArray = texture.image.data;
        for ( var k = 0, kl = theArray.length; k < kl; k += 4 ) {
            var x = Math.random() - 0.5;
            var y = Math.random() - 0.5;
            var z = Math.random() - 0.5;
            theArray[ k + 0 ] = x * 10;
            theArray[ k + 1 ] = y * 10;
            theArray[ k + 2 ] = z * 10;
            theArray[ k + 3 ] = 1;
        }
    }

    _render(timestamp) {
        const scene = this._scene;
        const camera = this._camera;
        const renderer = this._renderer;

        renderer.render(scene, camera);

        var now = performance.now();
        var delta = (now - last) / 1000;
        if (delta > 1) delta = 1; // safety cap on large deltas
        last = now;
        positionUniforms.time.value = now;
        positionUniforms.delta.value = delta;
        velocityUniforms.time.value = now;
        velocityUniforms.delta.value = delta;
        birdUniforms.time.value = now;
        birdUniforms.delta.value = delta;
        velocityUniforms.predator.value.set( 0.5 * mouseX / windowHalfX, - 0.5 * mouseY / windowHalfY, 0 );
        mouseX = 10000;
        mouseY = 10000;
        gpuCompute.compute();
        birdUniforms.texturePosition.value = gpuCompute.getCurrentRenderTarget( positionVariable ).texture;
        birdUniforms.textureVelocity.value = gpuCompute.getCurrentRenderTarget( velocityVariable ).texture;

        requestAnimationFrame(this._render);
    }

    _handleResize(event) {
        const renderer = this._renderer;
        const camera = this._camera;

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        controls.handleResize();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
