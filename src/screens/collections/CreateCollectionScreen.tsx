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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collectionsApi, cooperativeApi, AddTransactionDto } from '../../api';
import { Card, Button } from '../../components/common';
import { formatDate } from '../../utils';
import { getErrorMessage } from '../../utils/errorHandler';
import { Calendar, ChevronDown, Info } from 'lucide-react-native';

type Props = NativeStackScreenProps<any, 'CreateCollection'>;

const CreateCollectionScreen: React.FC<Props> = ({ route, navigation }) => {
  const { organizationId } = route.params as { organizationId: string };
  const [collectionDate, setCollectionDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    try {
      setIsCreating(true);
      const response = await collectionsApi.create(organizationId, {
        collectionDate: collectionDate.toISOString(),
      });

      if (response.success && response.data) {
        Alert.alert(
          'Success',
          'Collection created successfully. You can now add transactions.',
          [
            {
              text: 'OK',
              onPress: () =>
                navigation.replace('CollectionDetails', {
                  organizationId,
                  collectionId: response.data.id,
                }),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to create collection'));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={styles.sectionTitle}>Collection Date</Text>
          <Text style={styles.sectionSubtitle}>
            Select the date for this collection
          </Text>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={24} color="#3498db" />
            <Text style={styles.dateButtonText}>
              {formatDate(collectionDate.toISOString().split('T')[0])}
            </Text>
            <ChevronDown size={20} color="#95a5a6" />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={collectionDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setCollectionDate(selectedDate);
                }
              }}
            />
          )}
        </Card>

        <View style={styles.infoBox}>
          <Info size={24} color="#3498db" />
          <Text style={styles.infoText}>
            After creating the collection, you'll be able to add transactions from different cooperatives and members.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={isCreating ? 'Creating...' : 'Create Collection'}
          onPress={handleCreate}
          disabled={isCreating}
          loading={isCreating}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 12,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
    marginTop: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#2980b9',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
});

export default CreateCollectionScreen;
