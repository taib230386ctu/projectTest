// Đảm bảo toàn bộ cấu trúc giao diện HTML của trang Phá Kén 1 được tải xong mới chạy
document.addEventListener('DOMContentLoaded', () => {
    
    // --- KHỞI TẠO BIẾN ĐIỀU KHIỂN MENU 3 GẠCH ---
    const menuToggle = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.menu');

    if (menuToggle && menu) {
        // 1. Lắng nghe sự kiện click vào nút 3 gạch để bật/tắt menu
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation(); // Ngăn chặn sự kiện nổi bọt làm đóng menu lập tức
            menu.classList.toggle('active');
        });

        // 2. Mẹo UX tinh tế: Nếu click trượt ra ngoài vùng menu, tự động thu menu lại
        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target) && !menuToggle.contains(e.target)) {
                menu.classList.remove('active');
            }
        });
    }

});