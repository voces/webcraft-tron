
/* exported SphereModel */

class SphereModel extends THREE.Mesh {

	constructor() {

		const geometry = new THREE.SphereGeometry( 0.5 );
		const material = new THREE.MeshPhongMaterial( { color: 0x00ff00 } );

		super( geometry, material );

	}

}

SphereModel;
