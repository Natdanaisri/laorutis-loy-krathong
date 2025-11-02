// --- นี่คือโค้ดแบบใหม่ (ES Module) ครับ ---
// 1. Import ฟังก์ชันที่จำเป็นจาก Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    getDocs, // ‼️ เพิ่ม: สำหรับดึงข้อมูลทั้งหมดครั้งเดียว
    query, 
    orderBy, 
    limit,
    serverTimestamp,
    connectFirestoreEmulator,
    doc,
    getDoc,
    getCountFromServer, // ‼️ เพิ่ม: สำหรับนับจำนวนเอกสาร
    updateDoc, deleteDoc // ‼️ เพิ่ม: สำหรับแก้ไขและลบเอกสาร
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

// --- ‼️ ส่วนเพิ่มเติม: การจัดการการแสดงผลกระทง ‼️ ---
const MAX_KRATHONGS_ON_SCREEN = 10; // กำหนดจำนวนกระทงสูงสุดที่จะแสดงบนหน้าจอ
// --- ‼️ แก้ไข: แยกตัวแปรความสูงสำหรับจอแนวนอนและแนวตั้ง ‼️ ---
const KRATHONG_VERTICAL_POS_MIN_DESKTOP = 20;  // ตำแหน่งต่ำสุด (แนวนอน, หน่วยเป็น %, จากด้านล่าง)
const KRATHONG_VERTICAL_POS_MAX_DESKTOP = 55; // ตำแหน่งสูงสุด (แนวนอน, หน่วยเป็น %, จากด้านล่าง)
const KRATHONG_VERTICAL_POS_MIN_MOBILE = 30; // ‼️ แก้ไข: ปรับตำแหน่งต่ำสุดสำหรับจอแนวตั้ง
const KRATHONG_VERTICAL_POS_MAX_MOBILE = 75; // ‼️ แก้ไข: ปรับตำแหน่งสูงสุดสำหรับจอแนวตั้ง

const KRATHONG_ANIMATION_DURATION = 100; // ‼️‼️ เพิ่ม: กำหนดความเร็วคงที่สำหรับกระทงทุกลำ (หน่วยเป็นวินาที) ‼️‼️

// --- ‼️‼️ ตรรกะใหม่: ระบบกริด (Grid System) ‼️‼️ ---
const GRID_COLUMNS = 3; // จำนวนเลนในแนวนอน (ตามที่คุณต้องการ)
const GRID_ROWS = 2;    // จำนวนช่องย่อยในแนวตั้งต่อ 1 เลน

// สร้างโครงสร้างข้อมูลสำหรับ Grid: Array 2 มิติ ขนาด 3x2
// แต่ละช่อง (cell) จะเก็บ krathongElement หรือ null (ถ้าว่าง)
let grid = Array.from({ length: GRID_COLUMNS }, () => Array(GRID_ROWS).fill(null));
let verticalSlotPositions = []; // Array สำหรับเก็บค่า bottom ของแต่ละแถว

let displayedKrathongs = []; // Array สำหรับเก็บคิวของกระทงที่แสดงอยู่

// --- ‼️‼️ ส่วนเพิ่มเติม: คลังสำหรับสุ่มกระทง Community ‼️‼️ ---
let allKrathongIds = []; // เก็บ ID กระทงทั้งหมด
let communityKrathongPool = []; // คลัง ID ที่ยังไม่ได้สุ่มแสดง

let fireworks = []; // อาร์เรย์เก็บพลุที่กำลังทำงาน

// --- ‼️‼️ ส่วนเพิ่มเติม: ป้องกันกระทงซ้อนกันตอนเริ่มต้น ‼️‼️ ---
let globalLastKrathongStartTime = 0; // เก็บเวลาที่กระทงล่าสุด (จากทุกเลน) เริ่มลอย
let particles = []; // อาร์เรย์เก็บอนุภาคที่กำลังทำงาน
let lastFireworkTime = 0; // เวลาล่าสุดที่ยิงพลุ

