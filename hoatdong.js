import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getFirestore, collection, addDoc, query, orderBy, where, onSnapshot, limit, doc, updateDoc, increment, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// =========================================================
// 1. CẤU HÌNH HỆ THỐNG
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

let currentVisitorName = "";
let activeMomentId = null; 
let unsubComments = null;   
let unsubModalComments = null;

// =========================================================
// HÀM BỔ TRỢ: HỎI TÊN NGƯỜI DÙNG NẾU CHƯA CÓ
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
        
        // Đồng bộ ngược lại ô input tên ở đầu trang (nếu có)
        const topNameInput = document.getElementById('visitorName');
        if (topNameInput) topNameInput.value = currentVisitorName;

        // Lưu danh tính lên Firestore (Visitor log)
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

    return null; // Người dùng bấm hủy
}

// =========================================================
// 2. LOGIC HOẠT ĐỘNG MAIN
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    
    // --- [A] XỬ LÝ XEM TRƯỚC FILE ---
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

    // --- [B] NÚT "BẮT ĐẦU HÀNH TRÌNH" ---
    const startBtn = document.querySelector('.start-btn');
    const nameInput = document.getElementById('visitorName');
    const uploadSection = document.getElementById('uploadSection');

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
                    background: '#050b14', color: '#fff'
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
                    title: `Chào mừng ${userName}!`,
                    html: 'Chúc bạn có một hành trình thật nhẹ nhàng tại <b>Phá Kén</b>.',
                    icon: 'success',
                    confirmButtonText: 'BẮT ĐẦU THÔI ✦',
                    confirmButtonColor: '#d4af37',
                    background: '#050b14', color: '#fff'
                }).then(() => {
                    if (!uploadSection) return;
                    uploadSection.style.display = 'block';
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

    // --- [C] UPLOAD CLOUDINARY & FIREBASE ---
    const btnUpload = document.getElementById('btnUpload');
    const imgTitle = document.getElementById('imgTitle');

    if (btnUpload) {
        btnUpload.onclick = async () => {
            const file = fileInput ? fileInput.files[0] : null;
            const title = imgTitle ? imgTitle.value.trim() : "";

            if (!file || !title) {
                return Swal.fire({
                    title: 'Thiếu thông tin!',
                    text: 'Bạn nhập đầy đủ tiêu đề và chọn file trước khi thả vào Galaxy nhé!',
                    icon: 'warning',
                    confirmButtonColor: '#d4b06a',
                    background: '#050b14', color: '#fff'
                });
            }

            const author = await ensureVisitorName();
            if (!author) return; 

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
                showCancelButton: true, confirmButtonColor: '#d4b06a', cancelButtonColor: '#333', confirmButtonText: 'Thả vào Galaxy!',
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
                                title: 'Đã gửi đi!',
                                text: 'Khoảnh khắc của bạn đang chờ được kiểm duyệt để lấp lánh trong Galaxy nhé!',
                                icon: 'success', confirmButtonColor: '#d4b06a', background: '#050b14', color: '#fff'
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
                        Swal.fire('Lỗi rồi!', 'Hệ thống vũ trụ đang bận xử lý dữ liệu, bạn thử lại sau nhé!', 'error');
                    } finally {
                        btnUpload.innerText = "✦ THẢ VÀO VŨ TRỤ GALAXY ✦";
                        btnUpload.disabled = false;
                    }
                }
            });
        };
    }

    // --- [D] XỬ LÝ MODAL PHÓNG TO 2 CỘT (LIGHTBOX) ---
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
                
                // Định dạng thời gian cho bình luận
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

    // Gửi bình luận trong Modal Lightbox (có serverTimestamp)
    if (modalBtnSendComment) {
        modalBtnSendComment.onclick = async () => {
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
        };
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            mediaModal.classList.remove('show');
            modalMediaContainer.innerHTML = ''; 
            if (unsubModalComments) unsubModalComments();
        });
    }

    if (mediaModal) {
        mediaModal.addEventListener('click', (e) => {
            if (e.target === mediaModal) {
                mediaModal.classList.remove('show');
                modalMediaContainer.innerHTML = '';
                if (unsubModalComments) unsubModalComments();
            }
        });
    }

    // --- [E] THẢ TIM TOÀN CỤC ---
    window.toggleLike = async function(e, momentId) {
        e.stopPropagation();
        const heartBtn = e.currentTarget;
        const heartIcon = heartBtn.querySelector('i');
        const likedKey = `liked_${momentId}`;
        const isLiked = localStorage.getItem(likedKey) === 'true';
        const momentRef = doc(db, "moments", momentId);

        try {
            if (isLiked) {
                localStorage.removeItem(likedKey);
                heartIcon.classList.replace('fa-solid', 'fa-regular');
                heartBtn.style.color = '#ccc';
                await updateDoc(momentRef, { likeCount: increment(-1) });
            } else {
                localStorage.setItem(likedKey, 'true');
                heartIcon.classList.replace('fa-regular', 'fa-solid');
                heartBtn.style.color = '#e74c3c';
                await updateDoc(momentRef, { likeCount: increment(1) });
            }
        } catch (err) {
            console.error("Lỗi thả tim:", err);
        }
    };

    // Modal Comment Riêng
    const commentModal = document.getElementById('commentModal');
    const closeCommentModal = document.getElementById('closeCommentModal');
    const commentList = document.getElementById('commentList');
    const btnSendComment = document.getElementById('btnSendComment');
    const commentInput = document.getElementById('commentInput');

    window.openCommentModal = function(e, momentId, title) {
        e.stopPropagation();
        activeMomentId = momentId;
        document.getElementById('commentModalTitle').textContent = `Bình luận: ${title}`;
        commentModal.classList.add('show');
        loadComments(momentId);
    };

    if (closeCommentModal) {
        closeCommentModal.onclick = () => {
            commentModal.classList.remove('show');
            if (unsubComments) unsubComments();
        };
    }

    function loadComments(momentId) {
        if (unsubComments) unsubComments();
        
        const qComments = query(
            collection(db, "moments", momentId, "comments"),
            orderBy("createdAt", "asc")
        );

        unsubComments = onSnapshot(qComments, async (snapshot) => {
            commentList.innerHTML = "";
            const totalComments = snapshot.size;
            await updateDoc(doc(db, "moments", momentId), { commentCount: totalComments });

            if (snapshot.empty) {
                commentList.innerHTML = `<p style="color:#666; font-style:italic; text-align:center; padding: 10px;">Chưa có bình luận nào...</p>`;
                return;
            }

            snapshot.forEach((docSnap) => {
                const cmt = docSnap.data();
                
                // Định dạng thời gian cho bình luận
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
                    <div style="background: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 8px; margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #f6d28d; font-weight: bold; font-size: 0.85rem;">✦ ${cmt.author}</span>
                            <span style="color: #666; font-size: 0.75rem;">${timeStr}</span>
                        </div>
                        <p style="margin: 4px 0 0 0; color: #ddd; font-size: 0.95rem;">${cmt.text}</p>
                    </div>
                `;
            });
            commentList.scrollTop = commentList.scrollHeight;
        });
    }

    // Nút Gửi trong Modal Bình Luận Thường (có serverTimestamp)
    if (btnSendComment) {
        btnSendComment.onclick = async () => {
            const text = commentInput.value.trim();
            if (!text) {
                return Swal.fire({
                    title: 'Bình luận trống!',
                    text: 'Bạn vui lòng nhập nội dung bình luận nhé!',
                    icon: 'warning',
                    confirmButtonColor: '#d4af37',
                    background: '#050b14', color: '#fff'
                });
            }

            const author = await ensureVisitorName();
            if (!author) return;

            try {
                btnSendComment.disabled = true;
                await addDoc(collection(db, "moments", activeMomentId, "comments"), {
                    author: author, 
                    text: text, 
                    createdAt: serverTimestamp()
                });
                commentInput.value = "";
            } catch (err) {
                console.error("Lỗi gửi cmt:", err);
                Swal.fire('Lỗi!', 'Không thể gửi bình luận lúc này, thử lại sau nhé!', 'error');
            } finally {
                btnSendComment.disabled = false;
            }
        };
    }

    // --- [F] REAL-TIME LOAD CARD ---
    const videoGrid = document.getElementById('videoGrid');
    const imageGrid = document.getElementById('imageGrid');
    const btnLoadMoreVideo = document.getElementById('btnLoadMoreVideo');
    const btnLoadMoreImage = document.getElementById('btnLoadMoreImage');
    const searchInput = document.getElementById('searchInput');

    let currentVideoLimit = 6;
    let currentImageLimit = 9;
    let unsubVideo = null;
    let unsubImage = null;
    let searchQuery = "";

    function loadVideos() {
        if (!videoGrid) return;
        if (unsubVideo) unsubVideo(); 
        
        const fetchLimit = searchQuery ? 50 : currentVideoLimit;
        const qVideo = query(collection(db, "moments"), where("status", "==", "approved"), where("type", "==", "video"), orderBy("createdAt", "desc"), limit(fetchLimit));
        
        unsubVideo = onSnapshot(qVideo, (snapshot) => {
            videoGrid.innerHTML = ""; 
            if (snapshot.empty) {
                videoGrid.innerHTML = `<p style="color:#444; text-align:center; grid-column:1/-1;">Chưa có thước phim nào...</p>`;
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
                        <div class="gallery-card" style="cursor: pointer;" onclick="openModal('video', '${data.url}', '${title.replace(/'/g, "\\'")}', '${authorName.replace(/'/g, "\\'")}', '${dateDisplay}', '${docId}', ${likes})">
                            <video src="${data.url}" poster="${posterUrl}" preload="none" style="width: 100%; height: 260px; object-fit: cover; background: #000; pointer-events: none;"></video>
                            <div class="card-content">
                                <h3>${title}</h3>
                                <p style="color: var(--gold-light); font-weight: 600; margin-bottom: 5px;">✦ Bởi: ${authorName}</p>
                                <p>✦ ${dateDisplay}</p>
                                
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
                                    <button onclick="toggleLike(event, '${docId}')" style="background: none; border: none; color: ${heartColor}; cursor: pointer; font-size: 1.1rem;">
                                        <i class="${heartClass} fa-heart"></i> <span class="like-count" style="font-size: 0.9rem; color: #fff;">${likes}</span>
                                    </button>
                                    <button onclick="openCommentModal(event, '${docId}', '${title.replace(/'/g, "\\'")}')" style="background: none; border: none; color: #ccc; cursor: pointer; font-size: 1.1rem;">
                                        <i class="fa-regular fa-comment"></i> <span style="font-size: 0.9rem; color: #fff;">${comments}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }
            });

            if (count === 0 && searchQuery) {
                videoGrid.innerHTML = `<p style="color:#666; text-align:center; grid-column:1/-1;">Không tìm thấy video phù hợp...</p>`;
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
                imageGrid.innerHTML = `<p style="color:#444; text-align:center; grid-column:1/-1;">Chưa có bức hình nào...</p>`;
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
                        <div class="gallery-card" style="cursor: pointer;" onclick="openModal('image', '${data.url}', '${title.replace(/'/g, "\\'")}', '${authorName.replace(/'/g, "\\'")}', '${dateDisplay}', '${docId}', ${likes})">
                            <img src="${data.url}" style="width: 100%; height: 260px; object-fit: cover;">
                            <div class="card-content">
                                <h3>${title}</h3>
                                <p style="color: var(--gold-light); font-weight: 600; margin-bottom: 5px;">✦ Bởi: ${authorName}</p>
                                <p>✦ ${dateDisplay}</p>
                                
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
                                    <button onclick="toggleLike(event, '${docId}')" style="background: none; border: none; color: ${heartColor}; cursor: pointer; font-size: 1.1rem;">
                                        <i class="${heartClass} fa-heart"></i> <span class="like-count" style="font-size: 0.9rem; color: #fff;">${likes}</span>
                                    </button>
                                    <button onclick="openCommentModal(event, '${docId}', '${title.replace(/'/g, "\\'")}')" style="background: none; border: none; color: #ccc; cursor: pointer; font-size: 1.1rem;">
                                        <i class="fa-regular fa-comment"></i> <span style="font-size: 0.9rem; color: #fff;">${comments}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }
            });

            if (count === 0 && searchQuery) {
                imageGrid.innerHTML = `<p style="color:#666; text-align:center; grid-column:1/-1;">Không tìm thấy hình ảnh phù hợp...</p>`;
            }

            if ((snapshot.docs.length < fetchLimit || searchQuery) && btnLoadMoreImage) btnLoadMoreImage.style.display = 'none';
            else if (btnLoadMoreImage) btnLoadMoreImage.style.display = 'inline-block';
        });
    }

    if (videoGrid) loadVideos();
    if (imageGrid) loadImages();

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim();
            loadVideos();
            loadImages();
        });
    }

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

    // --- [G] CANCEL & TEXTAREA ---
    const btnCancel = document.getElementById('btnCancel');
    if (btnCancel) {
        btnCancel.onclick = () => {
            Swal.fire({
                title: 'Bạn muốn xóa bỏ sao ?',
                text: 'Cảm ơn bạn đã chia sẻ cho Kén, hi vọng bạn sẽ vượt qua những điều khó khăn',
                icon: 'question', showCancelButton: true,
                confirmButtonColor: '#333', cancelButtonColor: '#d4b06a',
                confirmButtonText: 'Bỏ', cancelButtonText: 'Mình đổi ý',
                background: '#050b14', color: '#fff'
            }).then((result) => {
                if (result.isConfirmed) {
                    if (imgTitle) { imgTitle.value = ""; imgTitle.style.height = 'auto'; }
                    if (fileInput) fileInput.value = "";
                    if (imgPreview) { imgPreview.src = ""; imgPreview.style.display = 'none'; }
                    if (videoPreview) { videoPreview.src = ""; videoPreview.style.display = 'none'; }
                    if (placeholder) placeholder.style.display = 'block';
                    if (fileNameDisplay) {
                        fileNameDisplay.innerText = "Bạn chưa chọn khoảnh khắc nào...";
                        fileNameDisplay.style.color = '#666';
                    }
                }
            });
        };
    }

    if (imgTitle) {
        imgTitle.addEventListener('input', function () {
            this.style.height = 'auto'; 
            this.style.height = this.scrollHeight + 'px'; 
        });
    }
});
