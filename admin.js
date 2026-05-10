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

    // 1. Lắng nghe bài CHỜ DUYỆT (Sắp xếp mới nhất lên đầu)
    const qPending = query(
        collection(db, "moments"), 
        where("status", "==", "pending"),
        orderBy("createdAt", "desc")
    );
    
    onSnapshot(qPending, (snapshot) => {
        adminGrid.innerHTML = "";
        if (snapshot.empty) adminGrid.innerHTML = "<p style='color:#444; grid-column:1/-1; text-align:center;'>Vũ trụ đang yên bình...</p>";
        snapshot.forEach(docSnap => renderCard(docSnap, adminGrid, 'pending'));
    });

    // 2. Lắng nghe bài ĐÃ DUYỆT (Giữ nguyên sắp xếp mới nhất)
    const qApproved = query(
        collection(db, "moments"), 
        where("status", "==", "approved"), 
        orderBy("createdAt", "desc")
    );
    
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
                    <button onclick="deletePost('${id}')" style="flex:1; background:#dc3545; color:white; border:none; padding:10px; border-radius:8px; cursor:pointer;">XÓA</button>
                </div>
            </div>
        </div>
    `;
}

// --- 5. HÀM XỬ LÝ (GIAO DIỆN SWEETALERT2) ---

window.updateStatus = async (id, newStatus) => {
    const isApproving = newStatus === 'approved';
    
    const result = await Swal.fire({
        title: isApproving ? 'Duyệt lên Galaxy?' : 'Gỡ khỏi Galaxy?',
        text: isApproving 
            ? 'Khoảnh khắc này sẽ được tỏa sáng công khai trên dải ngân hà.' 
            : 'Khoảnh khắc sẽ quay về trạng thái chờ duyệt và biến mất khỏi trang chủ.',
        icon: isApproving ? 'success' : 'warning',
        showCancelButton: true,
        confirmButtonColor: isApproving ? '#28a745' : '#6c757d',
        cancelButtonColor: '#333',
        confirmButtonText: isApproving ? 'DUYỆT NGAY! ✨' : 'GỠ XUỐNG ↩️',
        cancelButtonText: 'HỦY',
        background: '#0a0a0a',
        color: '#fff',
        backdrop: `rgba(5,11,20,0.8)`
    });

    if (result.isConfirmed) {
        try {
            await updateDoc(doc(db, "moments", id), { status: newStatus });
            
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                background: '#0a0a0a',
                color: '#d4b06a'
            });
            
            Toast.fire({
                icon: 'success',
                title: isApproving ? 'Đã duyệt thành công!' : 'Đã gỡ bài xuống.'
            });
        } catch (error) {
            Swal.fire('Lỗi!', 'Không thể kết nối với vũ trụ.', 'error');
        }
    }
};

window.deletePost = async (id, publicId, title) => {
    const result = await Swal.fire({
        title: 'XÓA VĨNH VIỄN?',
        html: `Khoảnh khắc <b>"${title}"</b> sẽ biến mất.<br><small style="color:red">Đừng quên xóa file trên Cloudinary với ID: <b>${publicId}</b></small>`,
        icon: 'error',
        showCancelButton: true,
        confirmButtonText: 'XÓA TRÊN WEB ❌',
        background: '#0a0a0a',
        color: '#fff'
    });

    if (result.isConfirmed) {
        await deleteDoc(doc(db, "moments", id));
        Swal.fire('Đã xóa trên Web!', 'Hãy vào Cloudinary xóa file có ID trên để sạch bộ nhớ nhé.', 'success');
    }
};

checkAuth();