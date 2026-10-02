import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { Expense } from '../types/expense';
import { expenseRepository } from '../storage/expenseRepository';

interface State {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
}

type Action = 
  | { type: 'LOAD_SUCCESS'; payload: Expense[] }
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'SET_ERROR'; payload: string };

const ExpenseContext = createContext<{ 
  state: State; 
  addExpense: (e: Expense) => Promise<void>;
  updateExpense: (id: string, e: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
} | undefined>(undefined);

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'LOAD_SUCCESS': return { ...state, expenses: action.payload, loading: false };
    case 'ADD_EXPENSE': return { ...state, expenses: [...state.expenses, action.payload] };
    case 'SET_ERROR': return { ...state, error: action.payload, loading: false };
    default: return state;
  }
};

export const ExpenseProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, { expenses: [], loading: true, error: null });

  useEffect(() => {
    expenseRepository.getAll()
      .then(expenses => dispatch({ type: 'LOAD_SUCCESS', payload: expenses }))
      .catch(() => dispatch({ type: 'SET_ERROR', payload: 'Veriler yüklenirken hata oluştu' }));
  }, []);

  const addExpense = async (expense: Expense) => {
    try {
      const newExpenses = [...state.expenses, expense];
      await expenseRepository.saveAll(newExpenses);
      dispatch({ type: 'ADD_EXPENSE', payload: expense });
    } catch {
      throw new Error('Harcama kaydedilemedi');
    }
  };

  const updateExpense = async (id: string, updated: Expense) => {
    try {
      const newExpenses = state.expenses.map(e => e.id === id ? updated : e);
      await expenseRepository.saveAll(newExpenses);
      dispatch({ type: 'LOAD_SUCCESS', payload: newExpenses });
    } catch {
      throw new Error('Harcama güncellenemedi');
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const newExpenses = state.expenses.filter(e => e.id !== id);
      await expenseRepository.saveAll(newExpenses);
      dispatch({ type: 'LOAD_SUCCESS', payload: newExpenses });
    } catch {
      throw new Error('Harcama silinemedi');
    }
  };

  return (
    <ExpenseContext.Provider value={{ state, addExpense, updateExpense, deleteExpense }}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) throw new Error('useExpense must be used within ExpenseProvider');
  return context;
};
