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
  Lightbulb,
  Heart,
  Coins,
  Settings,
  Globe,
  HelpCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/services/supabase';
import { syncService } from '@/services/syncService';
import { getOfflineTransactions } from '@/services/offlineStorage';
import { BusinessProfile, Transaction } from '@/types/business';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

// Daily Hustle Tips - X-inspired business insights
const DAILY_HUSTLE_TIPS = {
  sw: [
    "Mitumba tip: Nunua kutoka Gikomba kwa faida ya 100%! 💰",
    "Mboga hack: Nunua jumla saa 5 asubuhi kwa stock fresh! 🥬",
    "Deni wisdom: Andika madeni mara moja - akili husahau! 📝",
    "Tayari kwa umeme: Weka rekodi offline kila siku ⚡",
    "Uaminifu wa wateja: Salimia kila mtu kwa lugha yao 🤝",
    "Mkakati wa bei: Angalia bei za washindani kila asubuhi 📊",
    "Kupunguza hasara: Uza vyakula vinavyoharibika kwanza 🌱",
    "Mtiririko wa pesa: Hesabu mara mbili, amini mara moja 💵",
  ],
  en: [
    "Mitumba tip: Source from Gikomba for 100% markup! 💰",
    "Mboga hack: Buy wholesale at 5AM for freshest stock 🥬",
    "Deni wisdom: Always record debts immediately - memory fades! 📝",
    "Power outage prep: Keep offline records updated daily ⚡",
    "Customer loyalty: Greet everyone in their local language 🤝",
    "Pricing strategy: Check competitor prices every morning 📊",
    "Waste reduction: Sell perishables first, dry goods last 🌱",
    "Cash flow: Count money twice, trust once 💵",
  ]
};

// Translation object for UI text
const translations = {
  sw: {
    greeting: {
      morning: "Habari za asubuhi",
      afternoon: "Habari za mchana", 
      evening: "Habari za jioni",
      night: "Habari za usiku"
    },
    messages: {
      mama_mboga: {
        morning: "Leo mboga yako inaweza kuwa na faida kubwa!",
        afternoon: "Je, mboga zako zinauza vizuri leo?",
        evening: "Wakati wa kuhesabu faida ya leo!",
        night: "Unapanga biashara ya kesho?"
      },
      boda_boda: {
        morning: "Safari njema leo - customers wanakungoja!",
        afternoon: "Je, safari zinakwenda vizuri leo?",
        evening: "Wakati wa kuhesabu faida ya leo!",
        night: "Unapanga safari za kesho?"
      },
      default: {
        morning: "Biashara yako itafanikiwa leo!",
        afternoon: "Biashara inaendeleaje leo?",
        evening: "Wakati wa kuhesabu faida ya leo!",
        night: "Unapanga biashara ya kesho?"
      }
    },
    status: {
      online: "Mtandaoni",
      offline: "Nje ya mtandao"
    },
    sections: {
      performance: "Utendaji wa Leo",
      quickActions: "Vitendo vya Haraka",
      tipOfDay: "Tip ya Leo"
    },
    stats: {
      income: "Mapato",
      expenses: "Matumizi", 
      netProfit: "Faida Halisi",
      debtCollected: "Deni Lililokusanywa",
      wasteAvoided: "Hasara Iliyoepukwa"
    },
    actions: {
      recordSale: "Rekodi Mauzo",
      recordSaleDesc: "Andika mauzo ya leo",
      addExpense: "Ongeza Gharama",
      addExpenseDesc: "Fuatilia matumizi yako",
      manageStock: "Duka la Mizigo", 
      manageStockDesc: "Simamia stock yako",
      customersDebts: "Wateja & Madeni",
      customersDebtsDesc: "Fuatilia madeni ya wateja",
      aiAssistant: "HustleAI Msaidizi",
      aiAssistantDesc: "Pata maarifa ya kibinafsi kwa biashara yako"
    },
    activity: {
      sale: "Mauzo",
      expense: "Gharama",
      transaction: "Muamala"
    },
    alerts: {
      signOut: "Ondoka",
      signOutConfirm: "Una uhakika unataka kuondoka?",
      no: "Hapana",
      yes: "Ndio",
      error: "Hitilafu",
      signOutError: "Imeshindwa kuondoka. Jaribu tena.",
      aiComing: "Maarifa ya biashara yanakuja hivi karibuni! 🤖"
    }
  },
  en: {
    greeting: {
      morning: "Good morning",
      afternoon: "Good afternoon",
      evening: "Good evening", 
      night: "Good night"
    },
    messages: {
      mama_mboga: {
        morning: "Today your vegetables can bring great profit!",
        afternoon: "How are your vegetables selling today?",
        evening: "Time to count today's profits!",
        night: "Planning tomorrow's business?"
      },
      boda_boda: {
        morning: "Safe travels today - customers are waiting!",
        afternoon: "How are the rides going today?",
        evening: "Time to count today's profits!",
        night: "Planning tomorrow's routes?"
      },
      default: {
        morning: "Your business will succeed today!",
        afternoon: "How is business going today?",
        evening: "Time to count today's profits!",
        night: "Planning tomorrow's business?"
      }
    },
    status: {
      online: "Online",
      offline: "Offline"
    },
    sections: {
      performance: "Today's Performance",
      quickActions: "Quick Actions",
      tipOfDay: "Tip of the Day"
    },
    stats: {
      income: "Income",
      expenses: "Expenses",
      netProfit: "Net Profit", 
      debtCollected: "Debt Collected",
      wasteAvoided: "Waste Avoided"
    },
    actions: {
      recordSale: "Record Sale",
      recordSaleDesc: "Log today's sales",
      addExpense: "Add Expense", 
      addExpenseDesc: "Track your expenses",
      manageStock: "Manage Stock",
      manageStockDesc: "Monitor your inventory",
      customersDebts: "Customers & Debts",
      customersDebtsDesc: "Track customer debts",
      aiAssistant: "HustleAI Assistant",
      aiAssistantDesc: "Get personalized business insights"
    },
    activity: {
      sale: "Sale",
      expense: "Expense",
      transaction: "Transaction"
    },
    alerts: {
      signOut: "Sign Out",
      signOutConfirm: "Are you sure you want to sign out?",
      no: "Cancel",
      yes: "Sign Out", 
      error: "Error",
      signOutError: "Failed to sign out. Please try again.",
      aiComing: "AI-powered business insights coming soon! 🤖"
    }
  }
};

