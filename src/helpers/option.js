export default {
    format: "A4",
    orientation: "portrait",
    border: "10mm",
    header: {
        height: "20mm",
        contents: '<div style="text-align: center;">PHÒNG KHÁM NỘI TỔNG HỢP AN BÌNH</div>'
    },
    footer: {
        height: "28mm",
        contents: {
            first: 'Cover page',
            2: 'Second page', // Any page number is working. 1-based index
            default: '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', // fallback value
            last: 'Last Page'
        }
    }
}