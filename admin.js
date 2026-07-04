import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getFirestore, collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- 1. Cấu hình Firebase ---
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

// --- 2. Xác thực Admin ---
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
        backdrop: `rgba(5,11,20,0.95)`,
        customClass: { title: 'swal-title-art', input: 'swal-input-gold' }
    });

    if (password !== "123456") {
        await Swal.fire({ icon: 'error', title: 'Sai mật mã!', background: '#0a0a0a', color: '#fff' });
        window.location.href = "index.html";
    } else {
        loadAllPosts();
    }
};

// --- 3. Tải dữ liệu Real-time ---
function loadAllPosts() {
    const grids = {
        pendingImage: document.getElementById('pendingImage'),
        pendingVideo: document.getElementById('pendingVideo'),
        approvedImage: document.getElementById('approvedImage'),
        approvedVideo: document.getElementById('approvedVideo')
    };

    const q = query(collection(db, "moments"), orderBy("createdAt", "desc"));
    
    onSnapshot(q, (snapshot) => {
        // Xóa sạch nội dung cũ
        Object.values(grids).forEach(g => g.innerHTML = "");

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            // Xác định container dựa trên status và type
            const targetKey = `${data.status}${data.type.charAt(0).toUpperCase() + data.type.slice(1)}`;
            
            if (grids[targetKey]) {
                renderCard(docSnap, grids[targetKey], data.status);
            }
        });
    });
}

// --- 4. Hiển thị Card & Cấu hình Trình phát Video ---
function renderCard(docSnap, container, currentStatus) {
    const data = docSnap.data();
    const id = docSnap.id; 
    
    // LẤY TÊN TÁC GIẢ (Nếu bài cũ không có thì để ẩn danh)
    const authorName = data.author ? data.author : "Người ẩn danh";

    // Đã thêm controls giúp phát và tua video xem trước ngay tại trang quản trị
    const mediaTag = data.type === 'video' 
        ? `<video src="${data.url}" controls preload="metadata" style="width:100%; height:220px; object-fit:cover; background:#000; display:block;"></video>`
        : `<img src="${data.url}" style="width:100%; height:220px; object-fit:cover; display:block;">`;

    const actionBtn = currentStatus === 'pending' 
        ? `<button class="btn-status-toggle" data-id="${id}" data-next="approved" style="flex:2; background:#28a745; color:white; border:none; padding:10px; border-radius:8px; cursor:pointer; font-weight:600; transition:0.3s;">DUYỆT ✅</button>`
        : `<button class="btn-status-toggle" data-id="${id}" data-next="pending" style="flex:2; background:#6c757d; color:white; border:none; padding:10px; border-radius:8px; cursor:pointer; font-weight:600; transition:0.3s;">GỠ ↩️</button>`;

    // Khởi tạo thẻ Div chứa card
    const cardElement = document.createElement('div');
    cardElement.className = 'gallery-card';
    cardElement.style.cssText = "background: rgba(255,255,255,0.02); border: 1px solid rgba(212,176,106,0.1); border-radius: 20px; overflow: hidden;";
    
    cardElement.innerHTML = `
        ${mediaTag}
        <div style="padding: 15px;">
            <h3 style="font-family:'Maglony', serif; color: var(--gold); font-size: 1.1rem; margin-bottom: 5px;">${data.title}</h3>
            
            <p style="color: var(--gold-light); font-weight: 600; font-size: 0.9rem; margin-bottom: 15px;">✦ Bởi: ${authorName}</p>
            
            <div style="display: flex; gap: 8px;">
                ${actionBtn}
                <button class="btn-delete-post" data-id="${id}" data-url="${data.url}" data-type="${data.type}" data-title="${data.title}" data-author="${authorName}" style="flex:1; background:#dc3545; color:white; border:none; padding:10px; border-radius:8px; cursor:pointer; font-weight:600; transition:0.3s;">XÓA</button>
            </div>
        </div>
    `;

    // Sự kiện thay đổi trạng thái bài viết (Duyệt / Gỡ)
    cardElement.querySelector('.btn-status-toggle').onclick = (e) => {
        const docId = e.currentTarget.getAttribute('data-id');
        const nextStatus = e.currentTarget.getAttribute('data-next');
        updateStatus(docId, nextStatus);
    };

    // Sự kiện xóa bài viết khỏi Firebase vĩnh viễn
    cardElement.querySelector('.btn-delete-post').onclick = (e) => {
        const docId = e.currentTarget.getAttribute('data-id');
        const fileUrl = e.currentTarget.getAttribute('data-url');
        const fileType = e.currentTarget.getAttribute('data-type');
        const fileTitle = e.currentTarget.getAttribute('data-title');
        const fileAuthor = e.currentTarget.getAttribute('data-author'); // Truyền thêm tên tác giả vào hàm xóa
        deletePost(docId, fileUrl, fileType, fileTitle, fileAuthor);
    };

    container.appendChild(cardElement);
}

// --- 5. Hàm xử lý logic với SweetAlert2 ---
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
        background: '#0a0a0a', color: '#fff'
    });

    if (result.isConfirmed) {
        await updateDoc(doc(db, "moments", id), { status: newStatus });
    }
}

async function deletePost(id, url, type, title, author) {
    // Media hiển thị xem trước trong Popup cảnh báo xóa bài viết
    const previewMedia = type === 'video'
        ? `<video src="${url}" autoplay muted loop style="width:100%; border-radius:10px; margin-top:10px; max-height:200px; object-fit:contain; background:#000;"></video>`
        : `<img src="${url}" style="width:100%; border-radius:10px; margin-top:10px; max-height:200px; object-fit:contain;">`;

    const result = await Swal.fire({
        title: 'XÁC NHẬN XÓA?',
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
        background: '#0a0a0a', color: '#fff'
    });

    if (result.isConfirmed) {
        await deleteDoc(doc(db, "moments", id));
        Swal.fire({ title: 'Đã xóa!', icon: 'success', timer: 1500, showConfirmButton: false, background: '#0a0a0a', color: '#fff' });
    }
}

// Chạy xác thực mật mã quản trị ngay từ đầu
checkAuth();
