import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, ArrowRight, Sparkles, Users, TrendingUp, Eye, EyeOff, Star, User, MapPin, Briefcase } from 'lucide-react-native';
import { supabase } from '@/services/supabase';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

// Import images explicitly
const mamamboga = require('@/assets/images/mamamboga.jpg');
const mamamboga2 = require('@/assets/images/mamamboga2.jpeg');
const shop = require('@/assets/images/shop.jpg');
const mtumba1 = require('@/assets/images/mtumba1.jpg');
const mtumba = require('@/assets/images/mtumba.jpg');
const mamaMboga3 = require('@/assets/images/Mama-Mboga3.jpg');
const boda = require('@/assets/images/boda.jpg');

// Dynamic images for carousel
const hustleImages = [
  { source: mamamboga, title: 'Mama Mboga', subtitle: 'Fresh Vegetables & Fruits', color: '#10b981' },
  { source: mamamboga2, title: 'Market Vendors', subtitle: 'Local Business Heroes', color: '#3b82f6' },
  { source: shop, title: 'Small Shops', subtitle: 'Community Commerce', color: '#8b5cf6' },
  { source: mtumba1, title: 'Mtumba Business', subtitle: 'Fashion & Style', color: '#f59e0b' },
  { source: mtumba, title: 'Second Hand', subtitle: 'Quality at Great Prices', color: '#ef4444' },
  { source: mamaMboga3, title: 'Fresh Produce', subtitle: 'Farm to Table', color: '#06b6d4' },
  { source: boda, title: 'Boda Boda', subtitle: 'Fast & Reliable Transport', color: '#84cc16' },
];

// Dynamic encouraging quotes
const encouragingQuotes = [
  "Your hustle is your superpower 💪",
  "Every sale brings you closer to your dreams ✨",
  "Small steps, big impact 🚀",
  "Building wealth, one transaction at a time 💰",
  "Your business, your legacy 🌟",
  "Turning passion into profit 🔥",
  "Success starts with believing in yourself 💫",
  "From hustle to empire 👑",
  "Making moves, making money 📈",
  "Your grind today, your success tomorrow 🌅"
];

