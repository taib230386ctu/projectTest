import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getFirestore, collection, query, where, onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC7BBc13wFAe73OrR-0qvwej7e8tARaJ1I",
    authDomain: "test01-34e19.firebaseapp.com",
    projectId: "test01-34e19",
    storageBucket: "test01-34e19.firebasestorage.app",
    messagingSenderId: "88182153733",
    appId: "1:88182153733:web:fed599711e576454a8726c",
    measurementId: "G-J7T1M2Q1D2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function initGarden() {
    const gardenGrid = document.getElementById('homeGardenGrid');
    if (!gardenGrid) return;

    // Lọc các bài đã được duyệt
    const qMoments = query(
        collection(db, "moments"),
        where("status", "==", "approved")
    );

    onSnapshot(qMoments, (snapshot) => {
        gardenGrid.innerHTML = "";

        if (snapshot.empty) {
            gardenGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #fff;">Chưa có khoảnh khắc nào được gieo mầm...</p>`;
            return;
        }

        const moments = [];
        snapshot.forEach((docSnap) => {
            moments.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Sắp xếp bài nhiều tim nhất lên đầu
        moments.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));

        // Lấy đúng top 3
        const top3 = moments.slice(0, 3);

        top3.forEach((data) => {
            const title = data.title || "Khoảnh khắc";
            const author = data.author || "Người ẩn danh";
            const likes = data.likeCount || 0;
            const comments = data.commentCount || 0;
            const isVideo = data.type === "video";
            
            const mediaUrl = data.url || "./images/decor/photo_1.jpg";
            const posterUrl = isVideo ? mediaUrl.replace(/\.[^/.]+$/, ".jpg") : mediaUrl;

            let dateDisplay = "Vừa xong";
            if (data.createdAt && data.createdAt.seconds) {
                dateDisplay = new Date(data.createdAt.seconds * 1000).toLocaleDateString('vi-VN');
            }

            const mediaElement = isVideo 
                ? `<video src="${mediaUrl}" poster="${posterUrl}" preload="none" style="pointer-events: none; width:100%; height:100%; object-fit:cover;"></video>`
                : `<img src="${mediaUrl}" alt="${title}">`;

            const isLiked = localStorage.getItem(`liked_${data.id}`) === 'true';
            const heartClass = isLiked ? 'fa-solid' : 'fa-regular';
            const heartColor = isLiked ? '#e74c3c' : '#ccc';

            // Dùng toàn bộ cấu trúc HTML card chuẩn từ trang hoạt động
            gardenGrid.innerHTML += `
                <div class="gallery-card moment-card">
                    <div class="card-image-box">
                        ${mediaElement}
                    </div>
                    <div class="card-content">
                        <h3>${title}</h3>
                        <div class="card-info-list">
                            <p><i class="fa-solid fa-seedling"></i> Bởi: <span>${author}</span></p>
                            <p><i class="fa-solid fa-seedling"></i> <span>${dateDisplay}</span></p>
                        </div>
                        <div class="card-actions-bar">
                            <button type="button" style="color: ${heartColor};">
                                <i class="${heartClass} fa-heart"></i> <span>${likes}</span>
                            </button>
                            <button type="button" style="color: #ccc;">
                                <i class="fa-regular fa-comment"></i> <span>${comments}</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
    }, (error) => {
        console.error("Lỗi Firestore:", error);
        gardenGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #ffb4b4;">Lỗi kết nối Firebase.</p>`;
    });
}

// Chạy an toàn cho script module
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGarden);
} else {
    initGarden();
}
