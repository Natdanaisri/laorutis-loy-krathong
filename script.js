// --- นี่คือโค้ดแบบใหม่ (ES Module) ครับ ---
// 1. Import ฟังก์ชันที่จำเป็นจาก Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    limit,
    serverTimestamp,
    connectFirestoreEmulator
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// 2. ใช้ firebaseConfig ของครูไบร์ทที่ให้มา
const firebaseConfig = {
  apiKey: "AIzaSyBNGCWaonkX9TcJElsuAnktzqquFWPvkAs",
  authDomain: "laorutis-2d470.firebaseapp.com",
  projectId: "laorutis-2d470",
  storageBucket: "laorutis-2d470.firebasestorage.app",
  messagingSenderId: "613856627306",
  appId: "1:613856627306:web:a3769b52a5f0d9fa57d813",
  measurementId: "G-JVDJJRVR3L"
};

// 3. Initialize Firebase และ Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const krathongCollectionRef = collection(db, "krathongs"); // อ้างอิงถึง Collection 'krathongs'

// --- ‼️ ส่วนเพิ่มเติม: การเชื่อมต่อกับ Emulator ‼️ ---
// เช็คว่า hostname เป็น localhost หรือ 127.0.0.1 หรือไม่
// เพื่อให้โค้ดนี้ทำงานเฉพาะตอนที่เราทดสอบบนเครื่องตัวเองเท่านั้น
if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
  console.log("กำลังเชื่อมต่อกับ Firestore Emulator...");
  connectFirestoreEmulator(db, 'localhost', 8080);
}

// --- Configuration ---
//
// --- ‼️ แก้ไขลิงก์รูปภาพที่นี่ครับ ‼️ ---
//
// ผมได้เปลี่ยนลิงก์รูปภาพตัวอย่างที่หมดอายุ (404 Not Found)
// ให้เป็นที่อยู่ของไฟล์รูปภาพกระทงในเครื่องของคุณ
//
const KRATHONG_IMAGES = [
  'images/krathong-01.png', // 1
  'images/krathong-02.png', // 2
  'images/krathong-03.png', // 3
  'images/krathong-04.png', // 4
  'images/krathong-05.png', // 5
  'images/krathong-06.png', // 6
  'images/krathong-07.png', // 7
  'images/krathong-08.png', // 8
  'images/krathong-09.png', // 9
  'images/krathong-10.png'  // 10
];
let selectedKrathongType = null;
let currentKrathongData = {}; // เปลี่ยนชื่อเพื่อความชัดเจน และจะใช้เก็บข้อมูลชั่วคราว

// --- Fireworks Configuration ---
const FIREWORKS_ENABLED = true; // เปิด/ปิดพลุดอกไม้ไฟ
const FIREWORK_INTERVAL_MIN = 500; // ช่วงเวลาขั้นต่ำในการยิงพลุใหม่ (มิลลิวินาที)
const FIREWORK_INTERVAL_MAX = 1500; // ช่วงเวลาสูงสุดในการยิงพลุใหม่ (มิลลิวินาที)
const PARTICLE_COUNT_PER_EXPLOSION = 50; // จำนวนอนุภาคต่อการระเบิด 1 ครั้ง
const GRAVITY = 0.05; // แรงโน้มถ่วงสำหรับอนุภาค
const FIREWORK_SPEED_MIN = 3; // ความเร็วขั้นต่ำของพลุที่พุ่งขึ้น
const FIREWORK_SPEED_MAX = 7; // ความเร็วสูงสุดของพลุที่พุ่งขึ้น
const PARTICLE_SPEED_MIN = 0.5; // ความเร็วขั้นต่ำของอนุภาค
const PARTICLE_SPEED_MAX = 4; // ความเร็วสูงสุดของอนุภาค
const FIREWORK_HUE_MIN = 0; // สีพลุ (Hue) ขั้นต่ำ
const FIREWORK_HUE_MAX = 360; // สีพลุ (Hue) สูงสุด

let fireworks = []; // อาร์เรย์เก็บพลุที่กำลังทำงาน
let particles = []; // อาร์เรย์เก็บอนุภาคที่กำลังทำงาน
let lastFireworkTime = 0; // เวลาล่าสุดที่ยิงพลุ

// --- Fireworks Canvas Elements ---
let fireworksCanvas;
let fireworksCtx;

