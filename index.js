
/////////////////////////////////////////////////
///// Overhead
////////////////////////////////////////////////

{

	const isBrowser = new Function( "try {return this===window;}catch(e){ return false;}" )();

	//For Node (i.e., servers)
	if ( ! isBrowser ) {

		THREE = require( "three" );
		WebCraft = require( "webcraft" );

		process.stdout.on( "error", () => {} );

	}

}

/////////////////////////////////////////////////
///// Initialization
////////////////////////////////////////////////

const keyboard = {};

const app = new WebCraft.App( {

	network: { host: "notextures.io", port: 8086 },

	types: {
		doodads: [ { name: "Arena", model: "models/arena.js" } ],
		units: [
			{ name: "Bike", model: "models/cube.js" },
			{ name: "Wall", model: { path: "models/cube.js", opacity: 0.5 } }
		]
	},

	intentSystem: {

		keydown: e => {

			if ( keyboard[ e.key ] ) return;
			keyboard[ e.key ] = true;

			if ( ! app.localPlayer.bike ) return;

			const eventType = e.key === "ArrowUp" && "up" ||
				e.key === "ArrowDown" && "down" ||
				e.key === "ArrowLeft" && "left" ||
				e.key === "ArrowRight" && "right";

			if ( ! eventType ) return;

			app.network.send( { type: eventType } );

		},

		keyup: e => {

			if ( ! keyboard[ e.key ] ) return;
			keyboard[ e.key ] = false;

		}

	}

} );

new app.Arena();

const grid = [];
for ( let i = 0; i <= 40; i ++ ) grid[ i ] = [];

const bikes = [];

app.state = { players: app.players, bikes, grid };

Object.defineProperties( app.state, {
	tick: {
		get: () => ticker && { interval: ticker.interval, nextTick: ticker.time },
		set: descriptor => ticker = typeof descriptor === "object" && descriptor !== null ? app.setInterval( tick, descriptor.interval, descriptor.nextTick ) : descriptor,
		enumerable: true
	},
	startTimer: {
		get: () => startTimer && startTimer.time,
		set: time => startTimer = typeof time === "number" ? app.setTimeout( start, time ) : time,
		enumerable: true
	},
	scores: {
		get: () => app.players.slice( 0, 8 ).map( player => player.score || 0 ),
		set: scores => scores.map( ( score, i ) => app.players[ i ].score = score ),
		enumerable: true
	}
} );

const speed = 6.25;

const direction = {
	right: 0,
	up: Math.PI / 2,
	left: Math.PI,
	down: Math.PI * 3 / 2
};

const spawnLocations = [
	{ x: - 15, y: 6, facing: direction.right, speed },
	{ x: 15, y: 6, facing: direction.left, speed },
	{ x: - 15, y: 2, facing: direction.right, speed },
	{ x: 15, y: 2, facing: direction.left, speed },
	{ x: - 15, y: - 2, facing: direction.right, speed },
	{ x: 15, y: - 2, facing: direction.left, speed },
	{ x: - 15, y: - 6, facing: direction.right, speed },
	{ x: 15, y: - 6, facing: direction.left, speed }
];

let ticker;
let startTimer;

/////////////////////////////////////////////////
///// Game Logic
/////////////////////////////////////////////////

function reset() {

	const units = [ ...app.units ];

	for ( let i = 0; i < units.length; i ++ )
		units[ i ].remove();

	for ( let x = 0; x <= 40; x ++ )
		grid[ x ] = [];

	bikes.splice( 0 );

}

function start() {

	startTimer = undefined;

	reset();

	if ( WebCraft.isBrowser )
		for ( let i = 0; i < 8 && i < app.players.length; i ++ ) {

			if ( ! app.players[ i ] ) {

				document.querySelectorAll( `.row-${i} span` ).forEach( e => e.textContent = "" );
				continue;

			}

			if ( app.players[ i ]._score === undefined ) {

				const oldScore = app.players[ i ].score || 0;

				Object.defineProperty( app.players[ i ], "score", {
					get: () => app.players[ i ]._score,
					set: score => {

						app.players[ i ]._score = score;
						document.querySelector( `.row-${i} .score` ).textContent = score;

					}
				} );

				app.players[ i ].score = oldScore;

			}

			document.querySelector( `.row-${i} .player` ).textContent = app.players[ i ].color.name;

		}

	for ( let i = 0; i < 8 && i < app.players.length; i ++ ) {

		const bike = new app.Bike( Object.assign( { owner: app.players[ i ] }, spawnLocations[ i ] ) );
		app.players[ i ].bike = bike;
		bikes.push( bike );

		bike.x = app.linearTween( { start: bike.x, rate: bike.speed * Math.cos( bike.facing ), duration: Infinity } );

		bike.oldFacing = bike.facing;

	}

	tick();
	ticker = app.setInterval( tick, 1000 / speed );

}

