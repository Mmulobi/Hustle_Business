import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  X, 
  ArrowLeft, 
  DollarSign, 
  Filter, 
  Search,
  Clock,
  ArrowRight
} from 'lucide-react-native';
import { supabase } from '@/services/supabase';
import AllTransactionsScreen from '@/app/screens/AllTransactionsScreen';

const { width } = Dimensions.get('window');

interface Transaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  created_at?: string;
}

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [amountFilter, setAmountFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load sales records
      const { data: salesData, error: salesError } = await supabase
        .from('sales_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Load expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;
      if (expensesError) throw expensesError;

      // Combine and format transactions
      const allTransactions: Transaction[] = [
        ...(salesData || []).map((sale: any) => ({
          id: sale.id,
          user_id: sale.user_id,
          type: 'income' as const,
          amount: parseFloat(sale.amount),
          description: sale.description || 'Sale',
          category: sale.category || 'Sales',
          date: sale.date || sale.created_at,
          created_at: sale.created_at,
        })),
        ...(expensesData || []).map((expense: any) => ({
          id: expense.id,
          user_id: expense.user_id,
          type: 'expense' as const,
          amount: parseFloat(expense.amount),
          description: expense.description || 'Expense',
          category: expense.category || 'General',
          date: expense.date || expense.created_at,
          created_at: expense.created_at,
        }))
      ];

      // Sort by date
      allTransactions.sort((a, b) => 
        new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime()
      );

      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
      Alert.alert('Error', 'Failed to load transactions');
    }
  };

  const handleAddTransaction = async () => {
    if (!amount || !description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please sign in to add transactions');
        return;
      }

      const transactionData = {
        user_id: user.id,
        amount: parseFloat(amount),
        description: description.trim(),
        category: category.trim() || 'General',
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      };

      if (transactionType === 'income') {
        // Save to sales_records table
        const { error } = await supabase
          .from('sales_records')
          .insert(transactionData);
        
        if (error) throw error;
      } else {
        // Save to expenses table
        const { error } = await supabase
          .from('expenses')
          .insert(transactionData);
        
        if (error) throw error;
      }

      await loadTransactions();
      
      // Reset form
      setAmount('');
      setDescription('');
      setCategory('');
      setModalVisible(false);
      
      Alert.alert('Success', 'Transaction saved successfully!');
    } catch (error: any) {
      console.error('Error saving transaction:', error);
      Alert.alert('Error', error.message || 'Failed to save transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  const getTodayStats = () => {
    const today = new Date().toDateString();
    const todayTransactions = transactions.filter(
      t => new Date(t.date).toDateString() === today
    );
    
    const income = todayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expenses = todayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return { income, expenses, net: income - expenses };
  };

  const stats = getTodayStats();

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const getFilteredTransactions = () => {
    let filtered = transactions;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date);
        switch (dateFilter) {
          case 'today':
            return transactionDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return transactionDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return transactionDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Filter by amount
    if (amountFilter !== 'all') {
      filtered = filtered.filter(t => {
        switch (amountFilter) {
          case 'low':
            return t.amount < 1000;
          case 'medium':
            return t.amount >= 1000 && t.amount < 10000;
          case 'high':
            return t.amount >= 10000;
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  const filteredTransactions = getFilteredTransactions();

  // Chart data processing
  const getChartData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const dailyData = last7Days.map(date => {
      const dayTransactions = transactions.filter(t => 
        t.date.split('T')[0] === date
      );
      const income = dayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        date,
        income,
        expenses,
        net: income - expenses,
        day: new Date(date).toLocaleDateString('en', { weekday: 'short' })
      };
    });

    return dailyData;
  };

  const getCategoryData = () => {
    const categories: { [key: string]: { income: number; expenses: number } } = {};
    filteredTransactions.forEach(t => {
      if (!categories[t.category]) {
        categories[t.category] = { income: 0, expenses: 0 };
      }
      if (t.type === 'income') {
        categories[t.category].income += t.amount;
      } else {
        categories[t.category].expenses += t.amount;
      }
    });

    return Object.entries(categories).map(([category, data]) => ({
      category,
      income: data.income,
      expenses: data.expenses,
      total: data.income + data.expenses
    })).sort((a, b) => b.total - a.total);
  };

  const chartData = getChartData();
  const categoryData = getCategoryData();

  // Predefined categories for Kenyan hustler businesses
  const getCategoriesForType = (type: 'income' | 'expense') => {
    const incomeCategories = [
      'Vegetables', 'Fruits', 'Cereals', 'Meat & Fish', 'Dairy Products',
      'Boda Boda Rides', 'Matatu Fares', 'Delivery Services', 'Transport',
      'Salon Services', 'Barber Services', 'Beauty Products', 'Hair Products',
      'Tailoring', 'Shoe Repair', 'Electronics Repair', 'Phone Repair',
      'Retail Sales', 'Wholesale', 'Market Stall', 'Hawking',
      'Construction Work', 'Casual Labor', 'Cleaning Services', 'Security',
      'Mobile Money', 'Loans Given', 'Rent Collection', 'Commission'
    ];

    const expenseCategories = [
      'Stock Purchase', 'Inventory', 'Raw Materials', 'Wholesale Buying',
      'Fuel', 'Transport', 'Matatu Fare', 'Boda Boda', 'Parking',
      'Rent', 'Utilities', 'Water', 'Electricity', 'Internet',
      'Equipment', 'Tools', 'Machinery', 'Phone', 'Repairs',
      'Market Fees', 'License', 'Permits', 'Registration', 'Tax',
      'Meals', 'Tea', 'Lunch', 'Snacks', 'Personal',
      'Loan Repayment', 'Interest', 'Bank Charges', 'Mobile Money Charges',
      'Marketing', 'Advertising', 'Printing', 'Stationery'
    ];

    return type === 'income' ? incomeCategories : expenseCategories;
  };

  // Show full transactions screen if requested
  if (showAllTransactions) {
    return (
      <AllTransactionsScreen 
        onBack={() => setShowAllTransactions(false)}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Compact Modern Header */}
      <LinearGradient
        colors={['#1e293b', '#334155']}
        style={styles.compactHeader}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton}>
            <ArrowLeft size={20} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.compactTitle}>Transactions</Text>
            <Text style={styles.compactSubtitle}>{filteredTransactions.length} records</Text>
          </View>
          <TouchableOpacity 
            style={styles.filterToggle}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Main Scrollable Content */}
      <ScrollView 
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

      {/* Performance Dashboard */}
      <View style={styles.dashboardContainer}>
        {/* Quick Stats Row */}
        <View style={styles.quickStatsRow}>
          <View style={styles.miniStat}>
            <Text style={styles.miniStatValue}>{formatCurrency(stats.income)}</Text>
            <Text style={styles.miniStatLabel}>Income</Text>
            <View style={[styles.miniStatIndicator, { backgroundColor: '#10b981' }]} />
          </View>
          <View style={styles.miniStat}>
            <Text style={styles.miniStatValue}>{formatCurrency(stats.expenses)}</Text>
            <Text style={styles.miniStatLabel}>Expenses</Text>
            <View style={[styles.miniStatIndicator, { backgroundColor: '#ef4444' }]} />
          </View>
          <View style={styles.miniStat}>
            <Text style={[styles.miniStatValue, { color: stats.net >= 0 ? '#10b981' : '#ef4444' }]}>
              {formatCurrency(stats.net)}
            </Text>
            <Text style={styles.miniStatLabel}>Net</Text>
            <View style={[styles.miniStatIndicator, { backgroundColor: stats.net >= 0 ? '#10b981' : '#ef4444' }]} />
          </View>
        </View>

        {/* 7-Day Performance Chart */}
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>7-Day Performance</Text>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.legendText}>Income</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                <Text style={styles.legendText}>Expenses</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.chartArea}>
            <View style={styles.chartBars}>
              {chartData.map((day, index) => {
                const maxAmount = Math.max(...chartData.map(d => Math.max(d.income, d.expenses)));
                const incomeHeight = maxAmount > 0 ? (day.income / maxAmount) * 80 : 0;
                const expenseHeight = maxAmount > 0 ? (day.expenses / maxAmount) * 80 : 0;
                
                return (
                  <View key={day.date} style={styles.chartDay}>
                    <View style={styles.chartBarsContainer}>
                      <View style={[styles.chartBar, styles.incomeBar, { height: incomeHeight }]} />
                      <View style={[styles.chartBar, styles.expenseBar, { height: expenseHeight }]} />
                    </View>
                    <Text style={styles.chartDayLabel}>{day.day}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Category Breakdown */}
        {categoryData.length > 0 && (
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryTitle}>Top Categories</Text>
            <View style={styles.categoryList}>
              {categoryData.slice(0, 3).map((cat, index) => (
                <View key={cat.category} style={styles.categoryItem}>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{cat.category}</Text>
                    <Text style={styles.categoryAmount}>{formatCurrency(cat.total)}</Text>
                  </View>
                  <View style={styles.categoryBar}>
                    <View 
                      style={[
                        styles.categoryProgress, 
                        { 
                          width: `${(cat.total / categoryData[0].total) * 100}%`,
                          backgroundColor: index === 0 ? '#3b82f6' : index === 1 ? '#10b981' : '#f59e0b'
                        }
                      ]} 
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Search and Quick Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={18} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <View style={styles.quickFilters}>
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterChipText, filterType === 'all' && styles.filterChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'income' && styles.filterChipActive]}
            onPress={() => setFilterType('income')}
          >
            <TrendingUp size={14} color={filterType === 'income' ? '#ffffff' : '#10b981'} />
            <Text style={[styles.filterChipText, filterType === 'income' && styles.filterChipTextActive]}>
              Income
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'expense' && styles.filterChipActive]}
            onPress={() => setFilterType('expense')}
          >
            <TrendingDown size={14} color={filterType === 'expense' ? '#ffffff' : '#ef4444'} />
            <Text style={[styles.filterChipText, filterType === 'expense' && styles.filterChipTextActive]}>
              Expense
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Advanced Filters (Expandable) */}
      {showFilters && (
        <View style={styles.advancedFilters}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Date Range</Text>
            <View style={styles.filterOptions}>
              {['all', 'today', 'week', 'month'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.filterOption, dateFilter === option && styles.filterOptionActive]}
                  onPress={() => setDateFilter(option as any)}
                >
                  <Text style={[styles.filterOptionText, dateFilter === option && styles.filterOptionTextActive]}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Amount Range</Text>
            <View style={styles.filterOptions}>
              {[
                { key: 'all', label: 'All' },
                { key: 'low', label: '<1K' },
                { key: 'medium', label: '1K-10K' },
                { key: 'high', label: '>10K' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.filterOption, amountFilter === option.key && styles.filterOptionActive]}
                  onPress={() => setAmountFilter(option.key as any)}
                >
                  <Text style={[styles.filterOptionText, amountFilter === option.key && styles.filterOptionTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Recent Transactions Summary */}
      <View style={styles.recentTransactionsContainer}>
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Recent Activity</Text>
          <TouchableOpacity 
            style={styles.seeAllButton}
            onPress={() => setShowAllTransactions(true)}
          >
            <Text style={styles.seeAllText}>See All</Text>
            <ArrowRight size={14} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        <View style={styles.recentTransactionsList}>
          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Clock size={32} color="#9ca3af" />
              </View>
              <Text style={styles.emptyStateText}>No transactions yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start recording your sales and expenses
              </Text>
              <TouchableOpacity 
                style={styles.addFirstTransactionButton}
                onPress={() => setModalVisible(true)}
              >
                <Plus size={16} color="#ffffff" />
                <Text style={styles.addFirstTransactionText}>Add Transaction</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {filteredTransactions.slice(0, 5).map((transaction, index) => (
                <View key={transaction.id} style={[
                  styles.compactTransactionCard,
                  index === filteredTransactions.slice(0, 5).length - 1 && styles.lastTransactionCard
                ]}>
                  <View style={styles.transactionIconContainer}>
                    <View style={[
                      styles.transactionIcon,
                      { backgroundColor: transaction.type === 'income' ? '#10b98115' : '#ef444415' }
                    ]}>
                      {transaction.type === 'income' ? 
                        <TrendingUp size={16} color="#10b981" /> : 
                        <TrendingDown size={16} color="#ef4444" />
                      }
                    </View>
                  </View>
                  
                  <View style={styles.transactionDetails}>
                    <Text style={styles.compactTransactionDescription} numberOfLines={1}>
                      {transaction.description}
                    </Text>
                    <View style={styles.transactionMeta}>
                      <Text style={styles.compactTransactionCategory}>
                        {transaction.category}
                      </Text>
                      <Text style={styles.transactionDot}>•</Text>
                      <Text style={styles.compactTransactionDate}>
                        {new Date(transaction.date).toLocaleDateString('en', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.transactionAmountContainer}>
                    <Text style={[
                      styles.compactTransactionAmount,
                      { color: transaction.type === 'income' ? '#10b981' : '#ef4444' }
                    ]}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </Text>
                  </View>
                </View>
              ))}
              
              {filteredTransactions.length > 5 && (
                <TouchableOpacity 
                  style={styles.viewMoreButton}
                  onPress={() => setShowAllTransactions(true)}
                >
                  <Text style={styles.viewMoreText}>
                    View {filteredTransactions.length - 5} more transactions
                  </Text>
                  <ArrowRight size={16} color="#6b7280" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>

      </ScrollView>

      {/* Add Transaction Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Plus size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Modern Add Transaction Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        statusBarTranslucent={true}
      >
        <View style={styles.modernModalContainer}>
          {/* Modern Header with Gradient */}
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modernModalHeader}
          >
            <View style={styles.modalHeaderContent}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIconContainer}>
                  <Plus size={20} color="#ffffff" />
                </View>
                <View>
                  <Text style={styles.modernModalTitle}>Add Transaction</Text>
                  <Text style={styles.modernModalSubtitle}>Record your business activity</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.modernCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <X size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView 
            style={styles.modernModalContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Modern Transaction Type Cards */}
            <View style={styles.modernFormSection}>
              <Text style={styles.modernSectionTitle}>Transaction Type</Text>
              <View style={styles.modernTypeSelector}>
                <TouchableOpacity
                  style={[
                    styles.modernTypeCard,
                    transactionType === 'income' && styles.modernTypeCardActive
                  ]}
                  onPress={() => setTransactionType('income')}
                >
                  <View style={[
                    styles.modernTypeIcon,
                    { backgroundColor: transactionType === 'income' ? '#10b981' : '#dcfce7' }
                  ]}>
                    <TrendingUp size={24} color={transactionType === 'income' ? '#ffffff' : '#10b981'} />
                  </View>
                  <Text style={[
                    styles.modernTypeTitle,
                    transactionType === 'income' && styles.modernTypeTitleActive
                  ]}>
                    Income
                  </Text>
                  <Text style={[
                    styles.modernTypeSubtitle,
                    transactionType === 'income' && styles.modernTypeSubtitleActive
                  ]}>
                    Money earned
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.modernTypeCard,
                    transactionType === 'expense' && styles.modernTypeCardActive
                  ]}
                  onPress={() => setTransactionType('expense')}
                >
                  <View style={[
                    styles.modernTypeIcon,
                    { backgroundColor: transactionType === 'expense' ? '#ef4444' : '#fee2e2' }
                  ]}>
                    <TrendingDown size={24} color={transactionType === 'expense' ? '#ffffff' : '#ef4444'} />
                  </View>
                  <Text style={[
                    styles.modernTypeTitle,
                    transactionType === 'expense' && styles.modernTypeTitleActive
                  ]}>
                    Expense
                  </Text>
                  <Text style={[
                    styles.modernTypeSubtitle,
                    transactionType === 'expense' && styles.modernTypeSubtitleActive
                  ]}>
                    Money spent
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Modern Amount Input */}
            <View style={styles.modernFormSection}>
              <Text style={styles.modernSectionTitle}>Amount (KES) *</Text>
              <View style={styles.modernAmountContainer}>
                <View style={styles.currencyPrefix}>
                  <Text style={styles.currencyText}>KSh</Text>
                </View>
                <TextInput
                  style={styles.modernAmountInput}
                  placeholder="0.00"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            {/* Modern Description Input */}
            <View style={styles.modernFormSection}>
              <Text style={styles.modernSectionTitle}>Description *</Text>
              <View style={styles.modernInputContainer}>
                <View style={styles.inputIconContainer}>
                  <DollarSign size={18} color="#6b7280" />
                </View>
                <TextInput
                  style={styles.modernTextInput}
                  placeholder="What was this transaction for?"
                  value={description}
                  onChangeText={setDescription}
                  placeholderTextColor="#9ca3af"
                  multiline={true}
                  numberOfLines={2}
                />
              </View>
            </View>

            {/* Modern Category Section */}
            <View style={styles.modernFormSection}>
              <Text style={styles.modernSectionTitle}>Category</Text>
              <TouchableOpacity
                style={styles.modernCategoryDropdown}
                onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                <View style={styles.categoryDropdownLeft}>
                  <View style={styles.categoryIconContainer}>
                    <Filter size={18} color="#6b7280" />
                  </View>
                  <Text style={[
                    styles.modernCategoryText,
                    !category && styles.modernCategoryPlaceholder
                  ]}>
                    {category || 'Select category'}
                  </Text>
                </View>
                <View style={[
                  styles.modernDropdownArrow,
                  showCategoryDropdown && styles.modernDropdownArrowActive
                ]}>
                  <Text style={styles.modernArrowText}>
                    {showCategoryDropdown ? '▲' : '▼'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {showCategoryDropdown && (
              <View style={styles.categoryDropdownContainer}>
                <ScrollView 
                  style={styles.categoryDropdownList}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {getCategoriesForType(transactionType).map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryDropdownItem,
                        category === cat && styles.categoryDropdownItemActive
                      ]}
                      onPress={() => {
                        setCategory(cat);
                        setShowCategoryDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.categoryDropdownItemText,
                        category === cat && styles.categoryDropdownItemTextActive
                      ]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  
                  {/* Custom category option */}
                  <TouchableOpacity
                    style={styles.customCategoryOption}
                    onPress={() => {
                      setShowCustomCategory(true);
                      setShowCategoryDropdown(false);
                      setCategory('');
                    }}
                  >
                    <Text style={styles.customCategoryOptionText}>
                      + Enter custom category
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}

            {showCustomCategory && (
              <View style={styles.modernFormSection}>
                <TextInput
                  style={styles.modernCustomCategoryInput}
                  placeholder="Enter custom category"
                  value={category}
                  onChangeText={setCategory}
                  autoFocus={true}
                  placeholderTextColor="#9ca3af"
                />
              </View>
            )}

            {/* Modern Save Button */}
            <View style={styles.modernSaveSection}>
              <TouchableOpacity
                style={[
                  styles.modernSaveButton,
                  isLoading && styles.modernSaveButtonDisabled,
                  { backgroundColor: transactionType === 'income' ? '#10b981' : '#ef4444' }
                ]}
                onPress={handleAddTransaction}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View style={styles.modernSaveButtonContent}>
                    <Text style={styles.modernSaveButtonText}>Saving...</Text>
                  </View>
                ) : (
                  <View style={styles.modernSaveButtonContent}>
                    <Plus size={20} color="#ffffff" />
                    <Text style={styles.modernSaveButtonText}>
                      Save {transactionType === 'income' ? 'Income' : 'Expense'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  // Modern Header Styles
  modernHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  modernHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  filterToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Stats Container
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  netCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  // Search and Filter Styles
  searchSection: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  quickFilters: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: '#3b82f6',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  advancedFilters: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterRow: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  filterOptionActive: {
    backgroundColor: '#3b82f6',
  },
  filterOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  filterOptionTextActive: {
    color: '#ffffff',
  },
  // Compact Header Styles
  compactHeader: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  compactTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  compactSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  // Dashboard Styles
  dashboardContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  miniStat: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  miniStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  miniStatLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  miniStatIndicator: {
    width: 20,
    height: 2,
    borderRadius: 1,
    marginTop: 6,
  },
  // Chart Styles
  chartContainer: {
    marginBottom: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  chartLegend: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  chartArea: {
    height: 100,
    justifyContent: 'flex-end',
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 80,
  },
  chartDay: {
    flex: 1,
    alignItems: 'center',
  },
  chartBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginBottom: 8,
  },
  chartBar: {
    width: 8,
    borderRadius: 4,
    minHeight: 4,
  },
  incomeBar: {
    backgroundColor: '#10b981',
  },
  expenseBar: {
    backgroundColor: '#ef4444',
  },
  chartDayLabel: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '500',
  },
  // Category Styles
  categoryContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  categoryList: {
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryInfo: {
    flex: 1,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  categoryAmount: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  categoryBar: {
    width: 60,
    height: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  categoryProgress: {
    height: '100%',
    borderRadius: 2,
  },
  // Recent Transactions Styles
  recentTransactionsContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
  },
  mainScrollView: {
    flex: 1,
  },
  recentTransactionsList: {
    paddingHorizontal: 16,
  },
  compactTransactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  lastTransactionCard: {
    borderBottomWidth: 0,
    paddingBottom: 16,
  },
  transactionIconContainer: {
    marginRight: 12,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionDetails: {
    flex: 1,
    marginRight: 12,
  },
  compactTransactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactTransactionCategory: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  transactionDot: {
    fontSize: 12,
    color: '#d1d5db',
    marginHorizontal: 6,
  },
  compactTransactionDate: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  compactTransactionAmount: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 6,
  },
  viewMoreText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  emptyIcon: {
    alignItems: 'center',
    marginBottom: 12,
  },
  addFirstTransactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
    gap: 6,
  },
  addFirstTransactionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionsList: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  transactionCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transactionInfo: {
    flex: 1,
    marginRight: 12,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  unsyncedIndicator: {
    marginTop: 4,
  },
  unsyncedText: {
    color: '#f59e0b',
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#16a34a',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  // Modern Modal Styles
  modernModalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modernModalHeader: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  modernModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  modernModalSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  modernCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernModalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 8,
  },
  typeButtonActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  typeButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#ffffff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  saveButton: {
    backgroundColor: '#16a34a',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Category Dropdown Styles
  categoryDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  categoryDropdownText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  categoryPlaceholderText: {
    color: '#9ca3af',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  categoryDropdownContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginBottom: 16,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryDropdownList: {
    maxHeight: 200,
  },
  categoryDropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryDropdownItemActive: {
    backgroundColor: '#eff6ff',
  },
  categoryDropdownItemText: {
    fontSize: 15,
    color: '#374151',
  },
  categoryDropdownItemTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  customCategoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  customCategoryOptionText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  customCategoryInput: {
    marginTop: 12,
    borderColor: '#3b82f6',
    borderWidth: 2,
  },
  // Modern Form Styles
  modernFormSection: {
    marginBottom: 24,
  },
  modernSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  modernTypeSelector: {
    flexDirection: 'row',
    gap: 16,
  },
  modernTypeCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  modernTypeCardActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#f0f9ff',
  },
  modernTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modernTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  modernTypeTitleActive: {
    color: '#3b82f6',
  },
  modernTypeSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  modernTypeSubtitleActive: {
    color: '#3b82f6',
  },
  modernAmountContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    overflow: 'hidden',
  },
  currencyPrefix: {
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    justifyContent: 'center',
  },
  currencyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  modernAmountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modernInputContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  inputIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  modernTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    minHeight: 44,
    textAlignVertical: 'top',
  },
  modernCategoryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  categoryDropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconContainer: {
    marginRight: 12,
  },
  modernCategoryText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  modernCategoryPlaceholder: {
    color: '#9ca3af',
  },
  modernDropdownArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernDropdownArrowActive: {
    backgroundColor: '#3b82f6',
  },
  modernArrowText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  modernCustomCategoryInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#374151',
  },
  modernSaveSection: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  modernSaveButton: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  modernSaveButtonDisabled: {
    opacity: 0.6,
  },
  modernSaveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modernSaveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});