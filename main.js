import * as THREE from 'three';
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

function initEnvironmentMap()
{

}

function init()
{
  timer = new THREE.Timer();
	
	timer.connect(document); //uses page visibility API so that there aren't crazy deltas when exiting the page.

	let sceneCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
	sceneCamera.position.z = 5;
	sceneCamera.lookAt(0,0,0);
	
	graphicsContext = new glContext(sceneCamera);


	/*
		OBJECTS
	*/

	initSkybox();

	graphicsContext.loadObject('resources/cartoon_lowpoly_small_city_free_pack/scene.gltf');

	{
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
	}

  window.addEventListener('beforeunload', (event) => 
  {
    console.log("unloaded objects\n");
  });

}

init();

animate();