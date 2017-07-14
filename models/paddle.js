
/* exported PaddleModel */

class PaddleModel extends THREE.Mesh {

	constructor( { scale = 1 } = {} ) {

		const geometry = new THREE.BoxGeometry( scale, 5 * scale, scale );
		const material = new THREE.MeshPhongMaterial( { color: 0xeeeeff, vertexColors: THREE.FaceColors, shading: THREE.FlatShading } );

		super( geometry, material );

		this.accentFaces = [ ...Array( geometry.faces.length ).keys() ];

	}

}

PaddleModel;
