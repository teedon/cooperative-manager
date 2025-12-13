import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors, spacing, borderRadius } from '../../theme';
import Icon from './Icon';
import { formatDate } from '../../utils/formatters';

interface DatePickerProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  mode?: 'date' | 'datetime';
  error?: string;
  disabled?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  minimumDate,
  maximumDate,
  mode = 'date',
  error,
  disabled = false,
}) => {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value || new Date());

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
      if (event.type === 'set' && selectedDate) {
        onChange(selectedDate);
      }
    } else {
      // iOS - update temp date
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleConfirm = () => {
    onChange(tempDate);
    setShow(false);
  };

  const handleCancel = () => {
    setTempDate(value || new Date());
    setShow(false);
  };

  const handleClear = () => {
    onChange(null);
    setShow(false);
  };

  const displayValue = value
    ? mode === 'datetime'
      ? `${formatDate(value.toISOString())} ${value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : formatDate(value.toISOString())
    : placeholder;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[
          styles.inputContainer,
          error && styles.inputError,
          disabled && styles.inputDisabled,
        ]}
        onPress={() => !disabled && setShow(true)}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Icon
          name="Calendar"
          size={20}
          color={disabled ? colors.text.disabled : colors.text.secondary}
        />
        <Text
          style={[
            styles.inputText,
            !value && styles.placeholderText,
            disabled && styles.disabledText,
          ]}
        >
          {displayValue}
        </Text>
        {value && !disabled && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="X" size={18} color={colors.text.secondary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Android shows inline picker */}
      {Platform.OS === 'android' && show && (
        <DateTimePicker
          value={tempDate}
          mode={mode === 'datetime' ? 'date' : mode}
          display="default"
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}

      {/* iOS shows modal picker */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={show}
          transparent
          animationType="slide"
          onRequestClose={handleCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleCancel}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{label || 'Select Date'}</Text>
                <TouchableOpacity onPress={handleConfirm}>
                  <Text style={styles.confirmText}>Done</Text>
                </TouchableOpacity>
              </View>
              
              <DateTimePicker
                value={tempDate}
                mode={mode === 'datetime' ? 'datetime' : 'date'}
                display="spinner"
                onChange={handleChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                style={styles.picker}
              />

              {value && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={handleClear}
                >
                  <Text style={styles.clearButtonText}>Clear Date</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  inputError: {
    borderColor: colors.error.main,
  },
  inputDisabled: {
    backgroundColor: colors.background.paper,
    opacity: 0.6,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
  },
  placeholderText: {
    color: colors.text.disabled,
  },
  disabledText: {
    color: colors.text.disabled,
  },
  errorText: {
    fontSize: 12,
    color: colors.error.main,
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  cancelText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.main,
  },
  picker: {
    height: 200,
  },
  clearButton: {
    alignItems: 'center',
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  clearButtonText: {
    fontSize: 16,
    color: colors.error.main,
  },
});

export default DatePicker;
