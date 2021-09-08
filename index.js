const chromaticOctave = ["C4", 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'Gb4', 'G4', 'Ab5', 'A5', 'Bb5', 'B5', 'C5'];

const button = document.getElementById('play');

const APIOptions = {
  headers: {
    'Accept': 'application/vnd.api+json; version=1',
    'Content-Type': 'application/json'
  },
  method: 'GET',
  mode: 'cors'
}
const response = await window.fetch('https://www.zooniverse.org/api/subjects/65562620?http_cache=true', APIOptions)
const { subjects } = await response.json()
const [ subject ] = subjects
const [ dataLocation ] = subject.locations.filter(location => !!location["text/plain"])
const dataURL = dataLocation["text/plain"]
const dataResponse = await window.fetch(dataURL, { mode: 'cors' })
const { x, y } = await dataResponse.json()
const yMin = Math.min(...y)
const yMax = Math.max(...y)
const yDiff = yMax - yMin
console.log({ yMin, yMax })

function playData(xValue, index, synth, now) {
  const yValue = y[index]
  const toneIndex = parseInt((yValue - yMin) * (55 / yDiff))
  const start = now + xValue
  console.log({ yValue, toneIndex, start })
  const tone = chromaticOctave[toneIndex]
  synth.triggerAttackRelease(tone, "8n", start)
}

async function playScale() {
  await Tone.start()
  const synth = new Tone.Synth().toDestination();
  const now = Tone.now()
  for (let index = 0; index < 12; index++) {
    synth.triggerAttackRelease(chromaticOctave[11 - index], "8n", now + (index * 0.1))
  }
  const trimmedData = x.filter((x, index) => {
    const remainder = index % 20;
    return remainder === 0;
  });
  console.log(trimmedData.length)
  trimmedData.forEach((xValue, index) => playData(xValue, index, synth, now + 2))
}

button.addEventListener('click', playScale);
