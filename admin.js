import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getFirestore, collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, increment 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { 
    getStorage, ref, deleteObject 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// --- 1. CẤU HÌNH FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyC7BBc13wFAe73OrR-0qvwej7e8tARaJ1I",
    authDomain: "test01-34e19.firebaseapp.com",
    projectId: "test01-34e19",
    storageBucket: "test01-34e19.firebasestorage.app",
    messagingSenderId: "88182153733",
    appId: "1:88182153733:web:fed599711e576454a8726c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

let unsubComments = null;
let currentActiveMomentId = null;

// --- 2. XÁC THỰC ADMIN ---
const checkAuth = async () => {
    const { value: password } = await Swal.fire({
        title: 'XÁC THỰC ADMIN',
        input: 'password',
        inputLabel: 'Nhập mã tiếp cận Vũ trụ',
        inputPlaceholder: '••••••',
        background: '#0a0a0a',
        color: '#d4b06a',
        confirmButtonColor: '#d4b06a',
        confirmButtonText: 'TRUY CẬP ✦',
        allowOutsideClick: false,
        heightAuto: false,
        backdrop: `rgba(5,11,20,0.95)`,
        customClass: { title: 'swal-title-art', input: 'swal-input-gold' }
    });

    if (password !== "123456") {
        await Swal.fire({ 
            icon: 'error', 
            title: 'Sai mật mã!', 
            background: '#0a0a0a', 
            color: '#fff',
            heightAuto: false
        });
        window.location.href = "index.html";
    } else {
        loadAllPosts();
    }
};

// --- 3. TẢI DỮ LIỆU REAL-TIME BÀI VIẾT ---
function loadAllPosts() {
    const grids = {
        pendingImage: document.getElementById('pendingImage'),
        pendingVideo: document.getElementById('pendingVideo'),
        approvedImage: document.getElementById('approvedImage'),
        approvedVideo: document.getElementById('approvedVideo')
    };

    const q = query(collection(db, "moments"), orderBy("createdAt", "desc"));
    
    onSnapshot(q, (snapshot) => {
        Object.values(grids).forEach(g => { if (g) g.innerHTML = ""; });

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const targetKey = `${data.status}${data.type.charAt(0).toUpperCase() + data.type.slice(1)}`;
            
            if (grids[targetKey]) {
                renderCard(docSnap, grids[targetKey], data.status);
            }
        });
    });
}

