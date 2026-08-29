import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getFirestore, collection, addDoc, query, orderBy, where, onSnapshot, limit, doc, updateDoc, increment, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// =========================================================
// 1. CẤU HÌNH & KHỞI TẠO HỆ THỐNG
// =========================================================
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

// Biến trạng thái toàn cục
let currentVisitorName = "";
let activeMomentId = null; 
let unsubComments = null;   
let unsubModalComments = null;

// =========================================================
// 2. HÀM DÙNG CHUNG (UTILS)
// =========================================================
async function ensureVisitorName() {
    if (currentVisitorName) return currentVisitorName;

    const { value: nameInput } = await Swal.fire({
        title: 'Tên của bạn là...',
        text: 'Nhập tên của bạn để tiếp tục nhé:',
        input: 'text',
        inputPlaceholder: 'Nhập tên của bạn...',
        showCancelButton: true,
        confirmButtonText: 'Xác nhận',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#d4af37',
        background: '#050b14', color: '#fff',
        inputValidator: (value) => {
            if (!value || !value.trim()) {
                return 'Vui lòng nhập tên của bạn!';
            }
        }
    });

    if (nameInput && nameInput.trim()) {
        currentVisitorName = nameInput.trim();
        
        const topNameInput = document.getElementById('visitorName');
        if (topNameInput) topNameInput.value = currentVisitorName;

        try {
            await addDoc(collection(db, "visitors"), {
                ten_nguoi_dung: currentVisitorName,
                ngay_gui: serverTimestamp()
            });
        } catch (e) {
            console.error("Lỗi lưu visitor:", e);
        }

        return currentVisitorName;
    }

    return null;
}

// Hàm thả tim (Like / Unlike) dùng chung cho cả Card trên Grid
window.toggleLike = async function(e, momentId) {
    e.stopPropagation();
    if (!momentId) return;

    const likedKey = `liked_${momentId}`;
    const isLiked = localStorage.getItem(likedKey) === 'true';
    const momentRef = doc(db, "moments", momentId);

    if (isLiked) {
        localStorage.removeItem(likedKey);
        await updateDoc(momentRef, { likeCount: increment(-1) });
    } else {
        localStorage.setItem(likedKey, 'true');
        await updateDoc(momentRef, { likeCount: increment(1) });
    }
};

