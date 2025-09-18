import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
// PDF functionality will be added when dependencies are installed
// import * as Print from 'expo-print';
// import * as Sharing from 'expo-sharing';
// import * as FileSystem from 'expo-file-system';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Download, 
  TrendingUp, 
  TrendingDown,
  ArrowLeft as ChevronLeft,
  ArrowRight as ChevronRight,
  FileText
} from 'lucide-react-native';
import { supabase } from '@/services/supabase';

interface Transaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
}

interface AllTransactionsScreenProps {
  onBack: () => void;
}

const ITEMS_PER_PAGE = 20;

export default function AllTransactionsScreen({ onBack }: AllTransactionsScreenProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  useEffect(() => {
    loadAllTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, searchQuery, filterType]);

  const loadAllTransactions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load sales records
      const { data: salesData } = await supabase
        .from('sales_records')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      // Load expenses
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      // Combine and format transactions
      const allTransactions: Transaction[] = [
        ...(salesData || []).map(sale => ({
          id: sale.id,
          user_id: sale.user_id,
          type: 'income' as const,
          amount: sale.amount,
          description: sale.description || 'Sale',
          category: sale.category || 'Sales',
          date: sale.date
        })),
        ...(expensesData || []).map(expense => ({
          id: expense.id,
          user_id: expense.user_id,
          type: 'expense' as const,
          amount: expense.amount,
          description: expense.description || 'Expense',
          category: expense.category || 'General',
          date: expense.date
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
      Alert.alert('Error', 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = transactions;

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generatePDFContent = () => {
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netProfit = totalIncome - totalExpenses;

    const transactionRows = filteredTransactions.map(transaction => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formatDate(transaction.date)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${transaction.description}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${transaction.category}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <span style="color: ${transaction.type === 'income' ? '#10b981' : '#ef4444'};">
            ${transaction.type === 'income' ? 'Income' : 'Expense'}
          </span>
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; color: ${transaction.type === 'income' ? '#10b981' : '#ef4444'};">
          ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
        </td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Transactions Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { display: flex; justify-content: space-around; margin-bottom: 30px; }
            .summary-item { text-align: center; }
            .summary-value { font-size: 18px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f3f4f6; padding: 12px 8px; text-align: left; border-bottom: 2px solid #d1d5db; }
            .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Transactions Report</h1>
            <p>Generated on ${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <p>Total Records: ${filteredTransactions.length}</p>
          </div>

          <div class="summary">
            <div class="summary-item">
              <div class="summary-value" style="color: #10b981;">${formatCurrency(totalIncome)}</div>
              <div>Total Income</div>
            </div>
            <div class="summary-item">
              <div class="summary-value" style="color: #ef4444;">${formatCurrency(totalExpenses)}</div>
              <div>Total Expenses</div>
            </div>
            <div class="summary-item">
              <div class="summary-value" style="color: ${netProfit >= 0 ? '#10b981' : '#ef4444'};">${formatCurrency(netProfit)}</div>
              <div>Net Profit</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th style="text-align: center;">Type</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${transactionRows}
            </tbody>
          </table>

          <div class="footer">
            <p>Generated by Hustle Business App</p>
          </div>
        </body>
      </html>
    `;
  };

  const exportToPDF = async () => {
    try {
      setIsExporting(true);
      
      // For now, just show an alert. PDF functionality requires additional dependencies
      Alert.alert(
        'Export Feature',
        'PDF export functionality will be available once the required dependencies are installed.\n\nRequired packages:\n- expo-print\n- expo-sharing\n- expo-file-system',
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Error exporting PDF:', error);
      Alert.alert('Error', 'Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPaginationControls = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.pageButton,
            currentPage === i && styles.pageButtonActive
          ]}
          onPress={() => goToPage(i)}
        >
          <Text style={[
            styles.pageButtonText,
            currentPage === i && styles.pageButtonTextActive
          ]}>
            {i}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.navButton, currentPage === 1 && styles.navButtonDisabled]}
          onPress={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={20} color={currentPage === 1 ? '#9ca3af' : '#374151'} />
        </TouchableOpacity>

        <View style={styles.pageNumbers}>
          {startPage > 1 && (
            <>
              <TouchableOpacity style={styles.pageButton} onPress={() => goToPage(1)}>
                <Text style={styles.pageButtonText}>1</Text>
              </TouchableOpacity>
              {startPage > 2 && <Text style={styles.ellipsis}>...</Text>}
            </>
          )}
          
          {pages}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <Text style={styles.ellipsis}>...</Text>}
              <TouchableOpacity style={styles.pageButton} onPress={() => goToPage(totalPages)}>
                <Text style={styles.pageButtonText}>{totalPages}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <TouchableOpacity
          style={[styles.navButton, currentPage === totalPages && styles.navButtonDisabled]}
          onPress={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight size={20} color={currentPage === totalPages ? '#9ca3af' : '#374151'} />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Modern Sleek Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.modernHeader}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.modernBackButton} onPress={onBack}>
            <ArrowLeft size={20} color="#ffffff" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.modernHeaderTitle}>All Transactions</Text>
            <View style={styles.recordsBadge}>
              <Text style={styles.recordsText}>{filteredTransactions.length}</Text>
              <Text style={styles.recordsLabel}>records</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.modernExportButton, isExporting && styles.exportButtonLoading]} 
            onPress={exportToPDF}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <View style={styles.exportIconContainer}>
                <Download size={18} color="#ffffff" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Modern Search and Filters */}
      <View style={styles.modernFiltersContainer}>
        <View style={styles.modernSearchContainer}>
          <View style={styles.searchIconWrapper}>
            <Search size={20} color="#9ca3af" />
          </View>
          <TextInput
            style={styles.modernSearchInput}
            placeholder="Search transactions..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearSearchButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearSearchText}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.modernFilterChips}>
          {[
            { key: 'all', label: 'All', icon: null },
            { key: 'income', label: 'Income', icon: TrendingUp },
            { key: 'expense', label: 'Expense', icon: TrendingDown }
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.modernFilterChip,
                filterType === filter.key && styles.modernFilterChipActive
              ]}
              onPress={() => setFilterType(filter.key as any)}
            >
              {filter.icon && (
                <filter.icon 
                  size={16} 
                  color={filterType === filter.key ? '#ffffff' : '#6b7280'} 
                />
              )}
              <Text style={[
                styles.modernFilterChipText,
                filterType === filter.key && styles.modernFilterChipTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Transactions List */}
      <ScrollView style={styles.transactionsList} showsVerticalScrollIndicator={false}>
        {currentTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>No transactions found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try adjusting your search or filters
            </Text>
          </View>
        ) : (
          currentTransactions.map((transaction, index) => (
            <View key={transaction.id} style={[
              styles.modernTransactionCard,
              { 
                transform: [{ scale: 1 }],
                opacity: 1,
              }
            ]}>
              <View style={styles.cardLeftSection}>
                <View style={[
                  styles.modernTransactionIcon,
                  { 
                    backgroundColor: transaction.type === 'income' 
                      ? 'rgba(16, 185, 129, 0.1)' 
                      : 'rgba(239, 68, 68, 0.1)' 
                  }
                ]}>
                  {transaction.type === 'income' ? (
                    <TrendingUp size={18} color="#10b981" />
                  ) : (
                    <TrendingDown size={18} color="#ef4444" />
                  )}
                </View>
                
                <View style={styles.modernTransactionDetails}>
                  <Text style={styles.modernTransactionDescription} numberOfLines={1}>
                    {transaction.description}
                  </Text>
                  <View style={styles.modernTransactionMeta}>
                    <View style={[
                      styles.categoryBadge,
                      { 
                        backgroundColor: transaction.type === 'income' 
                          ? 'rgba(16, 185, 129, 0.1)' 
                          : 'rgba(239, 68, 68, 0.1)' 
                      }
                    ]}>
                      <Text style={[
                        styles.categoryBadgeText,
                        { 
                          color: transaction.type === 'income' ? '#10b981' : '#ef4444' 
                        }
                      ]}>
                        {transaction.category}
                      </Text>
                    </View>
                    <Text style={styles.modernTransactionDate}>
                      {formatDate(transaction.date)}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.cardRightSection}>
                <Text style={[
                  styles.modernTransactionAmount,
                  { color: transaction.type === 'income' ? '#10b981' : '#ef4444' }
                ]}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </Text>
                <View style={[
                  styles.transactionTypeBadge,
                  { 
                    backgroundColor: transaction.type === 'income' 
                      ? 'rgba(16, 185, 129, 0.1)' 
                      : 'rgba(239, 68, 68, 0.1)' 
                  }
                ]}>
                  <Text style={[
                    styles.transactionTypeText,
                    { color: transaction.type === 'income' ? '#10b981' : '#ef4444' }
                  ]}>
                    {transaction.type === 'income' ? 'Income' : 'Expense'}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modern Pagination */}
      {totalPages > 1 && (
        <View style={styles.modernPaginationWrapper}>
          <LinearGradient
            colors={['#ffffff', '#f8fafc']}
            style={styles.paginationGradient}
          >
            <View style={styles.paginationContent}>
              <Text style={styles.modernPaginationInfo}>
                <Text style={styles.paginationHighlight}>
                  {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)}
                </Text>
                {' '}of{' '}
                <Text style={styles.paginationHighlight}>
                  {filteredTransactions.length}
                </Text>
                {' '}records
              </Text>
              {renderPaginationControls()}
            </View>
          </LinearGradient>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  // Modern Header Styles
  modernHeader: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modernBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  modernHeaderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  recordsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recordsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginRight: 4,
  },
  recordsLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  modernExportButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  exportButtonLoading: {
    opacity: 0.7,
  },
  exportIconContainer: {
    padding: 2,
  },
  // Modern Filters Styles
  modernFiltersContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  modernSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIconWrapper: {
    marginRight: 12,
  },
  modernSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  clearSearchButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  clearSearchText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  modernFilterChips: {
    flexDirection: 'row',
    gap: 12,
  },
  modernFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  modernFilterChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  modernFilterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  modernFilterChipTextActive: {
    color: '#ffffff',
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
  filterChips: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
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
  transactionsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Modern Transaction Card Styles
  modernTransactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modernTransactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  modernTransactionDetails: {
    flex: 1,
  },
  modernTransactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 6,
    lineHeight: 20,
  },
  modernTransactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modernTransactionDate: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  cardRightSection: {
    alignItems: 'flex-end',
    marginLeft: 16,
  },
  modernTransactionAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  transactionTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  transactionTypeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  // Modern Pagination Styles
  modernPaginationWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  paginationGradient: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  paginationContent: {
    alignItems: 'center',
  },
  modernPaginationInfo: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  paginationHighlight: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3b82f6',
  },
  paginationWrapper: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  paginationInfo: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  navButtonDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#f1f5f9',
  },
  pageNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pageButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  pageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  pageButtonTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  ellipsis: {
    fontSize: 16,
    color: '#9ca3af',
    marginHorizontal: 6,
    fontWeight: '600',
  },
});
