const form = (message, color, icon) => {
    const notificationDiv = document.createElement("div");
    setTimeout(function () {
        notificationDiv.classList.add('d-flex', 'col-sm-12')
        const itemLeft = document.createElement("div");
        const itemRight = document.createElement("div");
        notificationDiv.appendChild(itemLeft)
        notificationDiv.appendChild(itemRight)
        itemLeft.classList.add('col-sm-10')
        itemRight.classList.add('col-sm-2')
        itemRight.innerHTML = `<i class="fa fa-${icon}" aria-hidden="true"></i>`
        itemLeft.innerHTML = message;
        notificationDiv.style.position = "fixed";
        notificationDiv.style.width = '30rem'
        notificationDiv.style.textAlign = 'left';
        notificationDiv.style.bottom = "6rem";
        notificationDiv.style.right = "1rem";
        notificationDiv.style.backgroundColor = `${color}`;
        notificationDiv.style.color = "white";
        notificationDiv.style.padding = "1rem";
        notificationDiv.style.fontSize = "1.4rem";
        notificationDiv.style.zIndex = '100000000000000000000';
        notificationDiv.style.opacity = '1';
        notificationDiv.style.transition = 'opacity 2s';
        notificationDiv.classList.add("notification");
        document.body.appendChild(notificationDiv);
        setTimeout(function () {
            notificationDiv.style.opacity = '0';
            setTimeout(function () {
                notificationDiv.remove();
            }, 2000);
        }, 2000);
    }, 100);
};
const notification = {
    message(message, color, icon) {
        form(message, color, icon)
    }
}




