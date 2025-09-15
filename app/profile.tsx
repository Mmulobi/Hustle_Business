import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  Modal,
} from 'react-native';
import {
  User,
  Mail,
  MapPin,
  Briefcase,
  Phone,
  Target,
  Edit3,
  Save,
  X,
  ArrowLeft,
  Settings,
  Shield,
  Bell,
  HelpCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/services/supabase';
import { BusinessProfile } from '@/types/business';
import { router } from 'expo-router';

// Business categories for dropdown
const businessCategories = [
  { id: 'mama_mboga', name: 'Mama Mboga', icon: '🥬', description: 'Vegetables & Fruits' },
  { id: 'boda_boda', name: 'Boda Boda', icon: '🏍️', description: 'Transport Services' },
  { id: 'small_shop', name: 'Small Shop', icon: '🏪', description: 'Retail & Kiosk' },
  { id: 'fruit_vendor', name: 'Fruit Vendor', icon: '🍊', description: 'Fresh Fruits' },
  { id: 'other_hustle', name: 'Other Hustle', icon: '⚡', description: 'Custom Business' },
];

export default function ProfileScreen() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showBusinessTypeModal, setShowBusinessTypeModal] = useState(false);
  
  // Edit form states
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    business_type: '',
    daily_goal: 0,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData, error } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error loading profile:', error);
          return;
        }

        if (profileData) {
          setProfile(profileData);
          setEditForm({
            full_name: profileData.full_name || '',
            email: profileData.email || '',
            phone: profileData.phone || '',
            location: profileData.location || '',
            business_type: profileData.business_type || '',
            daily_goal: profileData.daily_goal || 0,
          });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!editForm.full_name.trim() || !editForm.location.trim() || !editForm.business_type) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('business_profiles')
          .update({
            full_name: editForm.full_name.trim(),
            email: editForm.email.trim(),
            phone: editForm.phone.trim(),
            location: editForm.location.trim(),
            business_type: editForm.business_type,
            daily_goal: editForm.daily_goal,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (error) throw error;

        Alert.alert('Success', 'Profile updated successfully!');
        setIsEditing(false);
        loadProfile(); // Reload to get updated data
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getBusinessTypeInfo = (type: string) => {
    return businessCategories.find(cat => cat.id === type) || businessCategories[4];
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const businessInfo = getBusinessTypeInfo(profile.business_type);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Header */}
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Profile</Text>
          
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setIsEditing(!isEditing)}
          >
            {isEditing ? (
              <X size={24} color="#ffffff" />
            ) : (
              <Edit3 size={24} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Profile Avatar and Basic Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile.full_name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          
          {!isEditing ? (
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile.full_name}</Text>
              <View style={styles.businessTypeContainer}>
                <Text style={styles.businessIcon}>{businessInfo.icon}</Text>
                <Text style={styles.businessType}>{businessInfo.name}</Text>
              </View>
              <Text style={styles.profileLocation}>📍 {profile.location}</Text>
            </View>
          ) : (
            <View style={styles.editProfileInfo}>
              <TextInput
                style={styles.editNameInput}
                value={editForm.full_name}
                onChangeText={(text) => setEditForm({...editForm, full_name: text})}
                placeholder="Full Name"
                placeholderTextColor="rgba(255,255,255,0.6)"
              />
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {!isEditing ? (
          // View Mode
          <>
            {/* Profile Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Profile Details</Text>
              
              <View style={styles.detailItem}>
                <Mail size={20} color="#6b7280" />
                <View style={styles.detailText}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{profile.email}</Text>
                </View>
              </View>

              {profile.phone && (
                <View style={styles.detailItem}>
                  <Phone size={20} color="#6b7280" />
                  <View style={styles.detailText}>
                    <Text style={styles.detailLabel}>Phone</Text>
                    <Text style={styles.detailValue}>{profile.phone}</Text>
                  </View>
                </View>
              )}

              <View style={styles.detailItem}>
                <MapPin size={20} color="#6b7280" />
                <View style={styles.detailText}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{profile.location}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Briefcase size={20} color="#6b7280" />
                <View style={styles.detailText}>
                  <Text style={styles.detailLabel}>Business Type</Text>
                  <Text style={styles.detailValue}>{businessInfo.description}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Target size={20} color="#6b7280" />
                <View style={styles.detailText}>
                  <Text style={styles.detailLabel}>Daily Goal</Text>
                  <Text style={styles.detailValue}>
                    {profile.daily_goal > 0 ? formatCurrency(profile.daily_goal) : 'Not set'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Account Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Settings</Text>
              
              <TouchableOpacity style={styles.settingItem}>
                <Settings size={20} color="#6b7280" />
                <Text style={styles.settingText}>App Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem}>
                <Bell size={20} color="#6b7280" />
                <Text style={styles.settingText}>Notifications</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem}>
                <Shield size={20} color="#6b7280" />
                <Text style={styles.settingText}>Privacy & Security</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem}>
                <HelpCircle size={20} color="#6b7280" />
                <Text style={styles.settingText}>Help & Support</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          // Edit Mode
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Edit Profile</Text>
            
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <Mail size={18} color="#6b7280" />
                <TextInput
                  style={styles.input}
                  value={editForm.email}
                  onChangeText={(text) => setEditForm({...editForm, email: text})}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone (Optional)</Text>
              <View style={styles.inputWrapper}>
                <Phone size={18} color="#6b7280" />
                <TextInput
                  style={styles.input}
                  value={editForm.phone}
                  onChangeText={(text) => setEditForm({...editForm, phone: text})}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Location Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Location</Text>
              <View style={styles.inputWrapper}>
                <MapPin size={18} color="#6b7280" />
                <TextInput
                  style={styles.input}
                  value={editForm.location}
                  onChangeText={(text) => setEditForm({...editForm, location: text})}
                  placeholder="Enter your location"
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Business Type Selector */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Business Type</Text>
              <TouchableOpacity
                style={styles.inputWrapper}
                onPress={() => setShowBusinessTypeModal(true)}
              >
                <Briefcase size={18} color="#6b7280" />
                <Text style={[styles.input, { color: editForm.business_type ? '#111827' : '#9ca3af' }]}>
                  {editForm.business_type ? getBusinessTypeInfo(editForm.business_type).name : 'Select business type'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Daily Goal Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Daily Goal (KES)</Text>
              <View style={styles.inputWrapper}>
                <Target size={18} color="#6b7280" />
                <TextInput
                  style={styles.input}
                  value={editForm.daily_goal.toString()}
                  onChangeText={(text) => setEditForm({...editForm, daily_goal: parseInt(text) || 0})}
                  placeholder="Enter daily goal amount"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
              onPress={handleSaveProfile}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={styles.saveButtonGradient}
              >
                <Save size={20} color="#ffffff" />
                <Text style={styles.saveButtonText}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Business Type Modal */}
      <Modal
        visible={showBusinessTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBusinessTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Business Type</Text>
              <TouchableOpacity onPress={() => setShowBusinessTypeModal(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalList}>
              {businessCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setEditForm({...editForm, business_type: category.id});
                    setShowBusinessTypeModal(false);
                  }}
                >
                  <Text style={styles.modalItemIcon}>{category.icon}</Text>
                  <View style={styles.modalItemText}>
                    <Text style={styles.modalItemName}>{category.name}</Text>
                    <Text style={styles.modalItemDescription}>{category.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  profileSection: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  businessTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  businessIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  businessType: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  profileLocation: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  editProfileInfo: {
    width: '100%',
    alignItems: 'center',
  },
  editNameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 200,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailText: {
    marginLeft: 16,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingText: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 16,
  },
  inputContainer: {
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
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  saveButton: {
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#10b981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalList: {
    padding: 20,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalItemIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  modalItemText: {
    flex: 1,
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  modalItemDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
});
