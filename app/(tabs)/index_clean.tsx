import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Alert,
} from 'react-native';
import {
  Home,
  Package,
  Users,
  User,
  LogOut,
  Menu,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Star,
  Clock,
  Wifi,
  WifiOff,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/services/supabase';
import { syncService } from '@/services/syncService';
import { BusinessProfile } from '@/types/business';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [isOnline, setIsOnline] = useState(syncService.isConnected());
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [businessData, setBusinessData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalTransactions: 0,
    totalCustomers: 0,
    totalProducts: 0,
    customerDebts: 0,
  });

  const [todayStats, setTodayStats] = useState({
    income: 0,
    expenses: 0,
    transactions: 0,
  });

  const loadBusinessData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load profile
      const { data: profileData } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Load transactions for calculations
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id);

      if (transactions) {
        const revenue = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const today = new Date().toISOString().split('T')[0];
        const todayTransactions = transactions.filter(t => 
          t.created_at?.startsWith(today)
        );

        const todayIncome = todayTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const todayExpenses = todayTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        setBusinessData({
          totalRevenue: revenue,
          totalExpenses: expenses,
          netProfit: revenue - expenses,
          totalTransactions: transactions.length,
          totalCustomers: 0, // Will be loaded from customers table
          totalProducts: 0, // Will be loaded from inventory table
          customerDebts: 0, // Will be calculated from customer debts
        });

        setTodayStats({
          income: todayIncome,
          expenses: todayExpenses,
          transactions: todayTransactions.length,
        });
      }

      // Load customers count
      const { count: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Load inventory count
      const { count: inventoryCount } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setBusinessData(prev => ({
        ...prev,
        totalCustomers: customersCount || 0,
        totalProducts: inventoryCount || 0,
      }));

    } catch (error) {
      console.error('Error loading business data:', error);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBusinessData();
    setRefreshing(false);
  }, [loadBusinessData]);

  useEffect(() => {
    loadBusinessData();
    
    const unsubscribe = syncService.onConnectionChange(setIsOnline);
    return unsubscribe;
  }, [loadBusinessData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      {/* Sidebar */}
      {sidebarVisible && (
        <View style={styles.overlay}>
          <LinearGradient
            colors={['#0f172a', '#1e293b', '#334155']}
            style={styles.sidebar}
          >
            <View style={styles.sidebarHeader}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setSidebarVisible(false)}
              >
                <X size={24} color="#ffffff" />
              </TouchableOpacity>
              
              {profile && (
                <View style={styles.sidebarProfile}>
                  <View style={styles.profileAvatar}>
                    <Text style={styles.avatarText}>
                      {profile.full_name?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.profileName}>{profile.full_name}</Text>
                  <Text style={styles.profileBusiness}>{profile.business_name}</Text>
                </View>
              )}
            </View>

            <View style={styles.sidebarMenu}>
              {[
                { key: 'dashboard', icon: Home, color: '#10b981', label: 'Dashboard' },
                { key: 'stock', icon: Package, color: '#f59e0b', label: 'Stock' },
                { key: 'customers', icon: Users, color: '#ef4444', label: 'Customers' },
                { key: 'profile', icon: User, color: '#8b5cf6', label: 'Profile' },
              ].map((item) => {
                const IconComponent = item.icon;
                return (
                  <TouchableOpacity 
                    key={item.key}
                    style={styles.menuItem}
                    onPress={() => {
                      setSidebarVisible(false);
                      if (item.key !== 'dashboard') {
                        router.push(`/(tabs)/${item.key}` as any);
                      }
                    }}
                  >
                    <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
                      <IconComponent size={20} color={item.color} />
                    </View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={async () => {
                await supabase.auth.signOut();
                router.replace('/auth');
              }}
            >
              <LogOut size={20} color="#ef4444" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      <ScrollView 
        style={styles.mainContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#10b981']}
            tintColor="#10b981"
          />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity style={styles.menuButton} onPress={() => setSidebarVisible(true)}>
            <Menu size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <View style={styles.statusContainer}>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10b981' : '#ef4444' }]} />
              <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
            </View>
          </View>

          <View style={styles.headerContent}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.subtitle}>Ready to grow your business?</Text>
            
            {profile && (
              <View style={styles.businessInfo}>
                <Text style={styles.businessTitle}>{profile.business_name}</Text>
                <Text style={styles.location}>{profile.location}</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Today's Performance */}
        <View style={styles.performanceSection}>
          <View style={styles.performanceCard}>
            <View style={styles.performanceHeader}>
              <Text style={styles.performanceTitle}>Today's Performance</Text>
              <View style={styles.liveBadge}>
                <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.liveBadgeText}>LIVE</Text>
              </View>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#10b98120' }]}>
                  <TrendingUp size={24} color="#10b981" />
                </View>
                <Text style={styles.statAmount}>{formatCurrency(todayStats.income)}</Text>
                <Text style={styles.statLabel}>Income</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#ef444420' }]}>
                  <TrendingDown size={24} color="#ef4444" />
                </View>
                <Text style={styles.statAmount}>{formatCurrency(todayStats.expenses)}</Text>
                <Text style={styles.statLabel}>Expenses</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#3b82f620' }]}>
                  <DollarSign size={24} color="#3b82f6" />
                </View>
                <Text style={styles.statAmount}>{formatCurrency(todayStats.income - todayStats.expenses)}</Text>
                <Text style={styles.statLabel}>Net Profit</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Business Overview */}
        <View style={styles.overviewSection}>
          <View style={styles.sectionHeader}>
            <Star size={20} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Business Overview</Text>
          </View>
          
          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewNumber}>{formatCurrency(businessData.totalRevenue)}</Text>
              <Text style={styles.overviewLabel}>Total Revenue</Text>
            </View>
            
            <View style={styles.overviewCard}>
              <Text style={styles.overviewNumber}>{businessData.totalTransactions}</Text>
              <Text style={styles.overviewLabel}>Transactions</Text>
            </View>
            
            <View style={styles.overviewCard}>
              <Text style={styles.overviewNumber}>{businessData.totalCustomers}</Text>
              <Text style={styles.overviewLabel}>Customers</Text>
            </View>
            
            <View style={styles.overviewCard}>
              <Text style={styles.overviewNumber}>{businessData.totalProducts}</Text>
              <Text style={styles.overviewLabel}>Products</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <View style={styles.sectionHeader}>
            <Star size={20} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          
          <View style={styles.actionsGrid}>
            {[
              { icon: Package, title: 'Inventory', route: '/(tabs)/stock', color: '#10b981' },
              { icon: Users, title: 'Customers', route: '/(tabs)/customers', color: '#3b82f6' },
              { icon: TrendingUp, title: 'Sales', route: '/(tabs)/transactions', color: '#f59e0b' },
              { icon: DollarSign, title: 'Expenses', route: '/(tabs)/transactions', color: '#ef4444' },
            ].map((action, index) => {
              const IconComponent = action.icon;
              return (
                <TouchableOpacity 
                  key={index}
                  style={[styles.actionCard, { borderLeftColor: action.color }]}
                  onPress={() => router.push(action.route as any)}
                >
                  <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                    <IconComponent size={20} color={action.color} />
                  </View>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  mainContent: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
    flexDirection: 'row',
  },
  sidebar: {
    width: 280,
    height: '100%',
    paddingTop: 50,
  },
  sidebarHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 20,
  },
  sidebarProfile: {
    alignItems: 'center',
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  profileBusiness: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  sidebarMenu: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 10,
    borderRadius: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 10,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ef4444',
    marginLeft: 12,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    position: 'relative',
  },
  menuButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  statusContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 2,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 20,
  },
  businessInfo: {
    alignItems: 'center',
  },
  businessTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  performanceSection: {
    padding: 20,
    marginTop: -20,
    zIndex: 1,
  },
  performanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  performanceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  liveBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  overviewSection: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  overviewCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: (width - 60) / 2,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  overviewNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  actionsContainer: {
    padding: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    width: (width - 60) / 2,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderLeftWidth: 4,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
});