// Business categories for HustleAI
const businessCategories = [
  { id: 'mama_mboga', name: 'Mama Mboga', icon: '🥬', description: 'Vegetables & Fruits' },
  { id: 'boda_boda', name: 'Boda Boda', icon: '🏍️', description: 'Transport Services' },
  { id: 'small_shop', name: 'Small Shop', icon: '🏪', description: 'Retail & Kiosk' },
  { id: 'fruit_vendor', name: 'Fruit Vendor', icon: '🍊', description: 'Fresh Fruits' },
  { id: 'other_hustle', name: 'Other Hustle', icon: '⚡', description: 'Custom Business' },
];

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [location, setLocation] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showBusinessTypeDropdown, setShowBusinessTypeDropdown] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const quoteFadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Auto-rotate images and quotes
  useEffect(() => {
    const imageInterval = setInterval(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentImageIndex((prev) => (prev + 1) % hustleImages.length);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 5000);

    const quoteInterval = setInterval(() => {
      Animated.timing(quoteFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % encouragingQuotes.length);
        Animated.timing(quoteFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 3000);

    return () => {
      clearInterval(imageInterval);
      clearInterval(quoteInterval);
    };
  }, []);

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    if (isSignUp && (!fullName.trim() || !businessType || !location.trim())) {
      Alert.alert('Error', 'Please fill in all business profile fields');
      return;
    }

    setIsLoading(true);
    
    try {
      if (isSignUp) {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              full_name: fullName.trim(),
              business_type: businessType,
              location: location.trim(),
            }
          }
        });

        if (error) throw error;

        if (data.user) {
          // Create business profile in database
          const { error: profileError } = await supabase
            .from('business_profiles')
            .insert({
              user_id: data.user.id,
              full_name: fullName.trim(),
              business_type: businessType,
              location: location.trim(),
              email: email.trim(),
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
          }

          Alert.alert(
            'Success!', 
            'Account created successfully! Welcome to HustleAI!',
            [
              {
                text: 'Continue',
                onPress: () => router.replace('/(tabs)')
              }
            ]
          );
        }
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) throw error;

        if (data.user) {
          Alert.alert(
            'Welcome back!', 
            'Successfully signed in to HustleAI!',
            [
              {
                text: 'Continue',
                onPress: () => router.replace('/(tabs)')
              }
            ]
          );
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      Alert.alert('Error', error.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'hustleai://auth/callback'
        }
      });

      if (error) throw error;
      
      // OAuth will redirect, so we don't need to handle success here
    } catch (error: any) {
      console.error('Google auth error:', error);
      Alert.alert('Error', 'Google sign-in failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleFacebookAuth = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: 'hustleai://auth/callback'
        }
      });

      if (error) throw error;
      
      // OAuth will redirect, so we don't need to handle success here
    } catch (error: any) {
      console.error('Facebook auth error:', error);
      Alert.alert('Error', 'Facebook sign-in failed. Please try again.');
      setIsLoading(false);
    }
  };

  const currentImage = hustleImages[currentImageIndex];
  const currentQuote = encouragingQuotes[currentQuoteIndex];

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient
          colors={['#0f172a', '#1e293b', '#334155']}
          style={styles.gradient}
        >
          {/* Enhanced Image Carousel */}
          <View style={styles.imageContainer}>
            <Animated.View 
              style={[
                styles.imageWrapper,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }]
                }
              ]}
            >
              <Image 
                source={currentImage.source} 
                style={styles.heroImage}
                resizeMode="cover"
                onError={(error) => {
                  console.log('Image load error:', error);
                }}
                defaultSource={require('@/assets/images/icon.png')}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
                style={styles.imageOverlay}
              />
              
              {/* Enhanced Image Text with Color Accent */}
              <View style={styles.imageTextContainer}>
                <View style={[styles.categoryBadge, { backgroundColor: currentImage.color }]}>
                  <Star size={12} color="#ffffff" />
                  <Text style={styles.categoryText}>{currentImage.title}</Text>
                </View>
                <Text style={styles.imageTitle}>{currentImage.subtitle}</Text>
                <Text style={styles.imageDescription}>
                  Empowering entrepreneurs across Africa
                </Text>
              </View>
            </Animated.View>
            
            {/* Enhanced indicators */}
            <View style={styles.indicators}>
              {hustleImages.map((_, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentImageIndex && [
                      styles.activeIndicator,
                      { backgroundColor: currentImage.color }
                    ]
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Enhanced Auth Form */}
          <ScrollView 
            style={styles.authContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#16a34a', '#059669', '#047857']}
                style={styles.logoIcon}
              >
                <Sparkles size={24} color="#ffffff" />
              </LinearGradient>
              <Text style={styles.logoText}>HustleAI</Text>
              
              {/* Dynamic Encouraging Quotes */}
              <Animated.View 
                style={[
                  styles.quoteContainer,
                  { opacity: quoteFadeAnim }
                ]}
              >
                <Text style={styles.dynamicQuote}>{currentQuote}</Text>
              </Animated.View>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.welcomeText}>
                {isSignUp ? 'Join HustleAI!' : 'Welcome back!'}
              </Text>
              <Text style={styles.subtitleText}>
                {isSignUp 
                  ? 'Create your account and start growing your hustle with AI-powered insights'
                  : 'Sign in to continue managing your business'
                }
              </Text>

              {/* Business Profile Fields - Only show during sign up */}
              {isSignUp && (
                <>
                  {/* Full Name Input */}
                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <User size={18} color="#6b7280" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your full name"
                        placeholderTextColor="#9ca3af"
                        value={fullName}
                        onChangeText={setFullName}
                        autoComplete="name"
                        autoCapitalize="words"
                      />
                    </View>
                  </View>

                  {/* Business Type Dropdown */}
                  <View style={styles.inputContainer}>
                    <TouchableOpacity
                      style={styles.inputWrapper}
                      onPress={() => setShowBusinessTypeDropdown(!showBusinessTypeDropdown)}
                    >
                      <Briefcase size={18} color="#6b7280" style={styles.inputIcon} />
                      <Text style={[styles.input, { color: businessType ? '#111827' : '#9ca3af' }]}>
                        {businessType ? businessCategories.find(cat => cat.id === businessType)?.name : 'Select your business type'}
                      </Text>
                      <ArrowRight size={18} color="#6b7280" style={{ transform: [{ rotate: showBusinessTypeDropdown ? '90deg' : '0deg' }] }} />
                    </TouchableOpacity>
                    
                    {showBusinessTypeDropdown && (
                      <View style={styles.dropdown}>
                        {businessCategories.map((category) => (
                          <TouchableOpacity
                            key={category.id}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setBusinessType(category.id);
                              setShowBusinessTypeDropdown(false);
                            }}
                          >
                            <Text style={styles.categoryIcon}>{category.icon}</Text>
                            <View style={styles.categoryInfo}>
                              <Text style={styles.categoryName}>{category.name}</Text>
                              <Text style={styles.categoryDescription}>{category.description}</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Location Input */}
                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <MapPin size={18} color="#6b7280" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your location (e.g., Nairobi, Kibera)"
                        placeholderTextColor="#9ca3af"
                        value={location}
                        onChangeText={setLocation}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>
                </>
              )}

              {/* Enhanced Email Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Mail size={18} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#9ca3af"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoComplete="email"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Enhanced Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Lock size={18} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#9ca3af"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.passwordToggle}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color="#6b7280" />
                    ) : (
                      <Eye size={18} color="#6b7280" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Enhanced Sign In/Up Button */}
              <TouchableOpacity
                style={[styles.continueButton, isLoading && styles.continueButtonDisabled]}
                onPress={handleEmailAuth}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#16a34a', '#059669', '#047857']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.continueButtonText}>
                    {isLoading 
                      ? (isSignUp ? 'Creating Account...' : 'Signing In...') 
                      : (isSignUp ? 'Create Account' : 'Sign In')
                    }
                  </Text>
                  <ArrowRight size={20} color="#ffffff" />
                </LinearGradient>
              </TouchableOpacity>

              {/* Toggle Sign In/Up */}
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setIsSignUp(!isSignUp)}
              >
                <Text style={styles.toggleButtonText}>
                  {isSignUp 
                    ? 'Already have an account? ' 
                    : "Don't have an account? "
                  }
                  <Text style={styles.toggleButtonTextBold}>
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </Text>
                </Text>
              </TouchableOpacity>

              {/* Enhanced Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Enhanced Social Login Buttons */}
              <View style={styles.socialButtonsContainer}>
                <TouchableOpacity
                  style={[styles.socialButton, styles.googleButton]}
                  onPress={handleGoogleAuth}
                  disabled={isLoading}
                >
                  <View style={styles.socialButtonContent}>
                    <View style={styles.googleIcon}>
                      <Text style={styles.googleIconText}>G</Text>
                    </View>
                    <Text style={styles.socialButtonText}>Google</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.socialButton, styles.facebookButton]}
                  onPress={handleFacebookAuth}
                  disabled={isLoading}
                >
                  <View style={styles.socialButtonContent}>
                    <View style={styles.facebookIcon}>
                      <Text style={styles.facebookIconText}>f</Text>
                    </View>
                    <Text style={[styles.socialButtonText, { color: '#ffffff' }]}>Facebook</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Enhanced Features */}
              <View style={styles.featuresContainer}>
                <View style={styles.featureItem}>
                  <Users size={14} color="#16a34a" />
                  <Text style={styles.featureText}>Track Customers</Text>
                </View>
                <View style={styles.featureItem}>
                  <TrendingUp size={14} color="#16a34a" />
                  <Text style={styles.featureText}>Smart Analytics</Text>
                </View>
                <View style={styles.featureItem}>
                  <Sparkles size={14} color="#16a34a" />
                  <Text style={styles.featureText}>AI Assistant</Text>
                </View>
              </View>

              <Text style={styles.termsText}>
                By continuing, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  imageContainer: {
    height: height * 0.35,
    position: 'relative',
  },
  imageWrapper: {
    width: width,
    height: '100%',
    position: 'absolute',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  imageTextContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  imageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  imageSubtitle: {
    fontSize: 16,
    color: '#e5e7eb',
  },
  indicators: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  activeIndicator: {
    backgroundColor: '#ffffff',
    width: 24,
  },
  authContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  passwordToggle: {
    padding: 4,
  },
  continueButton: {
    borderRadius: 12,
    marginBottom: 16,
    boxShadow: '0 4px 8px rgba(22, 163, 74, 0.3)',
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  continueButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  toggleButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  toggleButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '400',
  },
  toggleButtonTextBold: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  socialButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButton: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
  },
  facebookButton: {
    backgroundColor: '#1877f2',
    borderColor: '#1877f2',
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  googleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  facebookIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  facebookIconText: {
    color: '#1877f2',
    fontSize: 14,
    fontWeight: 'bold',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  termsText: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 16,
  },
  termsLink: {
    color: '#16a34a',
    fontWeight: '500',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  imageDescription: {
    fontSize: 14,
    color: '#d1d5db',
    marginTop: 4,
  },
  quoteContainer: {
    marginVertical: 6,
    paddingHorizontal: 16,
  },
  dynamicQuote: {
    fontSize: 14,
    color: '#16a34a',
    textAlign: 'center',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  dropdown: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 8,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
});
