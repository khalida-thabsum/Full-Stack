const router = require('express').Router();
const complaints = require('../controllers/complaintController');
const users = require('../controllers/userController');
const { identify, allow } = require('../middleware/auth');

router.get('/', (req, res) => res.json({ service: 'Hostel Complaint API', version: '1.0' }));

// Users
router.post('/users', users.register);                         // open, so the demo can create accounts
router.get('/users', identify, allow('warden'), users.list);
router.get('/users/me', identify, users.me);

// Complaints (every route below needs X-User-Id)
router.use('/complaints', identify);
router.get('/complaints/summary', allow('warden'), complaints.summary);
router.route('/complaints')
  .get(complaints.list)
  .post(allow('student'), complaints.create);
router.route('/complaints/:id')
  .get(complaints.getOne)
  .delete(allow('student'), complaints.remove);
router.patch('/complaints/:id/assign', allow('warden'), complaints.assign);
router.patch('/complaints/:id/status', complaints.updateStatus);
router.post('/complaints/:id/comments', complaints.addComment);
router.post('/complaints/:id/rating', allow('student'), complaints.rate);

module.exports = router;
