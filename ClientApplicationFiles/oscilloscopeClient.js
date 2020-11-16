class RingBuffer {
  constructor(capacity) {
    this.buffer = new Array(capacity);
    this.capacity = capacity;
    this.head = this.tail = this.size = 0;
  }
  enqueue(data) {
      var next = this.head + 1;
      if (next >= this.capacity)
        next = 0;
      if (this.size < this.capacity)
        this.size++;
    
      this.buffer[this.head] = data;
      this.head = next;
    }
  dequeue() {
      var data = this.buffer[this.tail],
          next = this.tail + 1;
      if (next >= this.capacity)
          next = 0;
      if (this.size > 0)
          this.size--;
    
      this.tail = next;
      return data;
    }
  *[Symbol.iterator]() {
      for (var i = 0; i < this.size; i++)
      yield this.buffer[(this.tail + i) % this.capacity];
  }
}

//#####################################################################################################
//Class struccture

//#####################################################################################################
var ringBuffer = new RingBuffer(10);

var SamplesPerSecond = 25;
var dataset = 0;
var gain = 1;
function check_settings(){
  SamplesPerSecond = document.getElementById("samplesPerSecond_id").value
  dataset = document.getElementById("DataSet_id").value
  gain = document.getElementById("gain_id").value
  fpsInterval = 1000 / SamplesPerSecond;
}



let connection = new WebSocket("ws://192.168.0.28:8081");
connection.binaryType = 'arraybuffer';
connection.onopen = () => {
  
  connection.send([1,dataset,gain]);
}

connection.onerror = (error) => {
  console.log(`WebSocket error: ${error}`)
}

connection.onmessage = (e) => {
  let msg = new Int16Array(e.data);
  ringBuffer.enqueue(msg);
}

var ampFactor = 400;
var ctx;

//data packet number
var k = 1
// Interval code


var stop = false;
var fpsInterval, startTime, now, then, elapsed;

function startAnimating(fps) {
    fpsInterval = 1000 / fps;
    then = Date.now();
    startTime = then;
    animate();
}


function animate() {

    // stop
    if (stop) {
        return;
    }

    // request another frame

    requestAnimationFrame(animate);

    // calc elapsed time since last loop

    now = Date.now();
    elapsed = now - then;

    // if enough time has elapsed, draw the next frame

    if (elapsed > fpsInterval) {
      then = now - (elapsed % fpsInterval);
      helper(ctx);
    }
}

// rendering code
// renders each 
function drawcanvas(ctx){
  ctx.beginPath();
  ctx.moveTo(0,400*dataList[k%1920])
  for (let i=1;i<1920;i++){
    //ctx.lineTo(i/2,200*dataList[(i+(2*k))%1920]);
    ctx.lineTo(i,Math.floor(ampFactor*dataList[(i+ k)%1920]));
    
  }
  ctx.stroke();
  //console.log(end-start);
  k++
}

function clearScreen(ctx){
  //use points from import
  const drawline = x1 => y1 => x2 => y2 => {
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
  } 
  ctx.clearRect(0, 0, 1920, 800);
  ctx.strokeStyle = "#d9d9d9";
  ctx.beginPath();
  drawline(0)(400)(1920)(400);
  
  
  ctx.stroke();
  

}


function drawState(data,ctx){
  ctx.strokeStyle = "#00FF00";
  ctx.beginPath();
  ctx.moveTo(0,data[0])
  const n = data.length;
  const ratio = 1920/n;
  if (ratio <= 1){
    for (let i=1;i<n;i++){
      //ctx.lineTo(i/2,200*dataList[(i+(2*k))%1920]);
      ctx.lineTo(i,data[i]);
      
    }
  }
  else{
    for (let i=1;i<n;i++){
      //ctx.lineTo(i/2,200*dataList[(i+(2*k))%1920]);
      ctx.lineTo(i*(Math.ceil(ratio)),data[i]);
      
    }
  }
  ctx.stroke();

}
function helper(ctx){
  clearScreen(ctx);
  //drawcanvas(ctx)
  const tmp = ringBuffer.dequeue()
  drawState(tmp,ctx);
  // query server
  connection.send([k,dataset,gain]);
  k++;
}

const initialise = () => {
  // get values from document and set up necessary

  startAnimating(SamplesPerSecond);

}


document.getElementById ("initialiseBtn").addEventListener ("click", initialise, false);
if (typeof window != 'undefined')
    window.onload = ()=>{
      const canvas = document.getElementById("canvTest");
      ctx = canvas.getContext("2d");
      ctx.strokeStyle = "#00FF00";
      ctx.lineWidth = 1;
      //ctx.scale(2,2);
      //setInterval(helper,40,ctx)
      // samples per second
      
      setInterval(check_settings,200);
    }

/* run this in terminal
python3 -m http.server 9000
*/