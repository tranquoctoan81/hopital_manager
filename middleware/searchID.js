import express from 'express';
let id
export function searchID(req, res, next) {
    if (req.body.id) {
        next()
    }
    res.render('checkID/checkID')
}

// export function searchID(req, res, next) {
//     if (req.body.id) {
//         next()
//     }
//     res.render('checkID/not_found')
// }