export default function DashboardScreen() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isOnline, setIsOnline] = useState(syncService.isConnected());
  const [showProfile, setShowProfile] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [language, setLanguage] = useState<'en' | 'sw'>('sw'); // Default to Swahili
  const [todayStats, setTodayStats] = useState({
    income: 0,
    expenses: 0,
    net: 0,
    goalProgress: 0,
    deniCollected: 0,
    wasteAvoided: 0,
  });
  const [businessHealth, setBusinessHealth] = useState({
    inventoryCount: 0,
    lowStockItems: 0,
    unpaidDebts: 0,
    totalCustomers: 0,
    customerDebts: 0,
    spoilageRisk: 0,
  });
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [communityDeals, setCommunityDeals] = useState<any[]>([]);
  const [showBusinessHealth, setShowBusinessHealth] = useState(false);
  const [showQuickSale, setShowQuickSale] = useState(false);

  useEffect(() => {
    loadDashboardData();
    
    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Rotate tips every 10 seconds
    const tipInterval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % DAILY_HUSTLE_TIPS[language].length);
    }, 10000);

    // Set up real-time subscriptions
    const subscriptions = setupRealtimeSubscriptions();

    return () => {
      clearInterval(timeInterval);
      clearInterval(tipInterval);
      subscriptions.forEach(sub => sub?.unsubscribe?.());
    };
  }, [language]);

  const setupRealtimeSubscriptions = () => {
    const subscriptions: any[] = [];
    
    try {
      if ('channel' in supabase && typeof supabase.channel === 'function') {
        const salesSubscription = supabase
          .channel('sales_realtime')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'sales_records' },
            () => loadDashboardData()
          )
          .subscribe();
        
        const expensesSubscription = supabase
          .channel('expenses_realtime')
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'expenses' },
            () => loadDashboardData()
          )
          .subscribe();
        
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth');
        return;
      }

      // Load business profile
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('user_id', user.id) as any;
        
        if (profileError) {
          console.error('Error loading profile:', profileError);
        }
        
        if (!profileData || profileData.length === 0) {
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
            const { data: createdProfile } = await supabase
              .from('business_profiles')
              .select('*')
              .eq('user_id', user.id)
              .single() as any;
            
            if (createdProfile) {
              setProfile(createdProfile);
            }
          }
        } else {
          setProfile(profileData[0]);
        }
      } catch (error) {
        console.log('Error with profile operations:', error);
      }
      
      // Load today's enhanced stats
      const today = new Date().toISOString().split('T')[0];
      let salesData: any[] = [];
      let expensesData: any[] = [];
      let debtPayments: any[] = [];
      
      try {
        const { data: salesResponse } = await supabase
          .from('sales_records')
          .select('amount')
          .eq('user_id', user.id)
          .eq('date', today) as any;
        
        salesData = salesResponse || [];
          
        const { data: expensesResponse } = await supabase
          .from('expenses')
          .select('amount')
          .eq('user_id', user.id)
          .eq('date', today) as any;
        
        expensesData = expensesResponse || [];

        // Load debt payments for today
        const { data: debtResponse } = await supabase
          .from('customer_debts')
          .select('amount_owed')
          .eq('user_id', user.id)
          .eq('is_paid', true)
          .gte('updated_at', today) as any;
        
        debtPayments = debtResponse || [];
      } catch (error) {
        console.log('Error loading sales/expenses data:', error);
      }
          
      // Calculate enhanced stats
      const income = salesData?.reduce((sum: number, sale: any) => sum + parseFloat(sale.amount?.toString() || '0'), 0) || 0;
      const expenses = expensesData?.reduce((sum: number, expense: any) => sum + parseFloat(expense.amount?.toString() || '0'), 0) || 0;
      const net = income - expenses;
      const goalProgress = profile?.daily_goal > 0 
        ? Math.min((income / profile.daily_goal) * 100, 100)
        : 0;
      const deniCollected = debtPayments?.reduce((sum: number, debt: any) => sum + parseFloat(debt.amount_owed?.toString() || '0'), 0) || 0;
      const wasteAvoided = Math.floor(Math.random() * 500); // Placeholder - would be calculated from waste_logs
      
      setTodayStats({
        income,
        expenses,
        net,
        goalProgress,
        deniCollected,
        wasteAvoided,
      });
      
      await loadBusinessHealth(user.id);
      await loadAIInsights(user.id);
      await loadCommunityDeals();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    await loadDashboardData(true);
  }, []);


  const loadBusinessHealth = async (userId: string) => {
    try {
      let inventoryData: any[] = [];
      let debtsData: any[] = [];
      let customersData: any[] = [];
      
      try {
        const { data: inventoryResponse } = await supabase
          .from('inventory_items')
          .select('quantity, reorder_level, name, category')
          .eq('user_id', userId) as any;
        
        inventoryData = inventoryResponse || [];
          
        const { data: debtsResponse } = await supabase
          .from('customer_debts')
          .select('amount_owed, is_paid, customer_name')
          .eq('user_id', userId) as any;
        
        debtsData = debtsResponse || [];
          
        const { data: customersResponse } = await supabase
          .from('customer_debts')
          .select('customer_name')
          .eq('user_id', userId) as any;
        
        customersData = customersResponse || [];
      } catch (error) {
        console.log('Error loading business health data:', error);
      }
        
      const inventoryCount = inventoryData?.length || 0;
      const lowStockItems = inventoryData?.filter((item: any) => 
        item.quantity <= (item.reorder_level || 5)
      ).length || 0;
      const unpaidDebts = debtsData?.filter((debt: any) => !debt.is_paid).length || 0;
      const customerDebts = debtsData?.filter((debt: any) => !debt.is_paid)
        .reduce((sum: number, debt: any) => sum + parseFloat(debt.amount_owed?.toString() || '0'), 0) || 0;
      const totalCustomers = new Set(customersData?.map((c: any) => c.customer_name) || []).size;
      
      // Calculate spoilage risk for perishables
      const perishableItems = inventoryData?.filter((item: any) => 
        item.category && ['vegetables', 'fruits', 'dairy'].includes(item.category.toLowerCase())
      ).length || 0;
      const spoilageRisk = Math.min((perishableItems / Math.max(inventoryCount, 1)) * 100, 100);
        
      setBusinessHealth({
        inventoryCount,
        lowStockItems,
        unpaidDebts,
        totalCustomers,
        customerDebts,
        spoilageRisk,
      });
    } catch (error) {
      console.error('Error loading business health:', error);
    }
  };

  const loadAIInsights = async (userId: string) => {
    try {
      const insights: string[] = [];
      const businessType = profile?.business_type || 'other_hustle';
      
      // Rule-based AI insights based on data patterns
      if (todayStats.income > 0 && todayStats.expenses > todayStats.income) {
        insights.push(language === 'sw' ? 
          "⚠️ Matumizi yamezidi mapato leo - angalia gharama zako!" :
          "⚠️ Expenses exceed income today - review your costs!"
        );
      }
      
      if (businessHealth.lowStockItems > 0) {
        insights.push(language === 'sw' ? 
          `📦 Bidhaa ${businessHealth.lowStockItems} zimepungua - ongeza stock!` :
          `📦 ${businessHealth.lowStockItems} items running low - restock soon!`
        );
      }
      
      if (businessHealth.unpaidDebts > 5) {
        insights.push(language === 'sw' ? 
          "💰 Madeni mengi hayajalipwa - wasiliana na wateja!" :
          "💰 Many unpaid debts - follow up with customers!"
        );
      }
      
      // Business-specific insights
      if (businessType === 'mama_mboga' && businessHealth.spoilageRisk > 30) {
        insights.push(language === 'sw' ? 
          "🥬 Hatari ya kuharibika - uza mboga za haraka kwanza!" :
          "🥬 Spoilage risk high - sell perishables first!"
        );
      }
      
      // Add motivational insight if doing well
      if (todayStats.net > 0 && insights.length === 0) {
        insights.push(language === 'sw' ? 
          "🎉 Hongera! Leo umepata faida nzuri - endelea hivyo!" :
          "🎉 Great job! You're profitable today - keep it up!"
        );
      }
      
      setAiInsights(insights.slice(0, 3)); // Limit to 3 insights
    } catch (error) {
      console.error('Error loading AI insights:', error);
    }
  };

  const loadCommunityDeals = async () => {
    try {
      // Mock community deals - in real app, this would query community_posts table
      const mockDeals = [
        {
          id: 1,
          title: language === 'sw' ? "Kundi la Wholesale - Mahindi" : "Wholesale Group - Maize",
          description: language === 'sw' ? "Jiunge na kundi la ununuzi wa mahindi" : "Join maize buying group",
          members: 12,
          savings: "20%",
          type: "wholesale"
        },
        {
          id: 2,
          title: language === 'sw' ? "Mtumba Deals - Gikomba" : "Mtumba Deals - Gikomba",
          description: language === 'sw' ? "Mauzo ya haraka - nguo za mtumba" : "Quick deals - second-hand clothes",
          members: 8,
          savings: "15%",
          type: "deals"
        },
        {
          id: 3,
          title: language === 'sw' ? "Kundi la M-Pesa - Akiba" : "M-Pesa Group - Savings",
          description: language === 'sw' ? "Akiba ya kijamii kwa biashara" : "Community savings for business",
          members: 25,
          savings: "5% interest",
          type: "savings"
        }
      ];
      
      setCommunityDeals(mockDeals);
    } catch (error) {
      console.error('Error loading community deals:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  // Enhanced multilingual greetings with business context
  const getGreeting = () => {
    const hour = currentTime.getHours();
    const name = profile?.full_name?.split(' ')[0] || (language === 'sw' ? 'Mfanyabiashara' : 'Hustler');
    const businessType = profile?.business_type || 'other_hustle';
    const t = translations[language];
    
    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    let gradient: [string, string] = ['#f59e0b', '#f97316'];
    let emoji = '';
    
    if (hour >= 5 && hour < 12) {
      timeOfDay = 'morning';
      gradient = ['#f59e0b', '#f97316'];
      emoji = '☀️';
    } else if (hour >= 12 && hour < 17) {
      timeOfDay = 'afternoon';
      gradient = ['#10b981', '#059669'];
      emoji = '🌤️';
    } else if (hour >= 17 && hour < 21) {
      timeOfDay = 'evening';
      gradient = ['#f59e0b', '#dc2626'];
      emoji = '🌅';
    } else {
      timeOfDay = 'night';
      gradient = ['#6366f1', '#8b5cf6'];
      emoji = '🌙';
    }
    
    const greeting = `${t.greeting[timeOfDay]}, ${name}! ${emoji}`;
    
    let message = '';
    if (businessType === 'mama_mboga') {
      message = t.messages.mama_mboga[timeOfDay];
    } else if (businessType === 'boda_boda') {
      message = t.messages.boda_boda[timeOfDay];
    } else {
      message = t.messages.default[timeOfDay];
    }
    
    return {
      greeting,
      message,
      icon: Clock,
      gradient
    };
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'sw' ? 'en' : 'sw');
    setCurrentTipIndex(0); // Reset tip index when language changes
  };

  const handleSignOut = async () => {
    const t = translations[language];
    Alert.alert(
      t.alerts.signOut,
      t.alerts.signOutConfirm,
      [
        { text: t.alerts.no, style: 'cancel' },
        {
          text: t.alerts.yes,
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              router.replace('/auth');
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert(t.alerts.error, t.alerts.signOutError);
            }
          }
        }
      ]
    );
  };

  const handleAIAssistant = () => {
    const t = translations[language];
    Alert.alert(t.actions.aiAssistant, t.alerts.aiComing);
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;
  const t = translations[language];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
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
        {/* Enhanced Header with Multilingual Greeting & Daily Tips */}
        <LinearGradient
          colors={greeting.gradient}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => setShowProfile(true)}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.profileButtonGradient}
              >
                <User size={20} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>
            
            <View style={styles.headerRight}>
              {/* Language Switcher */}
              <TouchableOpacity 
                style={styles.languageToggle}
                onPress={toggleLanguage}
              >
                <Text style={styles.languageText}>{language.toUpperCase()}</Text>
              </TouchableOpacity>
              
              <View style={[styles.statusIndicator, { backgroundColor: isOnline ? 'rgba(255,255,255,0.2)' : 'rgba(239,68,68,0.8)' }]}>
                {isOnline ? <Wifi size={16} color="#ffffff" /> : <WifiOff size={16} color="#ffffff" />}
                <Text style={styles.statusText}>{isOnline ? t.status.online : t.status.offline}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.greetingContainer}>
            <GreetingIcon size={32} color="#ffffff" />
            <View style={styles.greetingText}>
              <Text style={styles.dynamicGreeting}>{greeting.greeting}</Text>
              <Text style={styles.greetingMessage}>{greeting.message}</Text>
            </View>
          </View>
          
          {/* Daily Hustle Tip Carousel */}
          <View style={styles.tipContainer}>
            <View style={styles.tipHeader}>
              <Lightbulb size={16} color="#ffffff" />
              <Text style={styles.tipHeaderText}>{t.sections.tipOfDay}</Text>
            </View>
            <Text style={styles.tipText}>{DAILY_HUSTLE_TIPS[language][currentTipIndex]}</Text>
          </View>
          
          {profile && (
            <View style={styles.businessInfo}>
              <Text style={styles.businessTitle}>
                {profile.business_type === 'mama_mboga' ? 'Mama Mboga' : 
                 profile.business_type === 'boda_boda' ? 'Boda Boda' : 'Biashara'}
              </Text>
              <Text style={styles.location}>📍 {profile.location}</Text>
            </View>
          )}
        </LinearGradient>

        {/* Modern Today's Performance Section */}
        <View style={styles.performanceContainer}>
          <View style={styles.performanceHeader}>
            <View style={styles.performanceHeaderLeft}>
              <View style={styles.performanceIconContainer}>
                <Star size={18} color="#ffffff" />
              </View>
              <View>
                <Text style={styles.performanceTitle}>{t.sections.performance}</Text>
                <Text style={styles.performanceSubtitle}>
                  {new Date().toLocaleDateString('sw-KE', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </Text>
              </View>
            </View>
            <View style={[
              styles.netProfitBadge, 
              { backgroundColor: todayStats.net >= 0 ? '#10b98120' : '#ef444420' }
            ]}>
              <Text style={styles.netProfitLabel}>
                {language === 'sw' ? 'Faida' : 'Net'}
              </Text>
              <Text style={[
                styles.netProfitAmount,
                { color: todayStats.net >= 0 ? '#10b981' : '#ef4444' }
              ]}>
                {formatCurrency(todayStats.net)}
              </Text>
            </View>
          </View>

          {/* Main Stats Row */}
          <View style={styles.mainStatsRow}>
            <View style={styles.primaryStatCard}>
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={styles.primaryStatGradient}
              >
                <View style={styles.primaryStatHeader}>
                  <TrendingUp size={20} color="#ffffff" />
                  <Text style={styles.primaryStatLabel}>{t.stats.income}</Text>
                </View>
                <Text style={styles.primaryStatAmount}>
                  {formatCurrency(todayStats.income)}
                </Text>
                <View style={styles.primaryStatFooter}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${Math.min(todayStats.goalProgress, 100)}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {Math.round(todayStats.goalProgress)}% {language === 'sw' ? 'ya lengo' : 'of goal'}
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.primaryStatCard}>
              <LinearGradient
                colors={['#ef4444', '#dc2626']}
                style={styles.primaryStatGradient}
              >
                <View style={styles.primaryStatHeader}>
                  <TrendingDown size={20} color="#ffffff" />
                  <Text style={styles.primaryStatLabel}>{t.stats.expenses}</Text>
                </View>
                <Text style={styles.primaryStatAmount}>
                  {formatCurrency(todayStats.expenses)}
                </Text>
                <View style={styles.primaryStatFooter}>
                  <Text style={styles.expenseRatio}>
                    {todayStats.income > 0 ? 
                      `${Math.round((todayStats.expenses / todayStats.income) * 100)}%` : 
                      '0%'
                    } {language === 'sw' ? 'ya mapato' : 'of income'}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          {/* Secondary Stats Row */}
          <View style={styles.secondaryStatsRow}>
            <View style={styles.secondaryStatCard}>
              <View style={[styles.secondaryStatIcon, { backgroundColor: '#8b5cf620' }]}>
                <Coins size={16} color="#8b5cf6" />
              </View>
              <View style={styles.secondaryStatContent}>
                <Text style={styles.secondaryStatAmount}>
                  {formatCurrency(todayStats.deniCollected)}
                </Text>
                <Text style={styles.secondaryStatLabel}>{t.stats.debtCollected}</Text>
              </View>
            </View>

            <View style={styles.secondaryStatCard}>
              <View style={[styles.secondaryStatIcon, { backgroundColor: '#10b98120' }]}>
                <Heart size={16} color="#10b981" />
              </View>
              <View style={styles.secondaryStatContent}>
                <Text style={styles.secondaryStatAmount}>
                  {formatCurrency(todayStats.wasteAvoided)}
                </Text>
                <Text style={styles.secondaryStatLabel}>{t.stats.wasteAvoided}</Text>
              </View>
            </View>

            {profile?.business_type === 'mama_mboga' && businessHealth.spoilageRisk > 0 && (
              <View style={styles.secondaryStatCard}>
                <View style={[styles.secondaryStatIcon, { backgroundColor: '#f59e0b20' }]}>
                  <TriangleAlert size={16} color="#f59e0b" />
                </View>
                <View style={styles.secondaryStatContent}>
                  <Text style={styles.secondaryStatAmount}>
                    {Math.round(businessHealth.spoilageRisk)}%
                  </Text>
                  <Text style={styles.secondaryStatLabel}>
                    {language === 'sw' ? 'Hatari Kuharibika' : 'Spoilage Risk'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* AI Assistant Card - Standalone */}
        <View style={styles.aiContainer}>
          <TouchableOpacity 
            style={styles.aiAssistantCard}
            onPress={handleAIAssistant}
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
                  <Text style={styles.aiAssistantTitle}>{t.actions.aiAssistant}</Text>
                  <Text style={styles.aiAssistantSubtitle}>
                    {t.actions.aiAssistantDesc}
                  </Text>
                </View>
                <Star size={20} color="#ffffff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* AI-Powered Insights Section */}
        {aiInsights.length > 0 && (
          <View style={styles.insightsContainer}>
            <View style={styles.sectionHeader}>
              <Lightbulb size={20} color="#f59e0b" />
              <Text style={styles.sectionTitle}>
                {language === 'sw' ? 'Maarifa ya AI' : 'AI Insights'}
              </Text>
            </View>
            
            <View style={styles.insightsGrid}>
              {aiInsights.map((insight, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.insightCard}
                  onPress={() => router.push('/insights' as any)}
                >
                  <Text style={styles.insightText}>{insight}</Text>
                  <ArrowUp size={16} color="#f59e0b" style={{ transform: [{ rotate: '45deg' }] }} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Community Marketplace Section */}
        <View style={styles.communityContainer}>
          <View style={styles.sectionHeader}>
            <Users size={20} color="#8b5cf6" />
            <Text style={styles.sectionTitle}>
              {language === 'sw' ? 'Jamii ya Wafanyabiashara' : 'Hustler Network'}
            </Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveIndicator} />
              <Text style={styles.liveText}>
                {communityDeals.length} {language === 'sw' ? 'deals' : 'deals'}
              </Text>
            </View>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dealsScroll}>
            {communityDeals.map((deal) => (
              <TouchableOpacity 
                key={deal.id}
                style={styles.dealCard}
                onPress={() => router.push('/community' as any)}
              >
                <View style={styles.dealHeader}>
                  <Text style={styles.dealTitle}>{deal.title}</Text>
                  <Text style={styles.dealSavings}>{deal.savings}</Text>
                </View>
                <Text style={styles.dealDescription}>{deal.description}</Text>
                <View style={styles.dealFooter}>
                  <Text style={styles.dealMembers}>
                    👥 {deal.members} {language === 'sw' ? 'wanachama' : 'members'}
                  </Text>
                  <ArrowUp size={14} color="#8b5cf6" style={{ transform: [{ rotate: '45deg' }] }} />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Business Health Section (Collapsible) */}
        <View style={styles.businessHealthContainer}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => setShowBusinessHealth(!showBusinessHealth)}
          >
            <Heart size={20} color="#10b981" />
            <Text style={styles.sectionTitle}>
              {language === 'sw' ? 'Afya ya Biashara' : 'Business Health'}
            </Text>
            <ArrowUp 
              size={16} 
              color="#10b981" 
              style={{ 
                transform: [{ rotate: showBusinessHealth ? '180deg' : '0deg' }] 
              }} 
            />
          </TouchableOpacity>
          
          {showBusinessHealth && (
            <View style={styles.healthGrid}>
              <View style={styles.healthCard}>
                <Package size={24} color="#10b981" />
                <Text style={styles.healthNumber}>{businessHealth.inventoryCount}</Text>
                <Text style={styles.healthLabel}>
                  {language === 'sw' ? 'Bidhaa' : 'Items'}
                </Text>
              </View>
              
              <View style={styles.healthCard}>
                <TriangleAlert size={24} color="#f59e0b" />
                <Text style={styles.healthNumber}>{businessHealth.lowStockItems}</Text>
                <Text style={styles.healthLabel}>
                  {language === 'sw' ? 'Stock Chini' : 'Low Stock'}
                </Text>
              </View>
              
              <View style={styles.healthCard}>
                <Users size={24} color="#3b82f6" />
                <Text style={styles.healthNumber}>{businessHealth.totalCustomers}</Text>
                <Text style={styles.healthLabel}>
                  {language === 'sw' ? 'Wateja' : 'Customers'}
                </Text>
              </View>
              
              <View style={styles.healthCard}>
                <Coins size={24} color="#ef4444" />
                <Text style={styles.healthNumber}>{businessHealth.unpaidDebts}</Text>
                <Text style={styles.healthLabel}>
                  {language === 'sw' ? 'Madeni' : 'Unpaid'}
                </Text>
              </View>
              
              {profile?.business_type === 'mama_mboga' && (
                <View style={styles.healthCard}>
                  <Heart size={24} color="#10b981" />
                  <Text style={styles.healthNumber}>{Math.round(businessHealth.spoilageRisk)}%</Text>
                  <Text style={styles.healthLabel}>
                    {language === 'sw' ? 'Hatari Kuharibika' : 'Spoilage Risk'}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* M-Pesa Integration Section */}
        <View style={styles.mpesaContainer}>
          <View style={styles.sectionHeader}>
            <DollarSign size={20} color="#00a86b" />
            <Text style={styles.sectionTitle}>
              {language === 'sw' ? 'Fedha & M-Pesa' : 'Finance & M-Pesa'}
            </Text>
          </View>
          
          <View style={styles.mpesaGrid}>
            <TouchableOpacity 
              style={styles.mpesaCard}
              onPress={() => router.push('/finance' as any)}
            >
              <View style={styles.mpesaIcon}>
                <DollarSign size={24} color="#00a86b" />
              </View>
              <Text style={styles.mpesaTitle}>
                {language === 'sw' ? 'M-Pesa Malipo' : 'M-Pesa Payments'}
              </Text>
              <Text style={styles.mpesaSubtitle}>
                {language === 'sw' ? 'Pokea na tuma pesa' : 'Send & receive money'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.mpesaCard}
              onPress={() => router.push('/loans' as any)}
            >
              <View style={styles.mpesaIcon}>
                <Coins size={24} color="#3b82f6" />
              </View>
              <Text style={styles.mpesaTitle}>
                {language === 'sw' ? 'Mikopo' : 'Loans'}
              </Text>
              <Text style={styles.mpesaSubtitle}>
                {language === 'sw' ? 'Omba mkopo wa biashara' : 'Apply for business loans'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.mpesaCard}
              onPress={() => router.push('/savings' as any)}
            >
              <View style={styles.mpesaIcon}>
                <Target size={24} color="#8b5cf6" />
              </View>
              <Text style={styles.mpesaTitle}>
                {language === 'sw' ? 'Akiba' : 'Savings'}
              </Text>
              <Text style={styles.mpesaSubtitle}>
                {language === 'sw' ? 'Weka akiba ya biashara' : 'Save for business goals'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
      
      {/* Floating Quick Actions Button */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => setShowQuickSale(true)}
      >
        <LinearGradient
          colors={['#10b981', '#059669']}
          style={styles.floatingGradient}
        >
          <Plus size={24} color="#ffffff" />
        </LinearGradient>
      </TouchableOpacity>
      
      {/* Quick Actions Modal */}
      {showQuickSale && (
        <View style={styles.quickActionsOverlay}>
          <TouchableOpacity 
            style={styles.quickActionsBackdrop}
            onPress={() => setShowQuickSale(false)}
          />
          <View style={styles.quickActionsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {language === 'sw' ? 'Vitendo vya Haraka' : 'Quick Actions'}
              </Text>
              <TouchableOpacity 
                style={styles.modalClose}
                onPress={() => setShowQuickSale(false)}
              >
                <X size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              {/* Transactions (Combined Sales & Expenses) */}
              <TouchableOpacity 
                style={[styles.quickActionCard, { borderColor: '#3b82f6' }]}
                onPress={() => {
                  setShowQuickSale(false);
                  router.push('/(tabs)/transactions' as any);
                }}
              >
                <LinearGradient
                  colors={['#3b82f6', '#2563eb']}
                  style={styles.quickActionGradient}
                >
                  <DollarSign size={28} color="#ffffff" />
                </LinearGradient>
                <View style={styles.quickActionText}>
                  <Text style={styles.quickActionTitle}>
                    {language === 'sw' ? 'Miamala' : 'Transactions'}
                  </Text>
                  <Text style={styles.quickActionDesc}>
                    {language === 'sw' ? 'Rekodi mauzo na gharama' : 'Record sales & expenses'}
                  </Text>
                </View>
                <ArrowUp size={16} color="#3b82f6" style={{ transform: [{ rotate: '45deg' }] }} />
              </TouchableOpacity>
              
              {/* Manage Stock */}
              <TouchableOpacity 
                style={[styles.quickActionCard, { borderColor: '#10b981' }]}
                onPress={() => {
                  setShowQuickSale(false);
                  router.push('/(tabs)/stock' as any);
                }}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={styles.quickActionGradient}
                >
                  <Package size={28} color="#ffffff" />
                </LinearGradient>
                <View style={styles.quickActionText}>
                  <Text style={styles.quickActionTitle}>{t.actions.manageStock}</Text>
                  <Text style={styles.quickActionDesc}>{t.actions.manageStockDesc}</Text>
                </View>
                <ArrowUp size={16} color="#10b981" style={{ transform: [{ rotate: '45deg' }] }} />
              </TouchableOpacity>
              
              {/* Customers & Debts */}
              <TouchableOpacity 
                style={[styles.quickActionCard, { borderColor: '#8b5cf6' }]}
                onPress={() => {
                  setShowQuickSale(false);
                  router.push('/(tabs)/customers' as any);
                }}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#7c3aed']}
                  style={styles.quickActionGradient}
                >
                  <Users size={28} color="#ffffff" />
                </LinearGradient>
                <View style={styles.quickActionText}>
                  <Text style={styles.quickActionTitle}>{t.actions.customersDebts}</Text>
                  <Text style={styles.quickActionDesc}>{t.actions.customersDebtsDesc}</Text>
                </View>
                <ArrowUp size={16} color="#8b5cf6" style={{ transform: [{ rotate: '45deg' }] }} />
              </TouchableOpacity>
            </View>

          </View>
        </View>
      )}
      
      {/* Profile & Settings Modal */}
      {showProfile && (
        <View style={styles.profileOverlay}>
          <TouchableOpacity 
            style={styles.profileBackdrop}
            onPress={() => setShowProfile(false)}
          />
          <View style={styles.profileModal}>
            <LinearGradient
              colors={['#ffffff', '#f8fafc']}
              style={styles.profileModalGradient}
            >
              {/* Modal Header */}
              <View style={styles.profileModalHeader}>
                <View style={styles.profileModalTitle}>
                  <Text style={styles.profileModalTitleText}>
                    {language === 'sw' ? 'Wasifu & Mipangilio' : 'Profile & Settings'}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.profileModalClose}
                  onPress={() => setShowProfile(false)}
                >
                  <X size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {/* Profile Info */}
              <View style={styles.profileInfo}>
                <View style={styles.profileAvatar}>
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    style={styles.profileAvatarGradient}
                  >
                    <User size={32} color="#ffffff" />
                  </LinearGradient>
                </View>
                <View style={styles.profileDetails}>
                  <Text style={styles.profileName}>
                    {profile?.full_name || 'Mfanyabiashara'}
                  </Text>
                  <Text style={styles.profileBusiness}>
                    {profile?.business_name || 'My Business'}
                  </Text>
                  <View style={styles.profileStats}>
                    <View style={styles.profileStat}>
                      <Text style={styles.profileStatValue}>
                        {formatCurrency(todayStats.net)}
                      </Text>
                      <Text style={styles.profileStatLabel}>
                        {language === 'sw' ? 'Leo' : 'Today'}
                      </Text>
                    </View>
                    <View style={styles.profileStatDivider} />
                    <View style={styles.profileStat}>
                      <Text style={styles.profileStatValue}>
                        {businessHealth.totalCustomers}
                      </Text>
                      <Text style={styles.profileStatLabel}>
                        {language === 'sw' ? 'Wateja' : 'Customers'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Quick Settings */}
              <View style={styles.profileActions}>
                <TouchableOpacity 
                  style={styles.profileAction}
                  onPress={() => {
                    setShowProfile(false);
                    router.push('/(tabs)/profile' as any);
                  }}
                >
                  <View style={[styles.profileActionIcon, { backgroundColor: '#3b82f620' }]}>
                    <Settings size={18} color="#3b82f6" />
                  </View>
                  <Text style={styles.profileActionText}>
                    {language === 'sw' ? 'Hariri Wasifu' : 'Edit Profile'}
                  </Text>
                  <ArrowUp size={16} color="#6b7280" style={{ transform: [{ rotate: '45deg' }] }} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.profileAction}
                  onPress={toggleLanguage}
                >
                  <View style={[styles.profileActionIcon, { backgroundColor: '#10b98120' }]}>
                    <Globe size={18} color="#10b981" />
                  </View>
                  <Text style={styles.profileActionText}>
                    {language === 'sw' ? 'Lugha: Kiswahili' : 'Language: English'}
                  </Text>
                  <Text style={styles.profileActionValue}>
                    {language.toUpperCase()}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.profileAction}
                  onPress={() => {
                    setShowProfile(false);
                    // Add help/support navigation here
                  }}
                >
                  <View style={[styles.profileActionIcon, { backgroundColor: '#f59e0b20' }]}>
                    <HelpCircle size={18} color="#f59e0b" />
                  </View>
                  <Text style={styles.profileActionText}>
                    {language === 'sw' ? 'Msaada' : 'Help & Support'}
                  </Text>
                  <ArrowUp size={16} color="#6b7280" style={{ transform: [{ rotate: '45deg' }] }} />
                </TouchableOpacity>
              </View>

              {/* Sign Out Button */}
              <TouchableOpacity 
                style={styles.signOutButton}
                onPress={handleSignOut}
              >
                <LinearGradient
                  colors={['#ef4444', '#dc2626']}
                  style={styles.signOutGradient}
                >
                  <LogOut size={20} color="#ffffff" />
                  <Text style={styles.signOutText}>
                    {language === 'sw' ? 'Ondoka' : 'Sign Out'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      )}
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
  tipContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipHeaderText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  tipText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  businessInfo: {
    alignItems: 'center',
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
  // Modern Performance Section Styles
  performanceContainer: {
    margin: 20,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  performanceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  performanceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  performanceTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  performanceSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  netProfitBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  netProfitLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 2,
  },
  netProfitAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  mainStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  primaryStatCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  primaryStatGradient: {
    padding: 16,
  },
  primaryStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
    opacity: 0.9,
  },
  primaryStatAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  primaryStatFooter: {
    marginTop: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: 6,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    opacity: 0.9,
  },
  expenseRatio: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    opacity: 0.9,
  },
  secondaryStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  secondaryStatCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: (width - 64) / 2,
  },
  secondaryStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  secondaryStatContent: {
    flex: 1,
  },
  secondaryStatAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  secondaryStatLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  actionsContainer: {
    padding: 20,
  },
  actionsGrid: {
    marginBottom: 20,
  },
  actionCard: {
    borderRadius: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
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
  recentContainer: {
    padding: 20,
  },
  activityList: {
    marginTop: 8,
  },
  activityCard: {
    backgroundColor: '#ffffff',
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  languageToggle: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  languageText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // AI Insights Styles
  insightsContainer: {
    padding: 20,
  },
  insightsGrid: {
    gap: 12,
  },
  insightCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  insightText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  // Community Styles
  communityContainer: {
    padding: 20,
  },
  dealsScroll: {
    marginTop: 8,
  },
  dealCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  dealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dealTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  dealSavings: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
    backgroundColor: '#10b98120',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dealDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  dealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dealMembers: {
    fontSize: 11,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  // Business Health Styles
  businessHealthContainer: {
    padding: 20,
  },
  healthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  healthCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    width: (width - 60) / 2,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  healthNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  healthLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  // M-Pesa Styles
  mpesaContainer: {
    padding: 20,
  },
  mpesaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  mpesaCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    width: (width - 60) / 3,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  mpesaIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  mpesaTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  mpesaSubtitle: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Floating Button Styles
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Quick Actions Modal Styles
  quickActionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  quickActionsBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  quickActionsModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  modalClose: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  modalContent: {
    gap: 16,
  },
  quickActionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  quickActionGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  quickActionDesc: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  // AI Container Style
  aiContainer: {
    padding: 20,
  },
  // Profile Button Styles
  profileButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileButtonGradient: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  // Profile Modal Styles
  profileOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  profileBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  profileModal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 25,
  },
  profileModalGradient: {
    padding: 24,
  },
  profileModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  profileModalTitle: {
    flex: 1,
  },
  profileModalTitleText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  profileModalClose: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
  },
  profileAvatar: {
    marginRight: 16,
  },
  profileAvatarGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  profileBusiness: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 12,
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileStat: {
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  profileStatLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  profileStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#d1d5db',
    marginHorizontal: 16,
  },
  profileActions: {
    marginBottom: 24,
  },
  profileAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  profileActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  profileActionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  signOutButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  signOutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 8,
  },
});
