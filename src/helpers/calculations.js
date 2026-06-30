import { compareDates, currentJalaliMonthEndIso, currentJalaliMonthYear, inCurrentMonth, isoToJalali, isDueThroughCurrentJalaliMonth, isNearDue, isOverdue } from './dates'

export function totalInstallments(item) {
  if (item.totalCount) return item.totalCount
  if (!item.endDate || item.endless) return 1
  const days = Math.max(1, Math.ceil((new Date(item.endDate) - new Date(item.startDate)) / 86400000))
  const unit = { روزانه: 1, هفتگی: 7, ماهانه: 30, دوماهه: 60, سه‌ماهه: 90, 'شش‌ماهه': 180, سالانه: 365, 'فقط یک‌بار': days }[item.recurrence] || days
  return Math.max(1, Math.ceil(days / unit))
}

export const completedInstallments = (item) => Number(item.paidCount || (item.status === 'دریافت شده' ? totalInstallments(item) : 0))

export function dashboardStats(data) {
  const incomes = Array.isArray(data?.incomes) ? data.incomes : []
  const currentExpenses = Array.isArray(data?.currentExpenses) ? data.currentExpenses : []
  const allDebts = Array.isArray(data?.debts) ? data.debts : []
  const monthIncome = incomes.filter(item => inCurrentMonth(item.dueDate))
  const monthExpense = currentExpenses.filter(item => inCurrentMonth(item.expenseDate || item.dueDate))
  const sum = (items, field = 'amount') => items.reduce((total, item) => total + Number(item[field] || 0), 0)
  const received = sum(monthIncome, 'receivedAmount')
  const confirmedReceived = sum(monthIncome.filter(item => (item.certainty || 'قطعی') === 'قطعی'), 'receivedAmount')
  const probableIncome = sum(monthIncome.filter(item => item.certainty === 'احتمالی'))
  const totalIncome = sum(monthIncome)
  const paidExpense = sum(monthExpense.filter(item => item.status === 'پرداخت شده'))
  const totalExpense = sum(monthExpense)
  const debts = allDebts.filter(item => !['پرداخت شده', 'تسویه‌شده'].includes(item.status))
  const futureIncome = incomes
    .filter(item => item.dueDate && compareDates(item.dueDate, currentJalaliMonthEndIso()) > 0 && !['دریافت شده', 'لغوشده'].includes(item.status))
    .reduce((total, item) => total + Math.max(0, Number(item.amount || 0) - Number(item.receivedAmount || 0)), 0)
  const dueDebts = sum(debts.filter(item => isDueThroughCurrentJalaliMonth(item.dueDate)))
  const criticalChecks = debts.filter(item => item.isCheck && (isNearDue(item) || isOverdue(item) || item.status === 'برگشت‌خورده'))
  return {
    totalIncome, received, confirmedReceived, probableIncome, expected: totalIncome - received, totalExpense, paidExpense,
    unpaidExpense: 0, debts: sum(debts), claims: 0, criticalChecks: criticalChecks.length, criticalCheckAmount: sum(criticalChecks),
    overdue: [...incomes, ...debts].filter(isOverdue).length,
    cashFlow: totalIncome - totalExpense, forecast: futureIncome, futureIncome,
    budgetBalance: totalIncome - dueDebts - totalExpense,
    currentBalance: confirmedReceived - totalExpense - dueDebts,
    debtIncomeRatio: totalIncome ? Math.round(dueDebts / totalIncome * 100) : 0,
  }
}

export function expenseComposition(data) {
  const items = (Array.isArray(data?.currentExpenses) ? data.currentExpenses : []).filter(item => inCurrentMonth(item.expenseDate || item.dueDate))
  return Object.entries(items.reduce((result, item) => ({ ...result, [item.category || 'بدون دسته‌بندی']: (result[item.category || 'بدون دسته‌بندی'] || 0) + Number(item.amount || 0) }), {}))
}

export function annualSummary(data, year = currentJalaliMonthYear().year) {
  const inYear = item => Number(isoToJalali(item.dueDate).split('/')[0]) === year
  const sum = (items, field = 'amount') => items.filter(inYear).reduce((total, item) => total + Number(item[field] || 0), 0)
  const income = sum(Array.isArray(data?.incomes) ? data.incomes : [])
  const expense = sum(Array.isArray(data?.expenses) ? data.expenses : [])
  return { year, income, expense, balance: income - expense }
}
