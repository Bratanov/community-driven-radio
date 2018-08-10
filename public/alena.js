// initialize horoscope
// ES6 because it's cool
const zodiacSigns = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces']
let zodiacRunning = false

// configuration
const intervalBetweenZodiacs = 60 * 1000
const startAtMinute = 33
const defaultColor = 'pink'

const startZodiac = () => {
  zodiacRunning = true

  for (let signIndex in zodiacSigns) {
    setTimeout(() => {
      singleZodiac(zodiacSigns[signIndex])
    }, intervalBetweenZodiacs * signIndex)
  }
  setTimeout(() => {
    cleanUpZodiac()
    zodiacRunning = false
  }, intervalBetweenZodiacs * zodiacSigns.length)
}

const singleZodiac = (sign) => {
  fetch(`https://aztro.sameerkumar.website/?sign=${sign}&day=today`, {
    method: 'POST'
  })
  .then(res => res.json())
  .then(res => {
    const { description, mood, color } = res
    cleanUpZodiac()
    renderZodiac(sign, description, mood, color)
  })
  .catch(err => console.error(err))
}

const cleanUpZodiac = () => {
  $(".zodiac-wraper").remove()
}

const renderZodiac = (sign, description, mood, color) => {
  const $zodiacWrapper = $('<div class="zodiac-wrapper">')
  $zodiacWrapper.css({
    'background-color': defaultColor, // default,
    'position': 'absolute',
    'bottom': '28.9%',
    'width': '92%',
    'height': '21%',
    'opacity': '.95'
  })
  const $zodiacContainer = $('<div>')
  $zodiacContainer.css({
    'background-color': color,
    'height': '100%',
    'padding': '.5rem'
  })
  const $mood = $('<p class="u-h2">')
  $mood.text(`${sign.replace(/^\w/, c => c.toUpperCase())} / ${mood}`)
  const $description = $('<p class="u-h3 u-h-secondary">')
  $zodiacWrapper.append($zodiacContainer)
  $description.text(description)
  $zodiacContainer.append($mood)
  $zodiacContainer.append($description)

  $('#song-container').append($zodiacWrapper)
}

setInterval(() => {
  if(new Date().getMinutes() == startAtMinute && !zodiacRunning) {
    startZodiac()
  }
}, 1000)
