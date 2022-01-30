var NanoTimer = require('nanotimer');
const dgram = require('dgram');
const { Buffer } = require('buffer');

let sender = dgram.createSocket('udp4');
var timerA = new NanoTimer();

const opCodeHigh = 0x97
const opCodeLow = 0
const protVerLow = 14
const protVerHigh = 0
let consoleAddress = ''

console.log('TOP OF CHILD');

const id = new Buffer.from('Art-Net\0')
const opCode = new Buffer.from([opCodeLow, opCodeHigh])
const protVer = new Buffer.from([protVerHigh, protVerLow])
const filler = new Buffer.from([0, 0])

const header = Buffer.concat([id, opCode, protVer, filler])

let count = 0;

let hours = 0;
let mins = 59
let secs = 58;
let frames = 0
let framerate = 30

const makeTypeByte = () => {
    switch (framerate) {
        case 24:
            return 0

        case 25:
            return 1

        case 29.97:
            return 2

        case 30:
            return 3

        default:
            throw new Error('Invalid rate')
    }
}

const makeTimeBytes = () => {
    return new Buffer.from([frames, secs, mins, hours, makeTypeByte()])
}

const addZero = (num) => {
    if (num < 10) return '0' + num
    return num
}

const makeClock = () => {
    frames++
    if (frames >= framerate) {
        frames = 0
        secs++
    }

    if (secs > 59) {
        secs = 0
        mins++
    }

    if (mins > 59) {
        mins = 0
        hours++
    }
    const time = `${addZero(hours)}:${addZero(mins)}:${addZero(secs)}:${addZero(frames)}`
    if (consoleAddress !== '') sender.send(Buffer.concat([header, makeTimeBytes()]), 6454, consoleAddress)
    return time
}

const liftOff = (dummy) => {
    const clock = makeClock(count)
    process.send({ cmd: 'time', clock })
        //console.log(clock);
    count++
}

timerA.setInterval(liftOff, '', '33333u', function() {
    //timerA.clearInterval();
});

process.on('message', (msg) => {
    console.log('Child got a message');
    switch (msg.cmd) {

        case 'consoleAddress':
            console.log('Console Address In Child');
            consoleAddress = msg.address
            break;

        default:
            console.log('ELSE');
            break;
    }
})