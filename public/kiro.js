const LOCAL_STORAGE_KIRO_KEY = 'kiro';

const elKiro = document.createElement('div');
elKiro.setAttribute('style', 'overflow:hidden;opacity:69%;width:100%;height:100%;position:absolute;pointer-events:none;top:0;left:0;font-size:14px');
document.body.appendChild(elKiro);
let lastPositionSent = 0;
let kiroEnabled = true;

socket.on('kiro_pointers', function(data) {
	console.log('kiro_pointers', data);
	renderPointers(data);
});

function renderPointers(pointers) {
	if (!kiroEnabled) return;

	let content = '';
 	for(let pointer of Object.values(pointers)) {
		content += `<div style="position: absolute; left: ${parseInt(pointer.x, 10)}px; top: ${parseInt(pointer.y, 10)}px">${pointer.icon}</div>`

		for(let trailIndex in pointer.trails) {
			content += `<div style="position: absolute; opacity: ${1-trailIndex/pointer.trails.length}; left: ${parseInt(pointer.trails[trailIndex].x, 10)}px; top: ${parseInt(pointer.trails[trailIndex].y, 10)}px">${pointer.icon}</div>`
		}
	}
	elKiro.innerHTML = content;
}

document.body.addEventListener('mousemove', e => {
	if (!kiroEnabled) return;

	if (Date.now() - lastPositionSent > 100) {
		socket.emit('kiro_move', {
			x: e.pageX,
			y: e.pageY
		});
		lastPositionSent = Date.now();
	}
});

window.onclick = e => {
	if (!kiroEnabled) return;

	socket.emit('kiro_trail', {
		x: e.pageX,
		y: e.pageY
	});
};

// toggle option for Kiro
const toggleKiro = (e) => {
	const chosenInput = $(e.target);
	const enabled = chosenInput.prop('checked');
	// set theme
	localStorage.setItem(LOCAL_STORAGE_KIRO_KEY, enabled);
	// set target
	chosenInput.prop('checked', enabled);
	kiroEnabled = enabled;

	if (!enabled) {
		elKiro.innerHTML = '';
	}
};

const setDefaultKiroToggle = () => {
	const enabled = (localStorage.getItem(LOCAL_STORAGE_KIRO_KEY) || 'true') === 'true';

	$('.js-kiro-toggle').prop('checked', enabled);
	kiroEnabled = enabled;

	if (!enabled) {
		elKiro.innerHTML = '';
	}
};

setDefaultKiroToggle();

$('.js-kiro-toggle').on('click', toggleKiro);