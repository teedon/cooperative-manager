import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { organizationsApi } from '../../api/organizationsApi';
import Icon from '../../components/common/Icon';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { getErrorMessage } from '../../utils/errorHandler';

type Props = NativeStackScreenProps<HomeStackParamList, 'CreateOrganization'>;

const CreateOrganizationScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Organization name is required');
      return;
    }

    try {
      setLoading(true);
      const organization = await organizationsApi.create({
        name: name.trim(),
        type: 'manager', // Default to manager organization
        description: description.trim() || undefined,
      });

      Alert.alert(
        'Success',
        'Organization created successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>
            Organization Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., ABC Management Services"
            placeholderTextColor={colors.text.disabled}
            editable={!loading}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Optional description of your organization"
            placeholderTextColor={colors.text.disabled}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!loading}
          />
        </View>

        <View style={styles.infoBox}>
          <Icon name="information-circle" size={20} color={colors.primary.main} />
          <Text style={styles.infoText}>
            This organization will manage multiple cooperatives and their staff members.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="checkmark" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Create Organization</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  content: {
    padding: spacing.md,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.error.main,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.main,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: 16,
    color: colors.text.primary,
  },
  textArea: {
    height: 100,
    paddingTop: spacing.sm,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.primary.light,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary.dark,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateOrganizationScreen;
