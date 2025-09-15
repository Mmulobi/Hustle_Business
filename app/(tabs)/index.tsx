import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Wifi,
  WifiOff,
  Bot,
  Package,
  Users,
  MapPin,
  Truck,
  ShoppingCart,
  Apple,
  Zap,
  CreditCard,
  AlertTriangle,
  Menu,
  X,
  Home,
  BarChart3,
  User,
  LogOut,
  Sun,
  Moon,
  Sunrise,
  Sunset,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/services/supabase';
import { syncService } from '@/services/syncService';
import { getOfflineTransactions } from '@/services/offlineStorage';
import { BusinessProfile, Transaction } from '@/types/business';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isOnline, setIsOnline] = useState(syncService.isConnected());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayStats, setTodayStats] = useState({
    income: 0,
    expenses: 0,
    net: 0,
    goalProgress: 0,
  });

  useEffect(() => {
    loadDashboardData();
    
    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Refresh data every 30 seconds for real-time updates
    const dataInterval = setInterval(() => {
      loadDashboardData();
    }, 30000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(dataInterval);
    };
  }, []);

  // Add focus listener to refresh data when user returns to dashboard
  useEffect(() => {
    const unsubscribe = router.addListener('focus', () => {
      loadDashboardData();
    });

    return unsubscribe;
  }, [router]);

  const loadDashboardData = async () => {
    try {
      // Load user profile and real data from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth');
        return;
      }

      // Load business profile
      const { data: profileData, error: profileError } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (profileError) {
        console.error('Error loading profile:', profileError);
        return;
      }
      
      if (profileData) {
        setProfile(profileData);
        
        // Load today's sales data
        const today = new Date().toISOString().split('T')[0];
        const { data: salesData } = await supabase
          .from('sales_records')
          .select('amount')
          .eq('user_id', user.id)
          .eq('date', today);
          
        // Load today's expenses data
        const { data: expensesData } = await supabase
          .from('expenses')
          .select('amount')
          .eq('user_id', user.id)
          .eq('date', today);
          
        // Calculate real stats from database
        const income = salesData?.reduce((sum: number, sale: any) => sum + parseFloat(sale.amount.toString()), 0) || 0;
        const expenses = expensesData?.reduce((sum: number, expense: any) => sum + parseFloat(expense.amount.toString()), 0) || 0;
        const net = income - expenses;
        const goalProgress = profileData.daily_goal > 0 
          ? Math.min((income / profileData.daily_goal) * 100, 100)
          : 0;
        
        setTodayStats({
          income,
          expenses,
          net,
          goalProgress,
        });
        
        // Load additional business-specific data
        await loadBusinessSpecificData(user.id, profileData.business_type);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const [businessData, setBusinessData] = useState({
    inventoryCount: 0,
    customerDebts: 0,
    lowStockItems: 0,
    tripCount: 0,
    totalDistance: 0,
    unpaidDebts: 0,
  });

  const loadBusinessSpecificData = async (userId: string, businessType: string) => {
    try {
      switch (businessType) {
        case 'mama_mboga':
        case 'small_shop':
        case 'fruit_vendor':
          // Load inventory and customer debt data
          const { data: inventoryData } = await supabase
            .from('inventory_items')
            .select('quantity')
            .eq('user_id', userId);
            
          const { data: debtsData } = await supabase
            .from('customer_debts')
            .select('amount, is_paid')
            .eq('user_id', userId);
            
          const inventoryCount = inventoryData?.length || 0;
          const lowStockItems = inventoryData?.filter((item: any) => item.quantity < 5).length || 0;
          const unpaidDebts = debtsData?.filter((debt: any) => !debt.is_paid).length || 0;
          const customerDebts = debtsData?.filter((debt: any) => !debt.is_paid)
            .reduce((sum: number, debt: any) => sum + parseFloat(debt.amount.toString()), 0) || 0;
            
          setBusinessData(prev => ({
            ...prev,
            inventoryCount,
            lowStockItems,
            unpaidDebts,
            customerDebts,
          }));
          break;
          
        case 'boda_boda':
          // Load trip data
          const today = new Date().toISOString().split('T')[0];
          const { data: tripsData } = await supabase
            .from('trip_logs')
            .select('distance_km')
            .eq('user_id', userId)
            .eq('date', today);
            
          const tripCount = tripsData?.length || 0;
          const totalDistance = tripsData?.reduce((sum: number, trip: any) => sum + parseFloat(trip.distance_km?.toString() || '0'), 0) || 0;
          
          setBusinessData(prev => ({
            ...prev,
            tripCount,
            totalDistance,
          }));
          break;
          
        default:
          break;
      }
    } catch (error) {
      console.error('Error loading business-specific data:', error);
    }
  };

  const handleAIAssistant = () => {
    Alert.alert(
      'HustleAI Assistant',
      'AI Assistant coming soon! This will provide personalized business insights and tips based on your hustle type.',
      [{ text: 'OK' }]
    );
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  const getHustleTypeTitle = (type: string) => {
    switch (type) {
      case 'mama_mboga':
        return 'Mama Mboga Business';
      case 'boda_boda':
        return 'Boda Boda Operations';
      case 'small_shop':
        return 'Shop Management';
      case 'fruit_vendor':
        return 'Fruit Vendor Business';
      default:
        return 'Your Hustle';
    }
  };

  const getCategorySpecificActions = (businessType: string) => {
    switch (businessType) {
      case 'mama_mboga':
        return [
          { icon: Package, title: 'Manage Inventory', subtitle: 'Track vegetables & fruits stock', color: '#10b981' },
          { icon: Users, title: 'Customer Debts', subtitle: 'Track "weka kwa deni" customers', color: '#3b82f6' },
          { icon: TrendingUp, title: 'Price Suggestions', subtitle: 'AI-powered pricing tips', color: '#f59e0b' },
          { icon: Apple, title: 'Best Sellers', subtitle: 'Analyze top performing items', color: '#ef4444' },
        ];
      case 'boda_boda':
        return [
          { icon: MapPin, title: 'Log Trip', subtitle: 'Record distance, time & earnings', color: '#10b981' },
          { icon: Truck, title: 'Fuel Tracker', subtitle: 'Monitor fuel costs & efficiency', color: '#3b82f6' },
          { icon: DollarSign, title: 'Daily Summary', subtitle: 'Net profit after expenses', color: '#f59e0b' },
          { icon: AlertTriangle, title: 'Safety Tips', subtitle: 'AI safety reminders', color: '#ef4444' },
        ];
      case 'small_shop':
        return [
          { icon: ShoppingCart, title: 'Shop Ledger', subtitle: 'Digital sales & stock tracking', color: '#10b981' },
          { icon: Package, title: 'Supplier Management', subtitle: 'Track purchases & suppliers', color: '#3b82f6' },
          { icon: AlertTriangle, title: 'Low Stock Alerts', subtitle: 'Never run out of popular items', color: '#f59e0b' },
          { icon: TrendingUp, title: 'Profit Dashboard', subtitle: 'Daily profit/loss analysis', color: '#ef4444' },
        ];
      case 'fruit_vendor':
        return [
          { icon: Apple, title: 'Seasonal Predictions', subtitle: 'AI demand forecasting', color: '#10b981' },
          { icon: Package, title: 'Freshness Tracker', subtitle: 'Monitor stock expiry dates', color: '#3b82f6' },
          { icon: Zap, title: 'Quick Sale Log', subtitle: 'One-tap fruit sales recording', color: '#f59e0b' },
          { icon: TrendingUp, title: 'Best Times', subtitle: 'Peak selling hours analysis', color: '#ef4444' },
        ];
      default:
        return [
          { icon: DollarSign, title: 'Custom Ledger', subtitle: 'Track your unique business', color: '#10b981' },
          { icon: Target, title: 'Goal Tracker', subtitle: 'Set & achieve daily targets', color: '#3b82f6' },
          { icon: Bot, title: 'HustleAI Tips', subtitle: 'Personalized business advice', color: '#f59e0b' },
          { icon: TrendingUp, title: 'Growth Insights', subtitle: 'Analyze your progress', color: '#ef4444' },
        ];
    }
  };

  const handleCategoryAction = (actionTitle: string) => {
    Alert.alert(
      actionTitle,
      `${actionTitle} feature coming soon! This will be tailored specifically for your ${getHustleTypeTitle(profile?.business_type || 'other_hustle')}.`,
      [{ text: 'OK' }]
    );
  };

  const getTimeBasedGreeting = () => {
    const hour = currentTime.getHours();
    const name = profile?.full_name?.split(' ')[0] || 'Hustler';
    
    if (hour >= 5 && hour < 12) {
      return {
        greeting: `Good morning, ${name}! ☀️`,
        message: "Ready to make today profitable?",
        icon: Sunrise,
        gradient: ['#f59e0b', '#f97316'] as const
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        greeting: `Good afternoon, ${name}! 🌤️`,
        message: "How's your hustle going today?",
        icon: Sun,
        gradient: ['#10b981', '#059669'] as const
      };
    } else if (hour >= 17 && hour < 21) {
      return {
        greeting: `Good evening, ${name}! 🌅`,
        message: "Time to review today's progress!",
        icon: Sunset,
        gradient: ['#f59e0b', '#dc2626'] as const
      };
    } else {
      return {
        greeting: `Good night, ${name}! 🌙`,
        message: "Planning for tomorrow's success?",
        icon: Moon,
        gradient: ['#6366f1', '#8b5cf6'] as const
      };
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              router.replace('/auth');
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  };

  const navigateToSection = (section: string) => {
    setSidebarOpen(false);
    switch (section) {
      case 'profile':
        router.push('/profile');
        break;
      case 'sales':
        router.push('/(tabs)/transactions');
        break;
      case 'stock':
        router.push('/(tabs)/stock');
        break;
      case 'customers':
        router.push('/(tabs)/customers');
        break;
      default:
        break;
    }
  };

  const timeGreeting = getTimeBasedGreeting();
  const GreetingIcon = timeGreeting.icon;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1}
          onPress={() => setSidebarOpen(false)}
        >
          <View style={styles.sidebar}>
            <LinearGradient
              colors={['#0f172a', '#1e293b']}
              style={styles.sidebarGradient}
            >
              {/* Sidebar Header */}
              <View style={styles.sidebarHeader}>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setSidebarOpen(false)}
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
                    <Text style={styles.sidebarName}>{profile.full_name}</Text>
                    <Text style={styles.sidebarBusiness}>{getHustleTypeTitle(profile.business_type)}</Text>
                  </View>
                )}
              </View>

              {/* Navigation Items */}
              <View style={styles.sidebarNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => navigateToSection('dashboard')}>
                  <Home size={20} color="#10b981" />
                  <Text style={styles.navText}>Dashboard</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.navItem} onPress={() => navigateToSection('sales')}>
                  <BarChart3 size={20} color="#3b82f6" />
                  <Text style={styles.navText}>Sales</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.navItem} onPress={() => navigateToSection('stock')}>
                  <Package size={20} color="#f59e0b" />
                  <Text style={styles.navText}>Stock</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.navItem} onPress={() => navigateToSection('customers')}>
                  <Users size={20} color="#ef4444" />
                  <Text style={styles.navText}>Customers</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.navItem} onPress={() => navigateToSection('profile')}>
                  <User size={20} color="#8b5cf6" />
                  <Text style={styles.navText}>Profile</Text>
                </TouchableOpacity>
              </View>

              {/* Sign Out Button */}
              <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <LogOut size={20} color="#ef4444" />
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      )}

      <ScrollView style={styles.mainContent}>
        {/* Enhanced Header with Dynamic Greeting */}
        <LinearGradient
          colors={timeGreeting.gradient}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => setSidebarOpen(true)}
            >
              <Menu size={24} color="#ffffff" />
            </TouchableOpacity>
            
            <View style={[styles.statusIndicator, { backgroundColor: isOnline ? 'rgba(255,255,255,0.2)' : 'rgba(239,68,68,0.8)' }]}>
              {isOnline ? <Wifi size={16} color="#ffffff" /> : <WifiOff size={16} color="#ffffff" />}
              <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
            </View>
          </View>
          
          <View style={styles.greetingContainer}>
            <GreetingIcon size={32} color="#ffffff" />
            <View style={styles.greetingText}>
              <Text style={styles.dynamicGreeting}>{timeGreeting.greeting}</Text>
              <Text style={styles.greetingMessage}>{timeGreeting.message}</Text>
            </View>
          </View>
          
          {profile && (
            <View style={styles.businessInfo}>
              <Text style={styles.businessTitle}>
                {getHustleTypeTitle(profile.business_type)}
              </Text>
              <Text style={styles.location}>📍 {profile.location}</Text>
            </View>
          )}
        </LinearGradient>

      {/* Today's Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Today's Performance</Text>
        
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.incomeCard]}>
            <TrendingUp size={24} color="#10b981" />
            <Text style={styles.statAmount}>{formatCurrency(todayStats.income)}</Text>
            <Text style={styles.statLabel}>Income</Text>
          </View>
          
          <View style={[styles.statCard, styles.expenseCard]}>
            <TrendingDown size={24} color="#ef4444" />
            <Text style={styles.statAmount}>{formatCurrency(todayStats.expenses)}</Text>
            <Text style={styles.statLabel}>Expenses</Text>
          </View>
          
          <View style={[styles.statCard, styles.netCard]}>
            <DollarSign size={24} color="#3b82f6" />
            <Text style={styles.statAmount}>{formatCurrency(todayStats.net)}</Text>
            <Text style={styles.statLabel}>Net Profit</Text>
          </View>
          
          {profile && (
            <View style={[styles.statCard, styles.goalCard]}>
              <Target size={24} color="#f59e0b" />
              <Text style={styles.statAmount}>{Math.round(todayStats.goalProgress)}%</Text>
              <Text style={styles.statLabel}>Goal Progress</Text>
            </View>
          )}
        </View>
      </View>

      {/* Business Overview - Standardized for all except Boda Boda */}
      {profile && (
        <View style={styles.businessDataContainer}>
          <Text style={styles.sectionTitle}>Business Overview</Text>
          
          {profile.business_type === 'boda_boda' ? (
            <View style={styles.businessStatsGrid}>
              <View style={styles.businessStatCard}>
                <MapPin size={20} color="#10b981" />
                <Text style={styles.businessStatNumber}>{businessData.tripCount}</Text>
                <Text style={styles.businessStatLabel}>Trips Today</Text>
              </View>
              
              <View style={styles.businessStatCard}>
                <Truck size={20} color="#3b82f6" />
                <Text style={styles.businessStatNumber}>{businessData.totalDistance.toFixed(1)} km</Text>
                <Text style={styles.businessStatLabel}>Distance Today</Text>
              </View>
              
              <View style={styles.businessStatCard}>
                <DollarSign size={20} color="#f59e0b" />
                <Text style={styles.businessStatNumber}>{formatCurrency(todayStats.income / (businessData.tripCount || 1))}</Text>
                <Text style={styles.businessStatLabel}>Avg per Trip</Text>
              </View>
              
              <View style={styles.businessStatCard}>
                <Target size={20} color="#ef4444" />
                <Text style={styles.businessStatNumber}>{businessData.totalDistance > 0 ? (todayStats.income / businessData.totalDistance).toFixed(0) : '0'}</Text>
                <Text style={styles.businessStatLabel}>KES per KM</Text>
              </View>
            </View>
          ) : (
            // Standard dashboard for all other business types
            <View style={styles.businessStatsGrid}>
              <View style={styles.businessStatCard}>
                <Package size={20} color="#10b981" />
                <Text style={styles.businessStatNumber}>{businessData.inventoryCount}</Text>
                <Text style={styles.businessStatLabel}>Items in Stock</Text>
              </View>
              
              <View style={styles.businessStatCard}>
                <AlertTriangle size={20} color="#f59e0b" />
                <Text style={styles.businessStatNumber}>{businessData.lowStockItems}</Text>
                <Text style={styles.businessStatLabel}>Low Stock</Text>
              </View>
              
              <View style={styles.businessStatCard}>
                <Users size={20} color="#ef4444" />
                <Text style={styles.businessStatNumber}>{businessData.unpaidDebts}</Text>
                <Text style={styles.businessStatLabel}>Pending Debts</Text>
              </View>
              
              <View style={styles.businessStatCard}>
                <DollarSign size={20} color="#3b82f6" />
                <Text style={styles.businessStatNumber}>{formatCurrency(businessData.customerDebts)}</Text>
                <Text style={styles.businessStatLabel}>Total Owed</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Category-Specific Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>
          {profile ? `${getHustleTypeTitle(profile.business_type)} Tools` : 'Business Tools'}
        </Text>
        
        <View style={styles.actionsGrid}>
          {getCategorySpecificActions(profile?.business_type || 'other_hustle').map((action, index) => {
            const IconComponent = action.icon;
            return (
              <TouchableOpacity 
                key={index}
                style={[styles.actionCard, { borderLeftColor: action.color }]}
                onPress={() => handleCategoryAction(action.title)}
              >
                <View style={styles.actionContent}>
                  <IconComponent size={24} color={action.color} />
                  <View style={styles.actionText}>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                    <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        
        {/* HustleAI Assistant */}
        <TouchableOpacity 
          style={styles.aiAssistantCard}
          onPress={handleAIAssistant}
        >
          <View style={styles.aiAssistantContent}>
            <Bot size={32} color="#6366f1" />
            <View style={styles.aiAssistantText}>
              <Text style={styles.aiAssistantTitle}>HustleAI Assistant</Text>
              <Text style={styles.aiAssistantSubtitle}>
                Get personalized tips for your {getHustleTypeTitle(profile?.business_type || 'business').toLowerCase()}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Recent Activity from Database */}
      <View style={styles.recentContainer}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {todayStats.income === 0 && todayStats.expenses === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No transactions recorded today</Text>
            <Text style={styles.emptyStateSubtext}>Start by recording your first sale or expense</Text>
          </View>
        ) : (
          <View style={styles.activitySummary}>
            <View style={styles.activityItem}>
              <TrendingUp size={16} color="#10b981" />
              <Text style={styles.activityText}>
                {todayStats.income > 0 ? `Sales: ${formatCurrency(todayStats.income)}` : 'No sales recorded'}
              </Text>
            </View>
            <View style={styles.activityItem}>
              <TrendingDown size={16} color="#ef4444" />
              <Text style={styles.activityText}>
                {todayStats.expenses > 0 ? `Expenses: ${formatCurrency(todayStats.expenses)}` : 'No expenses recorded'}
              </Text>
            </View>
          </View>
        )}
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
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  sidebar: {
    width: width * 0.8,
    height: '100%',
    maxWidth: 320,
  },
  sidebarGradient: {
    flex: 1,
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
  sidebarName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  sidebarBusiness: {
    fontSize: 14,
    color: '#94a3b8',
  },
  sidebarNav: {
    flex: 1,
    paddingTop: 30,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  navText: {
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 16,
    fontWeight: '500',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 30,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  signOutText: {
    fontSize: 16,
    color: '#ef4444',
    marginLeft: 16,
    fontWeight: '500',
  },
  header: {
    padding: 20,
    paddingTop: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingText: {
    marginLeft: 16,
    flex: 1,
  },
  dynamicGreeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  greetingMessage: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  businessInfo: {
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  businessTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  location: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    width: (width - 60) / 2,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  incomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  netCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  goalCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  statAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  actionsContainer: {
    padding: 20,
  },
  actionsGrid: {
    marginBottom: 20,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 16,
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  aiAssistantCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  aiAssistantContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiAssistantText: {
    marginLeft: 16,
    flex: 1,
  },
  aiAssistantTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  aiAssistantSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  businessDataContainer: {
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  businessStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  businessStatCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    width: (width - 60) / 2,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  businessStatNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  businessStatLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  recentContainer: {
    padding: 20,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  activitySummary: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activityText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  transactionItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
});