// --- 4. RENDER CARD THEO GIAO DIỆN CHUẨN MẪU ---
function renderCard(docSnap, container, currentStatus) {
    const data = docSnap.data();
    const id = docSnap.id; 
    const authorName = data.author || "Người ẩn danh";
    const likesCount = data.likes || 0;
    const commentCount = data.commentCount || 0;

    // Định dạng ngày tháng
    let dateStr = "Vừa xong";
    if (data.createdAt) {
        const dateObj = data.createdAt.seconds ? new Date(data.createdAt.seconds * 1000) : new Date(data.createdAt);
        dateStr = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
    }

    const mediaTag = data.type === 'video' 
        ? `<video src="${data.url}" preload="metadata" style="width:100%; height:220px; object-fit:cover; background:#000; cursor:pointer;"></video>`
        : `<img src="${data.url}" style="width:100%; height:220px; object-fit:cover; cursor:pointer;">`;

    const actionBtn = currentStatus === 'pending' 
        ? `<button class="btn-status-toggle" data-id="${id}" style="flex:1; background:#28a745; color:white; border:none; padding:8px; border-radius:6px; cursor:pointer; font-weight:600; font-size:0.8rem;">DUYỆT ✅</button>`
        : `<button class="btn-status-toggle" data-id="${id}" style="flex:1; background:#6c757d; color:white; border:none; padding:8px; border-radius:6px; cursor:pointer; font-weight:600; font-size:0.8rem;">GỠ ↩️</button>`;

    const cardElement = document.createElement('div');
    cardElement.className = 'gallery-card';
    cardElement.style.cssText = "background: #090d16; border: 1px solid rgba(255,220,150,0.12); border-radius: 16px; overflow: hidden; color: #fff; font-family: sans-serif;";
    
    cardElement.innerHTML = `
        <!-- Media (Ảnh / Video) -->
        <div class="card-media-click" style="width:100%; cursor:pointer;">
            ${mediaTag}
        </div>

        <!-- Nội Dung Bài Viết -->
        <div style="padding: 16px;">
            <h3 style="font-size: 1.15rem; font-weight: 700; color: #e6ca65; margin-bottom: 12px; font-family: serif;">${data.title || 'Không tiêu đề'}</h3>
            
            <p style="color: #d4b06a; font-size: 0.9rem; font-weight: 600; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
                ✦ <span style="color: #fff;">Bởi:</span> <span style="color: #d4b06a;">${authorName}</span>
            </p>
            
            <p style="color: #8892b0; font-size: 0.82rem; margin-bottom: 14px;">
                ✦ ${dateStr}
            </p>

            <!-- Đường kẻ phân cách -->
            <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); margin-bottom: 12px;"></div>

            <!-- Hàng Footer: ❤️ Góc trái & 💬 Góc phải -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 2px 4px; font-size: 1rem; color: #e2e8f0;">
                <div class="btn-like-click" style="display: flex; align-items: center; gap: 6px; cursor: pointer; user-select: none;">
                    <span style="font-size: 1.2rem;">❤️</span>
                    <span style="font-weight: 600; font-size: 0.95rem;">${likesCount}</span>
                </div>

                <div class="btn-comment-click" style="display: flex; align-items: center; gap: 6px; cursor: pointer; user-select: none;">
                    <span style="font-size: 1.2rem; filter: opacity(0.9);">💬</span>
                    <span style="font-weight: 600; font-size: 0.95rem;">${commentCount}</span>
                </div>
            </div>

            <!-- Nút Quản lý Admin -->
            <div style="display: flex; gap: 8px; margin-top: 14px; border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 10px;">
                ${actionBtn}
                <button class="btn-delete-post" style="flex:1; background:#dc3545; color:white; border:none; padding:8px; border-radius:6px; cursor:pointer; font-weight:600; font-size:0.8rem;">XÓA ❌</button>
            </div>
        </div>
    `;

    // Sự kiện Click
    const openModalHandler = () => openMediaModal(id, data);
    cardElement.querySelector('.card-media-click').onclick = openModalHandler;
    cardElement.querySelector('.btn-comment-click').onclick = openModalHandler;

    // Bấm ❤️ thả tim
    cardElement.querySelector('.btn-like-click').onclick = () => toggleLike(id);

    // Duyệt/Gỡ & Xóa
    cardElement.querySelector('.btn-status-toggle').onclick = () => updateStatus(id, currentStatus === 'pending' ? 'approved' : 'pending');
    cardElement.querySelector('.btn-delete-post').onclick = () => deletePost(id, data.url, data.type, data.title, authorName);

    container.appendChild(cardElement);
}

// --- 5. TĂNG TIM / DUYỆT / GỠ / XÓA BÀI VIẾT ---
async function toggleLike(id) {
    try {
        await updateDoc(doc(db, "moments", id), {
            likes: increment(1)
        });
    } catch (err) {
        console.error("Lỗi thả tim:", err);
    }
}

async function updateStatus(id, newStatus) {
    const isApproving = newStatus === 'approved';
    const result = await Swal.fire({
        title: isApproving ? 'Duyệt lên Galaxy?' : 'Gỡ khỏi Galaxy?',
        text: isApproving ? 'Khoảnh khắc này sẽ được tỏa sáng công khai.' : 'Khoảnh khắc sẽ quay về trạng thái chờ duyệt.',
        icon: isApproving ? 'success' : 'warning',
        showCancelButton: true,
        confirmButtonColor: isApproving ? '#28a745' : '#6c757d',
        cancelButtonColor: '#333',
        confirmButtonText: isApproving ? 'DUYỆT NGAY! ✨' : 'GỠ XUỐNG ↩️',
        background: '#0a0a0a', 
        color: '#fff',
        heightAuto: false
    });

    if (result.isConfirmed) {
        await updateDoc(doc(db, "moments", id), { status: newStatus });
    }
}

