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

// --- 3. Tải dữ liệu ---
function loadAllPosts() {
    const adminGrid = document.getElementById('adminGrid');
    const approvedGrid = document.getElementById('approvedGrid');

    // Lắng nghe bài CHỜ DUYỆT (Sắp xếp mới nhất lên đầu)
    const qPending = query(collection(db, "moments"), where("status", "==", "pending"), orderBy("createdAt", "desc"));
    onSnapshot(qPending, (snapshot) => {
        adminGrid.innerHTML = "";
        if (snapshot.empty) adminGrid.innerHTML = "<p style='color:#444; grid-column:1/-1; text-align:center;'>Vũ trụ đang yên bình...</p>";
        snapshot.forEach(docSnap => renderCard(docSnap, adminGrid, 'pending'));
    });

    // Lắng nghe bài ĐÃ DUYỆT
    const qApproved = query(collection(db, "moments"), where("status", "==", "approved"), orderBy("createdAt", "desc"));
    onSnapshot(qApproved, (snapshot) => {
        approvedGrid.innerHTML = "";
        if (snapshot.empty) approvedGrid.innerHTML = "<p style='color:#444; grid-column:1/-1; text-align:center;'>Chưa có bài nào tỏa sáng.</p>";
        snapshot.forEach(docSnap => renderCard(docSnap, approvedGrid, 'approved'));
    });
}

// --- 4. Hiển thị Card ---
function renderCard(docSnap, container, type) {
    const data = docSnap.data();
    const id = docSnap.id;
    const mediaTag = data.type === 'video' 
        ? `<video src="${data.url}" style="width:100%; height:220px; object-fit:cover; background:#000;"></video>`
        : `<img src="${data.url}" style="width:100%; height:220px; object-fit:cover;">`;

    const actionBtn = type === 'pending' 
        ? `<button onclick="updateStatus('${id}', 'approved')" style="flex:2; background:#28a745; color:white; border:none; padding:10px; border-radius:8px; cursor:pointer; font-weight:600;">DUYỆT ✅</button>`
        : `<button onclick="updateStatus('${id}', 'pending')" style="flex:2; background:#6c757d; color:white; border:none; padding:10px; border-radius:8px; cursor:pointer; font-weight:600;">GỠ ↩️</button>`;

    container.innerHTML += `
        <div class="gallery-card" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(212,176,106,0.1); border-radius: 20px; overflow: hidden;">
            ${mediaTag}
            <div style="padding: 15px;">
                <h3 style="font-family:'Maglony', serif; color: var(--gold); font-size: 1.1rem; margin-bottom: 15px;">${data.title}</h3>
                <div style="display: flex; gap: 8px;">
                    ${actionBtn}
                    <button onclick="deletePost('${id}', '${data.url}', '${data.type}', '${data.title}')" style="flex:1; background:#dc3545; color:white; border:none; padding:10px; border-radius:8px; cursor:pointer;">XÓA</button>
                </div>
            </div>
        </div>
    `;
}

// --- 5. Hàm xử lý Duyệt/Gỡ/Xóa ---
window.updateStatus = async (id, newStatus) => {
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
};

window.deletePost = async (id, url, type, title) => {
    const previewMedia = type === 'video'
        ? `<video src="${url}" autoplay muted loop style="width:100%; border-radius:10px; margin-top:10px; max-height:200px; object-fit:contain; background:#000;"></video>`
        : `<img src="${url}" style="width:100%; border-radius:10px; margin-top:10px; max-height:200px; object-fit:contain;">`;

    const result = await Swal.fire({
        title: 'XÁC NHẬN XÓA?',
        html: `<div style="text-align: center;"><p style="color:#d4b06a;"><b>✦ ${title} ✦</b></p>${previewMedia}</div>`,
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
};

checkAuth();