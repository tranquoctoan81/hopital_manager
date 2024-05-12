import siteRouter from '../routers/site.js'
import doctorRouter from '../routers/doctor.js'
import adminRouter from '../routers/admin.js'
import jsonRouter from '../routers/json.js'
import paysRouter from '../routers/pays.js'
import { searchID } from '../../middleware/searchID.js'
import { checkID } from '../../middleware/checkID.js'
const route = (app) => {
    // app.use('/admin', adminRouter);
    app.use('/doctor', doctorRouter);
    app.use('/json', checkID, jsonRouter);
    app.use('/pay/', checkID, paysRouter);
    app.use('/', siteRouter);
};
export default route;
