import express from 'express';
export function checkPosition(req, res, next) {
    const position = req.cookies.pos
    if (position == 'Dr') {
        next()
    } else {
        res.render('checkID/not_found')
    }
    next()
}
