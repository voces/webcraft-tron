
/////////////////////////////////////////////////
///// Overhead
////////////////////////////////////////////////

{

	const isBrowser = new Function( "try {return this===window;}catch(e){ return false;}" )();

	//For Node (i.e., servers)
	if ( ! isBrowser ) {

		THREE = require( "three" );
		WebCraft = require( "webcraft" );

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

app.state = {
	players: app.players
};

Object.defineProperty( app.state, "start", {
	get: () => startTimeout && startTimeout.time,
	set: time => startTimeout = startTimeout = app.setTimeout( start, time, true ),
	enumerable: true
} );

const spawnLocations = [
	{ x: - 15, y: 6, facing: 0, speed: 10 },
	{ x: 15, y: 6, facing: Math.PI, speed: 10 },
	{ x: - 15, y: 2, facing: 0, speed: 10 },
	{ x: 15, y: 2, facing: Math.PI, speed: 10 },
	{ x: - 15, y: - 2, facing: 0, speed: 10 },
	{ x: 15, y: - 2, facing: Math.PI, speed: 10 },
	{ x: - 15, y: - 6, facing: 0, speed: 10 },
	{ x: 15, y: - 6, facing: Math.PI, speed: 10 }
];

let tick;
let startTimeout;

/////////////////////////////////////////////////
///// Game Logic
/////////////////////////////////////////////////

function reset() {

	if ( ! WebCraft.isBrowser ) return;

	app.state.leftScore = app.state.rightScore = document.getElementById( "left-score" ).textContent = document.getElementById( "right-score" ).textContent = 0;

}

function init() {

	// leftPaddle.owner = app.players[ 0 ];
	// rightPaddle.owner = app.players[ 1 ];

}

function start() {

	for ( let i = 0; i < 8 && i < app.players.length; i ++ ) {

		const bike = new app.Bike( Object.assign( { owner: app.players[ i ] }, spawnLocations[ i ] ) );
		app.players[ i ].bike = bike;

		bike.x = app.linearTween( { start: bike.x, rate: bike.speed * Math.cos( bike.facing ), duration: Infinity } );

		bike.oldFacing = bike.facing;

	}

	tickFunc();
	tick = app.setInterval( tickFunc, 100 );

}

function tickFunc() {

	for ( let i = 0; i < app.players.length && i < 8; i ++ ) {

		const bike = app.players[ i ].bike;
		if ( ! bike ) continue;

		if ( Math.abs( bike.x ) > 19 || Math.abs( bike.y ) > 8 ) {

			app.players[ i ].bike = undefined;
			bike.kill();

		}

		new app.Wall( { owner: bike.owner, x: bike.x, y: bike.y } );

		if ( bike.facing !== bike.oldFacing ) {

			if ( bike.facing === 0 || bike.facing === Math.PI ) {

				bike.x = app.linearTween( { start: bike.x, rate: bike.speed * Math.cos( bike.facing ), duration: Infinity } );
				bike.y = bike.y;

			} else {

				bike.x = bike.x;
				bike.y = app.linearTween( { start: bike.y, rate: bike.speed * Math.sin( bike.facing ), duration: Infinity } );

			}

			bike.oldFacing = bike.facing;

		}

	}

}

/////////////////////////////////////////////////
///// Game Events
/////////////////////////////////////////////////

app.addEventListener( "playerJoin", () => {

	if ( ! WebCraft.isServer || app.players.length !== 2 ) return;

	const event = { type: "start" };

	app.setTimeout( () => ( app.network.send( event ), app.dispatchEvent( event ) ), 1000 );

} );

app.addEventListener( "start", () => {

	reset();
	init();
	start();

} );

// app.addEventListener( "playerLeave", e => {
//
// 	// if ( e.player !== leftPaddle.owner && e.player !== rightPaddle.owner ) return;
//
// 	startTimeout.clear();
// 	startTimeout = undefined;
//
// 	// ball.x = ball.x;
// 	// ball.y = ball.y;
//
// 	if ( app.players.length < 2 ) return;
//
// 	reset();
//
// 	startTimeout = app.setTimeout( () => ( init(), start() ), 1000 );
//
// } );

// app.addEventListener( "state", e => {
//
// 	if ( ! WebCraft.isBrowser ) return;
//
// 	if ( e.state.leftScore !== undefined ) document.getElementById( "left-score" ).textContent = app.state.leftScore;
// 	if ( e.state.rightScore !== undefined ) document.getElementById( "right-score" ).textContent = app.state.rightScore;
//
// } );

/////////////////////////////////////////////////
///// Player Actions
/////////////////////////////////////////////////

app.addEventListener( "up down left right", bikeEvent );

function bikeEvent( { type, player } ) {

	const bike = player.bike;

	switch ( type ) {

		case "right": bike.facing = 0; break;
		case "up": bike.facing = Math.PI / 2; break;
		case "left": bike.facing = Math.PI; break;
		case "down": bike.facing = Math.PI * 3 / 2; break;

	}

}
