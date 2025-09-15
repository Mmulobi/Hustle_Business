import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, MapPin, Target, User, Check } from 'lucide-react-native';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

// Import images explicitly
const mamamboga = require('@/assets/images/mamamboga.jpg');
const mamamboga2 = require('@/assets/images/mamamboga2.jpeg');
const shop = require('@/assets/images/shop.jpg');
const mtumba1 = require('@/assets/images/mtumba1.jpg');
const mtumba = require('@/assets/images/mtumba.jpg');
const mamaMboga3 = require('@/assets/images/Mama-Mboga3.jpg');
const boda = require('@/assets/images/boda.jpg');

const hustleTypes = [
  {
    id: 'mama_mboga',
    title: 'Mama Mboga',
    subtitle: 'Vegetable & Fruit Vendor',
    icon: '🥬',
    image: mamamboga,
    features: ['Inventory Management', 'Customer Debts', 'Smart Pricing', 'Freshness Tracking']
  },
  {
    id: 'boda_boda',
    title: 'Boda Boda',
    subtitle: 'Motorcycle Transport',
    icon: '🏍️',
    image: boda,
    features: ['Trip Logging', 'Fuel Tracking', 'Earnings Summary', 'Safety Tips']
  },
  {
    id: 'small_shop',
    title: 'Small Shop',
    subtitle: 'Kiosk & Retail',
    icon: '🏪',
    image: shop,
    features: ['Digital Ledger', 'Stock Management', 'Supplier Tracking', 'Profit Analysis']
  },
  {
    id: 'fruit_vendor',
    title: 'Fruit Vendor',
    subtitle: 'Fresh Fruits',
    icon: '🍊',
    image: mamaMboga3,
    features: ['Seasonal Predictions', 'Freshness Alerts', 'Quick Sales', 'Market Trends']
  },
  {
    id: 'mtumba',
    title: 'Mtumba',
    subtitle: 'Second Hand Clothes',
    icon: '👕',
    image: mtumba,
    features: ['Inventory Tracking', 'Style Trends', 'Customer Preferences', 'Profit Margins']
  },
  {
    id: 'other',
    title: 'Other Hustle',
    subtitle: 'Custom Business',
    icon: '💼',
    image: mamamboga2,
    features: ['Custom Categories', 'Goal Tracking', 'AI Suggestions', 'Flexible Setup']
  }
];

export default function BusinessProfileScreen() {
  const [selectedHustle, setSelectedHustle] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [dailyGoal, setDailyGoal] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = () => {
    if (!selectedHustle || !businessName || !location || !dailyGoal) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    // Simulate saving profile
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        'Welcome to HustleAI! 🎉',
        'Your business profile has been set up successfully. Let\'s start growing your hustle!',
        [
          {
            text: 'Get Started',
            onPress: () => router.replace('/(tabs)')
          }
        ]
      );
    }, 1500);
  };

  const selectedHustleData = hustleTypes.find(h => h.id === selectedHustle);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#16a34a', '#15803d']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Set Up Your Business</Text>
        <Text style={styles.headerSubtitle}>
          Tell us about your hustle so we can personalize your experience
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hustle Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's your hustle? 🚀</Text>
          <View style={styles.hustleGrid}>
            {hustleTypes.map((hustle) => (
              <TouchableOpacity
                key={hustle.id}
                style={[
                  styles.hustleCard,
                  selectedHustle === hustle.id && styles.hustleCardSelected
                ]}
                onPress={() => setSelectedHustle(hustle.id)}
              >
                <Image source={hustle.image} style={styles.hustleImage} />
                <View style={styles.hustleOverlay}>
                  <Text style={styles.hustleIcon}>{hustle.icon}</Text>
                  <Text style={styles.hustleTitle}>{hustle.title}</Text>
                  <Text style={styles.hustleSubtitle}>{hustle.subtitle}</Text>
                  {selectedHustle === hustle.id && (
                    <View style={styles.selectedIndicator}>
                      <Check size={16} color="#ffffff" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Selected Hustle Features */}
        {selectedHustleData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What you'll get with HustleAI:</Text>
            <View style={styles.featuresList}>
              {selectedHustleData.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={styles.featureBullet} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Business Details Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Business Name *</Text>
            <View style={styles.inputWrapper}>
              <User size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., Mama Sarah's Vegetables"
                value={businessName}
                onChangeText={setBusinessName}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Location *</Text>
            <View style={styles.inputWrapper}>
              <MapPin size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., Kawangware, Nairobi"
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Daily Goal (KES) *</Text>
            <View style={styles.inputWrapper}>
              <Target size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., 2000"
                value={dailyGoal}
                onChangeText={setDailyGoal}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.continueButton, isLoading && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={isLoading}
        >
          <Text style={styles.continueButtonText}>
            {isLoading ? 'Setting up...' : 'Complete Setup'}
          </Text>
          <ArrowRight size={20} color="#ffffff" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e5e7eb',
    lineHeight: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  hustleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  hustleCard: {
    width: (width - 60) / 2,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  hustleCardSelected: {
    borderColor: '#16a34a',
  },
  hustleImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  hustleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  hustleIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  hustleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 2,
  },
  hustleSubtitle: {
    fontSize: 10,
    color: '#e5e7eb',
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuresList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  continueButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 40,
    shadowColor: '#16a34a',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
});
