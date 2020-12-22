// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
let store = {
	track_id: undefined,
	player_id: undefined,
	race_id: undefined,
};

// We need our javascript to wait until the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
	onPageLoad();
	setupClickHandlers();
});

async function onPageLoad() {
	try {
		getTracks()
			.then(tracks => {
				const html = renderTrackCards(tracks);
				renderAt('#tracks', html);
			});

		getRacers()
			.then((racers) => {
				const html = renderRacerCars(racers);
				renderAt('#racers', html);
			});
	} catch(error) {
		console.log('Problem getting tracks and racers ::', error.message);
		console.error(error);
	}
}

function setupClickHandlers() {
	document.addEventListener('click', function(event) {
		const { target } = event;

		// Race track form field
		if (target.matches('.card.track')) {
			handleSelectTrack(target);
		}

		// Podracer form field
		if (target.matches('.card.podracer')) {
			handleSelectPodRacer(target);
		}

		// Submit create race form
		if (target.matches('#submit-create-race')) {
			event.preventDefault();
	
			// start race
			handleCreateRace();
		}

		// Handle acceleration click
		if (target.matches('#gas-peddle')) {
			handleAccelerate(target);
		}

	}, false);
}

async function delay(ms) {
	try {
		return await new Promise(resolve => setTimeout(resolve, ms));
	} catch(error) {
		console.log('an error shouldn\'t be possible here');
		console.log(error);
	}
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
	try{
	// Get player_id and track_id from the store
		const { track_id, player_id } = store;
		if(track_id === undefined || player_id === undefined){
			alert('select track and racer');

		}
		else{
		// render starting UI
			renderRaceStartView(track_id, player_id);

			// invoke the API call to create the race, then save the result
			const race = await createRace(player_id, track_id);

			// update the store with the race id
			store = Object.assign(store, {race_id: race.ID});

			// The race has been created, now start the countdown
			// call the async function runCountdown
			await runCountdown();

			// call the async function startRace
			await startRace(store.race_id);
			// call the async function runRace
			await runRace(store.race_id);
		}
	}
	catch(err) {
		console.log(err);
	}
}
function runRace(raceID) {
	return new Promise((resolve,reject) => {
		// Javascript's built in setInterval method to get race info every 500ms
		const interval = setInterval(() => {
			getRace(raceID)
				.then(res => {
					let status = res.status;
					// if the race info status property is "in-progress", update the leaderboard
					if(status === 'in-progress') {
						renderAt('#leaderBoard', raceProgress(res.positions));
						// if the race info status property is "finished", clear interval and resolve
					} else if(status === 'finished') {
						clearInterval(interval);
						renderAt('#race', resultsView(res.positions));
						resolve(res);
					}
				})
				.catch(err => reject(err));
		}
		, 500);
	});
}
async function runCountdown() {
	try {
		// wait for the DOM to load
		await delay(500);

		return new Promise(resolve => {
			let timer = 3;
			// Javascript's built in setInterval method to count down once per second
			const countDown = setInterval(() => {
				// run this DOM manipulation to decrement the countdown for the user
				console.log(timer);
				document.getElementById('big-numbers').innerHTML = timer;
				// if the countdown is done, clear the interval, resolve the promise, and return
				if(timer === 0) {
					clearInterval(countDown);
					resolve();
					//return;
				} else {
					timer--;
				}
			}, 1000);
		});
	} catch(err) {
		console.log(err);
	}
}

function handleSelectPodRacer(target) {
	console.log('selected a pod', target.id);

	// remove class selected from all racer options
	const selected = document.querySelector('#racers .selected');
	if(selected) {
		selected.classList.remove('selected');
	}
	// add class selected to current target
	target.classList.add('selected');

	// Save the selected racer to the store
	store = Object.assign(store, {player_id: target.id});
}

function handleSelectTrack(target) {
	console.log('selected a track', target.id);

	// remove class selected from all track options
	const selected = document.querySelector('#tracks .selected');
	if(selected) {
		selected.classList.remove('selected');
	}

	// add class selected to current target
	target.classList.add('selected');

	// Save the selected track id to the store
	store = Object.assign(store, {track_id: target.id});

}