// =========================================================
// 3. LUỒNG XỬ LÝ CHÍNH THEO THỨ TỰ GIAO DIỆN HTML
// =========================================================
document.addEventListener('DOMContentLoaded', () => {

    // -----------------------------------------------------
    // PHẦN 1: HERO SECTION (NÚT BẮT ĐẦU HÀNH TRÌNH)
    // -----------------------------------------------------
    const startBtn = document.querySelector('.start-btn');
    const nameInput = document.getElementById('visitorName');
    const uploadSection = document.querySelector('.garden-section');

    if (startBtn && nameInput) {
        startBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const userName = nameInput.value.trim();

            if (userName === "") {
                return Swal.fire({
                    html: `
                        <div class="popup-subhead-outside">REAL FINE</div>
                        <div class="custom-welcome-box">
                            <div class="avatar-circle">
                                <img src="./images/icon_tb/icon_tb1.png" alt="Butterfly Icon">
                            </div>
                            <h2 class="welcome-title">Tên của bạn là...</h2>
                            <p class="welcome-text">Hãy để lại một cái tên để mình biết bạn vừa ghé thăm nhé!</p>
                        </div>
                    `,
                    customClass: {
                        popup: 'custom-swal-popup',
                        confirmButton: 'custom-swal-btn'
                    },
                    confirmButtonText: 'OK',
                    buttonsStyling: false,
                    showConfirmButton: true
                });
            }

            try {
                startBtn.disabled = true;
                startBtn.innerText = "ĐANG MỞ KÉN...";

                await addDoc(collection(db, "visitors"), {
                    ten_nguoi_dung: userName,
                    ngay_gui: serverTimestamp()
                });

                currentVisitorName = userName;

                Swal.fire({
                    html: `
                        <div class="popup-subhead-outside">REAL FINE</div>
                        <div class="custom-welcome-box">
                            <div class="avatar-circle1">
                                <img src="./images/ML/ML_2.png" alt="Butterfly Icon">
                            </div>
                            <h2 class="welcome-title">Chào mừng ${currentVisitorName}!</h2>
                            <p class="welcome-text">Cảm ơn bạn đã ghé thăm. Hãy cùng gieo những khoảnh khắc thật đẹp vào khu vườn nhé!</p>
                        </div>
                    `,
                    customClass: {
                        popup: 'custom-swal-popup',
                        confirmButton: 'custom-swal-btn'
                    },
                    confirmButtonText: 'BẮT ĐẦU HÀNH TRÌNH',
                    buttonsStyling: false,
                    showConfirmButton: true
                }).then(() => {
                    if (!uploadSection) return;
                    uploadSection.style.display = 'flex';
                    setTimeout(() => { uploadSection.classList.add('active-fly'); }, 10);
                });

            } catch (err) {
                console.error("Firebase Visitor Error:", err);
                Swal.fire('Lỗi rồi!', 'Vũ trụ không thể ghi nhớ tên bạn lúc này, thử lại sau nhé!', 'error');
            } finally {
                startBtn.disabled = false;
                startBtn.innerText = "✦ BẮT ĐẦU HÀNH TRÌNH ✦";
            }
        });
    }

    // -----------------------------------------------------
    // PHẦN 2: UPLOAD FORM SECTION (ĐĂNG VÀ HỦY BÀI)
    // -----------------------------------------------------
    const fileInput = document.getElementById('file-input');
    const placeholder = document.getElementById('previewPlaceholder');
    const imgPreview = document.getElementById('imagePreview');
    const videoPreview = document.getElementById('videoPreview');
    const fileNameDisplay = document.getElementById('file-name-display');
    const btnUpload = document.querySelector('.btn-action');
    const btnCancel = document.getElementById('btnCancel');
    const imgTitle = document.getElementById('imgTitle');

    // Xem trước File Ảnh/Video
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (imgPreview) imgPreview.style.display = 'none'; 
            if (videoPreview) {
                videoPreview.style.display = 'none'; 
                videoPreview.src = ''; 
            }
            if (placeholder) placeholder.style.display = 'block';

            if (file) {
                const fileType = file.type;
                const fileUrl = URL.createObjectURL(file);
                if (fileNameDisplay) {
                    fileNameDisplay.innerHTML = `Đã nhận: <b>${file.name}</b>`;
                    fileNameDisplay.style.color = '#f6d28d';
                }
                if (placeholder) placeholder.style.display = 'none';

                if (fileType.startsWith('image/')) {
                    if (imgPreview) {
                        imgPreview.src = fileUrl; 
                        imgPreview.style.display = 'block';
                    }
                } else if (fileType.startsWith('video/')) {
                    if (videoPreview) {
                        videoPreview.src = fileUrl; 
                        videoPreview.style.display = 'block';
                    }
                }
            } else {
                if (fileNameDisplay) {
                    fileNameDisplay.innerText = "Bạn chưa chọn khoảnh khắc nào...";
                    fileNameDisplay.style.color = '#666';
                }
            }
        });
    }

    // Tự động dãn độ cao Textarea
    if (imgTitle) {
        imgTitle.addEventListener('input', function () {
            this.style.height = 'auto'; 
            this.style.height = this.scrollHeight + 'px'; 
        });
    }

    // Nút Upload bài lên Cloudinary & Firestore
    // Nút Upload bài lên Cloudinary & Firestore
    if (btnUpload) {
        btnUpload.onclick = async () => {
            const file = fileInput ? fileInput.files[0] : null;
            const title = imgTitle ? imgTitle.value.trim() : "";

            // 1. Kiểm tra đầu vào
            if (!file || !title) {
                return Swal.fire({
                    title: 'Thiếu thông tin!',
                    text: 'Bạn nhập đầy đủ tiêu đề và chọn file trước khi gieo khoảnh khắc nhé!',
                    icon: 'warning',
                    confirmButtonColor: '#d4b06a',
                    background: '#050b14', color: '#fff'
                });
            }

            // 2. Lấy thông tin Tên người dùng, Tiêu đề và Tên file
            const author = await ensureVisitorName();
            if (!author) return; 

            const fileName = file.name; // Lấy tên file người dùng vừa chọn

            // 3. Hiển thị Popup xác nhận
            Swal.fire({
                html: `
                    <div class="popup-subhead-gieo">REAL FINE</div>
                    <div class="custom-gieo-card">
                        <div class="custom-gieo-avatar">
                            <img src="./images/icon_tb/icon_tb1.png" alt="Icon">
                        </div>
                        <h2 class="custom-gieo-title">Gieo khoảnh khắc này nhé?</h2>
                        
                        <div class="custom-gieo-content-box">
                            <p>✦ Tác giả: ${author}</p>
                            <p>✦ Tiêu đề: ${title}</p>
                            <p>✦ File: ${fileName}</p>
                        </div>
                        
                        <p class="custom-gieo-subtext">Bạn đã sẵn sàng gieo khoảnh khắc này chưa</p>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: '🍀 Gieo khoảnh khắc!',
                cancelButtonText: '🌱 Để dành lần sau!',
                buttonsStyling: false,
                customClass: {
                    popup: 'custom-gieo-popup',
                    actions: 'custom-gieo-actions',
                    confirmButton: 'custom-gieo-btn-confirm',
                    cancelButton: 'custom-gieo-btn-cancel'
                }
            }).then(async (result) => {
                // Nếu bấm "🌱 Gieo khoảnh khắc!" (confirmButton)
                if (result.isConfirmed) {
                    try {
                        btnUpload.innerText = `ĐANG GIEO KHOẢNH KHẮC...`;
                        btnUpload.disabled = true;

                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('upload_preset', UPLOAD_PRESET);

                        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, { 
                            method: 'POST', body: formData 
                        });
                        
                        if (!res.ok) throw new Error("Cloudinary Upload Failed.");
                        const resultUpload = await res.json();

                        if (resultUpload.secure_url) {
                            await addDoc(collection(db, "moments"), {
                                author: author, 
                                title: title,
                                url: resultUpload.secure_url,
                                public_id: resultUpload.public_id,
                                type: resultUpload.resource_type,
                                status: "pending", 
                                likeCount: 0,
                                commentCount: 0,
                                createdAt: serverTimestamp()
                            });

                            Swal.fire({
    html: `
        <div class="custom-success-card">
            <div class="custom-success-avatar">
                <img src="./images/ML/ML_5.png" alt="Giỏi quá!">
            </div>
            <h2 class="custom-success-title">Đã gieo mầm!</h2>
            <p class="custom-success-text">
                Khoảnh khắc của bạn đang chờ được duyệt để gieo mầm trong khu vườn nhé!
            </p>
        </div>
    `,
    confirmButtonText: 'OK',
    buttonsStyling: false,
    customClass: {
        popup: 'custom-success-popup',
        actions: 'custom-success-actions',
        confirmButton: 'custom-success-btn'
    }
});

                            if (imgTitle) imgTitle.value = ""; 
                            if (fileInput) fileInput.value = "";
                            if (imgPreview) imgPreview.style.display = 'none'; 
                            if (videoPreview) videoPreview.style.display = 'none';
                            if (placeholder) placeholder.style.display = 'block';
                            if (fileNameDisplay) {
                                fileNameDisplay.innerText = "Bạn chưa chọn khoảnh khắc nào...";
                                fileNameDisplay.style.color = '#666';
                            }
                        }
                    } catch (error) {
                        console.error("Upload Logic Error: ", error);
                        Swal.fire('Lỗi rồi!', 'Hệ thống đang bận xử lý dữ liệu, bạn thử lại sau nhé!', 'error');
                    } finally {
                        btnUpload.innerText = "Gieo khoảnh khắc";
                        btnUpload.disabled = false;
                    }
                }
            });
        };
    }

    // Nút Bỏ vào thùng rác (Cancel)
    // Nút Bỏ vào thùng rác (Cancel)
if (btnCancel) {
    btnCancel.onclick = () => {

        // Kiểm tra dữ liệu hiện tại
        const title = imgTitle ? imgTitle.value.trim() : "";
        const file = fileInput ? fileInput.files[0] : null;

        // Nếu chưa có tiêu đề VÀ chưa chọn hình/video
        if (!title && !file) {
            return Swal.fire({
                title: 'Chưa có gì để xóa!',
                text: 'Bạn chưa nhập tiêu đề hoặc chọn hình ảnh/video nào cả.',
                icon: 'warning',
                confirmButtonText: 'Đã hiểu',
                buttonsStyling: false,
                customClass: {
                    popup: 'custom-swal-popup',
                    confirmButton: 'custom-swal-btn'
                }
            });
        }

        // Có dữ liệu → hỏi xác nhận
        Swal.fire({
            html: `
                <div class="popup-subhead-outside">REAL FINE</div>

                <div class="custom-welcome-box">

                    <div class="avatar-circle">
                        <img 
                            src="./images/ML/ML_4.png" 
                            alt="Butterfly Icon"
                        >
                    </div>

                    <h2 class="welcome-title">
                        Bạn muốn xóa bỏ sao?
                    </h2>

                    <p class="welcome-text">
                        Những thông tin và hình ảnh/video bạn đang nhập
                        sẽ bị xóa khỏi biểu mẫu.
                    </p>

                </div>
            `,

            showCancelButton: true,

            confirmButtonText: 'Bỏ',
            cancelButtonText: 'Mình đổi ý',

            buttonsStyling: false,

            customClass: {
                popup: 'custom-swal-popup',
                actions: 'button-group',
                confirmButton: 'custom-swal-btn',
                cancelButton: 'custom-swal-btn'
            }

        }).then((result) => {

            // Người dùng xác nhận xóa
            if (result.isConfirmed) {

                // Xóa tiêu đề
                if (imgTitle) {
                    imgTitle.value = "";
                    imgTitle.style.height = 'auto';
                }

                // Xóa file
                if (fileInput) {
                    fileInput.value = "";
                }

                // Xóa preview ảnh
                if (imgPreview) {
                    imgPreview.src = "";
                    imgPreview.style.display = 'none';
                }

                // Xóa preview video
                if (videoPreview) {
                    videoPreview.src = "";
                    videoPreview.style.display = 'none';
                }

                // Hiện placeholder
                if (placeholder) {
                    placeholder.style.display = 'block';
                }

                // Reset tên file
                if (fileNameDisplay) {
                    fileNameDisplay.innerText =
                        "Bạn chưa chọn khoảnh khắc nào...";

                    fileNameDisplay.style.color = '#666';
                }
            }

        });
    };
}

    // -----------------------------------------------------
    // PHẦN 3: SEARCH BAR (TÌM KIẾM)
    // -----------------------------------------------------
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearch');
    let searchQuery = "";

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim();
            loadVideos();
            loadImages();
        });
    }

    if (clearSearchBtn && searchInput) {
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = "";
            searchQuery = "";
            loadVideos();
            loadImages();
        });
    }

    // -----------------------------------------------------
    // PHẦN 4 & 5: GALLERIES (LOAD VIDEO & IMAGE GRIDS)
    // -----------------------------------------------------
    const videoGrid = document.getElementById('videoGrid');
    const imageGrid = document.getElementById('imageGrid');
    const btnLoadMoreVideo = document.getElementById('btnLoadMoreVideo');
    const btnLoadMoreImage = document.getElementById('btnLoadMoreImage');

    let currentVideoLimit = 6;
    let currentImageLimit = 9;
    let unsubVideo = null;
    let unsubImage = null;

    function loadVideos() {
    if (!videoGrid) return;
    if (unsubVideo) unsubVideo(); 
    
    const fetchLimit = searchQuery ? 50 : currentVideoLimit;
    const qVideo = query(collection(db, "moments"), where("status", "==", "approved"), where("type", "==", "video"), orderBy("createdAt", "desc"), limit(fetchLimit));
    
    unsubVideo = onSnapshot(qVideo, (snapshot) => {
        videoGrid.innerHTML = ""; 
        if (snapshot.empty) {
            videoGrid.innerHTML = `<p style="color:#fff; text-align:center; grid-column:1/-1;">Chưa có thước phim nào...</p>`;
            if (btnLoadMoreVideo) btnLoadMoreVideo.style.display = 'none';
            return;
        }
        
        let count = 0;
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const docId = docSnap.id;
            const authorName = data.author || "Người ẩn danh";
            const title = data.title || "";
            const likes = data.likeCount || 0;
            const comments = data.commentCount || 0;

            const filterText = searchQuery.toLowerCase();
            if (title.toLowerCase().includes(filterText) || authorName.toLowerCase().includes(filterText)) {
                count++;
                const posterUrl = data.url.replace(/\.[^/.]+$/, ".jpg");
                const dateDisplay = (data.createdAt && typeof data.createdAt.seconds !== 'undefined') 
                    ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('vi-VN') : 'Vừa xong';
                
                const isLiked = localStorage.getItem(`liked_${docId}`) === 'true';
                const heartClass = isLiked ? 'fa-solid' : 'fa-regular';
                const heartColor = isLiked ? '#e74c3c' : '#ccc';

                videoGrid.innerHTML += `
                    <div class="gallery-card moment-card" style="cursor: pointer;" onclick="openModal('video', '${data.url}', '${title.replace(/'/g, "\\'")}', '${authorName.replace(/'/g, "\\'")}', '${dateDisplay}', '${docId}', ${likes})">
                        <div class="card-image-box">
                            <video src="${data.url}" poster="${posterUrl}" preload="none" style="pointer-events: none;"></video>
                        </div>
                        <div class="card-content">
                            <h3>${title}</h3>
                            <div class="card-info-list">
                                <p><i class="fa-solid fa-seedling"></i> Bởi: <span>${authorName}</span></p>
                                <p><i class="fa-solid fa-seedling"></i> <span>${dateDisplay}</span></p>
                            </div>
                            
                            <div class="card-actions-bar">
                                <button onclick="toggleLike(event, '${docId}')" style="color: ${heartColor};">
                                    <i class="${heartClass} fa-heart"></i> <span style="font-size: 0.9rem; color: #fff;">${likes}</span>
                                </button>
                                <button onclick="openCommentModal(event, '${docId}', '${title.replace(/'/g, "\\'")}')" style="color: #ccc;">
                                    <i class="fa-regular fa-comment"></i> <span style="font-size: 0.9rem; color: #fff;">${comments}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
        });

        if (count === 0 && searchQuery) {
            videoGrid.innerHTML = `<p style="color:#fff; text-align:center; grid-column:1/-1;">Không tìm thấy video phù hợp...</p>`;
        }

        if ((snapshot.docs.length < fetchLimit || searchQuery) && btnLoadMoreVideo) btnLoadMoreVideo.style.display = 'none'; 
        else if (btnLoadMoreVideo) btnLoadMoreVideo.style.display = 'inline-block'; 
    });
}

