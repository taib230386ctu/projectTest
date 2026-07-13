// =========================================================
// XỬ LÝ MENU MOBILE (HAMBURGER BANNER)
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.menu');

    if (menuToggle && menu) {
        // Click vào nút 3 gạch để bật/tắt menu
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('active');
        });

        // Click ra ngoài vùng menu tự động đóng menu lại
        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target) && !menuToggle.contains(e.target)) {
                menu.classList.remove('active');
            }
        });
    }
});