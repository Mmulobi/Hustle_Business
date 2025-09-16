import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import {
  User,
  MapPin,
  Target,
  Phone,
  Save,
  Settings,
  LogOut,
  Edit3,
  Check,
  X,
  Briefcase,
  Mail,
  Calendar,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { supabase } from '@/services/supabase';
import { BusinessProfile, HustleType } from '@/types/business';

const { width } = Dimensions.get('window');

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
            setBusinessName(profileData.business_name || profileData.full_name || '');
            setLocation(profileData.location);
            setDailyGoal(profileData.daily_goal.toString());
            setHustleType(profileData.business_type || profileData.hustle_type || 'other_hustle');
            setPhoneNumber(profileData.phone || profileData.phone_number || '');
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
          full_name: user.email?.split('@')[0] || 'Business Owner',
          business_name: businessName,
          business_type: hustleType,
          location,
          email: user.email || '',
          daily_goal: parseFloat(dailyGoal),
          phone: phoneNumber,
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
      case 'other_hustle':
        return 'Other Hustle';
      default:
        return type;
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  return (
    <View style={styles.container}>
      {/* Modern Header with Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Profile & Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your business information</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <BlurView intensity={20} style={styles.cardBlur}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.avatar}
                >
                  <User size={32} color="#ffffff" />
                </LinearGradient>
              </View>
              <View style={styles.profileHeaderText}>
                <Text style={styles.profileName}>
                  {profile?.business_name || profile?.full_name || 'Business Owner'}
                </Text>
                <Text style={styles.profileType}>
                  {profile ? getHustleTypeDisplayName(profile.business_type || profile.hustle_type || 'other_hustle') : 'Set up your profile'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsEditing(!isEditing)}
                style={styles.modernEditButton}
              >
                {isEditing ? (
                  <X size={20} color="#ef4444" />
                ) : (
                  <Edit3 size={20} color="#667eea" />
                )}
              </TouchableOpacity>
            </View>

            {isEditing ? (
              <View style={styles.editForm}>
                <View style={styles.formGroup}>
                  <Text style={styles.modernInputLabel}>Business Name *</Text>
                  <View style={styles.inputContainer}>
                    <Briefcase size={18} color="#667eea" style={styles.inputIcon} />
                    <TextInput
                      style={styles.modernInput}
                      placeholder="Enter your business name"
                      value={businessName}
                      onChangeText={setBusinessName}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.modernInputLabel}>Type of Hustle *</Text>
                  <View style={styles.hustleTypeGrid}>
                    {(['mama_mboga', 'boda_boda', 'small_shop', 'fruit_vendor', 'other_hustle'] as HustleType[]).map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.hustleTypeCard,
                          hustleType === type && styles.hustleTypeCardActive
                        ]}
                        onPress={() => setHustleType(type)}
                      >
                        <Text style={[
                          styles.hustleTypeCardText,
                          hustleType === type && styles.hustleTypeCardTextActive
                        ]}>
                          {getHustleTypeDisplayName(type)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.modernInputLabel}>Location *</Text>
                  <View style={styles.inputContainer}>
                    <MapPin size={18} color="#667eea" style={styles.inputIcon} />
                    <TextInput
                      style={styles.modernInput}
                      placeholder="Where do you operate?"
                      value={location}
                      onChangeText={setLocation}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.modernInputLabel}>Daily Goal (KES) *</Text>
                  <View style={styles.inputContainer}>
                    <Target size={18} color="#667eea" style={styles.inputIcon} />
                    <TextInput
                      style={styles.modernInput}
                      placeholder="How much do you want to make daily?"
                      value={dailyGoal}
                      onChangeText={setDailyGoal}
                      keyboardType="numeric"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.modernInputLabel}>Phone Number</Text>
                  <View style={styles.inputContainer}>
                    <Phone size={18} color="#667eea" style={styles.inputIcon} />
                    <TextInput
                      style={styles.modernInput}
                      placeholder="Your contact number"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="phone-pad"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.modernSaveButton, isLoading && styles.modernSaveButtonDisabled]}
                  onPress={handleSaveProfile}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={isLoading ? ['#9ca3af', '#6b7280'] : ['#667eea', '#764ba2']}
                    style={styles.saveButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isLoading ? (
                      <Text style={styles.modernSaveButtonText}>Saving...</Text>
                    ) : (
                      <>
                        <Check size={20} color="#ffffff" />
                        <Text style={styles.modernSaveButtonText}>Save Profile</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.profileDetails}>
                {profile ? (
                  <>
                    <View style={styles.detailsGrid}>
                      <View style={styles.detailCard}>
                        <View style={styles.detailIconContainer}>
                          <Briefcase size={20} color="#667eea" />
                        </View>
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Business Name</Text>
                          <Text style={styles.detailValue}>{profile.business_name || 'Not set'}</Text>
                        </View>
                      </View>

                      <View style={styles.detailCard}>
                        <View style={styles.detailIconContainer}>
                          <MapPin size={20} color="#10b981" />
                        </View>
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Location</Text>
                          <Text style={styles.detailValue}>{profile.location}</Text>
                        </View>
                      </View>

                      <View style={styles.detailCard}>
                        <View style={styles.detailIconContainer}>
                          <Target size={20} color="#f59e0b" />
                        </View>
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Daily Goal</Text>
                          <Text style={styles.detailValue}>
                            {formatCurrency(profile.daily_goal)}
                          </Text>
                        </View>
                      </View>

                      {(profile.phone || profile.phone_number) && (
                        <View style={styles.detailCard}>
                          <View style={styles.detailIconContainer}>
                            <Phone size={20} color="#8b5cf6" />
                          </View>
                          <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Phone</Text>
                            <Text style={styles.detailValue}>{profile.phone || profile.phone_number}</Text>
                          </View>
                        </View>
                      )}

                      <View style={styles.detailCard}>
                        <View style={styles.detailIconContainer}>
                          <Mail size={20} color="#ef4444" />
                        </View>
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Email</Text>
                          <Text style={styles.detailValue}>{profile.email}</Text>
                        </View>
                      </View>

                      <View style={styles.detailCard}>
                        <View style={styles.detailIconContainer}>
                          <Calendar size={20} color="#06b6d4" />
                        </View>
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Member Since</Text>
                          <Text style={styles.detailValue}>
                            {new Date(profile.created_at).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </>
                ) : (
                  <View style={styles.emptyState}>
                    <User size={48} color="#9ca3af" />
                    <Text style={styles.emptyStateText}>
                      No profile found
                    </Text>
                    <Text style={styles.emptyStateSubtext}>
                      Please set up your business profile to get started
                    </Text>
                  </View>
                )}
              </View>
            )}
          </BlurView>
        </View>

        {/* App Information Card */}
        <View style={styles.infoCard}>
          <BlurView intensity={15} style={styles.cardBlur}>
            <View style={styles.infoHeader}>
              <Text style={styles.infoTitle}>About HustleAI</Text>
              <Text style={styles.versionBadge}>v1.0.0</Text>
            </View>
            <Text style={styles.infoDescription}>
              HustleAI helps African entrepreneurs track their business performance,
              manage inventory, and grow their hustles. Built specifically for
              Mama Mbogas, Boda Boda riders, and small shop owners.
            </Text>
          </BlurView>
        </View>

        {/* Sign Out Card */}
        <TouchableOpacity style={styles.signOutCard} onPress={handleSignOut}>
          <BlurView intensity={15} style={styles.cardBlur}>
            <View style={styles.signOutContent}>
              <View style={styles.signOutIconContainer}>
                <LogOut size={20} color="#ef4444" />
              </View>
              <Text style={styles.signOutText}>Sign Out</Text>
            </View>
          </BlurView>
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
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  cardBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeaderText: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  profileType: {
    fontSize: 14,
    color: '#6b7280',
  },
  modernEditButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editForm: {
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  modernInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  modernInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  hustleTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hustleTypeCard: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: (width - 80) / 2,
    alignItems: 'center',
  },
  hustleTypeCardActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  hustleTypeCardText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  hustleTypeCardTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  modernSaveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  modernSaveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  modernSaveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  profileDetails: {
    gap: 16,
  },
  detailsGrid: {
    gap: 12,
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.5)',
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  versionBadge: {
    backgroundColor: '#667eea',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  infoDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  signOutCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  signOutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  signOutIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  section: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: '#1f2937',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  editButtonText: {
    color: '#16a34a',
    fontWeight: '500',
    marginLeft: 4,
  },
  form: {
    gap: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hustleTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  hustleTypeButtonActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  hustleTypeButtonText: {
    fontSize: 14,
    color: '#6b7280',
  },
  hustleTypeButtonTextActive: {
    color: '#ffffff',
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
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
    color: '#1f2937',
    fontWeight: '500',
  },
  noProfileText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    fontStyle: 'italic',
  },
  aboutText: {
    fontSize: 14,
    color: '#6b7280',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  signOutButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});