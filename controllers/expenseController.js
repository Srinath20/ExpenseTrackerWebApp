const mongoose = require('mongoose');
const User = require('../models/user');
const Expense = require('../models/expense');

exports.getAllExpenses = async (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const expenses = await Expense.find({ userId }).populate('userId', 'name');
    res.json(expenses);
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ error: 'Failed to retrieve expenses' });
  }
};

exports.createExpense = async (req, res) => {
  const { amount, description, category } = req.body;
  const userId = req.session.userId;

  try {
    const newExpense = new Expense({ amount, description, category, userId });
    const savedExpense = await newExpense.save();

    await User.findByIdAndUpdate(userId, { $inc: { totalExpense: amount } });

    res.status(201).json(savedExpense);
  } catch (err) {
    console.error('Error creating expense:', err);
    res.status(500).json({ error: 'Failed to create expense' });
  }
};

exports.updateExpense = async (req, res) => {
  const { id } = req.params;
  const { amount, description, category } = req.body;

  try {
    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const amountDifference = amount - expense.amount;

    expense.amount = amount;
    expense.description = description;
    expense.category = category;
    await expense.save();

    await User.findByIdAndUpdate(expense.userId, { $inc: { totalExpense: amountDifference } });

    res.json(expense);
  } catch (err) {
    console.error('Error updating expense:', err);
    res.status(500).json({ error: 'Failed to update expense' });
  }
};

exports.deleteExpense = async (req, res) => {
  const { id } = req.params;

  try {
    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await User.findByIdAndUpdate(expense.userId, { $inc: { totalExpense: -expense.amount } });
    await Expense.findByIdAndDelete(id);

    res.json({ message: 'Expense deleted' });
  } catch (err) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
};