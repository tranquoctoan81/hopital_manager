import * as dotenv from 'dotenv'
dotenv.config()
import { connection } from '../../DB/connect.js'
const AdminController = {
    home(req, res) {
        res.render('admin/home')
    },
}
export default AdminController