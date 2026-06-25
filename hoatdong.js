import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getFirestore, collection, addDoc, query, orderBy, where, onSnapshot, limit 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// =========================================================
// 1. CẤU HÌNH HỆ THỐNG (CONFIGURATIONS)
// =========================================================
const firebaseConfig = {
    apiKey: "AIzaSyC7BBc13wFAe73OrR-0qvwej7e8tARaJ1I", // LƯU Ý: Hãy cấu hình chặn Tên miền trên Google Cloud để bảo mật
    authDomain: "test01-34e19.firebaseapp.com",
    projectId: "test01-34e19",
    storageBucket: "test01-34e19.firebasestorage.app",
    messagingSenderId: "88182153733",
    appId: "1:88182153733:web:fed599711e576454a8726c",
    measurementId: "G-J7T1M2Q1D2"
};

const CLOUD_NAME = "dkn0v4yv2"; 
const UPLOAD_PRESET = "phaken_preset"; 

// Khởi tạo Firebase dịch vụ
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Biến trạng thái toàn cục để khóa cứng tên người dùng sau khi xác thực hành trình
let currentVisitorName = "";

// =========================================================
// 2. QUẢN LÝ SỰ KIỆN GIAO DIỆN (UI CONTROLLERS)
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    
    // --- [A] XỬ LÝ MENU MOBILE (HAMBURGER BANNER) ---
    const menuToggle = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.menu');

    if (menuToggle && menu) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('active');
        });
        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target) && !menuToggle.contains(e.target)) {
                menu.classList.remove('active');
            }
        });
    }

    // --- [B] XỬ LÝ XEM TRƯỚC FILE KHI CHỌN (PREVIEW ENGINE) ---
    const fileInput = document.getElementById('imgFile');
    const placeholder = document.getElementById('previewPlaceholder');
    const imgPreview = document.getElementById('imagePreview');
    const videoPreview = document.getElementById('videoPreview');
    const fileNameDisplay = document.getElementById('file-name-display');

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            imgPreview.style.display = 'none'; 
            videoPreview.style.display = 'none'; 
            videoPreview.src = ''; 
            placeholder.style.display = 'block';

            if (file) {
                const fileType = file.type;
                const fileUrl = URL.createObjectURL(file);
                fileNameDisplay.innerHTML = `Đã nhận: <b>${file.name}</b>`;
                fileNameDisplay.style.color = '#f6d28d';
                placeholder.style.display = 'none';

                if (fileType.startsWith('image/')) {
                    imgPreview.src = fileUrl; 
                    imgPreview.style.display = 'block';
                } else if (fileType.startsWith('video/')) {
                    videoPreview.src = fileUrl; 
                    videoPreview.style.display = 'block';
                }
            } else {
                fileNameDisplay.innerText = "Bạn chưa chọn khoảnh khắc nào...";
                fileNameDisplay.style.color = '#666';
            }
        });
    }

    // =========================================================
    // 3. XỬ LÝ LOGIC FIREBASE & CLOUDINARY (CORE LOGIC)
    // =========================================================

    const startBtn = document.querySelector('.start-btn');
    const nameInput = document.getElementById('visitorName');
    const uploadSection = document.getElementById('uploadSection');

    // --- TÁC VỤ 1: GHI NHẬN DANH TÍNH VISITOR ---
    if (startBtn && nameInput) {
        startBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const userName = nameInput.value.trim();

            if (userName === "") {
                return Swal.fire({
                    title: 'Tên của bạn là...',
                    text: 'Hãy để lại một cái tên để mình biết bạn vừa ghé thăm nhé!',
                    icon: 'question',
                    confirmButtonColor: '#d4af37',
                    background: '#050b14',
                    color: '#fff'
                });
            }

            try {
                // Khóa nút bấm ngay lập tức chống người dùng click nhiều lần liên tục
                startBtn.disabled = true;
                startBtn.innerText = "ĐANG MỞ KÉN...";

                // Hiện thông báo Loading
                Swal.fire({
                    title: 'Đang mở kén...',
                    html: 'Vũ trụ đang ghi nhớ tên bạn...',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                // Đẩy dữ liệu lưu tên lên Firebase
                await addDoc(collection(db, "visitors"), {
                    ten_nguoi_dung: userName,
                    ngay_gui: new Date()
                });

                currentVisitorName = userName;

                // Hiện thông báo thành công sau khi hoàn tất lưu dữ liệu
                Swal.fire({
                    title: `Chào mừng ${userName}!`,
                    html: 'Chúc bạn có một hành trình thật nhẹ nhàng tại <b>Phá Kén</b>. ✨',
                    icon: 'success',
                    confirmButtonText: 'BẮT ĐẦU THÔI ✦',
                    confirmButtonColor: '#d4af37',
                    background: '#050b14',
                    color: '#fff'
                }).then((result) => {
                    if (!uploadSection) return;

                    // 1. Hiện form upload dữ liệu lên (Trình duyệt sẽ hiểu display: block trước)
                    uploadSection.style.display = 'block';

                    // 2. Chờ 10ms cực ngắn để trình duyệt cập nhật DOM xong, rồi nạp class kích hoạt TỰ BAY LÊN
                    setTimeout(() => {
                        uploadSection.classList.add('active-fly');
                    }, 10);
                });

            } catch (err) {
                console.error("Firebase Visitor Error:", err);
                Swal.fire(
                    'Lỗi rồi!',
                    'Vũ trụ không thể ghi nhớ tên bạn lúc này, thử lại sau nhé!',
                    'error'
                );
                // Nếu lỗi, mở lại nút cho họ bấm thử lại
                startBtn.disabled = false;
                startBtn.innerText = "✦ BẮT ĐẦU HÀNH TRÌNH ✦";
            }
        });
    }

    const btnUpload = document.getElementById('btnUpload');
    const imgTitle = document.getElementById('imgTitle');

    // --- TÁC VỤ 2: ĐẨY FILE LÊN CLOUDINARY & LƯU THÔNG TIN MOMENT ---
    if (btnUpload) {
        btnUpload.onclick = async () => {
            const file = fileInput.files[0];
            const title = imgTitle.value.trim();
            const author = currentVisitorName;

            if (!author) {
                return Swal.fire({
                    title: 'Khoan đã...',
                    text: 'Hình như bạn chưa bấm "Bắt đầu hành trình" ở trên cùng thì phải?',
                    icon: 'warning',
                    confirmButtonColor: '#d4b06a',
                    background: '#050b14', color: '#fff'
                });
            }

            if (!file || !title) {
                return Swal.fire({
                    title: 'Thiếu thông tin!',
                    text: 'Bạn nhập đầy đủ tiêu đề và chọn file trước khi thả vào Galaxy nhé!',
                    icon: 'warning',
                    confirmButtonColor: '#d4b06a',
                    background: '#050b14', color: '#fff'
                });
            }

            Swal.fire({
                title: 'Thả vào Vũ trụ?',
                html: `
                    <div style="text-align: left; padding: 12px; background: rgba(212,176,106,0.1); border: 1px solid rgba(212,176,106,0.3); border-radius: 10px;">
                        <p style="margin-bottom: 8px; color: #fff;"><b>✦ Tác giả:</b> ${author}</p>
                        <p style="margin-bottom: 8px; color: #fff;"><b>✦ Tiêu đề:</b> ${title}</p>
                        <p style="margin-bottom: 0; font-size: 0.85rem; color: #aaa;"><b>✦ File:</b> ${file.name}</p>
                    </div>
                    <br><span style="font-size: 0.9rem;">Bạn có chắc muốn thả khoảnh khắc này không?</span>`,
                icon: 'question',
                showCancelButton: true, confirmButtonColor: '#d4b06a', cancelButtonColor: '#333', confirmButtonText: 'Thả vào Galaxy! ',
                background: '#050b14', color: '#fff'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        btnUpload.innerText = `ĐANG BAY VÀO GALAXY...`;
                        btnUpload.disabled = true;

                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('upload_preset', UPLOAD_PRESET);

                        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, { 
                            method: 'POST', 
                            body: formData 
                        });
                        
                        if (!res.ok) throw new Error("Cloudinary API Upload Failed.");
                        const resultUpload = await res.json();

                        if (resultUpload.secure_url) {
                            await addDoc(collection(db, "moments"), {
                                author: author, 
                                title: title,
                                url: resultUpload.secure_url,
                                public_id: resultUpload.public_id,
                                type: resultUpload.resource_type,
                                status: "pending", 
                                createdAt: new Date()
                            });

                            Swal.fire({
                                title: 'Đã gửi đi!',
                                text: 'Khoảnh khắc của bạn đang chờ được kiểm duyệt để lấp lánh trong Galaxy nhé! ✨',
                                icon: 'success', confirmButtonColor: '#d4b06a', background: '#050b14', color: '#fff'
                            });

                            imgTitle.value = ""; fileInput.value = "";
                            imgPreview.style.display = 'none'; videoPreview.style.display = 'none';
                            placeholder.style.display = 'block';
                            fileNameDisplay.innerText = "Bạn chưa chọn khoảnh khắc nào...";
                            fileNameDisplay.style.color = '#666';
                        }
                    } catch (error) {
                        console.error("Upload Logic Error: ", error);
                        Swal.fire('Lỗi rồi!', 'Hệ thống vũ trụ đang bận xử lý dữ liệu, bạn thử lại sau nhé!', 'error');
                    } finally {
                        btnUpload.innerText = "✦ THẢ VÀO VŨ TRỤ GALAXY ✦";
                        btnUpload.disabled = false;
                    }
                }
            });
        };
    }

    // --- TÁC VỤ 3: LẮNG NGHE DỮ LIỆU REAL-TIME & XEM THÊM ---
    const videoGrid = document.getElementById('videoGrid');
    const imageGrid = document.getElementById('imageGrid');
    const btnLoadMoreVideo = document.getElementById('btnLoadMoreVideo');
    const btnLoadMoreImage = document.getElementById('btnLoadMoreImage');

    let currentVideoLimit = 6;
    let currentImageLimit = 9;
    
    let unsubVideo = null;
    let unsubImage = null;

    // --- HÀM TẢI VIDEO ---
    function loadVideos() {
        if (unsubVideo) unsubVideo(); 
        
        const qVideo = query(collection(db, "moments"), where("status", "==", "approved"), where("type", "==", "video"), orderBy("createdAt", "desc"), limit(currentVideoLimit));
        
        unsubVideo = onSnapshot(qVideo, (snapshot) => {
            videoGrid.innerHTML = ""; 
            if (snapshot.empty) {
                videoGrid.innerHTML = `<p style="color:#444; text-align:center; grid-column:1/-1; font-family:'Montserrat', sans-serif; font-style:italic;">Chưa có thước phim nào được ghi lại... ✨</p>`;
                if (btnLoadMoreVideo) btnLoadMoreVideo.style.display = 'none';
                return;
            }
            
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const authorName = data.author ? data.author : "Người ẩn danh";
                const posterUrl = data.url.replace(/\.[^/.]+$/, ".jpg");
                
                // Tránh lỗi hiển thị ngày giờ khi Firebase cập nhật Real-time lơ lửng
                const dateDisplay = (data.createdAt && typeof data.createdAt.seconds !== 'undefined') 
                    ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('vi-VN') 
                    : 'Vừa xong';
                
                videoGrid.innerHTML += `
                    <div class="gallery-card">
                        <video src="${data.url}" poster="${posterUrl}" controls preload="none" style="width: 100%; height: 260px; object-fit: cover; background: #000;"></video>
                        <div class="card-content">
                            <h3>${data.title}</h3>
                            <p style="color: var(--gold-light); font-weight: 600; margin-bottom: 5px; font-style: normal !important;">✦ Bởi: ${authorName}</p>
                            <p>✦ ${dateDisplay}</p>
                        </div>
                    </div>
                `;
            });

            if (snapshot.docs.length < currentVideoLimit && btnLoadMoreVideo) {
                btnLoadMoreVideo.style.display = 'none'; 
            } else if (btnLoadMoreVideo) {
                btnLoadMoreVideo.style.display = 'inline-block'; 
            }
        });
    }

    // --- HÀM TẢI HÌNH ẢNH ---
    function loadImages() {
        if (unsubImage) unsubImage();
        
        const qImage = query(collection(db, "moments"), where("status", "==", "approved"), where("type", "==", "image"), orderBy("createdAt", "desc"), limit(currentImageLimit));
        
        unsubImage = onSnapshot(qImage, (snapshot) => {
            imageGrid.innerHTML = ""; 
            if (snapshot.empty) {
                imageGrid.innerHTML = `<p style="color:#444; text-align:center; grid-column:1/-1; font-family:'Montserrat', sans-serif; font-style:italic;">Chưa có bức hình nào lấp lánh tại đây... ✨</p>`;
                if (btnLoadMoreImage) btnLoadMoreImage.style.display = 'none';
                return;
            }

            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const authorName = data.author ? data.author : "Người ẩn danh";
                
                // Tránh lỗi hiển thị ngày giờ khi Firebase cập nhật Real-time lơ lửng
                const dateDisplay = (data.createdAt && typeof data.createdAt.seconds !== 'undefined') 
                    ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('vi-VN') 
                    : 'Vừa xong';
                
                imageGrid.innerHTML += `
                    <div class="gallery-card">
                        <img src="${data.url}" style="width: 100%; height: 260px; object-fit: cover;">
                        <div class="card-content">
                            <h3>${data.title}</h3>
                            <p style="color: var(--gold-light); font-weight: 600; margin-bottom: 5px; font-style: normal !important;">✦ Bởi: ${authorName}</p>
                            <p>✦ ${dateDisplay}</p>
                        </div>
                    </div>
                `;
            });

            if (snapshot.docs.length < currentImageLimit && btnLoadMoreImage) {
                btnLoadMoreImage.style.display = 'none';
            } else if (btnLoadMoreImage) {
                btnLoadMoreImage.style.display = 'inline-block';
            }
        });
    }

    if (videoGrid) loadVideos();
    if (imageGrid) loadImages();

    if (btnLoadMoreVideo) {
        btnLoadMoreVideo.addEventListener('click', () => {
            currentVideoLimit += 6; 
            loadVideos();
        });
    }

    if (btnLoadMoreImage) {
        btnLoadMoreImage.addEventListener('click', () => {
            currentImageLimit += 9; 
            loadImages();
        });
    }

    // --- TÁC VỤ: XỬ LÝ NÚT "CẤT LẠI VÀO KÉN" ---
    const btnCancel = document.getElementById('btnCancel');

    if (btnCancel) {
        btnCancel.onclick = () => {
            Swal.fire({
                title: 'Bạn muốn xóa bỏ sao ?',
                text: 'Cảm ơn bạn đã chia sẻ cho Kén, hi vọng bạn sẽ vượt qua những điều khó khăn',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#333',     
                cancelButtonColor: '#d4b06a',   
                confirmButtonText: 'Bỏ',
                cancelButtonText: 'Mình đổi ý ',
                background: '#050b14', color: '#fff'
            }).then((result) => {
                if (result.isConfirmed) {
                    const titleInput = document.getElementById('imgTitle');
                    if (titleInput) {
                        titleInput.value = "";
                        titleInput.style.height = 'auto'; 
                    }

                    const inputTypeFile = document.getElementById('imgFile');
                    if (inputTypeFile) inputTypeFile.value = "";

                    const imgView = document.getElementById('imagePreview');
                    if (imgView) {
                        imgView.src = "";
                        imgView.style.display = 'none';
                    }

                    const vidView = document.getElementById('videoPreview');
                    if (vidView) {
                        vidView.src = "";
                        vidView.style.display = 'none';
                    }

                    const phBox = document.getElementById('previewPlaceholder');
                    if (phBox) phBox.style.display = 'block';

                    const txtDisplay = document.getElementById('file-name-display');
                    if (txtDisplay) {
                        txtDisplay.innerText = "Bạn chưa chọn khoảnh khắc nào...";
                        txtDisplay.style.color = '#666';
                    }
                }
            });
        };
    }

    // --- XỬ LÝ TEXTAREA TỰ ĐỘNG CO GIÃN ---
    const imgTitleTextarea = document.getElementById('imgTitle');
    if (imgTitleTextarea) {
        imgTitleTextarea.addEventListener('input', function () {
            this.style.height = 'auto'; 
            this.style.height = this.scrollHeight + 'px'; 
        });
    }
});