async function handleAccelerate() {
	console.log('accelerate button clicked');
	// Invoke the API call to accelerate
	await accelerate(store.race_id);
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {

	if (!racers) {
		return `
			<h4>Loading Racers...</4>
		`;
	}

	const results = racers.map(renderRacerCard).join('');

	return `
		<ul id="racers">
			${results}
		</ul>
	`;
}

function renderRacerCard(racer) {
	const { id, driver_name, top_speed, acceleration, handling } = racer;

	return `
		<li class="card podracer" id="${id}">
			<h3>${driver_name}</h3>
			<p>TS: ${top_speed}</p>
			<p>Acc: ${acceleration}</p>
			<p>H: ${handling}</p>
		</li>
	`;
}

function renderTrackCards(tracks) {
	if (!tracks) {
		return `
			<h4>Loading Tracks...</4>
		`;
	}

	const results = tracks.map(renderTrackCard).join('');

	return `
		<ul id="tracks">
			${results}
		</ul>
	`;
}

function renderTrackCard(track) {
	const { id, name } = track;

	return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`;
}

function renderCountdown(count) {
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`;
}

function renderRaceStartView(track_id, player_id) {

	getTracks()
		.then(tracks => {
			const selectedTrack = tracks.filter(track => track.id === parseInt(track_id));
			return selectedTrack[0].name;
		})
		.then(selectedTrackName => {
			const html = `
			<header>
				<h1>Race on Track: ${selectedTrackName}</h1>
			</header>
			<main id="two-columns">
				<section id="leaderBoard">
					${renderCountdown(3)}
				</section>

				<section id="accelerate">
					<h2>Directions</h2>
					<p>Click the button as fast as you can to make your racer go faster!</p>
					<button id="gas-peddle">Click Me To Win!</button>
				</section>
			</main>
			<footer>Udacity Project by Sergi</footer>
		`;

			renderAt('#race', html);
		})
		.catch(err => console.log(err));
}

function resultsView(positions) {
	positions.sort((a, b) => (a.final_position > b.final_position) ? 1 : -1);

	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a href="/race">Start a new race</a>
		</main>
	`;
}

function raceProgress(positions) {

	let userPlayer = positions.find(e => e.id === parseInt(store.player_id));
	userPlayer.driver_name += ' (you)';

	positions = positions.sort((a, b) => (a.segment > b.segment) ? -1 : 1);
	let count = 1;

	const results = positions.map(p => {
		return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`;
	}).join('');

	return `
		<main>
			<h3>Leaderboard</h3>
			<section id="leaderBoard">
				${results}
			</section>
		</main>
	`;
}

function renderAt(element, html) {
	const node = document.querySelector(element);

	node.innerHTML = html;
}

const SERVER = 'http://localhost:8000';

function defaultFetchOpts() {
	return {
		mode: 'cors',
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin' : SERVER,
		},
	};
}

// Fetch calls to each of the API endpoints

function getTracks() {
	// GET request to `${SERVER}/api/tracks`
	return fetch(`${SERVER}/api/tracks`, {
		method: 'GET',
		...defaultFetchOpts(),
	})
		.then(res => res.json())
		.catch(err => console.log(err));
}

function getRacers() {
	// GET request to `${SERVER}/api/cars`
	return fetch(`${SERVER}/api/cars`, {
		method: 'GET',
		...defaultFetchOpts(),
	})
		.then(res => res.json())
		.catch(err => console.log(err));
}

function createRace(player_id, track_id) {
	player_id = parseInt(player_id);
	track_id = parseInt(track_id);
	const body = { player_id, track_id };
	
	return fetch(`${SERVER}/api/races`, {
		method: 'POST',
		...defaultFetchOpts(),
		dataType: 'jsonp',
		body: JSON.stringify(body)
	})
		.then(res => res.json()
		)
		.catch(err => console.log('Something went wrong in createRace...', err));
}

function getRace(id) {
	// GET request to `${SERVER}/api/races/${id}`
	return fetch(`${SERVER}/api/races/${id-1}`, {
		method: 'GET',
		...defaultFetchOpts
	})
		.then(res => res.json())
		.catch(err => console.log('Something went wrong in getRace...', err));
}

function startRace(id) {
	console.log(`race id: ${id}`);
	return fetch(`${SERVER}/api/races/${id-1}/start`, {
		method: 'POST',
		...defaultFetchOpts(),
	})
		.catch(err => console.log('Something went wrong in startRace...', err));
}

function accelerate(id) {
	return fetch(`${SERVER}/api/races/${id-1}/accelerate`, {
		method: 'POST',
		...defaultFetchOpts(),
	})
		.catch(err => console.log('Something went wrong in accelerate', err));
}
