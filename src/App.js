const NEAR = 0.1;
const FAR = 9000;
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
let cameraYMax = 100;
let cameraYMin = -1000;

export default class App {
  constructor() {
    let context = this;
    window.addEventListener('resize', this._handleResize.bind(this));

        context.bindHandler('_render', '_handleResize');
        context.setup3D();
        context.createScene();

        context.start();

  }

  start() {
    let loop = () => {
      requestAnimationFrame(loop);
      this._render();
    }
    //requestAnimationFrame(this.animate.bind(this));
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
    this.scene.fog = new THREE.Fog( 0x000000, 500, 3000 );
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, NEAR, FAR);
    camera = this.camera;
    camera.position.y = (100);
    camera.position.z = (500);
  }

  setupControls() {
    let camera = this.camera;

    this.renderer.domElement.addEventListener('mousewheel', function (event) {
      event.preventDefault();
      camera.translateY( -event.deltaY );
    });
  }

  shuffle(a) {
    for (let i = a.length; i; i--) {
        let j = Math.floor(Math.random() * i);
        [a[i - 1], a[j]] = [a[j], a[i - 1]];
    }
    return a;
  }

  loadTextures() {
    let context = this;
    return new Promise(function (resolve, reject) {
      let textureLoader = new THREE.TextureLoader();

      context.background = new THREE.CubeTextureLoader()
        .setPath( '/src/assets/' )
        .load( context.shuffle(['sb-side.jpg', 'sb-side.jpg', 'sb-side.jpg', 'sb-side.jpg', 'sb-side.jpg', 'sb-side.jpg']),
          () => {
            resolve();
          },
          () => {
            // progress
          },
          () => {
            reject();
          });
    });
  }

  loadFonts() {
    return new Promise(function (resolve, reject) {
      var loader = new THREE.FontLoader();
      loader.load( 'src/assets/optimer_bold.typeface.json',
        (response) => {
          console.log(response);
          resolve(response);
        },
        () => {},
        () => {
          reject()
        });
    });
  }

  breakTweet(text) {
    let counter = 0;
    return this.decodeHTMLEntities(text)
      .split('')
      .map((text, index) => {
        if (counter > 25 && text === ' ') {
          counter = 0;
          return ' \n';
        }
        counter++;
        return text;
      })
      .join('');
  }

  decodeHTMLEntities(text) {
    var entities = {
      'amp': '&',
      'apos': '\'',
      '#x27': '\'',
      '#x2F': '/',
      '#39': '\'',
      '#47': '/',
      'lt': '<',
      'gt': '>',
      'nbsp': ' ',
      'quot': '"'
    }

    return text.replace(/&([^;]+);/gm, function (match, entity) {
      return entities[entity] || match
    })
  }

   mergeMeshes(meshes) {
    var combined = new THREE.Geometry();

    for (var i = 0; i < meshes.length; i++) {
      meshes[i].updateMatrix();
      combined.merge(meshes[i].geometry, meshes[i].matrix);
    }

    return combined;
  }

  setupContent() {
    let context = this;
    let randomPos = () => (Math.round((Math.random()*40)-20)*100);
    this.loadTextures()
      .then(() => {
        return this.loadFonts();
      })
      .then((font) => {
        let material = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          envMap: this.background
        });

        let lastBoundingBox = null;

        var geometry = new THREE.BoxBufferGeometry( 50, 50, 50 );

        for ( var i = 0; i < 500; i ++ ) {
          var object = new THREE.Mesh( geometry, material );
          object.position.x = Math.random() * 800 - 400;
          object.position.y = i * -10;
          object.position.z = Math.random() * -800 - 400;
          object.rotation.x = Math.random() * 2 * Math.PI;
          object.rotation.y = Math.random() * 2 * Math.PI;
          object.rotation.z = Math.random() * 2 * Math.PI;

          scene.add( object );

          if (object.position.y < cameraYMin + 500) {
            cameraYMin = object.position.y + 500;
          }
        }

      })
      .catch((err) => {
        console.log(err);
      });
  }

  createScene() {
    scene = this.scene;
  }

  _render(timestamp) {
    const scene = this.scene;
    const camera = this.camera;
    const renderer = this.renderer;

    if ( camera.position.y < cameraYMin ) {
      camera.translateY( Math.ceil((cameraYMin - camera.position.y) / 4) + 1 );
    }
    if ( camera.position.y > cameraYMax ) {
      camera.translateY( Math.floor((cameraYMax - camera.position.y) / 4) - 1 );
    }

    renderer.render(scene, camera);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    //controls.update();
  }

  _handleResize(event) {
    const renderer = this.renderer;
    const camera = this.camera;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    //controls.handleResize();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
