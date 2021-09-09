const chromaticOctave = ["C4", 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'Gb4', 'G4', 'Ab5', 'A5', 'Bb5', 'B5', 'C5'];
const minorOctave = ["C4", 'D4', 'Eb4', 'F4', 'G4', 'Ab5', 'Bb5', 'C5'];

const button = document.getElementById('play');
const canvas = document.getElementById('canvas');
const radios = document.querySelectorAll('input[type=radio]')

let useMinorScale = false

radios.forEach(radio => {
  radio.addEventListener('change', onModeChange);
  if (radio.checked) {
    useMinorScale = radio.value === 'minor';
  }
})

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
const xMin = Math.min(...x)
const xMax = Math.max(...x)
const xDiff = xMax - xMin
console.log({ xMin, xMax })

function onModeChange(event) {
  if (event.target.checked) {
    useMinorScale = event.target.value === 'minor';
  }
}

function drawCircle(x, y) {
  const normalisedX = (x - xMin) / xDiff;
  const normalisedY = (y - yMin) / yDiff;
  const xPixels = parseInt(normalisedX * 300);
  const yPixels = 100 - parseInt(normalisedY * 100);
  const circle = document.createElementNS('http://www.w3.org/2000/svg','circle');
  circle.setAttribute('cx', xPixels);
  circle.setAttribute('cy', yPixels);
  circle.setAttribute('r', '1');
  canvas.append(circle); 
}

function noteData(xValue, index, synth, now) {
  const yValue = y[index]
  const tonesArray = useMinorScale ? minorOctave : chromaticOctave;
  const scaleFactor = tonesArray.length * 2;
  const duration = useMinorScale ? "4n": "8n";
  const normalisedY = (yValue - yMin) / yDiff;
  const toneIndex = parseInt(normalisedY * scaleFactor);
  const interval = useMinorScale ? xValue * 4 : xValue * 2;
  const start = now + interval;
  console.log({ index, yValue, normalisedY, toneIndex, start, duration })
  const tone = tonesArray[toneIndex]
  return({ tone, duration, start })
}

function testChime(synth, now) {
  const tonesArray = useMinorScale ? minorOctave : chromaticOctave;
  // play a descending scale as a test.
  for (let index = 0; index < tonesArray.length; index++) {
    const toneIndex = tonesArray.length - index;
    const tone = tonesArray[toneIndex];
    synth.triggerAttackRelease(tone, "8n", now + (index * 0.1))
  }
}

async function play() {
  await Tone.start()
  const synth = new Tone.Synth().toDestination();
  const now = Tone.now()
  testChime(synth, now)
  const filteredIndexes = []
  const trimmedData = x.filter((x, index) => {
    const remainder = index % 10;
    if (remainder === 0) {
      filteredIndexes.push(index)
    }
    return remainder === 0;
  });
  const notes = trimmedData.map((xValue, index) => noteData(xValue, filteredIndexes[index], synth, now + 2))
  notes.forEach(({ tone, duration, start }, index) => {
    synth.triggerAttackRelease(tone, duration, start);
    Tone.Draw.schedule(() => {
      const actualIndex = filteredIndexes[index];
      const xValue = x[actualIndex];
      const yValue = y[actualIndex];
      drawCircle(xValue, yValue);
    }, start)
  })
}

button.addEventListener('click', play);
