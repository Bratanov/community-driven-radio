const elWordioWrapper = document.getElementById('zawordio');
const elWordioGuess = document.createElement('button');
const elWordioInput = document.createElement('input');
const elWordioResults = document.createElement('div');

elWordioResults.setAttribute('class', 'u-h3');
elWordioResults.setAttribute('style', 'font-family: monospace');
elWordioWrapper.appendChild(elWordioResults);
elWordioInput.setAttribute('class', 'u-h2');
elWordioInput.setAttribute('style', 'color: black');
elWordioInput.setAttribute('placeholder', 'ПИШИ ТУК');
elWordioWrapper.appendChild(elWordioInput);
elWordioGuess.setAttribute('class', 'u-h2');
elWordioGuess.setAttribute('style', 'background-color: gray');
elWordioGuess.textContent = 'Guess';
elWordioWrapper.appendChild(elWordioGuess);

const stateStrength = {
	white: 0,
	gray: 1,
	yellow: 2,
	green: 3
};

function renderWordio(states) {
	const allLetters = 'чявертъуиопшщасдфгхйклюзьцжбнм'.toUpperCase().split('').map((el) => {
		return { letter: el, state: 'white' };
	});

	let result = '';
	for (let state of states) {
		state.map((stateSingular) => {
			const letterMatch = allLetters.findIndex((el) => {
				return el.letter == stateSingular.letter;
			});
			if (stateStrength[stateSingular.state] > stateStrength[allLetters[letterMatch].state]) {
				allLetters[letterMatch].state = stateSingular.state;
			}
		});

		result += `<div>
			${state.map((el) => `<span style="background-color: ${el.state}; color: ${el.state=='gray' ? 'white' : 'black'}">[${el.letter}]</span>`).join(' ')}
		</div>`;
	}

	const placeholder = `<div>
		<span style="background-color: white;">[ ]</span>
		<span style="background-color: white;">[ ]</span>
		<span style="background-color: white;">[ ]</span>
		<span style="background-color: white;">[ ]</span>
		<span style="background-color: white;">[ ]</span>
		<span style="background-color: white;">[ ]</span>
	</div>`;
	if (states.length) {
		result += placeholder;
	} else {
		result = placeholder + result;
	}

	result += `
		<br /><div>
			${allLetters.map((el) => `<span style="background-color: ${el.state}; color: ${el.state=='gray' ? 'white' : 'black'}">[${el.letter}]</span>`).join(' ')}
		</div>
	`;

	elWordioResults.innerHTML = result;
}

socket.on('wordio_state', (data) => {
	renderWordio(data);
});

elWordioGuess.onclick = () => {
	if (elWordioInput.value.length !== 6) return;

	socket.emit('wordio_guess', elWordioInput.value);
	elWordioInput.value = '';
};

renderWordio([]);