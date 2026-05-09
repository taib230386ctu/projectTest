// --- 1. IMPORT THƯ VIỆN ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- 2. CẤU HÌNH ---
const firebaseConfig = {
    apiKey: "AIzaSyC7BBc13wFAe73OrR-0qvwej7e8tARaJ1I",
    authDomain: "test01-34e19.firebaseapp.com",
    projectId: "test01-34e19",
    storageBucket: "test01-34e19.firebasestorage.app",
    messagingSenderId: "88182153733",
    appId: "1:88182153733:web:fed599711e576454a8726c",
    measurementId: "G-J7T1M2Q1D2"
};

const CLOUD_NAME = "dkn0v4yv2"; 
const UPLOAD_PRESET = "phaken_preset"; 

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.addEventListener('load', () => {
    
    // --- [A] LƯU TÊN NGƯỜI TRUY CẬP ---
    const startBtn = document.querySelector('.start-btn');
    const nameInput = document.querySelector('.input-box input');

    if (startBtn) {
        startBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const userName = nameInput.value.trim();
            if (userName !== "") {
                try {
                    await addDoc(collection(db, "visitors"), {
                        ten_nguoi_dung: userName,
                        ngay_gui: new Date()
                    });
                    alert("Chào mừng " + userName + "!");
                } catch (err) { console.error(err); }
            }
        });
    }

    // --- [B] UPLOAD ĐA PHƯƠNG TIỆN (GIỚI HẠN 500MB) ---
    const btnUpload = document.getElementById('btnUpload');
    const imgFile = document.getElementById('imgFile');
    const imgTitle = document.getElementById('imgTitle');

    if (btnUpload) {
        btnUpload.onclick = async () => {
            const file = imgFile.files[0];
            const title = imgTitle.value.trim();

            if (!file || !title) return alert("Cậu nhập tiêu đề và chọn file nhé!");

            // THIẾT LẬP GIỚI HẠN 500MB
            const maxSize = 500 * 1024 * 1024; 
            if (file.size > maxSize) {
                return alert("File quá lớn! Giới hạn tối đa là 500MB nha.");
            }

            try {
                // Hiển thị trạng thái đang tải kèm dung lượng để người dùng kiên nhẫn chờ
                const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
                btnUpload.innerText = `ĐANG TẢI (${fileSizeMB}MB)...`;
                btnUpload.disabled = true;

                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', UPLOAD_PRESET);

                const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
                    method: 'POST',
                    body: formData
                });
                const result = await res.json();

                if (result.secure_url) {
                    await addDoc(collection(db, "moments"), {
                        title: title,
                        url: result.secure_url,
                        type: result.resource_type,
                        fileSizeMB: fileSizeMB,
                        createdAt: new Date()
                    });
                    alert("Đã đăng tải thành công khoảnh khắc " + fileSizeMB + "MB!");
                    imgTitle.value = ""; imgFile.value = "";
                } else {
                    alert("Lỗi từ server: " + (result.error ? result.error.message : "Thử lại sau nhé!"));
                }
            } catch (error) {
                console.error(error);
                alert("Lỗi mạng hoặc server rồi!");
            } finally {
                btnUpload.innerText = "✦ TẢI LÊN HÀNH TRÌNH ✦";
                btnUpload.disabled = false;
            }
        };
    }

    // --- [C] HIỂN THỊ REAL-TIME ---
    const galleryGrid = document.getElementById('galleryGrid');
    if (galleryGrid) {
        const q = query(collection(db, "moments"), orderBy("createdAt", "desc"));

        onSnapshot(q, (snapshot) => {
            galleryGrid.innerHTML = ""; 
            snapshot.forEach((doc) => {
                const data = doc.data();
                let mediaTag = "";

                if (data.type === 'video') {
                    mediaTag = `
                        <video src="${data.url}" controls preload="metadata"
                               style="width: 100%; height: 280px; object-fit: cover; background: #000;">
                        </video>`;
                } else {
                    mediaTag = `
                        <img src="${data.url}" 
                             style="width: 100%; height: 280px; object-fit: cover;">`;
                }

                galleryGrid.innerHTML += `
                    <div class="gallery-card" style="background:#0a0a0a; border:1px solid #1a1a1a; border-radius:20px; overflow:hidden; margin-bottom:20px;">
                        ${mediaTag}
                        <div style="padding:15px;">
                            <h3 style="color:#d4af37; margin:0; font-size:1.1rem;">${data.title}</h3>
                            <div style="display:flex; justify-content:space-between; margin-top:10px; color:#444; font-size:0.7rem;">
                                <span>${data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('vi-VN') : 'Vừa xong'}</span>
                                <span>${data.fileSizeMB || 0} MB</span>
                            </div>
                        </div>
                    </div>
                `;
            });
        });
    }
});