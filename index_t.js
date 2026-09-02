document.addEventListener('DOMContentLoaded', function() {
    const navbar = document.querySelector('.navbar');
    const menuToggle = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.menu');
    const dropdown = document.querySelector('.menu-dropdown');

    // 1. Cuộn chuột để bung/thu Navbar
    window.addEventListener('scroll', function() {
        if (window.scrollY > 40) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
            if (menu) menu.classList.remove('active');
            if (dropdown) dropdown.classList.remove('open');
        }
    });

    // 2. Click nút 3 gạch
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            if (!navbar.classList.contains('scrolled')) {
                navbar.classList.add('scrolled');
            }
            if (menu) menu.classList.toggle('active');
        });
    }

    // 3. Toggle dropdown Hoạt động trên thiết bị di động
    if (dropdown) {
        dropdown.addEventListener('click', function(e) {
            if (window.innerWidth <= 900) {
                dropdown.classList.toggle('open');
            }
        });
    }
});