function loadImages() {
    if (!imageGrid) return;
    if (unsubImage) unsubImage();
    
    const fetchLimit = searchQuery ? 50 : currentImageLimit;
    const qImage = query(collection(db, "moments"), where("status", "==", "approved"), where("type", "==", "image"), orderBy("createdAt", "desc"), limit(fetchLimit));
    
    unsubImage = onSnapshot(qImage, (snapshot) => {
        imageGrid.innerHTML = ""; 
        if (snapshot.empty) {
            imageGrid.innerHTML = `<p style="color:#fff; text-align:center; grid-column:1/-1;">Chưa có bức hình nào...</p>`;
            if (btnLoadMoreImage) btnLoadMoreImage.style.display = 'none';
            return;
        }

        let count = 0;
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const docId = docSnap.id;
            const authorName = data.author || "Người ẩn danh";
            const title = data.title || "";
            const likes = data.likeCount || 0;
            const comments = data.commentCount || 0;

            const filterText = searchQuery.toLowerCase();
            if (title.toLowerCase().includes(filterText) || authorName.toLowerCase().includes(filterText)) {
                count++;
                const dateDisplay = (data.createdAt && typeof data.createdAt.seconds !== 'undefined') 
                    ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('vi-VN') : 'Vừa xong';
                
                const isLiked = localStorage.getItem(`liked_${docId}`) === 'true';
                const heartClass = isLiked ? 'fa-solid' : 'fa-regular';
                const heartColor = isLiked ? '#e74c3c' : '#ccc';

                imageGrid.innerHTML += `
                    <div class="gallery-card moment-card" style="cursor: pointer;" onclick="openModal('image', '${data.url}', '${title.replace(/'/g, "\\'")}', '${authorName.replace(/'/g, "\\'")}', '${dateDisplay}', '${docId}', ${likes})">
                        <div class="card-image-box">
                            <img src="${data.url}" alt="${title}">
                        </div>
                        <div class="card-content">
                            <h3>${title}</h3>
                            <div class="card-info-list">
                                <p><i class="fa-solid fa-seedling"></i> Bởi: <span>${authorName}</span></p>
                                <p><i class="fa-solid fa-seedling"></i> <span>${dateDisplay}</span></p>
                            </div>
                            
                            <div class="card-actions-bar">
                                <button onclick="toggleLike(event, '${docId}')" style="color: ${heartColor};">
                                    <i class="${heartClass} fa-heart"></i> <span style="font-size: 0.9rem; color: #fff;">${likes}</span>
                                </button>
                                <button onclick="openCommentModal(event, '${docId}', '${title.replace(/'/g, "\\'")}')" style="color: #ccc;">
                                    <i class="fa-regular fa-comment"></i> <span style="font-size: 0.9rem; color: #fff;">${comments}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
        });

        if (count === 0 && searchQuery) {
            imageGrid.innerHTML = `<p style="color:#fff; text-align:center; grid-column:1/-1;">Không tìm thấy hình ảnh phù hợp...</p>`;
        }

        if ((snapshot.docs.length < fetchLimit || searchQuery) && btnLoadMoreImage) btnLoadMoreImage.style.display = 'none';
        else if (btnLoadMoreImage) btnLoadMoreImage.style.display = 'inline-block';
    });
}

    if (videoGrid) loadVideos();
    if (imageGrid) loadImages();

    if (btnLoadMoreVideo) {
        btnLoadMoreVideo.addEventListener('click', () => {
            currentVideoLimit += 6; loadVideos();
        });
    }

    if (btnLoadMoreImage) {
        btnLoadMoreImage.addEventListener('click', () => {
            currentImageLimit += 9; loadImages();
        });
    }

    // -----------------------------------------------------
    // PHẦN 6: MODAL LIGHTBOX 2 CỘT (MEDIA MODAL)
    // -----------------------------------------------------
    const mediaModal = document.getElementById('mediaModal');
    const closeModalBtn = document.getElementById('closeModal');
    const modalMediaContainer = document.getElementById('modalMediaContainer');
    const modalTitle = document.getElementById('modalTitle');
    const modalAuthor = document.getElementById('modalAuthor');
    const modalDate = document.getElementById('modalDate');
    const modalLikeBtn = document.getElementById('modalLikeBtn');
    const modalLikeIcon = document.getElementById('modalLikeIcon');
    const modalLikeCount = document.getElementById('modalLikeCount');
    const modalCommentList = document.getElementById('modalCommentList');
    const modalCommentInput = document.getElementById('modalCommentInput');
    const modalBtnSendComment = document.getElementById('modalBtnSendComment');

    window.openModal = function(type, url, title, author, date, momentId, likes) {
        if (!mediaModal) return;
        activeMomentId = momentId;

        if (type === 'video') {
            modalMediaContainer.innerHTML = `<video src="${url}" controls autoplay></video>`;
        } else {
            modalMediaContainer.innerHTML = `<img src="${url}">`;
        }
        
        modalTitle.textContent = title;
        modalAuthor.textContent = `✦ Bởi: ${author}`;
        modalDate.textContent = `✦ Ngày đăng: ${date}`;
        modalLikeCount.textContent = likes || 0;

        const isLiked = localStorage.getItem(`liked_${momentId}`) === 'true';
        if (isLiked) {
            modalLikeIcon.className = "fa-solid fa-heart";
            modalLikeBtn.style.color = "#e74c3c";
        } else {
            modalLikeIcon.className = "fa-regular fa-heart";
            modalLikeBtn.style.color = "#fff";
        }

        loadModalComments(momentId);
        mediaModal.classList.add('show');
        document.body.classList.add('modal-open');
    };

    function loadModalComments(momentId) {
        if (unsubModalComments) unsubModalComments();
        
        const qComments = query(
            collection(db, "moments", momentId, "comments"),
            orderBy("createdAt", "asc")
        );

        unsubModalComments = onSnapshot(qComments, async (snapshot) => {
            modalCommentList.innerHTML = "";
            const totalComments = snapshot.size;
            await updateDoc(doc(db, "moments", momentId), { commentCount: totalComments });

            if (snapshot.empty) {
                modalCommentList.innerHTML = `<p style="color:#666; font-style:italic; font-size:0.85rem; text-align:center;">Chưa có bình luận nào...</p>`;
                return;
            }

            snapshot.forEach((docSnap) => {
                const cmt = docSnap.data();
                let timeStr = "Vừa xong";
                if (cmt.createdAt) {
                    const dateObj = cmt.createdAt.seconds ? new Date(cmt.createdAt.seconds * 1000) : new Date(cmt.createdAt);
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const year = dateObj.getFullYear();
                    const hours = String(dateObj.getHours()).padStart(2, '0');
                    const mins = String(dateObj.getMinutes()).padStart(2, '0');
                    timeStr = `${day}/${month}/${year} ${hours}:${mins}`;
                }

                modalCommentList.innerHTML += `
                    <div style="background: rgba(255,255,255,0.05); padding: 8px 10px; border-radius: 8px; margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #f6d28d; font-weight: bold; font-size: 0.8rem;">✦ ${cmt.author}</span>
                            <span style="color: #666; font-size: 0.7rem;">${timeStr}</span>
                        </div>
                        <p style="margin: 3px 0 0 0; color: #ddd; font-size: 0.9rem;">${cmt.text}</p>
                    </div>
                `;
            });
            modalCommentList.scrollTop = modalCommentList.scrollHeight;
        });
    }

    if (modalLikeBtn) {
        modalLikeBtn.onclick = async () => {
            if (!activeMomentId) return;
            const likedKey = `liked_${activeMomentId}`;
            const isLiked = localStorage.getItem(likedKey) === 'true';
            const momentRef = doc(db, "moments", activeMomentId);

            let currentCount = parseInt(modalLikeCount.textContent) || 0;

            if (isLiked) {
                localStorage.removeItem(likedKey);
                modalLikeIcon.className = "fa-regular fa-heart";
                modalLikeBtn.style.color = "#fff";
                modalLikeCount.textContent = Math.max(0, currentCount - 1);
                await updateDoc(momentRef, { likeCount: increment(-1) });
            } else {
                localStorage.setItem(likedKey, 'true');
                modalLikeIcon.className = "fa-solid fa-heart";
                modalLikeBtn.style.color = "#e74c3c";
                modalLikeCount.textContent = currentCount + 1;
                await updateDoc(momentRef, { likeCount: increment(1) });
            }
        };
    }

    async function handleSendModalComment() {
        if (!modalCommentInput) return;
        const text = modalCommentInput.value.trim();
        if (!text) return;

        const author = await ensureVisitorName();
        if (!author) return;

        try {
            await addDoc(collection(db, "moments", activeMomentId, "comments"), {
                author: author,
                text: text,
                createdAt: serverTimestamp()
            });
            modalCommentInput.value = "";
        } catch (err) {
            console.error("Lỗi gửi bình luận modal:", err);
            Swal.fire('Lỗi!', 'Không thể gửi bình luận lúc này!', 'error');
        }
    }

    if (modalBtnSendComment) {
        modalBtnSendComment.onclick = handleSendModalComment;
    }

    if (modalCommentInput) {
        modalCommentInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSendModalComment();
        });
    }

    if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {

        mediaModal.classList.remove('show');

        document.body.classList.remove('modal-open');

        modalMediaContainer.innerHTML = '';

        if (unsubModalComments) {
            unsubModalComments();
        }
    });
}

    if (mediaModal) {
    mediaModal.addEventListener('click', (e) => {

        if (e.target === mediaModal) {

            mediaModal.classList.remove('show');

            document.body.classList.remove('modal-open');

            modalMediaContainer.innerHTML = '';

            if (unsubModalComments) {
                unsubModalComments();
            }
        }
    });
}

    // -----------------------------------------------------
    // PHẦN 7: MODAL BÌNH LUẬN ĐƠN (COMMENT MODAL)
    // -----------------------------------------------------
    const commentModal = document.getElementById('commentModal');
    const closeCommentModal = document.getElementById('closeCommentModal');
    const commentList = document.getElementById('commentList');
    const btnSendComment = document.getElementById('btnSendComment');
    const commentInput = document.getElementById('commentInput');
    const commentModalTitle = document.getElementById('commentModalTitle');

    window.openCommentModal = function(e, momentId, title) {
        e.stopPropagation();
        if (!commentModal) return;
        activeMomentId = momentId;
        
        if (commentModalTitle) {
            commentModalTitle.textContent = `Bình luận: ${title}`;
        }

        loadStandaloneComments(momentId);
        commentModal.classList.add('show');
    };

    function loadStandaloneComments(momentId) {
        if (unsubComments) unsubComments();

        const qComments = query(
            collection(db, "moments", momentId, "comments"),
            orderBy("createdAt", "asc")
        );

        unsubComments = onSnapshot(qComments, async (snapshot) => {
            if (!commentList) return;
            commentList.innerHTML = "";
            const totalComments = snapshot.size;
            await updateDoc(doc(db, "moments", momentId), { commentCount: totalComments });

            if (snapshot.empty) {
                commentList.innerHTML = `<p style="color:#666; font-style:italic; font-size:0.85rem; text-align:center;">Chưa có bình luận nào...</p>`;
                return;
            }

            snapshot.forEach((docSnap) => {
                const cmt = docSnap.data();
                let timeStr = "Vừa xong";
                if (cmt.createdAt) {
                    const dateObj = cmt.createdAt.seconds ? new Date(cmt.createdAt.seconds * 1000) : new Date(cmt.createdAt);
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const year = dateObj.getFullYear();
                    const hours = String(dateObj.getHours()).padStart(2, '0');
                    const mins = String(dateObj.getMinutes()).padStart(2, '0');
                    timeStr = `${day}/${month}/${year} ${hours}:${mins}`;
                }

                commentList.innerHTML += `
                    <div style="background: rgba(255,255,255,0.05); padding: 8px 10px; border-radius: 8px; margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #f6d28d; font-weight: bold; font-size: 0.8rem;">✦ ${cmt.author}</span>
                            <span style="color: #666; font-size: 0.7rem;">${timeStr}</span>
                        </div>
                        <p style="margin: 3px 0 0 0; color: #ddd; font-size: 0.9rem;">${cmt.text}</p>
                    </div>
                `;
            });
            commentList.scrollTop = commentList.scrollHeight;
        });
    }

    async function handleSendComment() {
        if (!commentInput) return;
        const text = commentInput.value.trim();
        if (!text) return;

        const author = await ensureVisitorName();
        if (!author) return;

        try {
            await addDoc(collection(db, "moments", activeMomentId, "comments"), {
                author: author,
                text: text,
                createdAt: serverTimestamp()
            });
            commentInput.value = "";
        } catch (err) {
            console.error("Lỗi gửi bình luận:", err);
            Swal.fire('Lỗi!', 'Không thể gửi bình luận lúc này!', 'error');
        }
    }

    if (btnSendComment) {
        btnSendComment.onclick = handleSendComment;
    }

    if (commentInput) {
        commentInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSendComment();
        });
    }

    if (closeCommentModal) {
        closeCommentModal.addEventListener('click', () => {
            commentModal.classList.remove('show');
            if (unsubComments) unsubComments();
        });
    }

    if (commentModal) {
        commentModal.addEventListener('click', (e) => {
            if (e.target === commentModal) {
                commentModal.classList.remove('show');
                if (unsubComments) unsubComments();
            }
        });
    }

    // Đóng Modal khi bấm phím ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (mediaModal && mediaModal.classList.contains('show')) {

    mediaModal.classList.remove('show');

    document.body.classList.remove('modal-open');

    modalMediaContainer.innerHTML = '';

    if (unsubModalComments) {
        unsubModalComments();
    }
}
            if (commentModal && commentModal.classList.contains('show')) {
                commentModal.classList.remove('show');
                if (unsubComments) unsubComments();
            }
        }
    });

});
