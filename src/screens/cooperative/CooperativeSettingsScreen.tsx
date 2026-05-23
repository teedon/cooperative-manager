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
  Switch,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary } from 'react-native-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateCooperative, fetchCooperative } from '../../store/slices/cooperativeSlice';
import { cooperativeApi } from '../../api/cooperativeApi';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';
import { getAllGradientPresets, getGradientConfig } from '../../utils/gradients';
import { GradientPreset, GRADIENT_PRESETS } from '../../models';

type Props = NativeStackScreenProps<HomeStackParamList, 'CooperativeSettings'>;

const CooperativeSettingsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cooperativeId } = route.params;
  const dispatch = useAppDispatch();
  
  const { currentCooperative, isLoading, error } = useAppSelector((state) => state.cooperative);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [useGradient, setUseGradient] = useState(true);
  const [gradientPreset, setGradientPreset] = useState<GradientPreset>('ocean');
  const [imageUrl, setImageUrl] = useState('');
  const [hasCollectionAccount, setHasCollectionAccount] = useState(false);
  const [collectionBankName, setCollectionBankName] = useState('');
  const [collectionAccountNumber, setCollectionAccountNumber] = useState('');
  const [collectionAccountHolderName, setCollectionAccountHolderName] = useState('');
  const [bankOptions, setBankOptions] = useState<string[]>([]);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const gradientPresets = getAllGradientPresets();
  
  useEffect(() => {
    if (currentCooperative) {
      setName(currentCooperative.name || '');
      setDescription(currentCooperative.description || '');
      setUseGradient(currentCooperative.useGradient !== false);
      setGradientPreset((currentCooperative.gradientPreset || 'ocean') as GradientPreset);
      setImageUrl(currentCooperative.imageUrl || '');
      setHasCollectionAccount(Boolean(currentCooperative.collectionBankName || currentCooperative.collectionAccountNumber || currentCooperative.collectionAccountHolderName));
      setCollectionBankName(currentCooperative.collectionBankName || '');
      setCollectionAccountNumber(currentCooperative.collectionAccountNumber || '');
      setCollectionAccountHolderName(currentCooperative.collectionAccountHolderName || '');
    }
  }, [currentCooperative]);

  useEffect(() => {
    const loadBankOptions = async () => {
      try {
        const response = await cooperativeApi.getBankOptions();
        if (response.success) {
          setBankOptions(response.data || []);
        }
      } catch (err) {
        console.error('Failed to load bank options:', err);
      }
    };

    loadBankOptions();
  }, []);
  
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Cooperative name is required');
      return;
    }

    if (hasCollectionAccount) {
      if (!collectionBankName) {
        Alert.alert('Error', 'Please select a bank');
        return;
      }

      if (!/^\d{10}$/.test(collectionAccountNumber)) {
        Alert.alert('Error', 'Account number must be 10 digits');
        return;
      }

      if (!collectionAccountHolderName.trim()) {
        Alert.alert('Error', 'Account holder name is required');
        return;
      }
    }
    
    setIsSaving(true);
    try {
      await dispatch(updateCooperative({
        id: cooperativeId,
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
          useGradient,
          gradientPreset,
          imageUrl: !useGradient && imageUrl.trim() ? imageUrl.trim() : undefined,
          collectionBankName: hasCollectionAccount ? collectionBankName : null,
          collectionAccountNumber: hasCollectionAccount ? collectionAccountNumber : null,
          collectionAccountHolderName: hasCollectionAccount ? collectionAccountHolderName.trim() : null,
        },
      })).unwrap();
      
      // Refresh cooperative data
      await dispatch(fetchCooperative(cooperativeId));
      
      Alert.alert('Success', 'Cooperative settings updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err || 'Failed to update cooperative settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadLogo = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.85,
      selectionLimit: 1,
    });

    if (result.didCancel) return;

    const selectedAsset = result.assets?.[0];
    if (!selectedAsset?.uri) {
      Alert.alert('Error', 'No image selected');
      return;
    }

    try {
      setIsUploadingImage(true);
      const uploadResponse = await cooperativeApi.uploadLogo({
        uri: selectedAsset.uri,
        type: selectedAsset.type || 'image/jpeg',
        name: selectedAsset.fileName || `logo-${Date.now()}.jpg`,
      });

      setImageUrl(uploadResponse.data.url);
      setUseGradient(false);
      Alert.alert('Success', 'Logo uploaded successfully');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to upload logo');
    } finally {
      setIsUploadingImage(false);
    }
  };
  
  const renderGradientPreview = (preset: GradientPreset, config: ReturnType<typeof getGradientConfig>, isSelected: boolean) => (
    <TouchableOpacity
      key={preset}
      style={[styles.presetCard, isSelected && styles.presetCardSelected]}
      onPress={() => setGradientPreset(preset)}
    >
      <LinearGradient
        colors={[...config.colors] as [string, string, ...string[]]}
        start={{ x: config.start.x, y: config.start.y }}
        end={{ x: config.end.x, y: config.end.y }}
        style={styles.presetGradient}
      >
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Icon name="checkmark" size={16} color="#fff" />
          </View>
        )}
      </LinearGradient>
      <Text style={[styles.presetName, isSelected && styles.presetNameSelected]}>
        {config.name}
      </Text>
      <Text style={styles.presetDescription} numberOfLines={1}>
        {config.description}
      </Text>
    </TouchableOpacity>
  );
  
  // Get current gradient config for preview
  const currentGradientConfig = getGradientConfig(gradientPreset);
  
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Preview */}
      <View style={styles.previewContainer}>
        <Text style={styles.previewLabel}>Preview</Text>
        <View style={styles.previewBox}>
          {useGradient ? (
            <LinearGradient
              colors={[...currentGradientConfig.colors] as [string, string, ...string[]]}
              start={{ x: currentGradientConfig.start.x, y: currentGradientConfig.start.y }}
              end={{ x: currentGradientConfig.end.x, y: currentGradientConfig.end.y }}
              style={styles.previewGradient}
            >
              <View style={styles.gradientPattern}>
                <View style={[styles.decorativeCircle, styles.circle1]} />
                <View style={[styles.decorativeCircle, styles.circle2]} />
              </View>
              <View style={styles.previewOverlay}>
                <Text style={styles.previewTitle}>{name || 'Cooperative Name'}</Text>
              </View>
            </LinearGradient>
          ) : (
            imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.previewImage} resizeMode="cover" />
            ) : (
              <View style={styles.previewImagePlaceholder}>
                <Icon name="image-outline" size={40} color={colors.text.secondary} />
                <Text style={styles.previewImageText}>Custom Image</Text>
              </View>
            )
          )}
        </View>
      </View>
      
      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Cooperative Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter cooperative name"
            placeholderTextColor={colors.text.secondary}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter a brief description"
            placeholderTextColor={colors.text.secondary}
            multiline
            numberOfLines={3}
          />
        </View>
      </View>
      
      {/* Background Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Background Settings</Text>
        
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Use Gradient Background</Text>
            <Text style={styles.toggleDescription}>
              {useGradient 
                ? 'Professional gradient with decorative elements' 
                : 'Custom image background'}
            </Text>
          </View>
          <Switch
            value={useGradient}
            onValueChange={setUseGradient}
            trackColor={{ false: colors.border.main, true: colors.primary.light }}
            thumbColor={useGradient ? colors.primary.main : '#9CA3AF'}
          />
        </View>
        
        {useGradient ? (
          <View style={styles.presetsContainer}>
            <Text style={styles.subsectionTitle}>Choose a Gradient</Text>
            <View style={styles.presetsGrid}>
              {gradientPresets.map(({ preset, config }) => 
                renderGradientPreview(preset, config, preset === gradientPreset)
              )}
            </View>
          </View>
        ) : (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Upload Logo</Text>
            <View style={styles.logoActionsRow}>
              <TouchableOpacity
                style={[styles.uploadLogoButton, isUploadingImage && styles.saveButtonDisabled]}
                onPress={handleUploadLogo}
                disabled={isUploadingImage}
              >
                {isUploadingImage ? (
                  <ActivityIndicator size="small" color={colors.primary.main} />
                ) : (
                  <Icon name="upload" size={16} color={colors.primary.main} />
                )}
                <Text style={styles.uploadLogoButtonText}>
                  {isUploadingImage ? 'Uploading...' : 'Choose Image'}
                </Text>
              </TouchableOpacity>

              {!!imageUrl && (
                <TouchableOpacity
                  style={styles.clearLogoButton}
                  onPress={() => setImageUrl('')}
                  disabled={isUploadingImage}
                >
                  <Text style={styles.clearLogoButtonText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.hint}>
              Supported formats: PNG, JPG, WEBP, GIF. Max size: 10MB.
            </Text>

            <Text style={styles.label}>Background Image URL</Text>
            <TextInput
              style={styles.input}
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholder="https://example.com/image.jpg"
              placeholderTextColor={colors.text.secondary}
              autoCapitalize="none"
              keyboardType="url"
            />
            <Text style={styles.hint}>
              Enter a URL to an image. Recommended size: 800x400 pixels.
            </Text>
          </View>
        )}
      </View>

      {/* Collection Account */}
      <View style={styles.section}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Collection Account</Text>
            <Text style={styles.toggleDescription}>
              Show cooperative bank details for member payments.
            </Text>
          </View>
          <Switch
            value={hasCollectionAccount}
            onValueChange={setHasCollectionAccount}
            trackColor={{ false: colors.border.main, true: colors.primary.light }}
            thumbColor={hasCollectionAccount ? colors.primary.main : '#9CA3AF'}
          />
        </View>

        {hasCollectionAccount ? (
          <View style={styles.collectionFields}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bank Name</Text>
              <TouchableOpacity
                style={styles.bankSelector}
                onPress={() => setShowBankPicker(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.bankSelectorText, !collectionBankName && styles.bankSelectorPlaceholder]}>
                  {collectionBankName || 'Select bank'}
                </Text>
                <Icon name="ChevronDown" size={18} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account Number</Text>
              <TextInput
                style={styles.input}
                value={collectionAccountNumber}
                onChangeText={(value) => setCollectionAccountNumber(value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit account number"
                placeholderTextColor={colors.text.secondary}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account Holder Name</Text>
              <TextInput
                style={styles.input}
                value={collectionAccountHolderName}
                onChangeText={setCollectionAccountHolderName}
                placeholder="Name on the bank account"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
          </View>
        ) : (
          <View style={styles.collectionDisabledCard}>
            <Text style={styles.collectionDisabledText}>
              Collection account is disabled. Turn it on to show bank details to members.
            </Text>
          </View>
        )}
      </View>
      
      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={20} color={colors.error.main} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {/* Save Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="save-outline" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showBankPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBankPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Bank</Text>
              <TouchableOpacity onPress={() => setShowBankPicker(false)}>
                <Icon name="X" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={bankOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.bankOption,
                    item === collectionBankName && styles.bankOptionSelected,
                  ]}
                  onPress={() => {
                    setCollectionBankName(item);
                    setShowBankPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.bankOptionText,
                      item === collectionBankName && styles.bankOptionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.bankOptionSeparator} />}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  previewContainer: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  previewBox: {
    height: 140,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  previewGradient: {
    flex: 1,
  },
  gradientPattern: {
    flex: 1,
    overflow: 'hidden',
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  circle1: {
    width: 150,
    height: 150,
    top: -40,
    right: -20,
  },
  circle2: {
    width: 100,
    height: 100,
    bottom: -30,
    left: 20,
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: spacing.md,
  },
  previewTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  previewImagePlaceholder: {
    flex: 1,
    backgroundColor: colors.background.paper,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  previewImageText: {
    marginTop: spacing.sm,
    color: colors.text.secondary,
    fontSize: 14,
  },
  section: {
    backgroundColor: colors.background.paper,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  logoActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  uploadLogoButton: {
    borderWidth: 1,
    borderColor: colors.primary.main,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background.paper,
  },
  uploadLogoButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary.main,
  },
  clearLogoButton: {
    borderWidth: 1,
    borderColor: colors.border.main,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.default,
  },
  clearLogoButtonText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  toggleInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  toggleDescription: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  collectionFields: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  bankSelector: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bankSelectorText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  bankSelectorPlaceholder: {
    color: colors.text.secondary,
  },
  collectionDisabledCard: {
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border.main,
    backgroundColor: colors.background.default,
    padding: spacing.md,
  },
  collectionDisabledText: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 19,
  },
  presetsContainer: {
    marginTop: spacing.sm,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  presetCard: {
    width: '31%',
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetCardSelected: {
    borderColor: colors.primary.main,
  },
  presetGradient: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    paddingTop: spacing.xs,
  },
  presetNameSelected: {
    color: colors.primary.main,
  },
  presetDescription: {
    fontSize: 10,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error.light,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    color: colors.error.dark,
    fontSize: 14,
  },
  buttonContainer: {
    padding: spacing.lg,
    paddingTop: 0,
    gap: spacing.md,
  },
  saveButton: {
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.text.secondary,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '70%',
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  bankOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  bankOptionSelected: {
    backgroundColor: colors.primary.light,
  },
  bankOptionText: {
    fontSize: 15,
    color: colors.text.primary,
  },
  bankOptionTextSelected: {
    color: colors.primary.main,
    fontWeight: '700',
  },
  bankOptionSeparator: {
    height: 1,
    backgroundColor: colors.border.light,
  },
});

export default CooperativeSettingsScreen;
