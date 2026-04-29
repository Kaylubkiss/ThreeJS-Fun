import * as THREE from 'three';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { glContext } from './classes/glContext.js';
import GUI from 'lil-gui';
import { Water } from 'three/addons/objects/Water.js'

let sceneObjects = [];
let graphicsContext;
let timer;
let gui;

const fsCode = `
  #include <common>

  uniform float uTime;
  uniform sampler2D textureSampler;

  // By Daedelus: https://www.shadertoy.com/user/Daedelus
  // license: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
  #define TIMESCALE 0.25
  #define TILES 8
  #define COLOR 0.7, 1.6, 2.8
  
	in vec2 outUV;
  out vec4 outColor;

  void main() {

		vec2 uv = outUV.xy;

		vec3 texture_color = texture(textureSampler, uv).rgb;
		
    vec4 noise = texture2D(textureSampler, floor(uv * float(TILES)) / float(TILES));
    float p = 1.0 - mod(noise.r + noise.g + noise.b + uTime * float(TIMESCALE), 1.0);
    p = min(max(p * 3.0 - 1.8, 0.1), 2.0);

    vec2 r = mod(uv * float(TILES), 1.0);
    r = vec2(pow(r.x - 0.5, 2.0), pow(r.y - 0.5, 2.0));
    p *= 1.0 - pow(min(1.0, 12.0 * dot(r, r)), 2.0);

    outColor = vec4(texture_color, 1.0) * p;
  }
  `;

const vsCode = `
	out vec2 outUV;

	void main() 
	{
		outUV = uv;
		gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
	}
`;

const movingTexture = new THREE.TextureLoader().load( 'resources/gman-face.jpg' );
movingTexture.minFilter = THREE.NearestFilter;
movingTexture.magFilter = THREE.NearestFilter;
movingTexture.wrapS = THREE.RepeatWrapping;
movingTexture.wrapT = THREE.RepeatWrapping;

const vUniforms = 
{
	uTime: { value: 0 },
	textureSampler: { value: movingTexture },
};

const movingMaterial = new THREE.ShaderMaterial( {
	vertexShader: vsCode,
	fragmentShader: fsCode,
	uniforms: vUniforms,
	glslVersion: THREE.GLSL3,
} );
movingMaterial.name = "moving texture material";
/////////////////


function animate( )
{
	update();
	graphicsContext.render();
	requestAnimationFrame( animate );

	vUniforms.uTime.value = timer.getElapsed();

}

function update()
{
	timer.update();
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

	const renderer = graphicsContext.getRenderer();

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

function initGUI()
{
	gui = new GUI();
	gui.add( document, 'title' );

}

function initTextureObject()
{

	const geometry = new THREE.SphereGeometry(10, 32, 16);
	const obj = new THREE.Mesh(geometry, movingMaterial);

	obj.position.set(-20, 10, 0);
	obj.castShadow = true;
	obj.receiveShadow = true;

	graphicsContext.addObjectToScene( obj );

	const folder = gui.addFolder( "textured objection positions");
	folder.add( obj.position, 'x', -100, 100, 5);
	folder.add( obj.position, 'y', -100, 100, 5);
	folder.add( obj.position, 'z', -100, 100, 5);

}

function initObjects()
{
	/*
		sphere geometry
	*/
	const light = new THREE.PointLight(0xffffff, 10000, 1000);
	light.position.set(0, 50, 50);

	
	light.castShadow = true;

	const pointLightHelper = new THREE.PointLightHelper( light, 15 );

	const folder = gui.addFolder('Light Position');
	folder.add(light.position, 'x', -100, 100, 5).onChange((event) =>
	{
		pointLightHelper.update();
	});

	folder.add(light.position, 'y', -100, 100, 5).onChange((event)=>{
		pointLightHelper.update();
	});

	folder.add(light.position, 'z', -100, 100, 5).onChange((event)=>{
		pointLightHelper.update();
	});
	

	graphicsContext.addObjectToScene( pointLightHelper );
	graphicsContext.addObjectToScene( light );

	const geometry = new THREE.SphereGeometry(10, 32, 16);
	const material = new THREE.MeshPhongMaterial();
	const sphere = new THREE.Mesh(geometry, material);

	sphere.position.set(0, 10, 0);
	sphere.castShadow = true;
	sphere.receiveShadow = true;

	graphicsContext.addObjectToScene(sphere);
	
	initTextureObject();

	const plane = new THREE.Mesh(
		new THREE.PlaneGeometry(200, 200),
		new THREE.MeshStandardMaterial({ color: 0xF0F0F0 })
	);

	plane.receiveShadow = true;
	plane.rotation.x = -Math.PI / 2.0;

	graphicsContext.addObjectToScene(plane, true);


}

function init()
{
  timer = new THREE.Timer();
	
	timer.connect(document); //uses page visibility API so that there aren't crazy deltas when exiting the page.

	initGUI();

	let sceneCamera = initPerspectiveCamera();
	
	graphicsContext = new glContext(sceneCamera);


	/*
		OBJECTS
	*/

	initEnvironmentMap();

	//graphicsContext.loadObject('resources/cartoon_lowpoly_small_city_free_pack/scene.gltf');

	//making a mesh:
	//1) need material (how should light respond to hitting its surface?)
	//2) need geometry (how is the appearance defined in the coordinate space?)
	initObjects();

	

}

init();

animate();