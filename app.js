// --- 1. IMPORT THƯ VIỆN ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    where, 
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- 2. CẤU HÌNH FIREBASE ---
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

// Đảm bảo script chạy sau khi DOM đã tải xong
window.addEventListener('load', () => {
    
    // --- [A] LƯU TÊN NGƯỜI TRUY CẬP (UI XỊN XÒ) ---
const startBtn = document.querySelector('.start-btn');
const nameInput = document.querySelector('.input-box input');

if (startBtn) {
    startBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const userName = nameInput.value.trim();

        if (userName === "") {
            return Swal.fire({
                title: 'Tên của cậu là...',
                text: 'Hãy để lại một cái tên để mình biết cậu vừa ghé thăm nhé!',
                icon: 'question',
                confirmButtonColor: '#d4af37',
                background: '#050b14',
                color: '#fff'
            });
        }

        try {
            // Hiển thị loading nhẹ trong lúc lưu
            Swal.fire({
                title: 'Đang mở kén...',
                html: 'Vũ trụ đang ghi nhớ tên cậu...',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            await addDoc(collection(db, "visitors"), {
                ten_nguoi_dung: userName,
                ngay_gui: new Date()
            });

            // THÔNG BÁO CHÀO MỪNG XỊN XÒ
            Swal.fire({
                title: `Chào mừng ${userName}!`,
                html: 'Chúc cậu có một hành trình thật nhẹ nhàng tại <b>Phá Kén</b>. ✨',
                icon: 'success',
                confirmButtonText: 'BẮT ĐẦU THÔI ✦',
                confirmButtonColor: '#d4af37',
                background: '#050b14',
                color: '#fff',
                backdrop: `rgba(5, 11, 20, 0.9)`, // Làm tối nền mờ ảo
                customClass: {
                    title: 'swal-title-art', // Áp dụng font Maglony
                }
            });
            
            nameInput.value = ""; // Xóa tên sau khi gửi thành công

        } catch (err) {
            console.error(err);
            Swal.fire('Lỗi rồi!', 'Vũ trụ đang gặp sự cố, thử lại sau nhé!', 'error');
        }
    });
}

    // --- [B] UPLOAD VŨ TRỤ GALAXY (CÓ KIỂM DUYỆT & SWEETALERT2) ---
    const btnUpload = document.getElementById('btnUpload');
    const imgFile = document.getElementById('imgFile');
    const imgTitle = document.getElementById('imgTitle');

    if (btnUpload) {
        btnUpload.onclick = async () => {
            const file = imgFile.files[0];
            const title = imgTitle.value.trim();

            if (!file || !title) {
                return Swal.fire({
                    title: 'Thiếu thông tin!',
                    text: 'Cậu nhập tiêu đề và chọn file trước khi thả vào Galaxy nhé!',
                    icon: 'warning',
                    confirmButtonColor: '#d4b06a'
                });
            }

            const fileName = file.name;

            // Hộp thoại xác nhận UI đẹp
            Swal.fire({
                title: 'Thả vào Vũ trụ?',
                html: `
                    <div style="text-align: left; padding: 12px; background: rgba(212,176,106,0.1); border: 1px solid rgba(212,176,106,0.3); border-radius: 10px;">
                        <p style="margin-bottom: 8px; color: #fff;"><b>✦ Tiêu đề:</b> ${title}</p>
                        <p style="margin-bottom: 0; font-size: 0.85rem; color: #aaa;"><b>✦ File:</b> ${fileName}</p>
                    </div>
                    <br><span style="font-size: 0.9rem;">Cậu có chắc muốn thả khoảnh khắc này không?</span>`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#d4b06a',
                cancelButtonColor: '#333',
                confirmButtonText: 'Thả ngay! ✨',
                cancelButtonText: 'Để sau',
                background: '#0a0a0a',
                color: '#fff',
                backdrop: `rgba(5,11,20,0.8)`
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
                        btnUpload.innerText = `ĐANG BAY VÀO GALAXY...`;
                        btnUpload.disabled = true;

                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('upload_preset', UPLOAD_PRESET);

                        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
                            method: 'POST',
                            body: formData
                        });
                        const resultUpload = await res.json();

                        if (resultUpload.secure_url) {
                            // LƯU VÀO FIRESTORE VỚI TRẠNG THÁI CHỜ DUYỆT (pending)
                            await addDoc(collection(db, "moments"), {
                                title: title,
                                url: resultUpload.secure_url,
                                public_id: resultUpload.public_id, // <--- THÊM DÒNG NÀY (Cực kỳ quan trọng)
                                type: resultUpload.resource_type,
                                status: "pending",
                                createdAt: new Date()
                            });

                            Swal.fire({
                                title: 'Đã gửi đi!',
                                text: 'Khoảnh khắc của cậu đang chờ được kiểm duyệt để lấp lánh trong Galaxy nhé! ✨',
                                icon: 'success',
                                confirmButtonColor: '#d4b06a',
                                background: '#0a0a0a',
                                color: '#fff'
                            });

                            imgTitle.value = ""; imgFile.value = "";
                        }
                    } catch (error) {
                        console.error(error);
                        Swal.fire('Lỗi rồi!', 'Vũ trụ đang gặp sự cố, thử lại sau nhé!', 'error');
                    } finally {
                        btnUpload.innerText = "✦ THẢ VÀO VŨ TRỤ GALAXY ✦";
                        btnUpload.disabled = false;
                    }
                }
            });
        };
    }

    // --- [C] HIỂN THỊ REAL-TIME (CHỈ HIỆN BÀI ĐÃ DUYỆT) ---
    const galleryGrid = document.getElementById('galleryGrid');
    if (galleryGrid) {
        // Chỉ lấy những bài có status == "approved"
        const q = query(
            collection(db, "moments"), 
            where("status", "==", "approved"), 
            orderBy("createdAt", "desc")
        );

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
                            <h3 style="color:#d4af37; margin:0; font-family:'Maglony', serif; font-size: 1.2rem;">${data.title}</h3>
                            <div style="margin-top:10px; color:#555; font-size:0.75rem; letter-spacing: 1px;">
                                <span>✦ ${data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('vi-VN') : 'Vừa xong'}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
        });
    }

    // --- [D] MENU MOBILE ---
    const menuToggle = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.menu');

    if(menuToggle && menu){
        menuToggle.addEventListener('click', () => {
            menu.classList.toggle('active');
        });
    }
});