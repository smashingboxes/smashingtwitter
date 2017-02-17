const NEAR = 0.1;
const FAR = 3000;
const WIDTH = 64;

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
require('three/examples/js/controls/TrackballControls');

let Detector = require('three/examples/js/Detector');
let stats = require('three/examples/js/libs/stats.min');
let gui = require('three/examples/js/libs/dat.gui.min');
let GPUComputationRenderer = require('./lib/GPUComputationRenderer');
let velocityTexture = require('./shaders/velocity.frag.glsl');
let positionTexture = require('./shaders/position.frag.glsl');
let birdFS = require('./shaders/bird.frag.glsl');
let birdVS = require('./shaders/bird.vert.glsl');

export default class App {
  constructor() {
    this.bindHandler('_render', '_handleResize');
    this.setup3D();
    this.createScene();

    window.addEventListener('resize', this._handleResize.bind(this));
  }

  start() {
    let loop = () => {
      requestAnimationFrame(loop);
      this._render();
    }
    requestAnimationFrame(this.animate.bind(this));
    requestAnimationFrame(loop);
  }

  bindHandler(...methods) {
    methods.forEach((method) => this[method] = this[method].bind(this));
  }

  setup3D() {
    renderer = this.renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(1);
    document.body.appendChild(renderer.domElement);

    this.setupScene();
    this.setupControls();
    this.setupContent();
  }

  setupScene() {
    scene = this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog( 0xffffff, 100, 1000 );
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, NEAR, FAR);
    camera = this.camera;
    camera.position.y = (100);
    camera.position.z = (500);
  }

  setupControls() {
    controls = new THREE.TrackballControls( this.camera );
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;
    controls.keys = [ 65, 83, 68 ];
    controls.addEventListener( 'change', () => {
      console.log('controls')
      this._render();
    } );
  }

  setupContent() {
    let material = new THREE.MeshPhongMaterial( { color: 0xdddddd, specular: 0x009900, shininess: 0, shading: THREE.SmoothShading,transparent: true } );
    let box = new THREE.Mesh( new THREE.BoxGeometry( 100, 100, 100, 4, 4, 4 ), material );
    box.position.set( -200, 0, 0 );
    this.scene.add( box );
  }

  createScene() {
    scene = this.scene;

    var grid = new THREE.GridHelper(1000, 5, 0x333333, 0x333333);
    scene.add(grid);
  }

  _render(timestamp) {
    const scene = this.scene;
    const camera = this.camera;
    const renderer = this.renderer;

    renderer.render(scene, camera);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    controls.update();
  }

  _handleResize(event) {
    const renderer = this.renderer;
    const camera = this.camera;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    controls.handleResize();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
