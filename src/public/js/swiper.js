var swiper = new Swiper(".slides_container", {
    spaceBetween: 0,
    centeredSlides: true,
    autoplay: {
        delay: 1500,
        disableOnInteraction: false,
    },
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
    },
    navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
    },
});
var swiper = new Swiper(".dichvu_slide_wrapper", {
    slidesPerView: 3,
    spaceBetween: 30,
    autoplay: {
        delay: 1500,
        disableOnInteraction: false,
    },
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
    },
    navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
    },
});
window.addEventListener('scroll', function () {
    const navbar_primary = this.document.querySelector('.navbar_primary')
    const header_time_work = this.document.querySelector('.header_time_work')
    const num = window.pageYOffset
    if (num >= 200) {
        navbar_primary.classList.add('active')
        header_time_work.classList.add('active')
    } else {
        navbar_primary.classList.remove('active')
        header_time_work.classList.remove('active')
    }
});