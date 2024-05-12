import { ZaloSDK } from 'zalo-sdk';

// Khởi tạo Zalo SDK với App ID và App Secret của bạn
const zaloConfig = {
    appId: 'your_app_id',
    appSecret: 'your_app_secret',
    callbackUrl: 'http://localhost:3000/callback', // URL được gọi sau khi xác thực
};

const zalo = new ZaloSDK(zaloConfig);

// Định nghĩa các tác vụ xác thực
const auth = (req, res) => {
    const authUrl = zalo.getAuthenticationUrl();
    res.redirect(authUrl);
};

// Xử lý callback sau khi xác thực
const callback = (req, res) => {
    const { code } = req.query;

    if (code) {
        zalo.getUserInfo(code, (err, userInfo) => {
            if (err) {
                console.error('Lỗi khi lấy thông tin người dùng:', err);
            } else {
                console.log('Thông tin người dùng:', userInfo);
            }
        });
    } else {
        console.error('Lỗi khi xác thực.');
    }
};

app.get('/auth', auth);
app.get('/callback', callback);


