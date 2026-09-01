document.addEventListener("DOMContentLoaded", () => {
    // 1. Toggle Menu Hamburger (Mobile)
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

    // 2. Toggle Dropdown "Hoạt động" (Nhắm đúng thẻ H2)
    const dropdown = document.querySelector(".menu-dropdown");
    const dropdownBtn = dropdown ? dropdown.querySelector("h2") : null;

    if (dropdown && dropdownBtn) {
        dropdownBtn.addEventListener("click", (e) => {
            const isTouchOrMobile = window.matchMedia("(hover: none)").matches || window.innerWidth <= 900;

            if (isTouchOrMobile) {
                dropdown.classList.toggle("open");
            }
        });

        document.addEventListener("click", (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove("open");
            }
        });
    }
});
