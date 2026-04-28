import * as THREE from 'three';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js'
import { glContext } from './classes/glContext.js'



let sceneObjects = [];
let graphicsContext;
let timer;

const fragmentShader = `
  #include <common>

  uniform vec3 iResolution;
  uniform float iTime;
  uniform sampler2D iChannel0;

  // By Daedelus: https://www.shadertoy.com/user/Daedelus
  // license: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
  #define TIMESCALE 0.25
  #define TILES 8
  #define COLOR 0.7, 1.6, 2.8

  void mainImage( out vec4 fragColor, in vec2 fragCoord )
  {
    vec2 uv = fragCoord.xy / iResolution.xy;
    uv.x *= iResolution.x / iResolution.y;

    vec4 noise = texture2D(iChannel0, floor(uv * float(TILES)) / float(TILES));
    float p = 1.0 - mod(noise.r + noise.g + noise.b + iTime * float(TIMESCALE), 1.0);
    p = min(max(p * 3.0 - 1.8, 0.1), 2.0);

    vec2 r = mod(uv * float(TILES), 1.0);
    r = vec2(pow(r.x - 0.5, 2.0), pow(r.y - 0.5, 2.0));
    p *= 1.0 - pow(min(1.0, 12.0 * dot(r, r)), 2.0);

    fragColor = vec4(COLOR, 1.0) * p;
  }

  varying vec2 vUv;

  void main() {
    mainImage(gl_FragColor, vUv * iResolution.xy);
  }
  `;

const vertexShader = `
	varying vec2 vUv;
	void main() {
		vUv = uv;
		gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
	}
`;

const movingTexture = new THREE.TextureLoader().load( 'resources/gman-face.jpg' );
movingTexture.minFilter = THREE.NearestFilter;
movingTexture.magFilter = THREE.NearestFilter;
movingTexture.wrapS = THREE.RepeatWrapping;
movingTexture.wrapT = THREE.RepeatWrapping;

const uniforms = {
	iTime: { value: 0 },
	iResolution: { value: new THREE.Vector3( 1, 1, 1 ) },
	iChannel0: { value: movingTexture },
};

const movingMaterial = new THREE.ShaderMaterial( {
	vertexShader,
	fragmentShader,
	uniforms,
} );
/////////////////


function animate( time )
{
	update();
	graphicsContext.render();
	requestAnimationFrame( animate );

	time *= .001;

	uniforms.iTime.value = time;

}

function update()
{
	timer.update();
}

function initSkybox()
{
	let rootDirectory = "/cubemaps/";
	let targetDirectory = "IceRiver/";
	let sides = ["negz", "posz", "posy", "negy", "posx", "negx"];
	let suffix = ".jpg";
	let materialArray = [];

	for (let i = 0; i < 6; ++i)
	{
		let url = rootDirectory + targetDirectory + sides[i] + suffix;
		materialArray.push( url );
	}

	const cubemapTexture = new THREE.CubeTextureLoader().load(materialArray);

	graphicsContext.addSceneBackground(cubemapTexture);
}

async function initEnvironmentMap()
{
	let rootDirectory = "/environmentmaps/"
	let file = "citrus_orchard_road_puresky_2k.hdr";

	const loader = new HDRLoader();

	const texture = await loader.loadAsync( rootDirectory + file );

	texture.mapping = THREE.EquirectangularReflectionMapping;

	graphicsContext.addSceneBackground(texture, true);

	console.log("loaded environment map " + file);

	let renderer = graphicsContext.getRenderer();

	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.0;
}

function initPerspectiveCamera()
{
	let sceneCamera = new THREE.PerspectiveCamera();
	let aspect = window.innerWidth / window.innerHeight;
	let fovy = Math.PI/2.0;
	let near = 0.1;
	let far = 1000;
	let denom = Math.tan(fovy / 2.0);
	let denom2 = far-near;

	let row1 = [1.0/(aspect * denom),0,0,0];
	let row2 = [0,1.0/(denom),0,0];
	let row3 = [0, 0,-(far + near) / denom2,-(2*far*near)/denom2 ];
	let row4 = [0,0,-1,0];

	let projectionMatrix = new THREE.Matrix4(
		row1[0],row1[1],row1[2],row1[3],
		row2[0],row2[1],row2[2],row2[3],
		row3[0],row3[1],row3[2],row3[3],
		row4[0],row4[1],row4[2],row4[3]
	);

	sceneCamera.projectionMatrix = projectionMatrix;
	sceneCamera.position.z = 5;
	sceneCamera.lookAt(0,0,0);

	return sceneCamera;

}

function initTextureObject()
{

	const geometry = new THREE.SphereGeometry(10, 32, 16);
	const obj = new THREE.Mesh(geometry, movingMaterial);

	obj.position.set(-20, 10, 0);

	graphicsContext.addObjectToScene( obj );

}

function initObjects()
{
	/*
		sphere geometry
	*/

	const geometry = new THREE.SphereGeometry(10, 32, 16);
	const material = new THREE.MeshPhongMaterial();
	const obj = new THREE.Mesh(geometry, material);

	obj.position.set(0, 10, 0);

	graphicsContext.addObjectToScene(obj);

	
	initTextureObject();

}

function init()
{
  timer = new THREE.Timer();
	
	timer.connect(document); //uses page visibility API so that there aren't crazy deltas when exiting the page.

	let sceneCamera = initPerspectiveCamera();
	
	graphicsContext = new glContext(sceneCamera);


	/*
		OBJECTS
	*/

	initEnvironmentMap();

	graphicsContext.loadObject('resources/cartoon_lowpoly_small_city_free_pack/scene.gltf');

	//making a mesh:
	//1) need material (how should light respond to hitting its surface?)
	//2) need geometry (how is the appearance defined in the coordinate space?)
	initObjects();

}

init();

animate();