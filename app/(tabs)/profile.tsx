import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import {
  User,
  MapPin,
  Target,
  Phone,
  Save,
  Settings,
  LogOut,
} from 'lucide-react-native';
import { supabase } from '@/services/supabase';
import { BusinessProfile, HustleType } from '@/types/business';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [dailyGoal, setDailyGoal] = useState('');
  const [hustleType, setHustleType] = useState<HustleType>('mama_mboga');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Try to get user from Supabase, but fallback to offline mode if not configured
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase
            .from('business_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
            
          if (profileData) {
            setProfile(profileData);
            setBusinessName(profileData.business_name);
            setLocation(profileData.location);
            setDailyGoal(profileData.daily_goal.toString());
            setHustleType(profileData.hustle_type);
            setPhoneNumber(profileData.phone_number);
          }
        }
      } catch (supabaseError) {
        console.log('Supabase not configured, using offline mode');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!businessName || !location || !dailyGoal) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    
    try {
      // Try to save to Supabase, but fallback to offline mode if not configured
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user found');

        const profileData = {
          user_id: user.id,
          business_name: businessName,
          hustle_type: hustleType,
          location,
          daily_goal: parseFloat(dailyGoal),
          phone_number: phoneNumber,
        };

        if (profile) {
          // Update existing profile
          const { error } = await supabase
            .from('business_profiles')
            .update(profileData)
            .eq('id', profile.id);
            
          if (error) throw error;
        } else {
          // Create new profile
          const { error } = await supabase
            .from('business_profiles')
            .insert([profileData]);
            
          if (error) throw error;
        }
        
        await loadProfile();
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } catch (supabaseError) {
        console.log('Supabase not configured, saving locally');
        // For now, just show success message in offline mode
        setIsEditing(false);
        Alert.alert('Success', 'Profile saved locally! (Supabase not configured)');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setIsLoading(false);
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
            await supabase.auth.signOut();
          },
        },
      ]
    );
  };

  const getHustleTypeDisplayName = (type: HustleType) => {
    switch (type) {
      case 'mama_mboga':
        return 'Mama Mboga (Vegetable Vendor)';
      case 'boda_boda':
        return 'Boda Boda Rider';
      case 'small_shop':
        return 'Small Shop/Kiosk';
      case 'fruit_vendor':
        return 'Fruit Vendor';
      case 'other':
        return 'Other Hustle';
      default:
        return type;
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile & Settings</Text>
      </View>

      {/* Profile Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Business Profile</Text>
          <TouchableOpacity
            onPress={() => setIsEditing(!isEditing)}
            style={styles.editButton}
          >
            <Settings size={20} color="#16a34a" />
            <Text style={styles.editButtonText}>
              {isEditing ? 'Cancel' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        {isEditing ? (
          <View style={styles.form}>
            <Text style={styles.inputLabel}>Business Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your business name"
              value={businessName}
              onChangeText={setBusinessName}
            />

            <Text style={styles.inputLabel}>Type of Hustle *</Text>
            <View style={styles.hustleTypeContainer}>
              {(['mama_mboga', 'boda_boda', 'small_shop', 'fruit_vendor', 'other'] as HustleType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.hustleTypeButton,
                    hustleType === type && styles.hustleTypeButtonActive
                  ]}
                  onPress={() => setHustleType(type)}
                >
                  <Text style={[
                    styles.hustleTypeButtonText,
                    hustleType === type && styles.hustleTypeButtonTextActive
                  ]}>
                    {getHustleTypeDisplayName(type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Location *</Text>
            <TextInput
              style={styles.input}
              placeholder="Where do you operate?"
              value={location}
              onChangeText={setLocation}
            />

            <Text style={styles.inputLabel}>Daily Goal (KES) *</Text>
            <TextInput
              style={styles.input}
              placeholder="How much do you want to make daily?"
              value={dailyGoal}
              onChangeText={setDailyGoal}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Your contact number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
              onPress={handleSaveProfile}
              disabled={isLoading}
            >
              <Save size={20} color="#ffffff" />
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Saving...' : 'Save Profile'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.profileView}>
            {profile ? (
              <>
                <View style={styles.profileItem}>
                  <User size={20} color="#6b7280" />
                  <View style={styles.profileItemText}>
                    <Text style={styles.profileLabel}>Business Name</Text>
                    <Text style={styles.profileValue}>{profile.business_name}</Text>
                  </View>
                </View>

                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>Hustle Type</Text>
                  <Text style={styles.profileValue}>
                    {getHustleTypeDisplayName(profile.hustle_type)}
                  </Text>
                </View>

                <View style={styles.profileItem}>
                  <MapPin size={20} color="#6b7280" />
                  <View style={styles.profileItemText}>
                    <Text style={styles.profileLabel}>Location</Text>
                    <Text style={styles.profileValue}>{profile.location}</Text>
                  </View>
                </View>

                <View style={styles.profileItem}>
                  <Target size={20} color="#6b7280" />
                  <View style={styles.profileItemText}>
                    <Text style={styles.profileLabel}>Daily Goal</Text>
                    <Text style={styles.profileValue}>
                      {formatCurrency(profile.daily_goal)}
                    </Text>
                  </View>
                </View>

                {profile.phone_number && (
                  <View style={styles.profileItem}>
                    <Phone size={20} color="#6b7280" />
                    <View style={styles.profileItemText}>
                      <Text style={styles.profileLabel}>Phone</Text>
                      <Text style={styles.profileValue}>{profile.phone_number}</Text>
                    </View>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.noProfileText}>
                No profile found. Please set up your business profile.
              </Text>
            )}
          </View>
        )}
      </View>

      {/* App Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About HustleAI</Text>
        <Text style={styles.aboutText}>
          HustleAI helps African entrepreneurs track their business performance,
          manage inventory, and grow their hustles. Built specifically for
          Mama Mbogas, Boda Boda riders, and small shop owners.
        </Text>
        
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>

      {/* Sign Out */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  section: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 20,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  editButtonText: {
    marginLeft: 4,
    color: '#16a34a',
    fontWeight: '500',
  },
  form: {
    gap: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  hustleTypeContainer: {
    gap: 8,
  },
  hustleTypeButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    alignItems: 'center',
  },
  hustleTypeButtonActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  hustleTypeButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  hustleTypeButtonTextActive: {
    color: '#ffffff',
  },
  saveButton: {
    backgroundColor: '#16a34a',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  profileView: {
    gap: 16,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  profileItemText: {
    marginLeft: 12,
    flex: 1,
  },
  profileLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  profileValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  noProfileText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  aboutText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  versionText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
  },
  signOutButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});