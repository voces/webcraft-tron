
/* exported CubeModel */

class CubeModel extends THREE.Mesh {

	constructor( { scale = 1, opacity } = {} ) {

		const geometry = new THREE.BoxGeometry( scale, scale, scale );

		const materialDef = { color: 0xeeeeff, vertexColors: THREE.FaceColors, shading: THREE.FlatShading };
		if ( opacity !== undefined ) {

			materialDef.opacity = opacity;
			materialDef.transparent = true;

		}

		const material = new THREE.MeshPhongMaterial( materialDef );

		super( geometry, material );

		this.accentFaces = [ ...Array( geometry.faces.length ).keys() ];

	}

}

CubeModel;