// --- Particle Class (อนุภาคของพลุ) ---
class Particle {
  constructor(x, y, hue, brightness, alpha, speed, angle) {
    this.x = x;
    this.y = y;
    this.hue = hue;
    this.brightness = brightness;
    this.alpha = alpha;
    this.speed = speed;
    this.angle = angle;
    this.velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    };
    this.friction = 0.95; // ลดความเร็วอนุภาค
    this.gravity = GRAVITY;
    this.decay = Math.random() * 0.015 + 0.01; // อัตราการจางหายของอนุภาค
  }

  update() {
    this.velocity.x *= this.friction;
    this.velocity.y *= this.friction;
    this.velocity.y += this.gravity;
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.alpha -= this.decay;
  }

  draw() {
    if (this.alpha <= 0) return;
    fireworksCtx.save();
    fireworksCtx.beginPath();
    fireworksCtx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
    fireworksCtx.fillStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.alpha})`;
    fireworksCtx.fill();
    fireworksCtx.restore();
  }
}

// --- Firework Class (ตัวพลุ) ---
class Firework {
  constructor(startX, startY, targetX, targetY, hue) {
    this.x = startX;
    this.y = startY;
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.hue = hue;
    this.distanceToTarget = this.calculateDistance(startX, startY, targetX, targetY);
    this.distanceTraveled = 0;
    this.angle = Math.atan2(targetY - startY, targetX - startX);
    this.speed = Math.random() * (FIREWORK_SPEED_MAX - FIREWORK_SPEED_MIN) + FIREWORK_SPEED_MIN;
    this.velocity = {
      x: Math.cos(this.angle) * this.speed,
      y: Math.sin(this.angle) * this.speed,
    };
    this.trail = []; // สำหรับวาดเส้นหางของพลุ
    this.trailLength = 3;
    this.exploded = false;
  }

  calculateDistance(p1x, p1y, p2x, p2y) {
    const xDistance = p1x - p2x;
    const yDistance = p1y - p2y;
    return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
  }

  update() {
    if (this.exploded) return;

    this.trail.unshift({ x: this.x, y: this.y });
    if (this.trail.length > this.trailLength) {
      this.trail.pop();
    }

    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.distanceTraveled = this.calculateDistance(this.startX, this.startY, this.x, this.y);

    if (this.distanceTraveled >= this.distanceToTarget) {
      this.exploded = true;
      this.explode();
    }
  }

  draw() {
    if (this.exploded) return;

    fireworksCtx.save();
    fireworksCtx.beginPath();
    // วาดหัวพลุ
    fireworksCtx.arc(this.x, this.y, 2, 0, Math.PI * 2);
    fireworksCtx.fillStyle = `hsl(${this.hue}, 100%, 50%)`;
    fireworksCtx.fill();

    // วาดเส้นหางพลุ
    if (this.trail.length > 0) {
        fireworksCtx.beginPath();
        fireworksCtx.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) {
            fireworksCtx.lineTo(this.trail[i].x, this.trail[i].y);
        }
        fireworksCtx.strokeStyle = `hsla(${this.hue}, 100%, 50%, ${0.5 / this.trail.length})`;
        fireworksCtx.lineWidth = 1;
        fireworksCtx.stroke();
    }
    fireworksCtx.restore();
  }

  explode() {
    for (let i = 0; i < PARTICLE_COUNT_PER_EXPLOSION; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (PARTICLE_SPEED_MAX - PARTICLE_SPEED_MIN) + PARTICLE_SPEED_MIN;
      const brightness = Math.random() * 30 + 50; // 50-80% brightness
      particles.push(new Particle(this.x, this.y, this.hue, brightness, 1, speed, angle));
    }
  }
}

// --- รอให้หน้าเว็บโหลดเสร็จก่อน ---
document.addEventListener('DOMContentLoaded', (event) => {
  
  // --- Element References ---
  const createBtn = document.getElementById('create-krathong-btn');
  const createModal = document.getElementById('create-modal');
  const previewModal = document.getElementById('preview-modal');
  const closeBtns = document.querySelectorAll('.close-btn');
  const selectionGrid = document.getElementById('krathong-selection-grid');
  const submitBtn = document.getElementById('submit-krathong-btn');
  const floatBtn = document.getElementById('float-krathong-btn');
  const counterNumberElem = document.getElementById('counter-number');
  
  // --- Populate Krathong Selection ---
  KRATHONG_IMAGES.forEach((src, index) => {
    let img = document.createElement('img');
    img.src = src;
    img.classList.add('krathong-option');
    img.dataset.type = 'krathong_' + (index + 1);
    img.dataset.src = src;
    selectionGrid.appendChild(img);
  });
  const krathongOptions = document.querySelectorAll('.krathong-option');

  // --- Initial Load & Real-time Listener ---
  listenForKrathongs();

  // --- Event Listeners ---
  createBtn.addEventListener('click', () => createModal.style.display = 'block');
  
  closeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.getElementById(e.target.dataset.modal).style.display = 'none';
    });
  });

  krathongOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      krathongOptions.forEach(opt => opt.classList.remove('selected'));
      e.target.classList.add('selected');
      selectedKrathongType = { type: e.target.dataset.type, src: e.target.dataset.src };
    });
  });

  submitBtn.addEventListener('click', () => {
    const data = handleFormSubmit();
    if (data) {
      currentKrathongData = data; // เก็บข้อมูลที่ได้จากฟอร์มไว้ชั่วคราว
    }
  });
  floatBtn.addEventListener('click', () => saveAndFloatKrathong(currentKrathongData));
  
  // --- Functions ---
  
  function listenForKrathongs() {
    // สร้าง query เพื่อดึงข้อมูล 100 รายการล่าสุด
    const q = query(krathongCollectionRef, orderBy("timestamp", "desc"));

    // onSnapshot คือการ "ดักฟัง" ข้อมูลแบบ Real-time
    onSnapshot(q, (snapshot) => {
      // อัปเดตจำนวนกระทงทั้งหมด
      counterNumberElem.textContent = snapshot.size;

      snapshot.docChanges().forEach((change) => {
        // เมื่อมีกระทง "ถูกเพิ่ม" (added)
        if (change.type === "added") {
          createKrathongElement(change.doc.data());
        }
      });
    }, (error) => {
      // หากเกิดข้อผิดพลาด (เช่น ไม่มี Index) ลิงก์สำหรับสร้าง Index จะแสดงใน Console
      console.error("Error listening for krathongs: ", error);
    });
  }
  
  function createKrathongElement(kData) {
      const river = document.getElementById('river');

      // Create a wrapper div for the krathong image and text
      const krathongWrapper = document.createElement('div');
      krathongWrapper.classList.add('floating-krathong-wrapper');
      
      // --- แก้ไข: ดึงรูปภาพกระทงที่ถูกต้อง ---
      // kData.krathongType จะเป็น 'krathong_1', 'krathong_2' เป็นต้น
      const krathongIndexMatch = kData.krathongType.match(/_(\d+)$/);
      let imgSrc = KRATHONG_IMAGES[0]; // กำหนดรูปภาพเริ่มต้น
      if (krathongIndexMatch && krathongIndexMatch[1]) {
          const index = parseInt(krathongIndexMatch[1], 10) - 1; // แปลงเป็น index แบบ 0-based
          if (index >= 0 && index < KRATHONG_IMAGES.length) {
              imgSrc = KRATHONG_IMAGES[index];
          }
      }
      // --- สิ้นสุดการแก้ไข ---

      // Create the krathong image element
      const krathongImg = document.createElement('img');
      krathongImg.src = imgSrc;
      // krathongImg.classList.add('floating-krathong'); // Class moved to wrapper

      // Create elements for name and wish
      const nameElem = document.createElement('div');
      nameElem.classList.add('krathong-name');
      nameElem.textContent = kData.name;

      const wishElem = document.createElement('div');
      wishElem.classList.add('krathong-wish');
      wishElem.textContent = `"${kData.wish}"`;

      // Append image and text to the wrapper
      krathongWrapper.appendChild(krathongImg);
      krathongWrapper.appendChild(nameElem);
      krathongWrapper.appendChild(wishElem);
      
      // Randomize animation
      const animationName = 'floatAcrossReverse';
      const duration = Math.random() * 40 + 60; // ทำให้ช้าลงเป็น 60-100 วินาที
      const verticalPos = Math.random() * 50 + 5; // 5% to 55% from bottom
      
      krathongWrapper.style.animationName = animationName;
      krathongWrapper.style.animationDuration = `${duration}s`;
      krathongWrapper.style.bottom = `${verticalPos}%`;
      krathongWrapper.style.animationDelay = `${Math.random() * duration * -1}s`; 
      
      river.appendChild(krathongWrapper);
  }

  function handleFormSubmit() {
    const name = document.getElementById('user-name').value.trim();
    const wish = document.getElementById('user-wish').value.trim();

    if (!selectedKrathongType) {
      alert('กรุณาเลือกแบบกระทง');
      return null;
    }
    if (!name || !wish) {
      alert('กรุณากรอกชื่อและคำอธิษฐาน');
      return null;
    }

    // Update and show preview modal
    document.getElementById('preview-krathong-img').src = selectedKrathongType.src;
    document.getElementById('preview-wish-text').textContent = `"${wish}"`;
    document.getElementById('preview-name-text').textContent = `- ${name} -`;

    createModal.style.display = 'none';
    previewModal.style.display = 'block';

    // Return data object
    return {
      name,
      wish,
      krathongType: selectedKrathongType.type,
      timestamp: serverTimestamp()
    };
  }

  async function saveAndFloatKrathong(dataToSave) {
    floatBtn.disabled = true;
    floatBtn.textContent = 'กำลังปล่อย...';

    // ซ่อน Modal และแสดง Toast ทันทีเพื่อให้ผู้ใช้รู้สึกว่าระบบตอบสนอง
    previewModal.style.display = 'none';
    showToast();
    
    try {
      // บันทึกข้อมูลลง Firestore ด้วยฟังก์ชัน addDoc
      await addDoc(krathongCollectionRef, dataToSave);
      
      // Reset form
      document.getElementById('user-name').value = '';
      document.getElementById('user-wish').value = '';
      krathongOptions.forEach(opt => opt.classList.remove('selected'));
      selectedKrathongType = null;

    } catch (error) {
      console.error("Error adding document: ", error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
    
    floatBtn.disabled = false;
    floatBtn.textContent = 'ปล่อยกระทงลงน้ำ';
  }
  
  function showToast() {
    const toast = document.getElementById('toast-notification');
    toast.className = 'show';
    setTimeout(() => { toast.className = toast.className.replace('show', ''); }, 3000);
  }

  // --- Main Animation Loop for Fireworks ---
  function animateFireworks() {
    requestAnimationFrame(animateFireworks);

    // ล้าง Canvas ให้โปร่งใสทั้งหมดในทุกเฟรม
    fireworksCtx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);

    // ยิงพลุใหม่หากถึงช่วงเวลาที่กำหนด
    const currentTime = Date.now();
    if (currentTime - lastFireworkTime > Math.random() * (FIREWORK_INTERVAL_MAX - FIREWORK_INTERVAL_MIN) + FIREWORK_INTERVAL_MIN) {
      const startX = Math.random() * fireworksCanvas.width;
      const startY = fireworksCanvas.height; // เริ่มจากด้านล่างของ Canvas
      const targetX = Math.random() * fireworksCanvas.width;
      const targetY = Math.random() * (fireworksCanvas.height * 0.5); // ระเบิดในครึ่งบนของ Canvas
      const hue = Math.random() * (FIREWORK_HUE_MAX - FIREWORK_HUE_MIN) + FIREWORK_HUE_MIN;
      fireworks.push(new Firework(startX, startY, targetX, targetY, hue));
      lastFireworkTime = currentTime;
    }

    // อัปเดตและวาดพลุ
    for (let i = fireworks.length - 1; i >= 0; i--) {
      fireworks[i].update();
      fireworks[i].draw();
      if (fireworks[i].exploded) { // ลบพลุที่ระเบิดแล้วออกจากอาร์เรย์
        fireworks.splice(i, 1);
      }
    }

    // อัปเดตและวาดอนุภาค
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].draw();
      if (particles[i].alpha <= 0) { // ลบอนุภาคที่จางหายไปหมดแล้ว
        particles.splice(i, 1);
      }
    }
  }

  // --- Resize Canvas Function ---
  function resizeFireworksCanvas() {
    if (fireworksCanvas) {
      fireworksCanvas.width = window.innerWidth;
      fireworksCanvas.height = window.innerHeight * 0.25; // ให้ตรงกับความสูงที่กำหนดใน CSS
    }
  }

  // --- Initialize Fireworks (เริ่มต้นพลุ) ---
  if (FIREWORKS_ENABLED) {
    fireworksCanvas = document.getElementById('fireworks-canvas');
    fireworksCtx = fireworksCanvas.getContext('2d');
    resizeFireworksCanvas(); // กำหนดขนาดเริ่มต้น
    window.addEventListener('resize', resizeFireworksCanvas); // จัดการเมื่อหน้าจอถูกปรับขนาด
    animateFireworks(); // เริ่มลูปแอนิเมชัน
  }
});
