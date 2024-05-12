import express from 'express';
export function checkID(req, res, next) {
    const id = req.cookies.id
    if (id) {
        next()
    } else {
        res.redirect('/login')
    }
}