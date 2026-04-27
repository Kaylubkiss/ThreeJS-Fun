import * as THREE from 'three';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js'
import { glContext } from './classes/glContext.js'



let sceneObjects = [];
let graphicsContext;
let timer;


function animate()
{
	update();
	graphicsContext.render();
	requestAnimationFrame( animate );
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
	texture.colorSpace = THREE.SRGBColorSpace;

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

	/* {
		const skyColor = 0xB1E1FF; // light blue
		const groundColor = 0xB97A20; // brownish orange
		const intensity = 2;
		const light = new THREE.HemisphereLight( skyColor, groundColor, intensity );
		graphicsContext.addObjectToScene( light );
		sceneObjects.push(light);
	}

  {

		const color = 0xFFFFFF;
		const intensity = 2.5;
		const light = new THREE.DirectionalLight( color, intensity );
		light.position.set( 5, 10, 2 );
    graphicsContext.addObjectToScene( light );
		sceneObjects.push(light);
	} */

  window.addEventListener('beforeunload', (event) => 
  {
    console.log("unloaded objects\n");
  });

}

init();

animate();