import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Animations removed
import { BlurView } from 'expo-blur';
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
  Plus,
  RefreshCw,
  Star,
  Zap,
  Calendar,
  Clock,
  Target,
  Wifi,
  WifiOff,
  MessageCircle,
  Search,
  TriangleAlert,
  ArrowUp,
  BarChart,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/services/supabase';
import { syncService } from '@/services/syncService';
import { getOfflineTransactions } from '@/services/offlineStorage';
import { BusinessProfile, Transaction } from '@/types/business';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

// Fallback Animated shim to prevent runtime errors if any Animated.View remains
const Animated = { View } as any;

export default function DashboardScreen() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isOnline, setIsOnline] = useState(syncService.isConnected());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
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

    // Set up real-time subscriptions
    const subscriptions = setupRealtimeSubscriptions();

    return () => {
      clearInterval(timeInterval);
      subscriptions.forEach(sub => sub?.unsubscribe?.());
    };
  }, []);

  const setupRealtimeSubscriptions = () => {
    const subscriptions: any[] = [];
    
    try {
      // Check if supabase has channel method (real client)
      if ('channel' in supabase && typeof supabase.channel === 'function') {
        // Subscribe to sales records
        const salesSubscription = supabase
          .channel('sales_realtime')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'sales_records' },
            () => loadDashboardData()
          )
          .subscribe();
        
        // Subscribe to expenses
        const expensesSubscription = supabase
          .channel('expenses_realtime')
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'expenses' },
            () => loadDashboardData()
          )
          .subscribe();
        
        // Subscribe to inventory changes
        const inventorySubscription = supabase
          .channel('inventory_realtime')
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'inventory_items' },
            () => loadDashboardData()
          )
          .subscribe();
        
        subscriptions.push(salesSubscription, expensesSubscription, inventorySubscription);
      }
    } catch (error) {
      console.log('Real-time subscriptions not available:', error);
    }
    
    return subscriptions;
  };

  const loadDashboardData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      // Load user profile and real data from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth');
        return;
      }

      // Load business profile with proper error handling
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('user_id', user.id) as any;
        
        if (profileError) {
          console.error('Error loading profile:', profileError);
        }
        
        // Handle case where no profile exists
        if (!profileData || profileData.length === 0) {
          console.log('No business profile found, creating default profile');
          // Create a default business profile
          const defaultProfile = {
            user_id: user.id,
            full_name: user.email?.split('@')[0] || 'Business Owner',
            business_name: `${user.email?.split('@')[0] || 'My'} Business`,
            business_type: 'other_hustle',
            location: 'Kenya',
            email: user.email || '',
            daily_goal: 1000,
          };
          
          const { data: newProfile, error: createError } = await supabase
            .from('business_profiles')
            .insert(defaultProfile) as any;
          
          if (!createError) {
            // Try to get the created profile
            const { data: createdProfile } = await supabase
              .from('business_profiles')
              .select('*')
              .eq('user_id', user.id)
              .single() as any;
            
            if (createdProfile) {
              setProfile(createdProfile);
            }
          } else {
            console.error('Error creating profile:', createError);
          }
        } else {
          setProfile(profileData[0]);
        }
      } catch (error) {
        console.log('Error with profile operations:', error);
      }
      
      // Load today's sales data with simplified error handling
      const today = new Date().toISOString().split('T')[0];
      let salesData: any[] = [];
      let expensesData: any[] = [];
      
      try {
        const { data: salesResponse } = await supabase
          .from('sales_records')
          .select('amount')
          .eq('user_id', user.id)
          .eq('date', today) as any;
        
        salesData = salesResponse || [];
          
        // Load today's expenses data
        const { data: expensesResponse } = await supabase
          .from('expenses')
          .select('amount')
          .eq('user_id', user.id)
          .eq('date', today) as any;
        
        expensesData = expensesResponse || [];
      } catch (error) {
        console.log('Error loading sales/expenses data:', error);
      }
          
      // Calculate real stats from database
      const income = salesData?.reduce((sum: number, sale: any) => sum + parseFloat(sale.amount?.toString() || '0'), 0) || 0;
      const expenses = expensesData?.reduce((sum: number, expense: any) => sum + parseFloat(expense.amount?.toString() || '0'), 0) || 0;
      const net = income - expenses;
      const goalProgress = profile?.daily_goal > 0 
        ? Math.min((income / profile.daily_goal) * 100, 100)
        : 0;
      
      setTodayStats({
        income,
        expenses,
        net,
        goalProgress,
      });
      
      // Load standard business data
      await loadStandardBusinessData(user.id);
      
      // Load recent activity
      await loadRecentActivity(user.id);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    await loadDashboardData(true);
  }, []);

  const loadRecentActivity = async (userId: string) => {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Get recent sales
      let recentSales: any[] = [];
      let recentExpenses: any[] = [];
      
      try {
        const { data: salesResponse } = await supabase
          .from('sales_records')
          .select('*')
          .eq('user_id', userId)
          .gte('date', yesterday.toISOString().split('T')[0])
          .order('created_at', { ascending: false })
          .limit(5) as any;
        
        recentSales = salesResponse || [];
        
        // Get recent expenses
        const { data: expensesResponse } = await supabase
          .from('expenses')
          .select('*')
          .eq('user_id', userId)
          .gte('date', yesterday.toISOString().split('T')[0])
          .order('created_at', { ascending: false })
          .limit(5) as any;
        
        recentExpenses = expensesResponse || [];
      } catch (error) {
        console.log('Error loading recent activity:', error);
      }
      
      // Combine and sort by timestamp
      const combined = [
        ...(recentSales || []).map((item: any) => ({ ...item, type: 'sale' })),
        ...(recentExpenses || []).map((item: any) => ({ ...item, type: 'expense' }))
      ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
       .slice(0, 8);
      
      setRecentActivity(combined);
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const [businessData, setBusinessData] = useState({
    inventoryCount: 0,
    customerDebts: 0,
    unpaidDebts: 0,
    lowStockItems: 0,
    totalCustomers: 0,
  });

  const loadStandardBusinessData = async (userId: string) => {
    try {
      // Load inventory data (available for all business types)
      let inventoryData: any[] = [];
      let debtsData: any[] = [];
      let customersData: any[] = [];
      
      try {
        const { data: inventoryResponse } = await supabase
          .from('inventory_items')
          .select('quantity, reorder_level')
          .eq('user_id', userId) as any;
        
        inventoryData = inventoryResponse || [];
          
        // Load customer debt data (available for all business types)
        const { data: debtsResponse } = await supabase
          .from('customer_debts')
          .select('amount_owed, is_paid')
          .eq('user_id', userId) as any;
        
        debtsData = debtsResponse || [];
          
        // Count unique customers
        const { data: customersResponse } = await supabase
          .from('customer_debts')
          .select('customer_name')
          .eq('user_id', userId) as any;
        
        customersData = customersResponse || [];
      } catch (error) {
        console.log('Error loading business data:', error);
      }
        
      const inventoryCount = inventoryData?.length || 0;
      const lowStockItems = inventoryData?.filter((item: any) => 
        item.quantity <= (item.reorder_level || 5)
      ).length || 0;
      const unpaidDebts = debtsData?.filter((debt: any) => !debt.is_paid).length || 0;
      const customerDebts = debtsData?.filter((debt: any) => !debt.is_paid)
        .reduce((sum: number, debt: any) => sum + parseFloat(debt.amount_owed?.toString() || '0'), 0) || 0;
      const totalCustomers = new Set(customersData?.map((c: any) => c.customer_name) || []).size;
        
      setBusinessData({
        inventoryCount,
        unpaidDebts,
        customerDebts,
        lowStockItems,
        totalCustomers,
      });
    } catch (error) {
      console.error('Error loading business data:', error);
    }
  };


  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  const getBusinessTitle = () => {
    return profile?.business_name || 'Your Business';
  };

  const getHustleTypeTitle = (businessType: string) => {
    switch (businessType) {
      case 'mama_mboga':
        return 'Mama Mboga Business';
      case 'boda_boda':
        return 'Boda Boda Service';
      case 'kiosk':
        return 'Kiosk Business';
      case 'salon':
        return 'Salon & Beauty';
      case 'restaurant':
        return 'Restaurant Business';
      case 'retail':
        return 'Retail Store';
      case 'services':
        return 'Service Business';
      case 'other_hustle':
      default:
        return 'Business';
    }
  };

  const getCategorySpecificActions = (businessType: string) => {
    const baseActions = [
      { icon: Package, title: 'Inventory', subtitle: 'Manage your stock items', color: '#10b981', route: '/stock' },
      { icon: Users, title: 'Customers', subtitle: 'Track customer debts', color: '#3b82f6', route: '/customers' },
      { icon: TrendingUp, title: 'Sales', subtitle: 'Record daily sales', color: '#f59e0b', route: '/sales' },
      { icon: DollarSign, title: 'Expenses', subtitle: 'Track business expenses', color: '#ef4444', route: '/expenses' },
    ];

    return baseActions;
  };


  const handleAction = (route: string) => {
    if (route && route.startsWith('/')) {
      router.push(route as any);
    } else {
      Alert.alert('Coming Soon', 'This feature is under development.');
    }
  };

  const getTimeBasedGreeting = () => {
    const hour = currentTime.getHours();
    const name = profile?.full_name?.split(' ')[0] || 'Hustler';
    
    if (hour >= 5 && hour < 12) {
      return {
        greeting: `Good morning, ${name}! ☀️`,
        message: "Ready to make today profitable?",
        icon: Clock,
        gradient: ['#f59e0b', '#f97316'] as const
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        greeting: `Good afternoon, ${name}! 🌤️`,
        message: "How's your hustle going today?",
        icon: Clock,
        gradient: ['#10b981', '#059669'] as const
      };
    } else if (hour >= 17 && hour < 21) {
      return {
        greeting: `Good evening, ${name}! 🌅`,
        message: "Time to review today's progress!",
        icon: Clock,
        gradient: ['#f59e0b', '#dc2626'] as const
      };
    } else {
      return {
        greeting: `Good night, ${name}! 🌙`,
        message: "Planning for tomorrow's success?",
        icon: Clock,
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

  const handleCategoryAction = (title: string) => {
    const actions = getCategorySpecificActions(profile?.business_type || 'other_hustle');
    const action = actions.find(a => a.title === title);
    if (action) {
      handleAction(action.route);
    }
  };

  const handleAIAssistant = () => {
    Alert.alert('HustleAI Assistant', 'AI-powered business insights coming soon!');
  };

  // Temporarily disabled animated styles
  // const statsAnimatedStyle = useAnimatedStyle(() => {
  //   return {
  //     transform: [{ scale: withSpring(1) }],
  //   };
  // });


  const timeGreeting = getTimeBasedGreeting();
  const GreetingIcon = timeGreeting.icon;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Modern Sidebar */}
      {sidebarOpen && (
        <View style={styles.modernOverlay}>
          <TouchableOpacity 
            style={styles.overlayTouchable} 
            activeOpacity={1}
            onPress={() => setSidebarOpen(false)}
          />
          
          <View style={styles.modernSidebar}>
            <BlurView intensity={20} style={styles.sidebarBlur}>
              <LinearGradient
                colors={['rgba(15, 23, 42, 0.95)', 'rgba(30, 41, 59, 0.95)', 'rgba(51, 65, 85, 0.9)']}
                style={styles.modernSidebarGradient}
              >
                {/* Enhanced Header */}
                <View style={styles.modernSidebarHeader}>
                  <TouchableOpacity 
                    style={styles.modernCloseButton}
                    onPress={() => setSidebarOpen(false)}
                  >
                    <LinearGradient
                      colors={['#ef4444', '#dc2626']}
                      style={styles.closeButtonGradient}
                    >
                      <X size={20} color="#ffffff" />
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  {profile && (
                    <View style={styles.modernSidebarProfile}>
                      <View style={styles.modernProfileAvatar}>
                        <LinearGradient
                          colors={['#667eea', '#764ba2']}
                          style={styles.avatarGradient}
                        >
                          <Text style={styles.modernAvatarText}>
                            {profile.full_name?.charAt(0).toUpperCase()}
                          </Text>
                        </LinearGradient>
                      </View>
                      
                      <Text style={styles.modernSidebarName}>
                        {profile.full_name}
                      </Text>
                      
                      <View style={styles.businessBadge}>
                        <Text style={styles.modernSidebarBusiness}>
                          {getHustleTypeTitle(profile.business_type)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Enhanced Navigation */}
                <View style={styles.modernSidebarNav}>
                  {[
                    { key: 'dashboard', icon: Home, color: '#10b981', label: 'Dashboard', gradient: ['#10b981', '#059669'] },
                    { key: 'sales', icon: BarChart, color: '#3b82f6', label: 'Sales', gradient: ['#3b82f6', '#2563eb'] },
                    { key: 'stock', icon: Package, color: '#f59e0b', label: 'Stock', gradient: ['#f59e0b', '#d97706'] },
                    { key: 'customers', icon: Users, color: '#ef4444', label: 'Customers', gradient: ['#ef4444', '#dc2626'] },
                    { key: 'profile', icon: User, color: '#8b5cf6', label: 'Profile', gradient: ['#8b5cf6', '#7c3aed'] }
                  ].map((item, index) => {
                    const IconComponent = item.icon;
                    return (
                      <View
                        key={item.key}
                      >
                        <TouchableOpacity 
                          style={styles.modernNavItem} 
                          onPress={() => {
                            navigateToSection(item.key);
                            setSidebarOpen(false);
                          }}
                        >
                          <BlurView intensity={10} style={styles.navItemBlur}>
                            <LinearGradient
                              colors={[item.gradient[0], item.gradient[1]] as [string, string]}
                              style={styles.navIconContainer}
                            >
                              <IconComponent size={20} color="#ffffff" />
                            </LinearGradient>
                            
                            <View style={styles.navTextContainer}>
                              <Text style={styles.modernNavText}>{item.label}</Text>
                              <View style={styles.navIndicator} />
                            </View>
                            
                            <View style={styles.navArrow}>
                              <ArrowUp size={16} color="rgba(255,255,255,0.6)" style={{ transform: [{ rotate: '90deg' }] }} />
                            </View>
                          </BlurView>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>

                {/* Enhanced Sign Out */}
                <View 
                  style={styles.modernSignOutContainer}
                >
                  <TouchableOpacity 
                    style={styles.modernSignOutButton} 
                    onPress={handleSignOut}
                  >
                    <BlurView intensity={15} style={styles.signOutBlur}>
                      <LinearGradient
                        colors={['rgba(239, 68, 68, 0.2)', 'rgba(220, 38, 38, 0.3)']}
                        style={styles.signOutGradient}
                      >
                        <LinearGradient
                          colors={['#ef4444', '#dc2626']}
                          style={styles.signOutIconContainer}
                        >
                          <LogOut size={18} color="#ffffff" />
                        </LinearGradient>
                        <Text style={styles.modernSignOutText}>Sign Out</Text>
                      </LinearGradient>
                    </BlurView>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </BlurView>
          </View>
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
        showsVerticalScrollIndicator={false}
      >
        {/* Enhanced Header with Dynamic Greeting */}
        <View>
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
        </View>

      {/* Today's Performance - Modern Cards */}
      <View 
        style={styles.statsContainer}
      >
        <View style={styles.sectionHeader}>
          <Star size={20} color="#10b981" />
          <Text style={styles.sectionTitle}>Today's Performance</Text>
        </View>
        
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
        </View>
      </View>

      {/* Enhanced Business Overview Section */}
      {profile && (
        <View 
          style={styles.modernOverviewSection}
        >
          <BlurView intensity={15} style={styles.overviewBlur}>
            <View style={styles.modernSectionHeader}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.sectionIconContainer}
              >
                <Search size={20} color="#ffffff" />
              </LinearGradient>
              <Text style={styles.modernSectionTitle}>Business Overview</Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveIndicator} />
                <Text style={styles.liveText}>Live</Text>
              </View>
            </View>
            
            <View style={styles.modernStatsGrid}>
              <View style={styles.modernStatCard}>
                <LinearGradient colors={['#10b981', '#059669']} style={styles.statGradient}>
                  <Package size={20} color="#ffffff" />
                </LinearGradient>
                <Text style={styles.modernStatNumber}>{businessData.inventoryCount}</Text>
                <Text style={styles.modernStatLabel}>Total Stock</Text>
              </View>
              
              <View style={styles.modernStatCard}>
                <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.statGradient}>
                  <TriangleAlert size={20} color="#ffffff" />
                </LinearGradient>
                <Text style={styles.modernStatNumber}>{businessData.lowStockItems}</Text>
                <Text style={styles.modernStatLabel}>Low Stock</Text>
              </View>
              
              <View style={styles.modernStatCard}>
                <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.statGradient}>
                  <Users size={20} color="#ffffff" />
                </LinearGradient>
                <Text style={styles.modernStatNumber}>{businessData.unpaidDebts}</Text>
                <Text style={styles.modernStatLabel}>Pending Debts</Text>
              </View>
              
              <View style={styles.modernStatCard}>
                <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.statGradient}>
                  <DollarSign size={20} color="#ffffff" />
                </LinearGradient>
                <Text style={styles.modernStatNumber}>{formatCurrency(businessData.customerDebts)}</Text>
                <Text style={styles.modernStatLabel}>Amount Owed</Text>
              </View>
            </View>
          </BlurView>
        </View>
      )}

      {/* Enhanced Recent Activity Section */}
      <View 
        style={styles.modernRecentSection}
      >
        <BlurView intensity={15} style={styles.recentBlur}>
          <View style={styles.modernSectionHeader}>
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed']}
              style={styles.sectionIconContainer}
            >
              <Clock size={20} color="#ffffff" />
            </LinearGradient>
            <Text style={styles.modernSectionTitle}>Recent Activity</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveIndicator} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>
          
          {recentActivity.length === 0 ? (
            <View style={styles.modernEmptyState}>
              <Calendar size={32} color="#9ca3af" />
              <Text style={styles.modernEmptyText}>No recent activity</Text>
              <Text style={styles.modernEmptySubtext}>Start making transactions to see them here</Text>
            </View>
          ) : (
            <View style={styles.modernActivityList}>
              {recentActivity.slice(0, 4).map((activity, index) => (
                <View 
                  key={`${activity.id}-${activity.type}`}
                  style={styles.modernActivityCard}
                >
                  <LinearGradient
                    colors={activity.type === 'sale' ? ['#10b981', '#059669'] : ['#ef4444', '#dc2626']}
                    style={styles.activityIconGradient}
                  >
                    {activity.type === 'sale' ? 
                      <TrendingUp size={16} color="#ffffff" /> : 
                      <TrendingDown size={16} color="#ffffff" />
                    }
                  </LinearGradient>
                  
                  <View style={styles.modernActivityDetails}>
                    <Text style={styles.modernActivityTitle} numberOfLines={1}>
                      {activity.description || 'Transaction'}
                    </Text>
                    <Text style={styles.modernActivityTime}>
                      {new Date(activity.created_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                  
                  <Text style={[styles.modernActivityAmount, { 
                    color: activity.type === 'sale' ? '#10b981' : '#ef4444' 
                  }]}>
                    {activity.type === 'sale' ? '+' : '-'}{formatCurrency(activity.amount)}
                  </Text>
                </View>
              ))}
              
              {recentActivity.length > 4 && (
                <TouchableOpacity style={styles.viewMoreButton}>
                  <Text style={styles.viewMoreText}>View All Activity</Text>
                  <ArrowUp size={14} color="#667eea" style={{ transform: [{ rotate: '90deg' }] }} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </BlurView>
      </View>

      {/* Your Hustle Tools - Interactive Cards */}
      <View 
        style={styles.actionsContainer}
        onStartShouldSetResponder={() => true}
      >
        <View style={styles.sectionHeader}>
          <Zap size={20} color="#f59e0b" />
          <Text style={styles.sectionTitle}>
            {profile ? `Your Hustle Tools` : 'Business Tools'}
          </Text>
        </View>
        
        <View style={styles.actionsGrid}>
          {getCategorySpecificActions(profile?.business_type || 'other_hustle').map((action, index) => {
            const IconComponent = action.icon;
            return (
              <View 
                key={index}
              >
                <TouchableOpacity 
                  style={[styles.modernActionCard, { borderLeftColor: action.color }]}
                  onPress={() => handleCategoryAction(action.title)}
                  activeOpacity={0.8}
                >
                  <BlurView intensity={20} style={styles.actionBlur}>
                    <View style={styles.actionContent}>
                      <View style={[styles.actionIconContainer, { backgroundColor: `${action.color}20` }]}>
                        <IconComponent size={24} color={action.color} />
                      </View>
                      <View style={styles.actionText}>
                        <Text style={styles.actionTitle}>{action.title}</Text>
                        <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                      </View>
                      <ArrowUp size={16} color={action.color} style={{ transform: [{ rotate: '45deg' }] }} />
                    </View>
                  </BlurView>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
        
        {/* HustleAI Assistant - Premium Card */}
        <View>
          <TouchableOpacity 
            style={styles.aiAssistantCard}
            onPress={handleAIAssistant}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#6366f1', '#8b5cf6', '#a855f7']}
              style={styles.aiGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.aiAssistantContent}>
                <View style={styles.aiIconContainer}>
                  <MessageCircle size={32} color="#ffffff" />
                  <View style={styles.aiPulse} />
                </View>
                <View style={styles.aiAssistantText}>
                  <Text style={styles.aiAssistantTitle}>HustleAI Assistant</Text>
                  <Text style={styles.aiAssistantSubtitle}>
                    Get personalized insights for your {getHustleTypeTitle(profile?.business_type || 'business').toLowerCase()}
                  </Text>
                </View>
                <Star size={20} color="#ffffff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Full Recent Activity - Expandable Section */}
      {recentActivity.length > 3 && (
        <View 
          style={styles.fullRecentContainer}
        >
          <View style={styles.sectionHeader}>
            <Clock size={20} color="#8b5cf6" />
            <Text style={styles.sectionTitle}>All Recent Activity</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveIndicator} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          <View style={styles.activityList}>
            {recentActivity.slice(3).map((activity, index) => (
              <View 
                key={`${activity.id}-${activity.type}`}
                style={styles.activityCard}
              >
                <View style={[styles.activityIcon, { backgroundColor: activity.type === 'sale' ? '#10b98120' : '#ef444420' }]}>
                  {activity.type === 'sale' ? 
                    <TrendingUp size={16} color="#10b981" /> : 
                    <TrendingDown size={16} color="#ef4444" />
                  }
                </View>
                <View style={styles.activityDetails}>
                  <Text style={styles.activityTitle}>
                    {activity.type === 'sale' ? 'Sale' : 'Expense'}: {activity.description || 'Transaction'}
                  </Text>
                  <Text style={styles.activityTime}>
                    {new Date(activity.created_at).toLocaleTimeString()}
                  </Text>
                </View>
                <Text style={[styles.activityAmount, { color: activity.type === 'sale' ? '#10b981' : '#ef4444' }]}>
                  {activity.type === 'sale' ? '+' : '-'}{formatCurrency(activity.amount)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 12,
    flex: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  statsContainer: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    width: (width - 60) / 2,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
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
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginTop: 12,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 6,
    fontWeight: '500',
  },
  actionsContainer: {
    padding: 20,
  },
  actionsGrid: {
    marginBottom: 20,
  },
  modernActionCard: {
    borderRadius: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  actionBlur: {
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionText: {
    marginLeft: 16,
    flex: 1,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  aiAssistantCard: {
    borderRadius: 20,
    marginTop: 8,
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  aiGradient: {
    padding: 24,
  },
  aiIconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  aiPulse: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    opacity: 0.6,
  },
  aiAssistantContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiAssistantText: {
    marginLeft: 16,
    flex: 1,
  },
  aiAssistantTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  aiAssistantSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    lineHeight: 20,
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
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 16,
    borderRadius: 16,
    width: (width - 60) / 2,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  businessStatNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 10,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  businessStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '600',
  },
  recentContainer: {
    padding: 20,
  },
  emptyState: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 8,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  activityList: {
    marginTop: 8,
  },
  activityCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: '700',
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
  // Compact Layout Styles
  compactRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  compactBusinessData: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  compactRecentActivity: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  compactSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  compactSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 8,
    flex: 1,
  },
  compactLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b98120',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  compactStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  compactStatCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(248,250,252,0.8)',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
  },
  compactStatNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1f2937',
    marginTop: 4,
    marginBottom: 2,
  },
  compactStatLabel: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '600',
  },
  compactEmptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  compactEmptyText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  compactActivityList: {
    gap: 8,
  },
  compactActivityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248,250,252,0.8)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
  },
  compactActivityIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  compactActivityDetails: {
    flex: 1,
  },
  compactActivityTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  compactActivityAmount: {
    fontSize: 10,
    fontWeight: '700',
  },
  fullRecentContainer: {
    marginTop: 20,
    padding: 20,
  },
  modernOverviewSection: {
    marginBottom: 20,
  },
  overviewBlur: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 20,
  },
  modernSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modernSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  modernStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  modernStatCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    width: (width - 80) / 2,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  statGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modernStatNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  modernStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  modernRecentSection: {
    marginBottom: 20,
  },
  recentBlur: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 20,
  },
  modernEmptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  modernEmptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
  },
  modernEmptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  modernActivityList: {
    gap: 12,
  },
  modernActivityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  activityIconGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modernActivityDetails: {
    flex: 1,
  },
  modernActivityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  modernActivityTime: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  modernActivityAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
    marginRight: 4,
  },
  // Modern Sidebar Styles
  modernOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
    flexDirection: 'row',
  },
  overlayTouchable: {
    flex: 1,
  },
  modernSidebar: {
    width: width * 0.85,
    height: '100%',
    maxWidth: 350,
  },
  sidebarBlur: {
    flex: 1,
  },
  modernSidebarGradient: {
    flex: 1,
    paddingTop: 50,
  },
  modernSidebarHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
  },
  modernCloseButton: {
    position: 'absolute',
    top: 24,
    right: 24,
    zIndex: 10,
  },
  closeButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernSidebarProfile: {
    alignItems: 'center',
    marginTop: 20,
  },
  modernProfileAvatar: {
    marginBottom: 16,
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modernSidebarName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  businessBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  modernSidebarBusiness: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  modernSidebarNav: {
    flex: 1,
    paddingTop: 32,
    paddingHorizontal: 16,
  },
  modernNavItem: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  navItemBlur: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  navIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  navTextContainer: {
    flex: 1,
  },
  modernNavText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  navIndicator: {
    width: 20,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
  },
  navArrow: {
    marginLeft: 8,
  },
  modernSignOutContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  modernSignOutButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  signOutBlur: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  signOutGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modernSignOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});