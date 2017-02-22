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

export default class App {
  constructor() {
    let context = this;
    window.addEventListener('resize', this._handleResize.bind(this));

    fetch('http://localhost:3344')
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        context.data = data;

        context.bindHandler('_render', '_handleResize');
        context.setup3D();
        context.createScene();

        context.start();
      });

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
      camera.translateZ( event.deltaY );
    });
    // controls = new THREE.TrackballControls( camera );
    // controls.rotateSpeed = 1.0;
    // controls.zoomSpeed = 1.2;
    // controls.panSpeed = 0.8;
    // controls.noZoom = true;
    // controls.noPan = false;
    //controls.staticMoving = true;
    //controls.dynamicDampingFactor = 0.3;
    //controls.keys = [ 65, 83, 68 ];
    // controls.addEventListener( 'change', () => {
    //   this._render();
    // } );

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

        context.mergeMeshes(context.data.map((tweet, i) => {
          let textGeo = new THREE.TextGeometry( context.breakTweet(tweet), {
            font: font,
            size: 80,
            height: 2,
            // curveSegments: 3,
            // bevelThickness: 5,
            // bevelSize: 5,
            // bevelEnabled: true,
            material: 0,
            extrudeMaterial: 1
          });

          textGeo.computeBoundingBox();
          textGeo.computeVertexNormals();

          let textMesh = new THREE.Mesh( textGeo, material );
          textMesh.position.set( -1200, 200, i * -1500 );
          this.scene.add( textMesh );

          //return textMesh;
        }));
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