async function deletePost(id, url, type, title, author) {
    const previewMedia = type === 'video'
        ? `<video src="${url}" autoplay muted loop style="width:100%; border-radius:10px; margin-top:10px; max-height:180px; object-fit:contain; background:#000;"></video>`
        : `<img src="${url}" style="width:100%; border-radius:10px; margin-top:10px; max-height:180px; object-fit:contain;">`;

    const result = await Swal.fire({
        title: 'XÁC NHẬN XÓA BÀI?',
        html: `<div style="text-align: center;">
                  <p style="color:#d4b06a; margin-bottom: 5px;"><b>✦ ${title} ✦</b></p>
                  <p style="color:#aaa; font-size: 0.85rem; margin-bottom: 10px;">Bởi: ${author}</p>
                  ${previewMedia}
               </div>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'XÓA NGAY ❌',
        cancelButtonText: 'GIỮ LẠI',
        background: '#0a0a0a', 
        color: '#fff',
        heightAuto: false
    });

    if (result.isConfirmed) {
        try {
            if (url && url.includes("firebasestorage")) {
                const storageRef = ref(storage, url);
                await deleteObject(storageRef).catch(err => console.log("Lỗi xóa file Storage:", err));
            }
            await deleteDoc(doc(db, "moments", id));
            
            if (currentActiveMomentId === id) closeModal();

            Swal.fire({ title: 'Đã xóa thành công!', icon: 'success', timer: 1500, showConfirmButton: false, background: '#0a0a0a', color: '#fff', heightAuto: false });
        } catch (err) {
            console.error(err);
            Swal.fire({ icon: 'error', title: 'Lỗi khi xóa bài!', background: '#0a0a0a', color: '#fff', heightAuto: false });
        }
    }
}

// --- 6. MODAL XEM CHI TIẾT & BÌNH LUẬN ---
function openMediaModal(momentId, data) {
    currentActiveMomentId = momentId;
    const modal = document.getElementById('mediaModal');
    const mediaContainer = document.getElementById('modalMediaContainer');
    const titleEl = document.getElementById('modalTitle');
    const descEl = document.getElementById('modalDesc');

    if (!modal) return;

    if (data.type === 'video') {
        mediaContainer.innerHTML = `<video src="${data.url}" controls autoplay style="max-width:100%; max-height:80vh; object-fit:contain;"></video>`;
    } else {
        mediaContainer.innerHTML = `<img src="${data.url}" style="max-width:100%; max-height:80vh; object-fit:contain;">`;
    }

    titleEl.innerText = data.title || "Chưa có tiêu đề";
    descEl.innerText = `Bởi: ${data.author || 'Ẩn danh'} • Mô tả: ${data.desc || 'Không có mô tả'}`;

    listenComments(momentId);
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('mediaModal');
    const mediaContainer = document.getElementById('modalMediaContainer');
    
    if (modal) modal.classList.remove('active');
    if (mediaContainer) mediaContainer.innerHTML = ''; 
    
    if (unsubComments) unsubComments();
    currentActiveMomentId = null;
}

// --- 7. LẮNG NGHE & XÓA BÌNH LUẬN REAL-TIME ---
function listenComments(momentId) {
    const commentList = document.getElementById('commentList');
    const commentCountEl = document.getElementById('commentCount');

    if (unsubComments) unsubComments();

    const qComments = query(
        collection(db, "moments", momentId, "comments"),
        orderBy("createdAt", "desc")
    );

    unsubComments = onSnapshot(qComments, (snapshot) => {
        if (commentCountEl) commentCountEl.innerText = snapshot.size;
        if (!commentList) return;

        commentList.innerHTML = "";

        if (snapshot.empty) {
            commentList.innerHTML = `<p style="color: #777; font-size: 13px; text-align: center; margin-top: 20px;">Bài viết chưa có bình luận nào.</p>`;
            return;
        }

        snapshot.forEach((docSnap) => {
            const comment = docSnap.data();
            const commentId = docSnap.id;
            const dateStr = comment.createdAt?.seconds 
                ? new Date(comment.createdAt.seconds * 1000).toLocaleString('vi-VN') 
                : 'Vừa xong';

            const item = document.createElement('div');
            item.className = 'comment-item';
            
            item.innerHTML = `
                <div class="comment-content">
                    <div class="comment-author">✦ ${comment.author || 'Khách'} <span style="color:#666; font-size:11px;">(${dateStr})</span></div>
                    <div class="comment-text">${comment.text}</div>
                </div>
                <button class="btn-delete-comment">🗑️ Xóa</button>
            `;

            item.querySelector('.btn-delete-comment').onclick = () => deleteComment(momentId, commentId);
            commentList.appendChild(item);
        });
    });
}

async function deleteComment(momentId, commentId) {
    const confirm = await Swal.fire({
        title: 'Xóa bình luận này?',
        text: 'Bình luận sẽ bị xóa vĩnh viễn khỏi hệ thống.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'XÓA NAY',
        cancelButtonText: 'HỦY',
        background: '#0a0a0a', 
        color: '#fff',
        heightAuto: false
    });

    if (confirm.isConfirmed) {
        try {
            await deleteDoc(doc(db, "moments", momentId, "comments", commentId));
            await updateDoc(doc(db, "moments", momentId), { commentCount: increment(-1) });
        } catch (err) {
            console.error("Lỗi khi xóa bình luận:", err);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('mediaModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('modal-close')) {
                closeModal();
            }
        });
    }
});

checkAuth();
