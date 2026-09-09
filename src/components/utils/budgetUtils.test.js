import test from 'node:test';
import assert from 'node:assert/strict';
import { getEffectiveBudget } from './budgetUtils.js';

test('previous-month rollover only carries the last month unused budget', () => {
  const budget = {
    budget_id: 2,
    budget_name: 'Groceries',
    category_ids: [101],
    monthly_limit: 100,
    month: 6,
    year: 2026,
    rollover: true,
    rollover_mode: 'previous-month'
  };

  const budgets = [
    {
      budget_id: 1,
      budget_name: 'Groceries',
      category_ids: [101],
      monthly_limit: 100,
      month: 5,
      year: 2026,
      rollover: true,
      rollover_mode: 'previous-month'
    }
  ];

  const transactions = [
    { transaction_id: 1, category_id: 101, amount: 30, date: '2026-05-10', type: 'expense' }
  ];

  assert.equal(getEffectiveBudget(budget, budgets, transactions), 170);
});

test('full rollover accumulates unused budget across matching previous months', () => {
  const budget = {
    budget_id: 3,
    budget_name: 'Groceries',
    category_ids: [101],
    monthly_limit: 100,
    month: 7,
    year: 2026,
    rollover: true,
    rollover_mode: 'full'
  };

  const budgets = [
    {
      budget_id: 1,
      budget_name: 'Groceries',
      category_ids: [101],
      monthly_limit: 100,
      month: 5,
      year: 2026,
      rollover: true,
      rollover_mode: 'full'
    },
    {
      budget_id: 2,
      budget_name: 'Groceries',
      category_ids: [101],
      monthly_limit: 100,
      month: 6,
      year: 2026,
      rollover: true,
      rollover_mode: 'full'
    }
  ];

  const transactions = [
    { transaction_id: 1, category_id: 101, amount: 30, date: '2026-05-10', type: 'expense' },
    { transaction_id: 2, category_id: 101, amount: 20, date: '2026-06-10', type: 'expense' }
  ];

  assert.equal(getEffectiveBudget(budget, budgets, transactions), 100 + 70 + 80);
});
