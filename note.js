if (document.cookie) {
    let arr = document.cookie.split(';')
    let username = arr[1].slice(6)
    optionDOM.innerHTML = `
        <div class="cart">
            <a  href="/gio-hang" class="icon_cart">
                <i class="fa-sharp fa-solid fa-cart-shopping"></i>
            </a>
            <a href="/don-hang" class="order_cart">
                Quản lý đơn hàng
            </a>
        </div>
    <a href="/thong-tin-tai-khoan"class="username username_dom"> <span>${username} </span>
        </a>
        <div class="logout_box">
            <a href='/logout' class="logout">
                <i class="fa-solid fa-right-from-bracket"></i>
            </a>
        </div>
    `
} else {
    optionDOM.innerHTML = `
    <a href="/login" class="login">
            <div class="icon_user">
                <i class="fa-sharp fa-solid fa-user"></i>
            </div>
        </a>
    `
}