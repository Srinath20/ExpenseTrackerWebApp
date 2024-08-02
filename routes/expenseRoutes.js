const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const userController = require('../controllers/userController');

router.get('/', expenseController.getAllExpenses);
router.post('/', expenseController.createExpense);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

router.post('/user/signup', userController.signupUser);
router.post('/user/login', userController.loginUser);

module.exports = router;