// --- ‼️‼️ ส่วนเพิ่มเติม: การจัดการ Admin ‼️‼️ ---
const ADMIN_PASSWORD = "laor7378"; // ตั้งรหัสผ่านที่นี่
let isAdmin = false; // สถานะการเป็น Admin

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
  const notFoundModal = document.getElementById('not-found-modal'); // ‼️ เพิ่ม: Element สำหรับ Modal หากระทงไม่เจอ
  // --- ‼️ ส่วนเพิ่มเติม: Element สำหรับ Modal รายชื่อ ‼️ ---
  const listModal = document.getElementById('list-modal');
  const viewAllBtn = document.getElementById('view-all-btn');
  const wishListTableBody = document.querySelector('#wish-list-table tbody');
  const submitBtn = document.getElementById('submit-krathong-btn');
  const floatBtn = document.getElementById('float-krathong-btn');
  const counterNumberElem = document.getElementById('counter-number');
  // --- เพิ่มเติม: Element สำหรับควบคุมเพลง ---
  // --- ‼️ ส่วนเพิ่มเติม: ปุ่มตามหากระทง ‼️ ---
  const findMyKrathongBtn = document.getElementById('find-my-krathong-btn');
  let myKrathongElement = null; // สำหรับเก็บกระทงพิเศษของเรา

  // --- ‼️‼️ ส่วนเพิ่มเติม: Element สำหรับ Admin ‼️‼️ ---
  const adminEntryBtn = document.getElementById('admin-entry-btn');
  const adminLoginModal = document.getElementById('admin-login-modal');
  const adminLoginBtn = document.getElementById('admin-login-btn');
  const toggleGridBtn = document.getElementById('toggle-grid-btn'); // ‼️ เพิ่ม: ปุ่ม Grid

  const musicControlBtn = document.getElementById('music-control-btn');
  const backgroundMusic = document.getElementById('background-music');
  let isMusicPlaying = false; // สถานะของเพลง

  // --- ‼️ ส่วนที่แก้ไข: UI สำหรับเลือกกระทงแบบใหม่ ‼️ ---
  const prevBtn = document.getElementById('prev-krathong-btn');
  const nextBtn = document.getElementById('next-krathong-btn');
  const krathongPreviewImg = document.getElementById('selected-krathong-preview');
  const dotsContainer = document.getElementById('krathong-dots-container');
  let currentKrathongIndex = 0;

  // --- ‼️‼️ ส่วนเพิ่มเติม: ตรวจสอบว่าอยู่ในโหมด Kiosk หรือไม่ ‼️‼️ ---
  const isKioskMode = document.body.classList.contains('kiosk-mode');

  // --- ‼️‼️ แก้ไข: ย้ายการสร้าง thumbnails มาไว้ที่เดียว เพื่อให้ใช้ได้ทั้ง 2 โหมด ‼️‼️ ---
  KRATHONG_IMAGES.forEach((src, index) => {
    const thumb = document.createElement('img'); // เปลี่ยนจาก div เป็น img
    thumb.src = src; // กำหนด src ของรูปภาพ
    thumb.classList.add('krathong-thumbnail'); // ใช้ class ใหม่
    thumb.dataset.index = index;
    thumb.addEventListener('click', () => showKrathong(index));
    // ตรวจสอบให้แน่ใจว่า dotsContainer มีอยู่จริงก่อนที่จะเพิ่มเข้าไป
    if (dotsContainer) {
      dotsContainer.appendChild(thumb);
    }
  });

  if (isKioskMode) {
    // --- ถ้าเป็นโหมด Kiosk ---
    // ไม่ต้องสร้างปุ่มควบคุมเพลง, ปุ่ม admin, ปุ่มตามหากระทง ฯลฯ
    // ซ่อน element ที่ไม่ต้องการให้แสดงในโหมด Kiosk
    ['music-control-btn', 'find-my-krathong-btn', 'admin-entry-btn', 'create-krathong-btn', 'krathong-counter'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.style.display = 'none';
    });
  } else {
    // --- ถ้าไม่ใช่โหมด Kiosk ให้ทำงานตามปกติ ---
    // (โค้ดส่วนนี้จะทำงานเฉพาะใน index.html)
    listenForKrathongs();
    // ‼️ เพิ่ม: สร้าง Grid Overlay สำหรับ Admin
    createGridOverlay();
    updateTotalKrathongCount();
    // --- ‼️‼️ แก้ไข: คำนวณตำแหน่งของ "แถว" ใน Grid ‼️‼️ ---
    calculateGridRowPositions();
    checkAndShowFindMyKrathongButton();
  }

  const thumbnails = document.querySelectorAll('.krathong-thumbnail'); // เลือก element ด้วย class ใหม่

  // ฟังก์ชันสำหรับแสดงกระทงตาม index
  function showKrathong(index) {
    // ทำให้ index วนลูปเมื่อถึงภาพสุดท้ายหรือภาพแรก
    if (index >= KRATHONG_IMAGES.length) {
      index = 0;
    } else if (index < 0) {
      index = KRATHONG_IMAGES.length - 1;
    }

    currentKrathongIndex = index;
    const krathongSrc = KRATHONG_IMAGES[currentKrathongIndex];
    krathongPreviewImg.src = krathongSrc;

    // อัปเดตสถานะ active ของภาพตัวอย่าง (thumbnails)
    if (thumbnails.length > 0) {
      thumbnails.forEach(thumb => thumb.classList.remove('active'));
      thumbnails[currentKrathongIndex].classList.add('active');
    }

    // อัปเดตข้อมูลกระทงที่เลือก
    selectedKrathongType = {
      type: `krathong_${currentKrathongIndex + 1}`,
      src: krathongSrc
    };
  }

  // --- Initial Load & Real-time Listener ---

  showKrathong(0); // แสดงกระทงแรกเมื่อโหลด


  // --- Event Listeners ---
  // --- ‼️‼️ แก้ไข: ตรวจสอบก่อนเพิ่ม Event Listener ‼️‼️ ---
  if (createBtn) {
    createBtn.addEventListener('click', () => createModal.style.display = 'block');
  }
  
  closeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.getElementById(e.target.dataset.modal).style.display = 'none';
    });
  });

  // Event Listeners สำหรับปุ่มลูกศร
  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => showKrathong(currentKrathongIndex - 1));
    nextBtn.addEventListener('click', () => showKrathong(currentKrathongIndex + 1));
  }

  // --- ‼️‼️ แก้ไข: แยก Logic การกดปุ่ม Submit/Float ‼️‼️ ---
  if (isKioskMode) {
    // ในโหมด Kiosk, ปุ่ม "ปล่อยกระทง" จะทำงานทั้งหมดในขั้นตอนเดียว
    floatBtn.addEventListener('click', () => {
      const data = handleFormSubmit(true); // true = isKiosk
      if (data) {
        saveAndFloatKrathong(data);
      }
    });
  } else {
    // โหมดปกติ, ทำงาน 2 ขั้นตอนเหมือนเดิม
    submitBtn.addEventListener('click', () => {
      const data = handleFormSubmit(false); // false = not Kiosk
      if (data) {
        currentKrathongData = data; // เก็บข้อมูลที่ได้จากฟอร์มไว้ชั่วคราว
      }
    });
    floatBtn.addEventListener('click', () => saveAndFloatKrathong(currentKrathongData));
  }
  
  // --- เพิ่มเติม: Event Listener สำหรับปุ่มควบคุมเพลง ---
  if (musicControlBtn) {
    musicControlBtn.addEventListener('click', toggleMusic);
  }

  // --- ‼️ ส่วนเพิ่มเติม: Event Listener สำหรับปุ่มตามหากระทง ‼️ ---
  if (findMyKrathongBtn) {
    findMyKrathongBtn.addEventListener('click', findAndHighlightMyKrathong);
  }

  // --- ‼️ ส่วนเพิ่มเติม: Event Listener สำหรับปุ่มดูรายชื่อทั้งหมด ‼️ ---
  if (viewAllBtn) viewAllBtn.addEventListener('click', fetchAllKrathongsAndShowList);

  // --- ‼️‼️ ส่วนเพิ่มเติม: Event Listeners สำหรับ Admin ‼️‼️ ---
  if (adminEntryBtn) adminEntryBtn.addEventListener('click', () => adminLoginModal.style.display = 'block');
  if (adminLoginBtn) adminLoginBtn.addEventListener('click', handleAdminLogin);
  if (toggleGridBtn) toggleGridBtn.addEventListener('click', () => {
    document.getElementById('grid-overlay').style.display = (document.getElementById('grid-overlay').style.display === 'grid') ? 'none' : 'grid';
  });

  // ทำให้กด Enter ในช่อง password แล้ว login ได้
  document.getElementById('admin-password').addEventListener('keyup', (e) => { if (e.key === 'Enter') handleAdminLogin(); });

  // --- Functions ---
  
  function listenForKrathongs() {
    // --- ‼️‼️ ตรรกะใหม่: เปลี่ยนจากการดักฟังกระทงล่าสุด มาเป็นการสุ่มกระทงจาก Community ‼️‼️ ---
    // 1. ดึงข้อมูลกระทงทั้งหมดมาเก็บ ID ไว้ใน Array และเติมคลังสำหรับสุ่ม
    getDocs(krathongCollectionRef).then(snapshot => {
      allKrathongIds = snapshot.docs.map(doc => doc.id);
      // เติมคลังกระทงสำหรับสุ่มในครั้งแรก
      refillCommunityPool();
      
      // 2. เริ่มแสดงกระทง Community ทันทีหลังจากได้ ID ทั้งหมด
      if (allKrathongIds.length > 0) showCommunityKrathongs();

      // 3. ตั้ง Interval ให้สุ่มและแสดงกระทงใหม่ๆ ทุกๆ 15-25 วินาที (เพิ่มระยะห่าง)
      setInterval(showCommunityKrathongs, Math.random() * 10000 + 15000);
    });

    // ฟังก์ชันสำหรับเติมคลังกระทงที่จะสุ่ม
    function refillCommunityPool() {
      console.log("Refilling community krathong pool...");
      communityKrathongPool = [...allKrathongIds]; // สร้างสำเนาใหม่
    }

    async function showCommunityKrathongs() {
      // 4. ถ้าคลังว่าง ให้เติมใหม่ก่อน
      if (communityKrathongPool.length === 0) {
        if (allKrathongIds.length === 0) return; // ยังไม่มีกระทงในระบบเลย
        refillCommunityPool();
      }

      // 5. สุ่ม index จากคลัง และดึง ID ออกมา (พร้อมลบออกจากคลัง)
      const poolIndex = Math.floor(Math.random() * communityKrathongPool.length);
      const randomId = communityKrathongPool.splice(poolIndex, 1)[0];

      const myKrathongId = localStorage.getItem('myKrathongId');
      // 6. ไม่ต้องแสดงกระทงของตัวเองซ้ำ ถ้ามันกำลังจะถูกแสดงในฐานะ Community
      if (randomId === myKrathongId) return;

      // 7. ดึงข้อมูลของกระทงที่สุ่มได้ แล้วนำไปสร้าง Element
      const docRef = doc(db, "krathongs", randomId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        createKrathongElement(docSnap.data());
      }
    }

    // --- ‼️‼️ ส่วนนี้ยังคงไว้: เพื่อดักฟัง "กระทงใหม่ล่าสุด" ที่เพิ่งสร้าง ‼️‼️ ---
    // เพื่อให้ผู้ใช้คนอื่นเห็นกระทงที่เพิ่งสร้างใหม่ทันที (แสดงผลแค่ครั้งเดียว)
    const q = query(
      krathongCollectionRef, 
      orderBy("timestamp", "desc"), 
      limit(1) // สนใจแค่กระทงล่าสุด 1 อันจริงๆ
    );

    onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          // ไม่ต้องสร้างกระทงซ้ำถ้าเป็นของตัวเอง (เพราะจะถูกจัดการโดยฟังก์ชัน saveAndFloatKrathong)
          const myKrathongId = localStorage.getItem('myKrathongId');
          // --- ‼️‼️ แก้ไข: เพิ่ม ID ใหม่เข้าไปในคลังสุ่มทันที ‼️‼️ ---
          const newId = change.doc.id;
          if (!allKrathongIds.includes(newId)) {
            allKrathongIds.push(newId);
            communityKrathongPool.push(newId); // เพิ่มในคลังที่ใช้สุ่มด้วย
          }
          if (change.doc.id !== myKrathongId) {
            createKrathongElement(change.doc.data());
          }
        }
      });
    }, (error) => {
      console.error("Error listening for krathongs: ", error);
    });
  }
  
  // --- ‼️‼️ ฟังก์ชันใหม่: คำนวณตำแหน่งของ "แถว" ใน Grid ‼️‼️ ---
  function calculateGridRowPositions() {
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    let verticalMin, verticalMax;
  
    if (isPortrait) {
      verticalMin = KRATHONG_VERTICAL_POS_MIN_MOBILE;
      verticalMax = KRATHONG_VERTICAL_POS_MAX_MOBILE;
    } else {
      verticalMin = KRATHONG_VERTICAL_POS_MIN_DESKTOP;
      verticalMax = KRATHONG_VERTICAL_POS_MAX_DESKTOP;
    }
  
    verticalSlotPositions = []; // ล้างค่าเก่า
    // คำนวณตำแหน่งสำหรับแต่ละแถว (Row)
    const step = (verticalMax - verticalMin) / (GRID_ROWS - 1);
    for (let i = 0; i < GRID_ROWS; i++) {
      verticalSlotPositions.push(verticalMin + (i * step));
    }
  }

  function createKrathongElement(kData) {
      const river = document.getElementById('river');

      // --- ‼️‼️ แก้ไข: กำหนดจำนวนกระทงสูงสุดตามแนวของจอ ‼️‼️ ---
      const isPortrait = window.matchMedia("(orientation: portrait)").matches;
      const maxKrathongsForDevice = GRID_COLUMNS * GRID_ROWS; // จำนวนกระทงสูงสุดเท่ากับขนาดของ Grid

      // --- ‼️‼️ แก้ไข: ตรรกะการจัดการคิวการแสดงผล ‼️‼️ ---
      // 1. ตรวจสอบว่ามีกระทง (ที่ไม่ใช่กระทงพิเศษของเรา) เกินจำนวนหรือไม่
      const communityKrathongs = displayedKrathongs.filter(k => !k.classList.contains('my-krathong-highlight'));

      if (communityKrathongs.length >= maxKrathongsForDevice) {
        // 2. ถ้าเกิน, ให้ลบกระทง "ของคนอื่น" ที่เก่าที่สุดออก
        const oldestKrathong = displayedKrathongs.shift(); // ดึงตัวเก่าสุดออกจาก Array
        if (oldestKrathong) {
            // --- ‼️‼️ แก้ไข: คืนช่องใน Grid ให้ว่าง ‼️‼️ ---
            const oldCol = parseInt(oldestKrathong.dataset.col, 10);
            const oldRow = parseInt(oldestKrathong.dataset.row, 10);
            if (!isNaN(oldCol) && !isNaN(oldRow)) {
              grid[oldCol][oldRow] = null;
            }
            oldestKrathong.remove();
        }
      }

      // Create a wrapper div for the krathong image and text
      const krathongWrapper = document.createElement('div');
      krathongWrapper.classList.add('floating-krathong-wrapper');
      // --- ‼️‼️ แก้ไข: ซ่อนกระทงไว้นอกจอก่อน เพื่อป้องกันการกระพริบที่มุมซ้าย ‼️‼️ ---
      // กำหนดตำแหน่งเริ่มต้นให้อยู่นอกจอไปไกลๆ ก่อนที่จะเริ่มแอนิเมชัน
      krathongWrapper.style.left = '-9999px';
      krathongWrapper.style.bottom = '0';
      
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
      const duration = Math.random() * 40 + 60; // ทำให้ช้าลงเป็น 60-100 วินาที

      // --- ‼️‼️ แก้ไข: ปรับปรุงการใช้ระบบเลน (Lane) ‼️‼️ ---
      let verticalMin, verticalMax;
      if (isPortrait) {
        verticalMin = KRATHONG_VERTICAL_POS_MIN_MOBILE;
        verticalMax = KRATHONG_VERTICAL_POS_MAX_MOBILE;
      } else {
        verticalMin = KRATHONG_VERTICAL_POS_MIN_DESKTOP;
        verticalMax = KRATHONG_VERTICAL_POS_MAX_DESKTOP;
      }

      // --- ‼️‼️ ตรรกะใหม่: ใช้ระบบกริด (Grid System) ‼️‼️ ---
      // 1. หาช่องที่ว่างในกริด
      const cell = findEmptyGridCell();
      if (!cell) return; // ถ้าไม่มีช่องว่างเลย ก็ไม่ต้องสร้างกระทง

      const { col, row } = cell;
      grid[col][row] = krathongWrapper; // จองช่องในกริด
      krathongWrapper.dataset.col = col;
      krathongWrapper.dataset.row = row;

      // 2. คำนวณตำแหน่งแนวตั้งจาก "แถว" ของกริด
      let verticalPos = verticalSlotPositions[row];

      // --- ‼️ ส่วนเพิ่มเติม: จำลองมิติความลึก (Perspective) ‼️ ---
      // ใช้ "คอลัมน์" (เลน) ของกริดในการคำนวณ
      const perspectiveRatio = (col + 1) / GRID_COLUMNS; // ค่าระหว่าง 0.33, 0.66, 1.0
      const scale = 0.6 + (perspectiveRatio * 0.5); // ขนาดจะอยู่ระหว่าง 0.7 - 1.1 (ยังคงไว้เพื่อให้มีมิติ)
      const animationDuration = KRATHONG_ANIMATION_DURATION; // ‼️‼️ แก้ไข: ใช้ความเร็วคงที่ ‼️‼️
      
      const direction = 'floatAcross';
      const orientation = isPortrait ? 'portrait' : 'desktop';

      // --- ‼️‼️ แก้ไข: ตรรกะการหน่วงเวลาอัจฉริยะ (Global Delay) ‼️‼️ ---
      // ตรวจสอบเวลาจากกระทงล่าสุดที่ถูกปล่อย "จากทุกเลน" เพื่อป้องกันการซ้อนกัน
      const now = Date.now();
      const timeSinceLastGlobal = now - globalLastKrathongStartTime;
      const requiredDelayMs = 4000; // ‼️ กำหนดให้กระทงแต่ละอันห่างกันอย่างน้อย 4 วินาที
      let delay = 0; // ค่าหน่วงเวลา (หน่วยเป็นวินาที)

      if (timeSinceLastGlobal < requiredDelayMs) {
        // ถ้ากระทงล่าสุดเพิ่งถูกปล่อยไปไม่นาน ให้หน่วงเวลากระทงใหม่
        delay = (requiredDelayMs - timeSinceLastGlobal) / 1000;
      }
      // อัปเดตเวลาล่าสุดของกระทงที่ถูกปล่อย (รวมเวลาหน่วง)
      globalLastKrathongStartTime = now + (delay * 1000);

      krathongWrapper.style.animationDuration = `${animationDuration}s`;
      krathongWrapper.style.bottom = `${verticalPos}%`;
      krathongWrapper.style.animationDelay = `${delay}s`;
      // --- ‼️‼️ แก้ไข: ปรับ z-index ตามหลัก Perspective ‼️‼️ ---
      // กระทงที่อยู่ใกล้ (verticalPos น้อย) ควรมี z-index สูงกว่า
      // เราจะใช้ค่า 100 ลบด้วยตำแหน่งแนวตั้ง เพื่อให้กระทงที่อยู่ด้านล่างสุด (เช่น bottom: 5%) มี z-index สูงสุด (z-index: 95)
      krathongWrapper.style.zIndex = Math.floor(100 - verticalPos);
      krathongWrapper.style.transform = `scale(${scale})`;
      // --- ‼️‼️ แก้ไข: กำหนด animation-name และล้างค่า left ที่ซ่อนไว้ออก ‼️‼️ ---
      // ใช้ requestAnimationFrame เพื่อให้แน่ใจว่าเบราว์เซอร์ได้ประมวลผลสไตล์เริ่มต้น (ที่ซ่อนไว้) ก่อน
      // จากนั้นจึงกำหนดแอนิเมชันและตำแหน่งที่ถูกต้อง
      requestAnimationFrame(() => {
        krathongWrapper.style.left = ''; // ล้างค่า left ที่ซ่อนไว้ออก
        krathongWrapper.style.animationName = `${direction}-${orientation}`;
      });
      
      river.appendChild(krathongWrapper);

      // อัปเดตคิวของกระทงที่แสดงผลอยู่
      displayedKrathongs.push(krathongWrapper);
  }

  // --- ‼️‼️ ฟังก์ชันใหม่: หาช่องที่ว่างในกริด ‼️‼️ ---
  function findEmptyGridCell() {
    // หาคอลัมน์ (เลน) ที่มีช่องว่างมากที่สุดก่อน
    let bestCol = -1;
    let maxEmptySlots = -1;

    for (let c = 0; c < GRID_COLUMNS; c++) {
      const emptySlots = grid[c].filter(cell => cell === null).length;
      if (emptySlots > maxEmptySlots) {
        maxEmptySlots = emptySlots;
        bestCol = c;
      }
    }

    if (bestCol === -1) return null; // ไม่มีช่องว่างเลย

    // หาแถวที่ว่างในคอลัมน์ที่ดีที่สุด
    for (let r = 0; r < GRID_ROWS; r++) {
      if (grid[bestCol][r] === null) {
        return { col: bestCol, row: r }; // คืนค่าตำแหน่งช่องที่ว่าง
      }
    }
    return null; // ไม่ควรจะเกิดขึ้นถ้า Logic ถูกต้อง
  }

  // --- ‼️ ส่วนเพิ่มเติม: ฟังก์ชันสำหรับสร้างกระทง "พิเศษ" ของเรา ‼️ ---
  // --- ‼️ ส่วนเพิ่มเติม: ฟังก์ชันสำหรับสร้างกระทง "พิเศษ" ของเรา ‼️ ---
  function createMyKrathongElement(kData) {
    // ถ้ามีกระทงพิเศษของเราแสดงอยู่แล้ว ให้ลบของเก่าออกก่อน
    if (myKrathongElement && myKrathongElement.parentNode) {
      myKrathongElement.remove();
    }

    // สร้างกระทงโดยใช้ฟังก์ชันเดิม
    createKrathongElement(kData);

    // หากระทงที่เพิ่งสร้าง (ตัวสุดท้ายในคิว)
    const newKrathong = displayedKrathongs[displayedKrathongs.length - 1];
    if (newKrathong) {
      // เพิ่มคลาสพิเศษเพื่อไฮไลท์
      newKrathong.classList.add('my-krathong-highlight');
      // เก็บ reference ของกระทงเราไว้
      myKrathongElement = newKrathong;
    }
  }

  function handleFormSubmit(isKiosk = false) {
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

    // ถ้าไม่ใช่โหมด Kiosk ให้แสดงหน้า Preview ก่อน
    if (!isKiosk) {
      document.getElementById('preview-krathong-img').src = selectedKrathongType.src;
      document.getElementById('preview-wish-text').textContent = `"${wish}"`;
      document.getElementById('preview-name-text').textContent = `- ${name} -`;
      createModal.style.display = 'none';
      previewModal.style.display = 'block';
    }

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

    if (!isKioskMode) {
      // ซ่อน Modal และแสดง Toast ทันทีเพื่อให้ผู้ใช้รู้สึกว่าระบบตอบสนอง
      previewModal.style.display = 'none';
      showToast();
    }
    
    try {
      // บันทึกข้อมูลลง Firestore ด้วยฟังก์ชัน addDoc
      const docRef = await addDoc(krathongCollectionRef, dataToSave);
      
      if (isKioskMode) {
        // --- ‼️‼️ Logic สำหรับ Kiosk Mode ‼️‼️ ---
        showKioskThankYou(dataToSave);
      } else {
        // --- Logic สำหรับโหมดปกติ ---
        // 1. บันทึก ID ของกระทงที่เพิ่งสร้างลงใน localStorage
        localStorage.setItem('myKrathongId', docRef.id);
        // 2. แสดงปุ่ม "ตามหากระทงของฉัน"
        findAndHighlightMyKrathong(); // แสดงกระทงของตัวเองทันที
        findMyKrathongBtn.style.display = 'block';
        // 3. อัปเดตจำนวนกระทงบนหน้าจอทันที
        updateTotalKrathongCount();
        // 4. Reset form
        document.getElementById('user-name').value = '';
        document.getElementById('user-wish').value = '';
      }

    } catch (error) {
      console.error("Error adding document: ", error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      // คืนสถานะปุ่มหากเกิดข้อผิดพลาด
      floatBtn.disabled = false;
      floatBtn.textContent = isKioskMode ? 'ปล่อยกระทง' : 'ปล่อยกระทงลงน้ำ';
    }
    
    // ไม่ต้องคืนสถานะปุ่มในโหมด Kiosk เพราะหน้าจะรีเฟรช
    if (!isKioskMode) {
      floatBtn.disabled = false;
      floatBtn.textContent = 'ปล่อยกระทงลงน้ำ';
    }
  }

  // --- ‼️‼️ ฟังก์ชันใหม่: แสดงหน้าขอบคุณในโหมด Kiosk และเริ่มนับถอยหลัง ‼️‼️ ---
  function showKioskThankYou(savedData) {
    const formWrapper = document.getElementById('kiosk-form-wrapper');
    const thankYouWrapper = document.getElementById('kiosk-thank-you-wrapper');
    const countdownTimer = document.getElementById('countdown-timer');

    // 1. แสดงข้อมูลที่เพิ่งบันทึกในหน้าขอบคุณ
    document.getElementById('preview-krathong-img').src = selectedKrathongType.src;
    document.getElementById('preview-wish-text').textContent = `"${savedData.wish}"`;
    document.getElementById('preview-name-text').textContent = `- ${savedData.name} -`;

    // 2. สลับการแสดงผลจากฟอร์มเป็นหน้าขอบคุณ
    formWrapper.style.display = 'none';
    thankYouWrapper.style.display = 'block';

    // 3. เริ่มนับถอยหลัง
    let secondsLeft = 10;
    countdownTimer.textContent = secondsLeft;

    const interval = setInterval(() => {
      secondsLeft--;
      countdownTimer.textContent = secondsLeft;
      if (secondsLeft <= 0) {
        clearInterval(interval);
        // 4. รีโหลดหน้าเพื่อกลับสู่สถานะเริ่มต้น
        window.location.reload();
      }
    }, 1000);
  }
  
  // --- ‼️ ส่วนเพิ่มเติม: ฟังก์ชันสำหรับดึงและอัปเดตจำนวนกระทงทั้งหมด ‼️ ---
  async function updateTotalKrathongCount() {
    if (!counterNumberElem) return; // ถ้าไม่มี element นี้ ก็ไม่ต้องทำ
    try {
      // ใช้ getCountFromServer เพื่อนับจำนวนเอกสารทั้งหมดใน collection
      const snapshot = await getCountFromServer(krathongCollectionRef);
      const totalCount = snapshot.data().count;

      // อัปเดตตัวเลขบนหน้าจอ
      counterNumberElem.textContent = totalCount;
    } catch (error) {
      console.error("Error getting krathong count:", error);
    }
  }

  // --- ‼️ ส่วนเพิ่มเติม: ฟังก์ชันสำหรับตรวจสอบและแสดงปุ่ม "ตามหากระทง" ‼️ ---
  function checkAndShowFindMyKrathongButton() {
    const myId = localStorage.getItem('myKrathongId');
    if (myId) {
      findMyKrathongBtn.style.display = 'block';
    }
  }

  // --- ‼️ ส่วนเพิ่มเติม: ฟังก์ชันสำหรับค้นหาและไฮไลท์กระทงของฉัน ‼️ ---
  async function findAndHighlightMyKrathong() {
    const myId = localStorage.getItem('myKrathongId');
    if (!myId) {
      alert('ยังไม่พบข้อมูลกระทงของคุณในเครื่องนี้');
      return;
    }

    // แสดง Toast บอกผู้ใช้ว่ากำลังค้นหา
    showToast('กำลังตามหากระทงของคุณ...');

    try {
      const docRef = doc(db, "krathongs", myId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // ถ้าเจอกระทง, สร้างกระทงพิเศษขึ้นมาแสดงผล
        const krathongData = docSnap.data();
        // เพิ่ม ID เข้าไปในข้อมูล เพื่อใช้ตรวจสอบได้ง่ายขึ้น
        krathongData.id = docSnap.id; 
        createMyKrathongElement(krathongData);

      } else {
        notFoundModal.style.display = 'block'; // ‼️ แก้ไข: แสดง Modal ที่สร้างขึ้นมาใหม่
        localStorage.removeItem('myKrathongId'); // ลบ ID ที่ใช้ไม่ได้แล้ว
        findMyKrathongBtn.style.display = 'none'; // ซ่อนปุ่ม
      }
    } catch (error) {
      console.error("Error finding krathong:", error);
      alert('เกิดข้อผิดพลาดขณะค้นหากระทง');
    }
  }

  // --- ‼️‼️ ส่วนเพิ่มเติม: ฟังก์ชันสำหรับจัดการการ Login ของ Admin ‼️‼️ ---
  function handleAdminLogin() {
    const passwordInput = document.getElementById('admin-password');
    const errorMsg = document.getElementById('admin-error-msg');
    
    if (passwordInput.value === ADMIN_PASSWORD) {
      isAdmin = true;
      adminLoginModal.style.display = 'none';
      passwordInput.value = ''; // ล้างรหัสผ่าน
      errorMsg.style.display = 'none';
      showToast('เข้าสู่ระบบผู้ดูแลสำเร็จ!');
      // เปิดหน้าต่างรายชื่อในโหมด Admin ทันที
      // ‼️ เพิ่ม: แสดงปุ่ม Grid เมื่อเป็น Admin
      toggleGridBtn.style.display = 'block';
      fetchAllKrathongsAndShowList();
    } else {
      isAdmin = false;
      errorMsg.style.display = 'block';
      passwordInput.select();
    }
  }

  // --- ‼️‼️ ส่วนเพิ่มเติม: ฟังก์ชันสร้าง Grid Overlay สำหรับ Admin ‼️‼️ ---
  function createGridOverlay() {
    const river = document.getElementById('river');
    const gridOverlay = document.getElementById('grid-overlay');
    if (!river || !gridOverlay) return;

    // สร้าง Cell ตามจำนวน Grid
    for (let i = 0; i < GRID_COLUMNS * GRID_ROWS; i++) {
      const cell = document.createElement('div');
      cell.classList.add('grid-cell');

      // --- ‼️‼️ เพิ่ม: สร้างตัวหนังสือบอกแกน ‼️‼️ ---
      // CSS Grid จะเรียงจากซ้ายไปขวา, บนลงล่าง
      const col = i % GRID_COLUMNS;
      const row = Math.floor(i / GRID_COLUMNS);
      
      const label = document.createElement('span');
      label.classList.add('grid-cell-label');
      label.textContent = `C${col + 1}, R${row + 1}`; // C = Column, R = Row
      cell.appendChild(label);
      // --- สิ้นสุดการเพิ่ม ---

      gridOverlay.appendChild(cell);
    }
    river.appendChild(gridOverlay); // ย้าย Overlay เข้าไปในแม่น้ำ
  }
  // --- ‼️ ส่วนเพิ่มเติม: ฟังก์ชันสำหรับดึงข้อมูลทั้งหมดและแสดงใน Modal ‼️ ---
  async function fetchAllKrathongsAndShowList() {
    // 1. แสดง Modal และสถานะกำลังโหลด
    listModal.style.display = 'block';
    wishListTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 40px;">กำลังโหลดรายชื่อ...</td></tr>`;

    try {
      // 2. สร้าง Query เพื่อดึงข้อมูลทั้งหมด โดยเรียงจากเก่าไปใหม่
      const q = query(krathongCollectionRef, orderBy("timestamp", "asc"));

      // 3. ดึงข้อมูลด้วย getDocs (ดึงครั้งเดียว)
      const querySnapshot = await getDocs(q);

      // 4. ล้างข้อมูลเก่าในตาราง
      wishListTableBody.innerHTML = '';

      if (querySnapshot.empty) {
        wishListTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 40px;">ยังไม่มีผู้ร่วมลอยกระทง</td></tr>`;
        return;
      }

      // 5. วนลูปเพื่อสร้างแถวในตารางสำหรับแต่ละเอกสาร
      // ‼️‼️ แก้ไข: เพิ่มหัวตารางสำหรับ Admin ‼️‼️
      const listContent = document.querySelector('#list-modal .list-content');
      const tableHeader = document.querySelector('#wish-list-table thead tr');

      if (isAdmin) {
        // เพิ่มปุ่มเปิด/ปิดโหมดพิเศษ (หากยังไม่มี)
        if (!document.getElementById('special-mode-toggle-btn')) {
          const specialModeBtn = document.createElement('button');
          specialModeBtn.id = 'special-mode-toggle-btn';
          specialModeBtn.textContent = '🖥️ เปิดโหมดจอสัมผัส';
          specialModeBtn.style.cssText = 'background-color: #ff9800; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 1em; margin-bottom: 20px;';
          specialModeBtn.onclick = () => window.open('kiosk.html', '_blank');
          // ใส่ปุ่มไว้บนสุดของ modal content
          listContent.insertBefore(specialModeBtn, listContent.firstChild);
        }

        // เพิ่มหัวตาราง "จัดการ" (หากยังไม่มี)
        if (!document.getElementById('admin-actions-header')) {
          const adminHeader = document.createElement('th');
          adminHeader.id = 'admin-actions-header';
          adminHeader.textContent = 'จัดการ';
          tableHeader.appendChild(adminHeader);
        }
        // ถ้าไม่เป็น Admin ให้ซ่อนปุ่มโหมดพิเศษ (ถ้ามี)
      } else {
        document.getElementById('special-mode-toggle-btn')?.remove(); // ย้ายมาไว้ใน else
      }

      let sequenceNumber = 1; // ตัวแปรสำหรับนับลำดับ
      querySnapshot.forEach((doc) => {
        const kData = doc.data();
        const row = document.createElement('tr');

        // --- Cell 1: ลำดับ
        const seqCell = document.createElement('td');
        seqCell.textContent = sequenceNumber;
        seqCell.style.textAlign = 'center';

        // --- Cell 2: Krathong Image ---
        const imgCell = document.createElement('td');
        const img = document.createElement('img');
        img.classList.add('list-krathong-img');
        
        // หา src ของรูปภาพจาก krathongType
        const krathongIndexMatch = kData.krathongType.match(/_(\d+)$/);
        let imgSrc = KRATHONG_IMAGES[0]; // รูปภาพเริ่มต้น
        if (krathongIndexMatch && krathongIndexMatch[1]) {
            const index = parseInt(krathongIndexMatch[1], 10) - 1;
            if (index >= 0 && index < KRATHONG_IMAGES.length) {
                imgSrc = KRATHONG_IMAGES[index];
            }
        }
        img.src = imgSrc;
        imgCell.appendChild(img);

        // --- Cell 3: Name
        const nameCell = document.createElement('td');
        nameCell.textContent = kData.name;

        // --- Cell 4: Wish
        const wishCell = document.createElement('td');
        wishCell.textContent = kData.wish;

        row.append(seqCell, imgCell, nameCell, wishCell);

        // --- ‼️‼️ ส่วนเพิ่มเติม: สร้างปุ่มสำหรับ Admin ‼️‼️ ---
        if (isAdmin) {
          const actionCell = document.createElement('td');

          // ปุ่มแก้ไข
          const editBtn = document.createElement('button');
          editBtn.textContent = 'แก้ไข';
          editBtn.classList.add('admin-action-btn', 'edit-btn');
          editBtn.onclick = () => editKrathong(doc.id, kData.name, kData.wish);

          // ปุ่มลบ
          const deleteBtn = document.createElement('button');
          deleteBtn.textContent = 'ลบ';
          deleteBtn.classList.add('admin-action-btn', 'delete-btn');
          deleteBtn.onclick = () => deleteKrathong(doc.id);

          actionCell.append(editBtn, deleteBtn);
          row.appendChild(actionCell);
        }
        // --- สิ้นสุดส่วนของ Admin ---

        wishListTableBody.appendChild(row);

        sequenceNumber++; // เพิ่มค่าลำดับ
      });
    } catch (error) {
      console.error("Error fetching all krathongs:", error);
      wishListTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red; padding: 40px;">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>`;
    }
  }

  // --- ‼️‼️ ส่วนเพิ่มเติม: ฟังก์ชันสำหรับแก้ไขกระทง (Admin) ‼️‼️ ---
  function editKrathong(id, currentName, currentWish) {
    const newName = prompt("แก้ไขชื่อ:", currentName);
    // ถ้าผู้ใช้กด Cancel, prompt จะคืนค่า null
    if (newName === null) return; 

    const newWish = prompt("แก้ไขคำอธิษฐาน:", currentWish);
    if (newWish === null) return;

    if (confirm(`คุณต้องการบันทึกการเปลี่ยนแปลงสำหรับกระทงนี้ใช่หรือไม่?`)) {
      const docRef = doc(db, "krathongs", id);
      updateDoc(docRef, {
        name: newName.trim(),
        wish: newWish.trim()
      }).then(() => {
        showToast('แก้ไขข้อมูลสำเร็จ!');
        // โหลดข้อมูลในตารางใหม่
        fetchAllKrathongsAndShowList();
      }).catch(error => {
        console.error("Error updating document: ", error);
        alert('เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
      });
    }
  }

  // --- ‼️‼️ ส่วนเพิ่มเติม: ฟังก์ชันสำหรับลบกระทง (Admin) ‼️‼️ ---
  function deleteKrathong(id) {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบกระทงนี้? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
      const docRef = doc(db, "krathongs", id);
      deleteDoc(docRef).then(() => {
        showToast('ลบกระทงสำเร็จ!');
        // โหลดข้อมูลในตารางใหม่
        fetchAllKrathongsAndShowList();
        // อัปเดตจำนวนกระทงทั้งหมด
        updateTotalKrathongCount();
        // หากกระทงที่ถูกลบเป็นกระทงของฉัน ให้ลบออกจาก localStorage ด้วย
        if (localStorage.getItem('myKrathongId') === id) {
          localStorage.removeItem('myKrathongId');
          findMyKrathongBtn.style.display = 'none';
        }
      }).catch(error => {
        console.error("Error deleting document: ", error);
        alert('เกิดข้อผิดพลาดในการลบข้อมูล');
      });
    }
  }

  function showToast(message = 'บันทึกคำอธิษฐานสำเร็จ!') {
    const toast = document.getElementById('toast-notification');
    // ‼️ แก้ไข: ตั้งค่าข้อความที่ได้รับมา
    toast.textContent = message;
    toast.className = 'show';
    // หลังจากแสดงผลเสร็จ, หน่วงเวลาเล็กน้อยก่อนเปลี่ยนข้อความกลับเป็นค่าเริ่มต้น
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
      // --- ‼️‼️ ส่วนเพิ่มเติม: คำนวณตำแหน่งช่องลอยใหม่เมื่อปรับขนาดจอ ‼️‼️ ---
      calculateGridRowPositions();
    }
  }

  // --- Initialize Fireworks (เริ่มต้นพลุ) ---
  // --- ‼️‼️ แก้ไข: ไม่ต้องแสดงพลุในโหมด Kiosk ‼️‼️ ---
  if (FIREWORKS_ENABLED && !isKioskMode) {
    fireworksCanvas = document.getElementById('fireworks-canvas');
    if (fireworksCanvas) {
      fireworksCtx = fireworksCanvas.getContext('2d');
      resizeFireworksCanvas(); // กำหนดขนาดเริ่มต้น
      window.addEventListener('resize', resizeFireworksCanvas); // จัดการเมื่อหน้าจอถูกปรับขนาด
      animateFireworks(); // เริ่มลูปแอนิเมชัน
    }
  }

  // --- เพิ่มเติม: ฟังก์ชันสำหรับควบคุมเพลง ---
  function toggleMusic() {
    if (isMusicPlaying) {
        backgroundMusic.pause();
        musicControlBtn.textContent = '🔇';
    } else {
        // การเรียก .play() จะคืนค่า Promise
        // เราจะใช้ Promise นี้เพื่อตรวจสอบว่าเล่นได้สำเร็จหรือไม่
        const playPromise = backgroundMusic.play();
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                // เล่นเพลงสำเร็จ
                musicControlBtn.textContent = '🎵';
                isMusicPlaying = true; // อัปเดตสถานะที่นี่
            }).catch(error => {
                // เล่นเพลงไม่สำเร็จ (เช่น เบราว์เซอร์บล็อก)
                console.log("การเล่นเพลงอัตโนมัติถูกบล็อก:", error);
                isMusicPlaying = false; // ตรวจสอบให้แน่ใจว่าสถานะถูกต้อง
                musicControlBtn.textContent = '🔇'; // อัปเดตไอคอนปุ่มเมื่อเล่นไม่สำเร็จ
            });
        }
    }
  }

  // --- เพิ่มเติม: จัดการการเล่นเพลง ---
  // --- ‼️‼️ แก้ไข: ไม่ต้องเล่นเพลงในโหมด Kiosk ‼️‼️ ---
  if (!isKioskMode) {
    // 1. พยายามเล่นเพลงอัตโนมัติเมื่อโหลดหน้าเว็บ
    toggleMusic();
    // 2. หากเล่นอัตโนมัติไม่สำเร็จ ให้เริ่มเล่นเมื่อผู้ใช้คลิกครั้งแรก
    document.body.addEventListener('click', () => {
      if (!isMusicPlaying && backgroundMusic.paused) {
          toggleMusic();
      }
    }, { once: true }); // { once: true } ทำให้ Event Listener นี้ทำงานแค่ครั้งเดียว
  }
});