function tick() {

	let death = false;

	for ( let i = 0; i < app.players.length && i < 8; i ++ ) {

		const bike = app.players[ i ].bike;
		if ( ! bike ) continue;

		const x = Math.round( bike.x );
		const y = Math.round( bike.y );

		if ( Math.abs( x ) < 21 && Math.abs( y ) < 10 && grid[ x + 20 ][ y + 9 ] === undefined )
			continue;

		death = true;
		app.players[ i ].bike = undefined;
		bike.kill();
		bikes.splice( bikes.indexOf( bike ), 1 );

	}

	for ( let i = 0; i < app.players.length && i < 8; i ++ ) {

		const bike = app.players[ i ].bike;
		if ( ! bike ) continue;

		const x = Math.round( bike.x );
		const y = Math.round( bike.y );

		new app.Wall( { owner: bike.owner, x: x, y: y } );
		grid[ x + 20 ][ y + 9 ] = new app.Wall( { owner: bike.owner, x: x, y: y } );

		if ( bike.facing !== bike.oldFacing ) {

			if ( bike.facing === 0 || bike.facing === Math.PI ) {

				bike.x = app.linearTween( { start: x, rate: bike.speed * Math.cos( bike.facing ), duration: Infinity } );
				bike.y = y;

			} else {

				bike.x = x;
				bike.y = app.linearTween( { start: y, rate: bike.speed * Math.sin( bike.facing ), duration: Infinity } );

			}

			bike.oldFacing = bike.facing;

		}

	}

	if ( ! death || bikes.length > 1 ) return;

	if ( bikes.length === 0 ) {

		ticker = ticker.clear();
		startTimer = app.setTimeout( start, 1000 );
		return;

	}

	const winner = bikes[ 0 ].owner;

	++ winner.score;

	winner.bike.x = winner.bike.x;
	winner.bike.y = winner.bike.y;

	ticker = ticker.clear();

	startTimer = app.setTimeout( start, 1000 );

}

/////////////////////////////////////////////////
///// Game Events
/////////////////////////////////////////////////

app.addEventListener( "playerJoin", e => {

	if ( ! WebCraft.isServer || app.players.length !== 2 ) return;

	const event = { type: "start" };

	app.setTimeout( () => ( app.network.send( event ), app.dispatchEvent( event ) ), 1000 );

} );

app.addEventListener( "start", () => start() );

app.addEventListener( "playerLeave", e => {

	if ( startTimer ) {

		startTimer.clear();
		return;

	}

	if ( e.player.bike ) {

		e.player.bike.kill();
		bikes.splice( bikes.indexOf( e.player.bike ), 1 );
		e.player.bike = undefined;

	}

	if ( bikes.length === 1 ) {

		const bike = bikes[ 0 ];

		bike.x = bike.x;
		bike.y = bike.y;

		ticker = ticker.clear();

		return;

	}

	if ( bikes.length !== 0 ) return;
	bikes = [].splice( 0 );
	ticker = ticker.clear();

} );

app.addEventListener( "state", e => {

	if ( ! WebCraft.isBrowser ) return;

	for ( let i = 0; i < e.state.bikes.length; i ++ ) {

		e.state.bikes[ i ].owner.bike = e.state.bikes[ i ];
		e.state.bikes[ i ].oldFacing = e.state.bikes[ i ].facing;

	}

} );

/////////////////////////////////////////////////
///// Player Actions
/////////////////////////////////////////////////

app.addEventListener( "up down left right", bikeEvent );

function bikeEvent( { type, player } ) {

	const bike = player.bike;

	if ( ! bike ) return;

	if ( Math.abs( ( ( bike.oldFacing + Math.PI ) % ( Math.PI * 2 ) ) - direction[ type ] ) < 1e-6 )
		return;

	bike.facing = direction[ type ];

}
