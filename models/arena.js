
/* exported ArenaModel */

class ArenaModel extends THREE.Mesh {

	constructor( { scale = 1 } = {} ) {

		const geometry = new THREE.Geometry();

		{

			const subgeometry = new THREE.BoxGeometry( 41 * scale, scale, scale );
			const wall = new THREE.Mesh( subgeometry );
			wall.position.y = 10 * scale;

			geometry.mergeMesh( wall );

		}

		{

			const subgeometry = new THREE.BoxGeometry( 41 * scale, scale, scale );
			const wall = new THREE.Mesh( subgeometry );
			wall.position.y = - 10 * scale;

			geometry.mergeMesh( wall );

		}

		{

			const subgeometry = new THREE.BoxGeometry( scale, scale * 21, scale );
			const wall = new THREE.Mesh( subgeometry );
			wall.position.x = 21 * scale;

			geometry.mergeMesh( wall );

		}

		{

			const subgeometry = new THREE.BoxGeometry( scale, scale * 21, scale );
			const wall = new THREE.Mesh( subgeometry );
			wall.position.x = - 21 * scale;

			geometry.mergeMesh( wall );

		}

		const material = new THREE.MeshPhongMaterial( { color: 0xeeeeff } );

		super( geometry, material );

	}

}

ArenaModel;
